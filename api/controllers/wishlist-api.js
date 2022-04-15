const admin = require("firebase-admin");
const { firestore } = require("firebase-admin");

const apiPaginationHelper = require("../../utils/pagination");

let codebase = {
  "1Wnj2qKgYoThS3rWIb7a": "Data Annotation",
  D0Oq8uBf4wLAT6gE5uOE: "Image Classification",
  KEgQsPE5n81vd9fGqABS: "Natural Language Processing",
  LE4uP5kLFx7QvEUp2y08: "Image Annotation",
  OBunDroXr13XmJpGET8F: "Computer Vision",
  ZCZhBME2V17tK1wLPo4r: "Speech Recognition",
  ZQko2HMWn8Cfr5oWE2Ec: "Image Enhancement",
  ZUIyPefXrxvbCtuXkDPu: "Information Retrieval",
  aS8tJo3CJYO0wSMxM6QR: "Others",
  bRFCacgcDaCT4mm7oJdk: "Noise Reduction",
  h0eVizGJy4OadSXWd5wK: "Robotic Process Automation",
  l9i0dzPKPPmEoySqLBZ3: "Reinforcement Learning",
};

let language = {
  "9KYkbfLIS3kDT4ilKDo0": "TensorFlow",
  "9xg8hAGsLPL2HfMScGyG": "Python",
  AOdQBpZ6RHJN55scKMDF: "JavaScript",
  IK33ttQOidUy3mrKXwgZ: "CUDA",
  LiRC6HGBq80QJrFZYUWk: "Tensor Cart",
  LlRRdFUpAs3guBNaeLi3: "C",
  lHlJtZ2qzb6BQcBZ8QmN: "keras",
  rTZCCfDA81r6cP69t1N3: "C++",
  vyOfSm0VBXDshC9UBUvV: "Other Frameworks",
  xExBsXIlUa3IM7KCs8K4: "perl",
  yruYQSTBwHqNN5lFv5XZ: "R",
};

/* method to get the status for a Repository in Present
in Wishlist given a User
input: Plugin Name and UserId (present in req.user.id)
output: Response
dependencies: Firebase.
downside: the references in firestore creates too many firestore collections call
author: Aman Sutariya */
module.exports.wishlist_plugin_status = async (req, res) => {
  let db = admin.firestore();
  let pluginId;
  let pluginName = req.params.plugin;
  let pluginData;
  if (req.user.id != undefined) {
    //fetching Plugin Details
    db.collection("Plugin")
      .where("title", "==", pluginName)
      .get()
      .then((plugin) => {
        pluginId = plugin.docs[0].id;
        pluginData = plugin.docs[0].data();
        if (pluginData != null) {
          db.collection("Wishlist")
            .where("userRef", "==", `User/${req.user.id}`)
            .where("pluginsRef", "array-contains", `Plugin/${pluginId}`)
            .get()
            .then((wishlist) => {
              // Item present in Wishlist
              if (wishlist.docs.length == 1) {
                res.status(200).json({
                  status: true,
                  status_code: 200,
                  message: "Plugin Present in Wishlist!",
                  data: {
                    wishlistRef: wishlist.docs[0].id,
                    ...pluginData,
                  },
                  inWishlist: true,
                });
              }
              // Item not present in Wishlist
              else {
                res.status(404).json({
                  status: true,
                  status_code: 404,
                  message: "Plugin Not Present in Wishlist!",
                  data: {
                    ...pluginData,
                  },
                  inWishlist: false,
                });
              }
            })
            .catch((err) => console.log(err));
        } else {
          res.status(404).json({
            status: true,
            status_code: 404,
            message: "No Plugin Found!",
          });
        }
      });
  } else {
    res.status(401).json({
      status: true,
      status_code: 401,
      message: "Please Log in Again, Unauthorized!",
      inWishlist: false,
    });
  }
};

