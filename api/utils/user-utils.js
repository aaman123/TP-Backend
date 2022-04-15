const passport = require("passport");
let Request = require("request");
const admin = require("firebase-admin");
const mailUtils = require("../../utils/mailUtils");
const keys = require("../../config/keys");
const stripe = require("stripe")(process.env.stripe_key);
const slugify = require("slugify");
const create_asset = require("../../utils/createAsset");

module.exports.getCollabRepos = async (req, res) => {
  let db = admin.firestore();
  let repoNames = [];
  try {
    const plugins = await db
      .collection("Plugin")
      .where("userRef", "==", `User/${req.user.id}`)
      .get();
    if (plugins.docs.length > 0) {
      plugins.docs.forEach((plugin) => {
        repoNames.push({
          repoName: plugin.data().title,
          status: plugin.data().status,
        });
      });
      return res.status(200).json({ repos: repoNames });
    } else {
      return res.status(200).json({ repos: [] });
    }
  } catch (e) {
    return res.status(500).json({ error: e });
  }
};

module.exports.addBitRepo = async (obj, req, res) => {
  let db = admin.firestore();
  let data = JSON.parse(obj);
  await db
    .collection("Plugin")
    .add({
      hostedOn: "Bitbucket",
      title: data.repository.name,
      slug: slugify(data.repository.slug, {
        lower: true,
        strict: true,
      }),
      bitbucketRepoUrl: data.repository.resource_uri,
      codebaseRef: [],
      languageRef: [],
      reputationScore: 0,
      totalPurchase: 1,
      description: data.repository.description,
      inputType: " ",
      outputType: " ",
      price: 0,
      image: " ",
      userRef: `User/`,
      status: "Pending",
      avgRatings: 0,
      totalReviews: 0,
      transactionId: "",
      blockNumber: "",
    })
    .then((result) => {
      res.status(200).json({ message: "Repo added successfully" });
    })
    .catch((err) => {
      res
        .status(501)
        .json({ message: "Firebase Error Occurred while adding the repo." });
    });
};

module.exports.addRepo = async (obj, req, res) => {
  let db = admin.firestore();
  let userId;
  let userDetails;
  await db
    .collection("User")
    .where("userName", "==", obj.inviter.login)
    .get()
    .then(async (userData) => {
      userData.docs.forEach(async (data) => {
        userId = data.id;
        queryRepository = await db
          .collection("Plugin")
          .where("title", "==", obj.repository.name)
          .get();
        if (queryRepository.docs.length == 0) {
          await db
            .collection("Plugin")
            .add({
              hostedOn: "Github",
              title: obj.repository.name,
              slug: slugify(obj.repository.name, {
                lower: true, // convert to lower case, defaults to `false`
                strict: true, // strip special characters except replacement, defaults to `false`
              }),
              githubRepoUrl: obj.repository.html_url,
              codebaseRef: [],
              languageRef: [],
              reputationScore: 0,
              totalPurchase: 1,
              description: obj.repository.description,
              inputType: " ",
              outputType: " ",
              price: 0,
              image: " ",
              userRef: `User/${data.id}`,
              status: "Pending",
              avgRatings: 0,
              totalReviews: 0,
              transactionId: "",
              blockNumber: "",
            })
            .then(async (pluginDetails) => {
              await db
                .collection("UserPlugins")
                .where("userRef", "==", `User/${req.user.id}`)
                .get()
                .then(async (userPluginData) => {
                  if (userPluginData._size > 0) {
                    userPluginData.docs.forEach(async (innerPlugin) => {
                      await db
                        .collection("UserPlugins")
                        .doc(innerPlugin.id)
                        .update({
                          pending: admin.firestore.FieldValue.arrayUnion(
                            obj.repository.name
                          ),
                        });
                    });
                  }
                });

              await db
                .collection("User")
                .doc(userId)
                .update({
                  numberOfRepositories: admin.firestore.FieldValue.increment(1),
                });

              await db
                .collection("User")
                .doc(req.user.id)
                .get()
                .then((data) => {
                  userDetails = data.data();
                });

              if (process.env["ENABLE_MAILING"] == "true") {
                // console.log('Entering Mail Utils...')
                mailUtils.publish_repo(userDetails, obj);
                // console.log('Exited MailUtils...')
              }
              // Creating Asset on Blockchain for the repo.
              if (process.env["ENABLE_BLOCKCHAIN"] == "true") {
                // console.log('Entering Mail Utils...')
                create_asset.create_asset(pluginDetails);
                // console.log('Exited MailUtils...')
              }

              res.status(200).json({ msg: "Repository added successfully" });
            })
            .catch((err) => {
              console.log(err);
              res.status(400).json({
                error: err,
                msg: "Error creating plugin.",
              });
            });
        } else {
          return res.status(208).json({
            msg: "Repository already exists with same name. Please change the name of the repository.",
          });
        }
      });
    })
    .catch((err) => {
      res.status(400).json({ msg: "Failed to fetch the User." });
    });
  // let db = admin.database();
  // let collab_repos = db.ref("collab-repos");
  // let repo = collab_repos.child(obj.repository.full_name);
  // obj["status"] = "pending";
  // console.log(obj);
  // repo.update(obj, (err) => {
  //   if (err) {
  //     res.status(300).json({ msg: "Something went wrong", error: err });
  //   } else {
  //     res.status(200).json({ msg: "repo added sucessfully" });
  //   }
  // });
};

