const admin = require("firebase-admin");
const updateRepoScore = require("../../utils/updateRepoScore");
const addBuyerInfo = require("../../utils/addBuyerInfo");
const mailUtils = require("../../utils/mailUtils");
const luxon = require("luxon");
const DateTime = luxon.DateTime;

/* API for Updating Reviews for the plugin already 
purchased by a user
consumers: Frontend
producer: Node backend
input parameters: Plugin name
output: The Review given by the user for a Given Plugin.
author : Aman Sutariya */
module.exports.update_review = async (req, res) => {
  let db = admin.firestore();
  const paramReviewRef = req.params.reviewRef;
  // Checking if User is logged in or not
  if (req.user.id != undefined) {
    // Checking if ReviewRef Belongs to the same user.
    const review = await db.collection("Review").doc(paramReviewRef).get();
    const reviewData = review.data();
    if (!review.exists) {
      return res.status(404).json({
        status: true,
        status_code: 404,
        message: "Review Document not found!",
      });
    } else {
      if (reviewData.userRef != `User/${req.user.id}`) {
        return res.status(401).json({
          status: true,
          status_code: 401,
          message: "You are not Authorized to update the review!",
        });
      } else {
        if (req.body.repoName || req.body.userRef) {
          return res.status(403).json({
            status: false,
            status_code: 403,
            message: "Cannot Update Repository Name or User Reference!",
          });
        } else {
          const updatedReview = await db
            .collection("Review")
            .doc(paramReviewRef)
            .update(req.body);
          return res.status(200).json({
            status_code: 200,
            status: true,
            message: "Review Updated Successfully!",
          });
        }
      }
    }
  } else {
    return res.status(401).json({
      status: true,
      status_code: 401,
      message: "Please Log in Again, Unauthorized!",
    });
  }
};

/* API for Getting Reviews for the plugin given a user
consumers: Frontend
producer: Node backend
input parameters: Plugin name
output: The Review given by the user for a Given Plugin.
author : Aman Sutariya */
module.exports.review_status = async (req, res) => {
  let db = admin.firestore();
  let pluginName = req.params.plugin;
  // Checking if User is logged in or not
  if (req.user.id != " " || req.user.id != "undefined") {
    const plugin = await db
      .collection("Plugin")
      .where("title", "==", pluginName)
      .get();
    if (plugin.docs.length == 0) {
      return res.status(404).json({
        status: true,
        status_code: 404,
        message: "No Plugin Found",
      });
    }
    if (plugin.docs.length == 1) {
      let pluginRef = plugin.docs[0].id;
      let pluginData = plugin.docs[0].data();
      if (pluginData.status == "Pending") {
        return res.status(404).json({
          status: true,
          status_code: 404,
          message: "Repo Is Not Approved Yet",
        });
      }
      if (`User/${req.user.id}` == pluginData.userRef) {
        return res.status(404).json({
          status: true,
          status_code: 404,
          message: "Can't get a status, it's owned by you",
        });
      }
      if (`User/${req.user.id}` != pluginData.userRef) {
        let review = await db
          .collection("Review")
          .where("userRef", "==", `User/${req.user.id}`)
          .where("repoName", "==", pluginName)
          .get();
        if (review.docs.length == 1) {
          let reviewRef = review.docs[0].id;
          let reviewData = review.docs[0].data();
          return res.status(200).json({
            status: true,
            status_code: 200,
            data: {
              reviewRef: `Review/${reviewRef}`,
              ...reviewData,
            },
            isReviewAdded: true,
            message: "Review Fetched Successfully!",
          });
        }
        if (review.docs.length == 0) {
          return res.status(404).json({
            status: true,
            status_code: 404,
            message: "No Reviews Found!",
            isReviewAdded: false,
          });
        }
      }
    } else {
      return res.status(404).json({
        status: true,
        status_code: 404,
        message: "More than One Plugin found!",
      });
    }
  } else {
    return res.status(401).json({
      status: true,
      status_code: 401,
      message: "Please Log in Again!",
    });
  }
};