/* async function that contains a promise to 
fetch all the responses from firebase
This function is called by wishlist_plugin_get module. */
async function getWishlistPlugins(req) {
  return new Promise(async (resolve, reject) => {
    let db = admin.firestore();
    let finalResponse = [];
    let codebaseName = [];
    let languageName = [];
    let keys = [];

    await db
      .collection("Wishlist")
      .where("userRef", "==", `User/${req.user.id}`)
      .get()
      .then(async (result) => {
        result.docs.forEach(async (r) => {
          r.data().pluginsRef.forEach(async (rr) => {
            let string = rr.split("/");
            keys.push(string[1]);
          });
        });

        if (keys.length > 0) {
          await db
            .collection("Plugin")
            .where(firestore.FieldPath.documentId(), "in", keys)
            .get()
            .then((beta) => {
              let page_no = req.params.page_no;
              apiPaginationHelper.api_pagination(beta, page_no, finalResponse);
              // console.log(beta);
              // beta.docs.forEach((r) => {
              //   finalResponse.push(r.data());
              // })
            });
          // console.log(finalResponse)
        } else {
          finalResponse = [];
        }
      });
    resolve(finalResponse);
  });
}

/* async function that contains a promise to 
fetch all the responses from firebase
This function is called by wishlist_plugin_get module. (Without Page)*/
async function getWishlistPluginsNoPage(req) {
  return new Promise(async (resolve, reject) => {
    let db = admin.firestore();
    let finalResponse = [];
    let codebaseName = [];
    let languageName = [];
    let keys = [];

    await db
      .collection("Wishlist")
      .where("userRef", "==", `User/${req.user.id}`)
      .get()
      .then(async (result) => {
        result.docs.forEach(async (r) => {
          r.data().pluginsRef.forEach(async (rr) => {
            let string = rr.split("/");
            keys.push(string[1]);
          });
        });

        if (keys.length > 0) {
          await db
            .collection("Plugin")
            .where(firestore.FieldPath.documentId(), "in", keys)
            .get()
            .then((beta) => {
              beta.docs.forEach((r) => {
                finalResponse.push(r.data());
              });
            });
        } else {
          finalResponse = [];
        }
      });
    resolve(finalResponse);
  });
}

