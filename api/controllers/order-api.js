const keys = require("../../config/keys");
const admin = require("firebase-admin");
const dev_score = require("../../utils/updateDeveloperScore");
const updateRepoScore = require("../../utils/updateRepoScore");
const octo = require("@octokit/request");
const mailUtils = require("../../utils/mailUtils");

/* paypal transaction letiables */
const paypal = require("@paypal/payouts-sdk");
let paypalClientId = keys.PAYPAL_CLIENT_ID;
let paypalClientSecret = keys.PAYPAL_CLIENT_SECRET;
let environment = new paypal.core.SandboxEnvironment(
  paypalClientId,
  paypalClientSecret
);
let client = new paypal.core.PayPalHttpClient(environment);

/*
 method to fetch order details for a user.
input: None (will use user id from cookies).
output: Response
dependencies: Firebase.
downside: None
author: Aman Sutariya 
*/
module.exports.get_OrderDetails = [
  
  async (req, res) => {
    let db = admin.firestore();
    let orderData = [];

    if (req.user.id != " " || req.user.id != "undefined") {
      await db
        .collection("Order")
        .doc(req.params.order_id)
        .get()
        .then((result) => {
          if (!result.exists) {
            res.status(404).json({
              status: 404,
              status_code: true,
              data: result.data(),
              message: "No order found for this id",
            });
          } else {
            res.status(200).json({
              status: 200,
              status_code: true,
              data: result.data(),
              message: "Order details for user fetched sucessfully",
            });
          }
        });
    } else {
      res.status(401).json({
        status: true,
        status_code: 401,
        message: "Please login again",
      });
    }
  },
];