/* 
FUNCTIONALITY - PENDING APPROVED CHECKER
DESCRIPTION   - function for getting all repos from the firestore PLUGIN 
                connection and tensorplace-admin account.
SCEHDULED     - Every 12 hours
DEPENDENCIES  - GITHUB AND FIREBASE
AUTHOR        - Aman Sutariya
*/
module.exports.getAllAdminGitRepos = () => {
  key = keys.TENSORPLACE_PAT;
  let adminRepos = [];
  let sellerDetails = "";
  let repoDetails = "";
  Request.get(
    {
      headers: { Authorization: "token " + key, "User-Agent": "request" },
      url: "https://api.github.com/user/repos?per_page=10000000",
    },
    async (error, response, body) => {
      let jsonResponse = JSON.parse(response.body);
      jsonResponse.forEach(function (innerResponse) {
        full_name = innerResponse.full_name;
        if (full_name.includes(process.env.githubUsername)) {
          adminRepos.push(innerResponse.name);
        }
      });
      // console.log(adminRepos);
      let db = admin.firestore();
      await db
        .collection("Plugin")
        .get()
        .then((result) => {
          result.docs.forEach(async (data) => {
            console.log(adminRepos);
            console.log(data._fieldsProto.title.stringValue);
            if (adminRepos.indexOf(data._fieldsProto.title.stringValue) > -1) {
              console.log(`${data.data().title} found!!`);
              await db
                .collection("Plugin")
                .doc(data.id)
                .update({ status: "Approved" })
                .then(async (result) => {
                  await db
                    .collection("Plugin")
                    .doc(data.id)
                    .get()
                    .then(async (product_details) => {
                      if (!product_details.data().stripeProductId) {
                        const stripe_product = await stripe.products.create({
                          name: product_details.data().title,
                          description: product_details.data().description,
                          metadata: {
                            pluginRef: `Plugin/${data.id}`,
                            userRef: product_details.data().userRef,
                          },
                        });
                        await db.collection("Plugin").doc(data.id).set(
                          {
                            stripeProductId: stripe_product.id,
                          },
                          { merge: true }
                        );
                      }
                      await db
                        .collection("User")
                        .doc(data.data().userRef.split("/")[1])
                        .get()
                        .then((seller) => {
                          if (!seller.exists) {
                            sellerDetails = seller.data();
                          } else {
                            console.log(`${data.data().title} found!!`);
                            console.log("Seller Not Found!");
                          }
                        });
                      repoDetails = data.data();
                      // Mailing Seller for his acceptance status.
                      mailUtils.repo_approved(repoDetails, sellerDetails);

                      await db
                        .collection("UserPlugins")
                        .where("userRef", "==", data.data().userRef)
                        .get()
                        .then(async (userPluginData) => {
                          if (userPluginData._size > 0) {
                            userPluginData.docs.forEach(async (innerPlugin) => {
                              let userPendingRepos = innerPlugin.data().pending;

                              userPendingRepos.forEach(async (indiRepo) => {
                                if (adminRepos.indexOf(indiRepo) > -1) {
                                  await db
                                    .collection("UserPlugins")
                                    .doc(innerPlugin.id)
                                    .update({
                                      pending:
                                        admin.firestore.FieldValue.arrayRemove(
                                          indiRepo
                                        ),
                                    });

                                  await db
                                    .collection("UserPlugins")
                                    .doc(innerPlugin.id)
                                    .update({
                                      approved:
                                        admin.firestore.FieldValue.arrayUnion(
                                          indiRepo
                                        ),
                                    });
                                }
                              });
                            });
                          }
                        });
                    });
                });
            }
          });
        });
    }
  );
};
