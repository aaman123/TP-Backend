let Request = require("request");
const admin = require("firebase-admin");
const mailUtils = require("../../utils/mailUtils");
const apiPaginationHelper = require("../../utils/pagination");
const validateRepoUpdateRequest = require('../../validation/repoUpdate')

let codebase = {
  "1Wnj2qKgYoThS3rWIb7a": "Data Annotation",
  "D0Oq8uBf4wLAT6gE5uOE": "Image Classification",
  "KEgQsPE5n81vd9fGqABS": "Natural Language Processing",
  "LE4uP5kLFx7QvEUp2y08": "Image Annotation",
  "OBunDroXr13XmJpGET8F": "Computer Vision",
  "ZCZhBME2V17tK1wLPo4r": "Speech Recognition",
  "ZQko2HMWn8Cfr5oWE2Ec": "Image Enhancement",
  "ZUIyPefXrxvbCtuXkDPu": "Information Retrieval",
  "aS8tJo3CJYO0wSMxM6QR": "Others",
  "bRFCacgcDaCT4mm7oJdk": "Noise Reduction",
  "h0eVizGJy4OadSXWd5wK": "Robotic Process Automation",
  "l9i0dzPKPPmEoySqLBZ3": "Reinforcement Learning",
};

let language = {
  "9KYkbfLIS3kDT4ilKDo0": "TensorFlow",
  "9xg8hAGsLPL2HfMScGyG": "Python",
  "AOdQBpZ6RHJN55scKMDF": "JavaScript",
  "IK33ttQOidUy3mrKXwgZ": "CUDA",
  "LiRC6HGBq80QJrFZYUWk": "Tensor Cart",
  "LlRRdFUpAs3guBNaeLi3": "C",
  "lHlJtZ2qzb6BQcBZ8QmN": "keras",
  "rTZCCfDA81r6cP69t1N3": "C++",
  "vyOfSm0VBXDshC9UBUvV": "Other Frameworks",
  "xExBsXIlUa3IM7KCs8K4": "perl",
  "yruYQSTBwHqNN5lFv5XZ": "R",
};

/* api for Status for purchased plugin
consumers: Frontend
producer: Node backend
input parameters: none
output: Purchase Status for a repo.
Note : We are storing exact names of Repo in the purchased
array and not the UUID.
author : Aman Sutariya */

module.exports.plugin_purchase_status = async (req, res) => {
  let db = admin.firestore();
  let pluginName = req.params.pluginName;
  let userPluginsId;
  let userPluginsData;
  let userPurchasedPlugin;
  let pluginData;
  if (req.user.id != undefined) {
    db.collection("UserPlugins")
      .where("userRef", "==", `User/${req.user.id}`)
      .get()
      .then((snapshot) => {
        // If only one document found!
        if (snapshot.docs.length == 1) {
          userPluginsId = snapshot.docs.id;
          userPluginsData = snapshot.docs[0].data();
          userPurchasedPlugin = userPluginsData.purchaseRef;
          //If Plugin Present in the purchaseRef
          userPurchasedPlugin.some((item) => {
            if (item.repoName === pluginName) {
              pluginData = item;
            }
          });
          // If no plugin Present
          if (pluginData == null) {
            res.status(200).json({
              status: true,
              status_code: 200,
              message: "Plugin Not Purchased by the user!",
              isPurchased: false,
            });
          }
          // If present
          else {
            res.status(200).json({
              status: true,
              status_code: 200,
              data: {
                userPluginRef: userPluginsId,
                ...pluginData,
              },
              isPurchased: true,
              message: "User Already Purchased the Plugin!",
            });
          }
        }
        // If more than one document found!
        else if (snapshot.docs.length > 1) {
          res.status(300).json({
            status: true,
            status_code: 300,
            message: "Multiple Documents for Same user found! Contact support.",
            isPurchased: false,
          });
        }
        //If no Document Found
        else {
          res.status(404).json({
            status: true,
            status_code: 404,
            message:
              "Either User doesn't exist or User has no recent activities on the platform!",
            isPurchased: false,
          });
        }
      });
  } else {
    res.status(401).json({
      status: true,
      status_code: 401,
      message: "Please Log in Again, Unauthorized!",
      isPurchased: false,
    });
  }
};

/*
api for fetching all the BlockChain Logs for the Plugin
Developer : Aman Sutariya
*/
const transaction_utils = require("../../utils/addTransactionsToFirestore");

