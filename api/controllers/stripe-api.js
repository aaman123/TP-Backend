const stripe = require("stripe")(process.env.stripe_key);
const validateCreateCheckoutSession = require("../../validation/checkoutSession");
const admin = require("firebase-admin");

const handleCompletedCheckoutSession = (connectedAccountId, session) => {
  // Fulfill the purchase.
  console.log("Connected account ID: " + connectedAccountId);
  console.log(JSON.stringify(session));
};

module.exports.webhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  // Verify webhook signature and extract the event.
  // See https://stripe.com/docs/webhooks/signatures for more information.
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.webhook_secret
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const connectedAccountId = event.account;
    handleCompletedCheckoutSession(connectedAccountId, session);
  }

  response.json({ received: true });
};

module.exports.success = async (req, res) => {
  res.status(200).json({
    status: true,
    message: "Onboarding Successful.",
  });
};

function generateAccountLink(accountID, origin) {
  return stripe.accountLinks
    .create({
      type: "account_onboarding",
      account: accountID,
      refresh_url: `${origin}/onboard-seller/refresh`,
      return_url: `${origin}/success`,
    })
    .then((link) => link.url);
}

module.exports.onboard_seller_refresh = async (req, res) => {
  let account_id = req.params.account_id;

  if (
    req.user
      .data()
      .stripe_connected_accounts.some((item) => item.id == account_id)
  ) {
    try {
      const origin = `${process.env.node_url}`;
      const accountLinkURL = await generateAccountLink(account_id, origin);

      res.redirect(accountLinkURL);
    } catch (err) {
      res.status(500).json({
        error: err.message,
        deleted,
      });
    }
  } else {
    res.status(404).json({
      error: "Connected Account not found for the Logged In User.",
    });
  }
};

module.exports.onboard_seller = async (req, res) => {
  let db = admin.firestore();
  try {
    const account = await stripe.accounts.create({
      type: "standard",
      metadata: {
        tensorplace_user_id: req.user.id,
      },
    });

    const origin = `${process.env.node_url}`;
    const accountLinkURL = await generateAccountLink(account.id, origin, res);

    await db
      .collection("User")
      .doc(req.user.id)
      .update({
        stripe_connected_accounts: admin.firestore.FieldValue.arrayUnion({
          id: account.id,
          accountLinkURL: accountLinkURL,
        }),
      })
      .catch((err) => {
        res.status(500).json({
          error: `Firebase Error: ${err}`,
        });
      });
    res.status(200).json({
      id: account.id,
      url: accountLinkURL,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

getPriceDetails = (priceId) =>
  new Promise((resolve, reject) => {
    stripe.prices
      .retrieve(priceId)
      .then(async (object) => {
        const productInfo = await stripe.products.retrieve(object.product);

        responseObject = {
          amount: object.unit_amount,
          currency: object.currency,
          name: productInfo.description,
          product: object.product,
        };
        resolve(responseObject);
      })
      .catch((err) => {
        return {
          error: err,
        };
      });
  });
calculateApplicationFeeAmount = (item_list) =>
  new Promise(async (resolve, reject) => {
    let totalAmount = 0;
    let priceDetails = await getPriceDetails(item_list[0].price);
    totalAmount = priceDetails.amount;
    application_fee = parseInt(Number(totalAmount) * 0.1);
    resolve(application_fee);
  });

getSellerConnectedAccounts = (productId) =>
  new Promise(async (resolve, reject) => {
    let db = admin.firestore();

    const product = await stripe.products.retrieve(productId);
    const userRef = product.metadata.userRef;
    const sellerDetails = await db.collection("User").doc(userRef).get();

    resolve(sellerDetails.data().stripe_connected_accounts);
  });

module.exports.create_checkout_session = async (req, res) => {
  const { errors, isValid } = validateCreateCheckoutSession(req.body);

  if (isValid) {
    try {
      if (req.body.item_list.length == 1) {
        // console.log(req.body.item_list[0].price)
        let productDetails = await getPriceDetails(req.body.item_list[0].price);
        let sellerDetails = await getSellerConnectedAccounts(
          productDetails.product
        );
        let application_fee = await calculateApplicationFeeAmount(
          req.body.item_list
        );
        const session = await stripe.checkout.sessions.create(
          {
            payment_intent_data: {
              setup_future_usage: "off_session",
              application_fee_amount: application_fee,
            },
            payment_method_types: req.body.payment_method_types,
            line_items: [
              {
                name: productDetails.name,
                amount: productDetails.amount,
                currency: productDetails.currency,
                quantity: 1,
              },
            ],
            mode: "payment",
            success_url: `${process.env.react_url}/checkout/success`,
            cancel_url: `${process.env.react_url}/checkout/cancel`,
          },
          {
            stripeAccount: sellerDetails[0].id,
          }
        );

        res.status(200).json({ id: session.id });
      } else {
        res.status(500).json({
          status_code: 500,
          status: true,
          error: "Only one plugin can be purchased at a time.",
        });
      }
    } catch (err) {
      res.status(500).json({
        status: true,
        status_code: 500,
        error: err.raw.message,
      });
    }
  } else {
    res.status(500).json({
      status: false,
      status_code: 500,
      error: errors,
    });
  }
};