/* method to store a plugin order
input: Payment details for storing.
output: Response
dependencies: Firebase.
downside: None
author: Aman Sutariya */
module.exports.store_order = [
  
  async (req, res) => {
    let db = admin.firestore();

    if (req.user.id != " " || req.user.id != "undefined") {
      // await db.collection('Plugin').where('title', '==', req.body.pluginName)
      // .get()
      // .then( (pluginResult) => {

      let amount_received = req.body.total;
      let service_fee = (amount_received * 10) / 100;
      let amount_paid = amount_received - service_fee;
      let orderId;
      let pluginId;
      let pluginUserRef;
      let sellerEmail;
      let buyerDetails;
      let sellerDetails;
      let repoDetails;

      // pluginResult.docs.forEach( async(pluginInner) => {

      const data = {
        paymentId: req.body.paymentId,
        payerId: req.body.payerId,
        email: req.body.email,
        currency: req.body.currency,
        // pluginsRef: admin.firestore.FieldValue.arrayUnion(`Plugin/${pluginInner.id}`),
        pluginsRef: admin.firestore.FieldValue.arrayUnion(req.body.pluginName),
        amountReceived: parseInt(amount_received),
        amountPaid: parseInt(amount_paid),
        serviceFee: parseInt(service_fee),
        timeStamp: new Date(),
        userRef: `User/${req.user.id}`,
      };

      await db
        .collection("Plugin")
        .where("title", "==", req.body.pluginName)
        .get()
        .then((result) => {
          result.docs.forEach((plugin) => {
            if (plugin.data().userRef.split("/")[1] == req.user.id) {
              res.status(400).json({
                status: true,
                status_code: 400,
                message: "You can't purchase your own Plugin!",
              });
            }
          });
        });

      await db
        .collection("Order")
        .add(data)
        .then((d) => {
          orderId = d.id;
        });

      await db
        .collection("UserPlugins")
        .where("userRef", "==", `User/${req.user.id}`)
        .get()
        .then(async (userPluginData) => {
          let orderJson = {
            repoName: req.body.pluginName,
            orderRef: `Order/${orderId}`,
          };
          if (userPluginData._size > 0) {
            userPluginData.docs.forEach(async (innerPlugin) => {
              await db
                .collection("UserPlugins")
                .doc(innerPlugin.id)
                .update({
                  purchaseRef: admin.firestore.FieldValue.arrayUnion(orderJson),
                });
            });
          }
        });

      await db
        .collection("User")
        .doc(req.user.id)
        .update({
          repositoriesPurchased: admin.firestore.FieldValue.increment(1),
        });

      await db
        .collection("Plugin")
        .where("title", "==", req.body.pluginName)
        .get()
        .then((pluginResult) => {
          pluginResult.docs.forEach(async (innerResult) => {
            repoDetails = innerResult.data();
            pluginId = innerResult.id;
            pluginUserRef = innerResult.data().userRef;
            let totalPurchase = innerResult.data().totalPurchase + 1;
            await db.collection("Plugin").doc(innerResult.id).update({
              totalPurchase: totalPurchase,
            });
          });
        });

      if (amount_received != 0) {
        const seller = await db
          .collection("User")
          .doc(pluginUserRef.split("/")[1])
          .get();
        sellerDetails = seller.data();

        if (!seller.exists) {
          console.log("No such document!");
        } else {
          sellerEmail = seller.data().paypalId;

          if (sellerEmail != "") {
            let senderBatchId =
              "Tensorplace_payment_" + Math.random().toString(36).substring(7);
            let requestBody = {
              sender_batch_header: {
                recipient_type: "EMAIL",
                email_message: "SDK payouts test txn",
                note: "Enjoy your Payout!!",
                sender_batch_id: `${senderBatchId}`,
                email_subject: "This is a transaction from TensorPlace.",
              },
              items: [
                {
                  note: `This is a payment from TensorPlace for recent transaction on your Plugin ${req.body.pluginName}`,
                  amount: {
                    currency: "USD",
                    value: `${amount_paid}`,
                  },
                  receiver: `${sellerEmail}`,
                  sender_item_id: "PAYPAL_TEST",
                },
              ],
            };

            // Sending the payment to seller after deducting service fee
            paypalSendToSeller(requestBody, orderId);
          } else {
            res.status(400).json({
              status: true,
              status_code: 400,
              message: "No PaypalID Found for the seller!",
            });
          }
        }
      }

      /*
    Updating the Developer Score and Reputation Score
    as Purchase count is increased
    */

      dev_score.update_developer_score(pluginUserRef.split("/")[1]);
      updateRepoScore.update_reputation_score(pluginId);

      await db
        .collection("User")
        .doc(req.user.id)
        .get()
        .then((data) => {
          buyerDetails = data.data();
        });

      mailUtils.purchase_mail_shoot_to_buyer(buyerDetails, repoDetails);
      mailUtils.purchase_mail_shoot_to_seller(sellerDetails, repoDetails);

      await db
        .collection("User")
        .doc(req.user.id)
        .get()
        .then(async (fireResult) => {
          try {
            await octo.request(
              "PUT /repos/{owner}/{repo}/collaborators/{username}",
              {
                headers: {
                  authorization: "token " + keys.TENSORPLACE_PAT + "",
                },
                owner: "Tensorplace",
                repo: req.body.pluginName,
                username: fireResult.data().userName,
                permission: "admin",
              }
            );
          } catch (err) {
            res.status(501).json({
              error: "Error Occurred in addCollaborator.",
            });
          }
        });

      res.status(200).json({
        status: true,
        status_code: 200,
        message: "Order saved successfully",
      });
      // })
      // })
    } else {
      res.status(401).json({
        status: true,
        status_code: 401,
        message: "Please login again!",
      });
    }
  },
];

/* 
function to send money to the seller after fetching order response from the FrontEnd.
input: Payment Request body and orderId
output: Response
dependencies: Firebase and Paypal
downside: None
author: Aman Sutariya
 */
async function paypalSendToSeller(senderRequestBody, orderId) {
  try {
    let db = admin.firestore();
    const request = new paypal.payouts.PayoutsPostRequest();
    request.requestBody(senderRequestBody);

    const response = await client.execute(request);
    const storeToFirestoreResponse = response.result;
    // console.log(`Response: ${JSON.stringify(response)}`);
    // console.log(`Payouts Create Response: ${JSON.stringify(response.result)}`);
    await db.collection("OrderDetails").add({
      OrderRef: `Order/${orderId}`,
      ...storeToFirestoreResponse,
    });
  } catch (error) {
    console.log(error);
  }
}