/* API for Getting all Reviews for the plugin
consumers: Frontend
producer: Node backend
input parameters: Plugin name
output: List of all the reviews.
author : Aman Sutariya */
module.exports.get_reviews = [
  async (req, res) => {
    let db = admin.firestore();
    let reviews = [];
    let user_details;
    const plugin = await db
      .collection("Plugin")
      .where("title", "==", req.params.plugin)
      .get();
    if (plugin.docs.length == 0) {
      return res.status(404).json({
        status: true,
        status_code: 404,
        message: "No Plugin Found",
      });
    }
    if (plugin.docs.length == 1) {
      const pluginRef = plugin.docs[0].id;
      const pluginData = plugin.docs[0].data();
      if (pluginData.status == "Pending") {
        return res.status(404).json({
          status: true,
          status_code: 404,
          message: "Repo Is Not Approved Yet",
        });
      }
      const review = await db
        .collection("Review")
        .where("repoName", "==", req.params.plugin)
        .get();

      for (
        let counter = 0;
        counter < review.docs.length;
        counter = counter + 1
      ) {
        let reviewRef = review.docs[counter];
        let single_review = review.docs[counter].data();
        let date = DateTime.fromMillis(
          reviewRef.updateTime.seconds * 1000
        ).toISO();
        single_review["updateTime"] = date;
        if (!single_review.username) {
          user_details = await db
            .collection("User")
            .doc(single_review.userRef.split("/")[1])
            .get();
          single_review.username = user_details.data().userName;
        }
        reviews.push(single_review);
      }
      if (reviews.length > 0) {
        return res.status(200).json({
          status: true,
          status_code: 200,
          data: reviews,
          message: "Reviews fetched successfully!",
        });
      }
      if (reviews.length == 0) {
        return res.status(404).json({
          status: true,
          status_code: 404,
          message: "No Reviews found!",
        });
      }
    } else if (result.docs.length > 1) {
      return res.status(404).json({
        status: true,
        status_code: 404,
        message: "More Than One Plugin Found!",
      });
    }
  },
];