/* method to get the whole wishlist for a user without Page
input: none
output: Response
dependencies: Firebase.
downside: the references in firestore creates too many firestore collections call
author: Aman Sutariya */
module.exports.wishlist_plugin_get_no_page = [
  async (req, res) => {
    if (req.user.id != " " || req.user.id != "undefined") {
      getWishlistPluginsNoPage(req).then((r) => {
        if (r.length > 0) {
          res.status(200).json({
            status: true,
            status_code: 200,
            data: r,
            message: "Wishlist fetched successfully",
          });
        } else {
          res.status(404).json({
            status: true,
            status_code: 404,
            data: r,
            message: "No Plugins in Wishlist for the User.",
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

/* method to get the whole wishlist for a user
input: none
output: Response
dependencies: Firebase.
downside: the references in firestore creates too many firestore collections call
author: Aman Sutariya */
module.exports.wishlist_plugin_get = [
  async (req, res) => {
    if (req.user.id != " " || req.user.id != "undefined") {
      getWishlistPlugins(req).then((r) => {
        if (r.length > 0) {
          res.status(200).json({
            status: true,
            status_code: 200,
            data: r,
            message: "Wishlist fetched successfully",
          });
        } else {
          res.status(404).json({
            status: true,
            status_code: 404,
            data: r,
            message: "No Plugins in Wishlist for the User.",
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

/* method to add a plugin to the wishlist
input: repo name for adding details.
output: Response
dependencies: Firebase.
downside: the references in firestore creates too many firestore collections call
author: Aman Sutariya */
module.exports.wishlist_plugin_save = [
  async (req, res) => {
    let db = admin.firestore();
    let pluginRef;
    let pluginData;
    let wishlistRef;
    if (req.user.id != " " || req.user.id != "undefined") {
      const plugin = await db
        .collection("Plugin")
        .where("title", "==", req.body.repo_name)
        .get();

      if (plugin.docs.length == 1) {
        pluginRef = plugin.docs[0].id;
        pluginData = plugin.docs[0].data();
        if (pluginData.userRef == `User/${req.user.id}`) {
          return res.status(405).json({
            status: false,
            status_code: 405,
            error: "You cannot wishlist your own plugin.",
          });
        }
        if (pluginData.status != "Approved") {
          return res.status(405).json({
            status: false,
            status_code: 405,
            error: "Plugin Not yet Approved by our team!",
          });
        }
      } else {
        return res.status(404).json({
          status: false,
          status_code: 404,
          error: "No Plugin Found!",
        });
      }

      const wishlist = await db
        .collection("Wishlist")
        .where("userRef", "==", `User/${req.user.id}`)
        .get();
      if (wishlist.docs.length == 1) {
        wishlistRef = wishlist.docs[0].id;
        await db
          .collection("Wishlist")
          .doc(wishlistRef)
          .update({
            pluginsRef: admin.firestore.FieldValue.arrayUnion(
              `Plugin/${pluginRef}`
            ),
          });
      } else if (wishlist.docs.length > 1) {
        wishlist.docs.forEach((doc) => {
          db.collection("Wishlist").doc(doc.id).delete();
        });
        await db.collection("Wishlist").add({
          pluginsRef: [`Plugin/${pluginRef}`],
          userRef: `User/${req.user.id}`,
        });
      } else {
        await db.collection("Wishlist").add({
          pluginsRef: [`Plugin/${pluginRef}`],
          userRef: `User/${req.user.id}`,
        });
      }

      return res.status(200).json({
        status: true,
        status_code: 200,
        message: "Plugin saved to wishlist successfully",
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

/*module to remove an item from the wishlist
input: repo name for removing details.
output: Response
dependencies: Firebase.
downside: the references in firestore creates too many firestore collections call
author: Aman Sutariya */
module.exports.wishlist_plugin_remove = [
  async (req, res) => {
    let db = admin.firestore();
    let pluginRef;
    let pluginData;
    let wishlistRef;
    let wishlistData;

    if (req.user.id != " " || req.user.id != "undefined") {
      const plugin = await db
        .collection("Plugin")
        .where("title", "==", req.body.repo_name)
        .get();

      if (plugin.docs.length == 1) {
        pluginRef = plugin.docs[0].id;
        pluginData = plugin.docs[0].data();
        if (pluginData.userRef == `User/${req.user.id}`) {
          return res.status(405).json({
            status: false,
            status_code: 405,
            error: "Can't remove your own Plugin.",
          });
        }
        if (pluginData.status != "Approved") {
          return res.status(405).json({
            status: false,
            status_code: 405,
            error: "Plugin Not yet Approved by our team!",
          });
        }
      } else {
        return res.status(404).json({
          status: false,
          status_code: 404,
          error: "No Plugin Found!",
        });
      }

      const wishlist = await db
        .collection("Wishlist")
        .where("userRef", "==", `User/${req.user.id}`)
        .get();

      if (wishlist.docs.length == 1) {
        wishlistRef = wishlist.docs[0].id;
        wishlistData = wishlist.docs[0].data();

        if (wishlistData.pluginsRef.indexOf(`Plugin/${pluginRef}`) == -1) {
          return res.status(404).json({
            status: false,
            status_code: 404,
            error: "Plugin not present in the wishlist.",
          });
        }
        await db
          .collection("Wishlist")
          .doc(wishlistRef)
          .update({
            pluginsRef: admin.firestore.FieldValue.arrayRemove(
              `Plugin/${pluginRef}`
            ),
          });
      } else if (wishlist.docs.length > 1) {
        wishlist.docs.forEach((doc) => {
          db.collection("Wishlist").doc(doc.id).delete();
        });
        await db.collection("Wishlist").add({
          pluginsRef: [],
          userRef: `User/${req.user.id}`,
        });
      } else {
        await db.collection("Wishlist").add({
          pluginsRef: [],
          userRef: `User/${req.user.id}`,
        });
      }

      return res.status(200).json({
        status: true,
        status_code: 200,
        message: "Plugin removed from wishlist successfully",
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