module.exports.plugin_blockchain_logs = async (req, res) => {
  let db = admin.firestore();
  let pluginId = "";

  let pluginRef = await db
    .collection("Plugin")
    .where("title", "==", req.params.pluginName);

  pluginRef.get().then(async (result) => {
    if (result.docs.length >= 1) {
      result.forEach((doc) => {
        pluginId = doc.id;
      });

      // let transactions = transaction_utils.getTransactionsForPlugin(pluginId)

      const transactionObject = await db
        .collection("BlockchainTransactions")
        .doc(pluginId)
        .get();

      if (!transactionObject.exists) {
        console.log("No such document!");
        res.status(404).json({
          status: true,
          status_code: 404,
          message: "No Transactions Found!",
        });
      } else {
        console.log("Document Found!");
        // console.log(transactionObject.data())
        // return transactionObject.data()
        res.status(200).json({
          status: true,
          status_code: 200,
          data: transactionObject.data(),
          message: "All BlockChain Transactions fetched Successfully!",
        });
      }
    } else {
      res.status(404).json({
        status: true,
        status_code: 404,
        message: "No Plugin Found!",
      });
    }
  });
  // transaction_utils.
};

/* api for getting purchased plugins without page number
consumers: Frontend
producer: Node backend
input parameters: none
output: array of all purchased plugins
Note : We are storing exact names of Repo in the purchased
array and not the UUID.
author : Aman Sutariya */
module.exports.plugin_purchased_no_page = [
  async (req, res) => {
    let db = admin.firestore();
    let purchase_arr = [];
    let purchase_arr_detailed = [];
    if (req.user.id != " " || req.user.id != "undefined") {
      await db
        .collection("UserPlugins")
        .where("userRef", "==", `User/${req.user.id}`)
        .get()
        .then(async (result) => {
          if (result.docs.length > 0) {
            if (result.docs.length > 1) {
              res.status(300).json({
                status: true,
                status_code: 300,
                data: [],
                message: "Multiple Records for the same User present!",
              });
            } else {
              /*Will use this if we need to return detailed repo
              information otherwise only name is enough as
              we can anyway fetch the individual information
              for a specific repository.
              Here splice is used as the max key length 
              for a where clause in firebase is 10.*/

              if (result.docs) {
                result.docs.forEach((doc) => {
                  doc.data().purchaseRef.forEach((repo) => {
                    purchase_arr.push(repo);
                  });
                });
                res.status(200).json({
                  status: true,
                  status_code: 200,
                  data: purchase_arr,
                  message: "Purchased Repos fetched successfully!",
                });
              } else {
                res.status(404).json({
                  stats: true,
                  status_code: 404,
                  data: [],
                  message: "No Plugins Purchased!",
                });
              }
            }
          } else {
            res.status(404).json({
              status: true,
              status_code: 404,
              data: [],
              message: "No Purchased Plugins Found for the User!",
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

/* api for getting purchased plugins
consumers: Frontend
producer: Node backend
input parameters: none
output: array of all purchased plugins
Note : We are storing exact names of Repo in the purchased
array and not the UUID.
author : Aman Sutariya */
module.exports.plugin_purchased = [
  async (req, res) => {
    let db = admin.firestore();
    let purchase_arr = [];
    let purchase_arr_detailed = [];
    if (req.user.id != " " || req.user.id != "undefined") {
      await db
        .collection("UserPlugins")
        .where("userRef", "==", `User/${req.user.id}`)
        .get()
        .then(async (result) => {
          if (result.docs.length > 0) {
            if (result.docs.length > 1) {
              res.status(303).json({
                status: true,
                status_code: 303,
                data: [],
                message: "Multiple Records for the same User present!",
              });
            } else {
              /*Will use this if we need to return detailed repo
              information otherwise only name is enough as
              we can anyway fetch the individual information
              for a specific repository.
              Here splice is used as the max key length 
              for a where clause in firebase is 10.*/

              if (result.docs) {
                result.docs.forEach((doc) => {
                  // let page_no = req.params.page_no;
                  // apiPaginationHelper.api_pagination(doc.data().purchaseRef,page_no,purchase_arr);
                  doc.data().purchaseRef.forEach((repo) => {
                    purchase_arr.push(repo);
                  });
                });
                console.log(purchase_arr);
                res.status(200).json({
                  status: true,
                  status_code: 200,
                  data: purchase_arr,
                  message: "Purchased Repos fetched successfully!",
                });
              } else {
                res.status(404).json({
                  stats: true,
                  status_code: 404,
                  data: [],
                  message: "No Plugins Purchased!",
                });
              }
            }
          } else {
            res.status(404).json({
              status: true,
              status_code: 404,
              data: [],
              message: "No Purchased Plugins Found for the User!",
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

/* api for filtering plugins based on categories
consumers: Frontend
producer: Node backend
input parameters: none
output: array of all plugins
author: Aman Sutariya 
edit : Aman Sutariya */
module.exports.plugin_filter = [
  async (req, res) => {
    let codebaseFilter = req.body.codebase;
    let db = admin.firestore();
    let jsonResponse = [];

    //req.user.id is a letiable coming in request header which contains current
    // user's id.
    if (req.user.id != " ") {
      await db
        .collection("Plugin")
        .where("codebaseRef", "array-contains", codebaseFilter)
        .get()
        .then((result) => {
          result.docs.forEach((r) => {
            jsonResponse.push(r.data());
          });
          if (jsonResponse.length > 0) {
            res.status(200).json({
              status: true,
              status_code: 200,
              data: jsonResponse,
              message: "Plugin details fetched successfully",
            });
          } else {
            res.status(404).json({
              status: true,
              status_code: 404,
              data: [],
              message: "No Plugins Found w.r.t Category!",
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

/* api for fetching categories or codebase for all the repositories
consumers: Frontend and other third party app
producer: Node backend
input parameters: none
output: array of all category lists
author: Aman Sutariya */
module.exports.plugin_category_list = [
  
  async (req, res) => {
    let db = admin.firestore();
    let categorylist = [];
    await db
      .collection("Codebase")
      .get()
      .then((r) => {
        r.docs.forEach((d) =>
          categorylist.push(d._fieldsProto.name.stringValue)
        );
      })
      .catch((e) => {
        res.status(501).json({
          error: "Firebase Error Occurred",
        });
      });
    res.status(200).json({
      status: true,
      status_code: 200,
      category_list: categorylist,
      message: "Response send sucessfully",
    });
  },
];

/* api for fetching all the trending repositories
consumers: Frontend and other third party app
producer: Node backend
input parameters: none
output: array of all trending repos
author: Aman Sutariya */
module.exports.plugin_trending = [
  
  async (req, res) => {
    let db = admin.firestore();
    let trendingRepos = [];

    // req.user.id is a letiable coming in request header which
    // contains current user's id.
    if (req.user.id != " ") {
      await db
        .collection("Plugin")
        .where("status", "==", "Approved")
        .get()
        .then((result) => {
          let page_no = req.params.page_no;

          /*
          apiPaginationHelper helps paginate all the queries.
          Module defined in pagination.js in utils folder
        */
          apiPaginationHelper.api_pagination(result, page_no, trendingRepos);

          // result.docs.forEach((r) => {

          //   let jsonResponse = r.data();

          //   // trending logic goes here
          //   trendingRepos.push(jsonResponse)
          // })
        })
        .catch((e) => {
          res.status(501).json({
            error: "Error Occurred while Pagination.",
          });
        });
      res.status(200).json({
        status: true,
        status_code: 200,
        data: trendingRepos,
        message: "Response send successfully",
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

/* api for fetching all the trending repositories without page
consumers: Frontend and other third party app
producer: Node backend
input parameters: none
output: array of all trending repos
author: Aman Sutariya */
module.exports.plugin_trending_no_page = [
  
  async (req, res) => {
    let db = admin.firestore();
    let trendingRepos = [];

    // req.user.id is a letiable coming in request header which
    // contains current user's id.
    if (req.user.id != " ") {
      await db
        .collection("Plugin")
        .where("status", "==", "Approved")
        .get()
        .then((result) => {
          result.docs.forEach((r) => {
            let jsonResponse = r.data();

            // trending logic goes here
            trendingRepos.push(jsonResponse);
          });
        })
        .catch((e) => {
          res.status(501).json({
            error: "Error Occurred while fetching Trending Repositories.",
          });
        });
      res.status(200).json({
        status: true,
        status_code: 200,
        data: trendingRepos,
        message: "Response send successfully",
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

//method to view plugin details(repos)
//input: plugin name for viewing details.
//output: data from firestore
//dependencies: Firebase.
//author: Aman Sutariya
module.exports.plugin_view = [
  
  async (req, res) => {
    let db = admin.firestore();

    await db
      .collection("Plugin")
      .where("title", "==", req.params.pluginName)
      .get()
      .then((result) => {
        if (result.docs.length > 0) {
          result.docs.forEach((innerResult) => {
            res.status(200).json({
              status: true,
              status_code: 200,
              data: innerResult.data(),
              message: "Plugin details fetched successfully",
            });
          });
        } else {
          res.status(404).json({
            status: true,
            status_code: 404,
            data: {},
            message: "Plugin not Found!",
          });
        }
      });
  },
];

/*
method to edit plugins(repos)
input: edit form fields from the frontend.
output: Response
dependencies: Firebase.
downside: too many firebase calls (might decrease speed)
author: Aman Sutariya
*/
module.exports.plugin_edit = [
  
  async (req, res) => {
    let db = admin.firestore();
    let userDetails;
    const { errors, isValid } = validateRepoUpdateRequest(req.body);

    // Check validation
  if (!isValid) {
    return res.status(400).json({ errors: errors });
  }
    let codebase_arr = req.body.data.codebaseRef;
    let language_arr = req.body.data.languageRef;
    let codebaseList = [];
    let languageList = [];

    if (req.user.id != " ") {
      await db
        .collection("Plugin")
        .where("title", "==", req.body.repo_name)
        .where("userRef", "==", `User/${req.user.id}`)
        .get()
        .then((result) => {
          if (result.docs.length != 0){
          result.docs.forEach(async (r) => {
            codebaseList = r.data().codebaseRef;
            languageList = r.data().languageRef;

            codebaseList.forEach(async (cIndex) => {
              await db
                .collection("Plugin")
                .doc(r.id)
                .update({
                  codebaseRef: admin.firestore.FieldValue.arrayRemove(cIndex),
                });
            });

            codebase_arr.forEach(async (c) => {
              await db
                .collection("Plugin")
                .doc(r.id)
                .update({
                  codebaseRef: admin.firestore.FieldValue.arrayUnion(c),
                });
            });

            languageList.forEach(async (lIndex) => {
              await db
                .collection("Plugin")
                .doc(r.id)
                .update({
                  languageRef: admin.firestore.FieldValue.arrayRemove(lIndex),
                });
            });

            language_arr.forEach(async (l) => {
              await db
                .collection("Plugin")
                .doc(r.id)
                .update({
                  languageRef: admin.firestore.FieldValue.arrayUnion(l),
                });
            });

            await db
              .collection("Plugin")
              .doc(r.id)
              .update({
                description: req.body.data.description,
                price: req.body.data.price,
                inputType: req.body.data.inputType,
                outputType: req.body.data.outputType,
              });

            await db
              .collection("User")
              .doc(req.user.id)
              .get()
              .then((data) => {
                userDetails = data.data();
              });

            // Sending a mail for successful update on repo.
            // console.log('Entering Mail Utils...')
            mailUtils.update_repo_details(userDetails, r.data());
            // console.log('Exiting Mail Utils...')
            res.status(200).json({
              status: true,
              status_code: 200,
              message: "Plugin updated successfully",
            });
          }) 
        }
        else{
          res.status(404).json({
            error: "No Repository with the given name for current user present.",
          });
        }
        })
        .catch((err) => {
          // console.log(err);
          res.status(501).json({
            error: "Error fetching User's Repositories.",
          });
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

/*method to search plugins(repos)
input: Search Query from Frontend
output: List of Plugins w.r.t search query
dependencies: Firebase and Python Backend on FastAPI.
downside: Due to limitation of Firebase on 10 concurrent repos can be shown per page.
author:Aman Sutariya*/
module.exports.search_plugins = [
  (req, res) => {
    const searchParams = {
      slug: { $regex: ".*" + req.query.search + ".*" },
    };

    if (req.query.codebaseFilter) {
      searchParams["codebase"] = { $in: [req.query.codebaseFilter] };
    }
    if (req.query.languageFilter) {
      searchParams["language"] = { $in: [req.query.languageFilter] };
    }
    if (req.query.priceFilter) {
      searchParams["price"] = { $lte: req.query.priceFilter };
    }
    // console.log(JSON.stringify(req.query))

    url = `${process.env.search_url}/search/${JSON.stringify(req.query)}`;
    // console.log(url)

    Request(url, async function (error, response, body) {
      if (!error && response.statusCode == 200) {
        let searchResults = JSON.parse(body);

        final = searchResults.similar_by_rating.concat(
          searchResults.similar_by_cosine
        );
        // console.log(req.query.search)
        // console.log(`Similar by cosine length : ${searchResults.similar_by_cosine.length}`)
        // console.log(`Similar by rating length : ${searchResults.similar_by_rating.length}`)
        // Removing Duplicates
        let filteredfinal = final.filter(function (item, pos) {
          return final.indexOf(item) == pos;
        });

        let db = admin.firestore();

        const allPlugins = [];
        try {
          filteredfinal.forEach((item) => {
            let jsonObject = {
              title: item,
            };
            allPlugins.push(jsonObject);
          });
        } catch {
          allPlugins = [];
        }
        res.status(200).json(allPlugins);
      }
    });
  },
];

/* 
  method to fetch the language list from firebase
  input: none
  output: Response
  dependencies: Firebase.
  downside: none
  author: Aman Sutariya
*/
module.exports.get_all_languages = [
  
  async (req, res) => {
    let db = admin.firestore();
    let language_list = [];

    await db
      .collection("Language")
      .get()
      .then((response) => {
        response.forEach((r) => {
          language_list.push(r.data().name);
        });
        res.status(200).json({
          status: true,
          status_code: 200,
          data: language_list,
          message: "Languages fetched successfully",
        });
      })
      .catch((err) => {
        res.status(501).json({
          status: false,
          status_code: 501,
          message: "Firebase Error Occurred.",
        });
      });
  },
];