/* API for Saving a Review
consumers: Frontend
producer: Node backend
input parameters: reviewData (Look in postman collection for
    detailed body params)
output: Store a review, Save on Blockchain and Update repo score
author : Aman Sutariya */
module.exports.add_review = [
  async (req, res) => {
    let db = admin.firestore();
    let purchase_arr = [];
    let buyer_details = {};
    let reviewData = req.body;
    let pluginRef = "";
    let sellerRef = "";
    let repo_details = "";

    // Checking if User is logged in or not
    if (req.user.id != " " || req.user.id != "undefined") {
      let avgRatings = 0;
      let totalReviews = 0;

      const plugin = await db
        .collection("Plugin")
        .where("title", "==", req.body.repoName)
        .get();

      if (plugin.docs.length == 0) {
        return res.status(404).json({
          status: true,
          status_code: 404,
          message: "No Plugin Found",
        });
      }
      if (plugin.docs.length == 1) {
        let pluginData = plugin.docs[0].data();
        if (pluginData.status == "Pending") {
          return res.status(404).json({
            status: true,
            status_code: 404,
            message: "Repo Is Not Approved Yet",
          });
        }
        if (`User/${req.user.id}` == pluginData.userRef) {
          return res.status(404).json({
            status: true,
            status_code: 404,
            message: "Can't add a review, it's owned by you",
          });
        }
        if (`User/${req.user.id}` != pluginData.userRef) {
          const reviews = await db
            .collection("Review")
            .where("userRef", "==", `User/${req.user.id}`)
            .where("repoName", "==", req.body.repoName)
            .get();
          if (reviews.docs.length == 1) {
            return res.status(404).json({
              status: true,
              status_code: 404,
              message: "Already Added a Review",
            });
          }
          if (reviews.docs.length == 0) {
            buyer_details = await db.collection("User").doc(req.user.id).get();

            const userPlugins = await db
              .collection("UserPlugins")
              .where("userRef", "==", `User/${req.user.id}`)
              .get();

            /*Checking if user already purchased the 
                    Repo or not*/
            if (userPlugins.docs.length == 1) {
              const userPluginsData = userPlugins.docs[0].data();
              let pluginRef = userPluginsData.purchaseRef;

              for (
                let counter = 0;
                counter < pluginRef.length;
                counter = counter + 1
              ) {
                purchase_arr.push(pluginRef[counter]);
              }
            }

            if (
              purchase_arr.some(
                (item) => item.repoName === req.body.repoName
              ) == false
            ) {
              return res.status(403).json({
                status: true,
                status_code: 403,
                message: "You need to purchase the Repo to add a review.",
              });
            }

            if (
              purchase_arr.some(
                (item) => item.repoName === req.body.repoName
              ) == true
            ) {
              // Adding a document for Review in firebase
              reviewData["userRef"] = `User/${req.user.id}`;
              reviewData["username"] = buyer_details.username;
              await db.collection("Review").doc().set(reviewData);

              // Adding Buyer Info to BlockChain
              if (process.env["ENABLE_BLOCKCHAIN"] == true) {
                addBuyerInfo.addBuyerInfo(buyer_details, reviewData);
              }

              /* Updating the avg rating for the Plugin on Firestore
                        and BlockChain*/

              //Updating  Plugin Ratings
              const updatedPlugin = await db
                .collection("Plugin")
                .where("title", "==", reviewData.repoName)
                .get();

              if (updatedPlugin.docs.length == 1) {
                let updatedPluginRef = updatedPlugin.docs[0].id;
                let updatedPluginData = updatedPlugin.docs[0].data();
                sellerRef = updatedPluginData.userRef.split("/")[1];
                repo_details = updatedPluginData;
                if (updatedPluginData.totalReviews === undefined) {
                  totalReviews = 1;
                } else {
                  totalReviews = updatedPluginData.totalReviews + 1;
                }
                if (updatedPluginData.avgRatings === undefined) {
                  avgRatings = reviewData.codeRating;
                } else {
                  avgRatings =
                    (updatedPluginData.avgRatings * (totalReviews - 1) +
                      reviewData.codeRating) /
                    totalReviews;
                }
              }

              await db.collection("Plugin").doc(updatedPluginRef).update({
                totalReviews: totalReviews,
                avgRatings: avgRatings,
              });

              totalReviews = 0;
              let avgDevRatings = 0;
              // Updating Developer Ratings

              const developer = await db
                .collection("User")
                .doc(sellerRef)
                .get();
              const developerData = developer.data();
              if (developerData.totalReviews === undefined) {
                totalReviews = 1;
              } else {
                totalReviews = developerData.totalReviews + 1;
              }
              if (developerData.avgDevRatings === undefined) {
                avgDevRatings = reviewData.devRating;
              } else {
                avgDevRatings =
                  (developerData.avgDevRatings * (totalReviews - 1) +
                    reviewData.devRating) /
                  totalReviews;
              }

              await db.collection("User").doc(sellerRef).update({
                totalReviews: totalReviews,
                avgDevRatings: avgDevRatings,
              });
              if (process.env["ENABLE_BLOCKCHAIN"] == true) {
                updateRepoScore.update_reputation_score(updatedPluginRef);
              }
              //Sending Mail if Successful review added
              if (process.env["ENABLE_MAILING"] == true) {
                mailUtils.review_added(buyer_details, repo_details, reviewData);
              }
              return res.status(200).json({
                status: true,
                status_code: 200,
                message: "Review added successfully!",
                data: req.body,
              });
            }
          }
        }
      } else {
        return res.status(404).json({
          status: true,
          status_code: 404,
          message: "More than One Plugin Find",
        });
      }
    } else {
      return res.status(401).json({
        status: true,
        status_code: 401,
        message: "Please Log in Again!",
      });
    }
  },
];
