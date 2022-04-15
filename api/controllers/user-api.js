const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
let Request = require("request");
const admin = require("firebase-admin");
const keys = require("../../config/keys");
const mailUtils = require("../../utils/mailUtils");
const stripe = require("stripe")(process.env.stripe_key);
const octo = require("@octokit/request");

// Load input validation
const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");
const validateUserInput = require("../../validation/editProfile");

// Utilities
const user_utils = require("../utils/user-utils");
const { default: axios } = require("axios");

/* 
method to add github collaborator
input: Login github user 
output: Collaborator
dependencies: Firebase, Stripe.
author: Aman Sutariya
*/
module.exports.github_add_collaborator = async (req, res) => {
  try {
    const result = await octo.request(
      "PUT /repos/{owner}/{repo}/collaborators/{username}",
      {
        headers: {
          accept: "application/vnd.github.v3+json",
          authorization: "token " + req.user.githubAccessToken + "",
        },
        owner: req.body.owner_username,
        repo: req.body.owner_repo,
        username: `${process.env.githubUsername}`,
        permission: "admin",
      }
    );
    if (result.data != undefined) {
      user_utils.addRepo(result.data, req, res);
    } else {
      res.status(400).json({ error: "Invitation Already Accepted." });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/* 
method to add bitbucket collaborator
input: Login bitbucket user 
output: Collaborator
dependencies: Firebase, Stripe.
author: Aman Sutariya
*/
module.exports.bitbucket_add_collaborator = (req, res) => {
  let username = req.body.userName;
  let reponame = req.body.repoName;
  Request.post(
    {
      headers: {
        "Cache-control": "no-cache",
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${req.user.bitbucketAccessToken}`,
      },
      url: `https://api.bitbucket.org/1.0/invitations/${username}/${reponame}`,
      form: {
        email: "tensorplace@gmail.com",
        permission: "admin",
      },
    },
    (error, response, body) => {
      if (error) {
        res.status(300).json({
          status: false,
          status_code: 300,
          error: error,
          message: "Something went wrong",
        });
      } else {
        user_utils.addBitRepo(body, req, res);
      }
    }
  );
};

/* 
method to get currentuser
input: Login user 
output: Details about currentuser
dependencies: Firebase, Stripe.
author: Aman Sutariya
*/
module.exports.currentuser = async (req, res) => {
  let db = admin.firestore();
  try {
    const user = req.user;
    const userData = user.data();
    const userDetails = {
      userId: req.user.id,
      accepted_tos: userData?.accepted_tos,
      developerScore: userData?.developerScore,
      email: userData?.email,
      firstName: userData?.firstName,
      lastName: userData?.lastName,
      githubId: userData?.githubId,
      numberOfRepositories: userData?.numberOfRepositories,
      profileImg: userData?.profileImg,
      repositoriesPurchased: userData?.repositoriesPurchased,
      subscribe_emails: userData?.subscribe_emails,
      userName: userData?.userName,
      tagline: userData?.tagline,
    };
    return res.status(200).json({
      status: true,
      status_code: 200,
      data: userDetails,
      message: "User Details fetched Successfully!",
    });
  } catch {
    return res.status(404).json({
      status: true,
      status_code: 404,
      message: "Error in fetching User Details!",
    });
  }
};

/* 
method to login via Bitbucket
input: Login user 
output: Logged in user
dependencies: Firebase, Stripe.
author: Aman Sutariya
*/
module.exports.login_bitbucket = (req, res) => {
  const clientData = {
    client_id: keys.bitbucketClientId,
    client_secret: keys.bitbucketClientSecret,
    code: req.body.userData.code,
  };
  console.log(clientData);
  let code = req.body.userData.code;
  let digested = new Buffer(
    `${process.env.bitbucket_client_key}:${process.env.bitbucket_client_secret}`
  ).toString("base64");
  Request.post(
    {
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${digested}`,
      },
      url: "https://bitbucket.org/site/oauth2/access_token",
      form: { grant_type: "authorization_code", code: `${code}` },
    },
    (error, response, body) => {
      if (error) {
        return console.log(error);
      }
      let json_body = JSON.parse(body);
      let access_token = json_body.access_token;
      let bitbucketAccessToken = json_body.access_token;

      Request.get(
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Cache-control": "no-cache",
          },
          url: "https://api.bitbucket.org/2.0/user",
        },
        async (error, response, body) => {
          if (!body) {
            console.log(error);
            return res.send(401, "User Not Authenticated");
          }
          let db = admin.firestore();
          let userData = JSON.parse(body);
          console.log(userData);
          const data = {
            developerScore: 0,
            email: "null",
            emaillVerificationCode: "null",
            firstName: "null",
            githubId: "null",
            githubToken: "null",
            lastName: "null",
            numberOfRepositories: 0,
            password: "null",
            profileImg: "null",
            repositoriesPurchased: "null",
            repositoriesViews: "null",
            userName: userData.username,
            accepted_tos: true,
            cards: [],
            subscribe_emails: false,
            tagline: "",
            github: {},
            bitbucket: {
              userName: userData.username,
              displayName: userData.display_name,
              fullName: userData.nickname,
            },
            gitLab: {},
          };
          // data.bitbucket.push({
          //   userName: userData.username,
          //   displayName: userData.display_name,
          //   fullName: userData.nickname
          // })
          await db
            .collection("User")
            .where("bitbucket.userName", "==", userData.username)
            .get()
            .then(async (r) => {
              if (r._size == 0) {
                await db
                  .collection("User")
                  .add(data)
                  .then(async (r) => {
                    const currentUserData = {
                      userName: userData.username,
                    };

                    await db
                      .collection("CURRENT_USER")
                      .where("userName", "==", userData.username)
                      .get()
                      .then(async (result) => {
                        if (result.size == 0) {
                          await db
                            .collection("CURRENT_USER")
                            .add(currentUserData)
                            .then(async (innerResult) => {
                              let payload = {
                                id: r.id,
                                userName: userData.username,
                                bitbucketAccessToken: bitbucketAccessToken,
                              };

                              jwt.sign(
                                payload,
                                keys.secretOrKey,
                                {
                                  expiresIn: 3600,
                                },
                                (err, token) => {
                                  res.status(200).json({
                                    success: true,
                                    authToken: "Bearer " + token,
                                  });
                                }
                              );
                            });
                        } else if (result.size > 0) {
                          result.docs.forEach((docId) => {
                            let payload = {
                              id: r.id,
                              userName: userData.username,
                              bitbucketAccessToken: bitbucketAccessToken,
                            };

                            jwt.sign(
                              payload,
                              keys.secretOrKey,
                              {
                                expiresIn: 3600,
                              },
                              (err, token) => {
                                res.status(200).json({
                                  sucess: true,
                                  authToken: "Bearer " + token,
                                });
                              }
                            );
                          });
                        }
                      });
                  });
              } else if (r._size > 0) {
                let userId;
                let userRelated;

                r.forEach((doc) => {
                  userId = doc.id;
                  userRelated = doc.data();
                });

                const currentUserData = {
                  userName: userData.username,
                };

                await db
                  .collection("CURRENT_USER")
                  .where("userName", "==", userData.username)
                  .get()
                  .then(async (result) => {
                    if (result.size == 0) {
                      await db
                        .collection("CURRENT_USER")
                        .add(currentUserData)
                        .then((innerResult) => {
                          let payload = {
                            id: userId,
                            userName: userData.username,
                            bitbucketAccessToken: bitbucketAccessToken,
                          };

                          jwt.sign(
                            payload,
                            keys.secretOrKey,
                            {
                              expiresIn: 3600,
                            },
                            (err, token) => {
                              res.status(200).json({
                                success: true,
                                authToken: "Bearer " + token,
                              });
                            }
                          );
                        });
                    } else if (result.size > 0) {
                      result.docs.forEach((docId) => {
                        let payload = {
                          id: userId,
                          userName: userData.username,
                          bitbucketAccessToken: bitbucketAccessToken,
                        };

                        jwt.sign(
                          payload,
                          keys.secretOrKey,
                          {
                            expiresIn: 3600,
                          },
                          (err, token) => {
                            res.status(200).json({
                              success: true,
                              authToken: "Bearer " + token,
                            });
                          }
                        );
                      });
                    }
                  });
              }
            });
        }
      );
    }
  );
};

/* 
method to login via Github using Personal Access Token
input: Login user 
output: Logged in user
dependencies: Firebase, Stripe, Github API.
author: Kairav
*/

module.exports.login_github_pat = (req, res) => {
  let githubAccessToken = req.body.personal_access_token;
  axios({
    url: "https://api.github.com/user",
    method: "get",
    headers: {
      Authorization: "token " + githubAccessToken,
      "User-Agent": "request",
    },
  })
    .then(async (github_response) => {
      const response = github_response.data;
      let db = admin.firestore();
      const userData = response;
      let name;
      if (userData.name) {
        name = userData.name.split(" ");
      } else {
        name = ["", ""];
      }

      const data = {
        developerScore: 0,
        email: userData.email,
        emaillVerificationCode: "null",
        firstName: name[0],
        githubId: userData.id,
        githubToken: userData.node_id,
        lastName: name[1],
        numberOfRepositories: 0,
        password: "null",
        profileImg: userData.avatar_url,
        repositoriesPurchased: "null",
        repositoriesViews: "null",
        userName: userData.login,
        accepted_tos: true,
        cards: [],
        subscribe_emails: false,
        tagline: "",
      };

      await db
        .collection("User")
        .where("userName", "==", userData.login)
        .get()
        .then(async (r) => {
          if (r.docs.length == 0) {
            let customer = await stripe.customers.create({
              name: `${userData.login}`,
              email: userData.email,
              metadata: {
                username: userData.login,
                tensorplace_user_id: "",
              },
            });

            await db
              .collection("User")
              .add(data)
              .then(async (r) => {
                // Update the metadata in Stripe Customer
                let updated_customer = await stripe.customers.update(
                  customer.id,
                  {
                    metadata: {
                      username: userData.login,
                      tensorplace_user_id: r.id,
                    },
                  }
                );
                await db.collection("UserPlugins").add({
                  approved: admin.firestore.FieldValue.arrayUnion("null"),
                  pending: admin.firestore.FieldValue.arrayUnion("null"),
                  purchaseRef: admin.firestore.FieldValue.arrayUnion("null"),
                  userRef: `User/${r.id}`,
                });

                if (process.env["ENABLE_MAILING"] == "true") {
                  // console.log('Entering Mail Utils...')
                  mailUtils.register_github(userData);
                  // console.log('Exited MailUtils...')
                }

                const currentUserData = {
                  email: userData.email,
                  userName: userData.login,
                };

                await db
                  .collection("CURRENT_USER")
                  .where("userName", "==", userData.login)
                  .get()
                  .then(async (result) => {
                    if (result.size == 0) {
                      await db
                        .collection("CURRENT_USER")
                        .add(currentUserData)
                        .then(async (innerResult) => {
                          let payload = {
                            id: r.id,
                            email: userData.email,
                            userName: userData.login,
                            githubAccessToken: githubAccessToken,
                          };

                          jwt.sign(
                            payload,
                            keys.secretOrKey,
                            {
                              expiresIn: 3600, // 60 mins in seconds
                            },
                            (err, token) => {
                              res.status(200).json({
                                success: true,
                                authToken: "Bearer " + token,
                              });
                            }
                          );
                        });
                    } else if (result.size > 0) {
                      result.docs.forEach((docId) => {
                        let payload = {
                          id: r.id,
                          email: userData.email,
                          userName: userData.login,
                          githubAccessToken: githubAccessToken,
                        };

                        jwt.sign(
                          payload,
                          keys.secretOrKey,
                          {
                            expiresIn: 3600, // 60 mins in seconds
                          },
                          (err, token) => {
                            res.status(200).json({
                              success: true,
                              authToken: "Bearer " + token,
                            });
                          }
                        );
                      });
                    }
                  });
              })
              .catch((e) => {
                console.log("some error occured");
                console.log(e);
              });
          } else if (r._size > 0) {
            let userId;
            let userRelated;
            r.forEach(async (doc) => {
              userId = doc.id;
              userRelated = doc.data();
              if (
                userRelated.stripe_customer_id == undefined ||
                userRelated.stripe_customer_id == ""
              ) {
                let customer = await stripe.customers.create({
                  name: `${userRelated.userName}`,
                  email: userRelated.email,
                  metadata: {
                    username: userRelated.userName,
                    tensorplace_user_id: doc.id,
                  },
                });
                await db.collection("User").doc(doc.id).update({
                  stripe_customer_id: customer.id,
                });
              }
            });
            // console.log('Doc ID', userId)
            // console.log('Doc Data', userRelated)

            const currentUserData = {
              email: userRelated.email,
              userName: userData.login,
            };
            // console.log(currentUserData);
            await db
              .collection("CURRENT_USER")
              .where("userName", "==", userData.login)
              .get()
              .then(async (result) => {
                if (result.size == 0) {
                  await db
                    .collection("CURRENT_USER")
                    .add(currentUserData)
                    .then((innerResult) => {
                      let payload = {
                        id: userId,
                        email: userRelated.email,
                        userName: userRelated.userName,
                        githubAccessToken: githubAccessToken,
                      };

                      jwt.sign(
                        payload,
                        keys.secretOrKey,
                        {
                          expiresIn: 3600, // 60 mins in seconds
                        },
                        (err, token) => {
                          res.status(200).json({
                            success: true,
                            authToken: "Bearer " + token,
                          });
                        }
                      );
                    });
                } else if (result.size > 0) {
                  result.docs.forEach((docId) => {
                    let payload = {
                      id: userId,
                      email: userRelated.email,
                      userName: userRelated.userName,
                      githubAccessToken: githubAccessToken,
                    };

                    jwt.sign(
                      payload,
                      keys.secretOrKey,
                      {
                        expiresIn: 3600, // 60 mins in seconds
                      },
                      (err, token) => {
                        res.status(200).json({
                          success: true,
                          authToken: "Bearer " + token,
                        });
                      }
                    );
                  });
                }
              });
          }
        })
        .catch((err) => {
          res.status(501).json({
            message: "Failed to fetch the user - Firestore.",
            success: false,
            error: err,
          });
        });
    })
    .catch((err) => {
      res.status(501).json({
        message: "Failed to fetch the user.",
        success: false,
        error: err,
      });
    });
};

/* 
method to login via Github
input: Login user 
output: Logged in user
dependencies: Firebase, Stripe.
author: Aman Sutariya
*/
module.exports.login_github = (req, res) => {
  const clientData = {
    client_id: keys.GITHUB_CLIENT_ID,
    client_secret: keys.GITHUB_CLIENT_SECRET,
    code: req.body.userData.code,
  };

  Request.post(
    {
      headers: { "content-type": "application/json" },
      url: "https://github.com/login/oauth/access_token",
      body: JSON.stringify(clientData),
    },
    (error, resp, body) => {
      if (error) {
        return console.dir(error);
      }
      let token = resp.body;
      let new_token = token.split("&");
      let final_token = new_token[0];
      let tokkenn = final_token.split("=");
      githubAccessToken = tokkenn[1];

      let params = body.split("&");
      if (params.length > 0) {
        let key = decodeURIComponent(params[0].replace("access_token=", ""));

        Request.get(
          {
            headers: { Authorization: "token " + key, "User-Agent": "request" },
            url: "https://api.github.com/user",
          },
          async (error, response, body) => {
            if (error) {
              res.status(501).json({
                message: "Failed to fetch the user.",
                success: false,
              });
            }
            console.log('RESPONSE: ', response)
            let db = admin.firestore();
            const userData = JSON.parse(body);
            let name;
            if (userData.name) {
              name = userData.name.split(" ");
            } else {
              name = ["", ""];
            }

            const data = {
              developerScore: 0,
              email: userData.email,
              emaillVerificationCode: "null",
              firstName: name[0],
              githubId: userData.id,
              githubToken: userData.node_id,
              lastName: name[1],
              numberOfRepositories: 0,
              password: "null",
              profileImg: userData.avatar_url,
              repositoriesPurchased: "null",
              repositoriesViews: "null",
              userName: userData.login,
              accepted_tos: true,
              cards: [],
              subscribe_emails: false,
              tagline: "",
            };

            await db
              .collection("User")
              .where("userName", "==", userData.login)
              .get()
              .then(async (r) => {
                if (r.docs.length == 0) {
                  let customer = await stripe.customers.create({
                    name: `${userData.login}`,
                    email: userData.email,
                    metadata: {
                      username: userData.login,
                      tensorplace_user_id: "",
                    },
                  });
                  await db
                    .collection("User")
                    .add(data)
                    .then(async (r) => {
                      // Update the metadata in Stripe Customer
                      let updated_customer = await stripe.customers.update(
                        customer.id,
                        {
                          metadata: {
                            username: userData.login,
                            tensorplace_user_id: r.id,
                          },
                        }
                      );
                      await db.collection("UserPlugins").add({
                        approved: admin.firestore.FieldValue.arrayUnion("null"),
                        pending: admin.firestore.FieldValue.arrayUnion("null"),
                        purchaseRef:
                          admin.firestore.FieldValue.arrayUnion("null"),
                        userRef: `User/${r.id}`,
                      });

                      // console.log('Entering Mail Utils...')
                      mailUtils.register_github(userData);
                      // console.log('Exited MailUtils...')

                      const currentUserData = {
                        email: userData.email,
                        userName: userData.login,
                      };

                      await db
                        .collection("CURRENT_USER")
                        .where("userName", "==", userData.login)
                        .get()
                        .then(async (result) => {
                          if (result.size == 0) {
                            await db
                              .collection("CURRENT_USER")
                              .add(currentUserData)
                              .then(async (innerResult) => {
                                let payload = {
                                  id: r.id,
                                  email: userData.email,
                                  userName: userData.login,
                                  githubAccessToken: githubAccessToken,
                                };

                                jwt.sign(
                                  payload,
                                  keys.secretOrKey,
                                  {
                                    expiresIn: 3600, // 60 mins in seconds
                                  },
                                  (err, token) => {
                                    res.status(200).json({
                                      success: true,
                                      authToken: "Bearer " + token,
                                    });
                                  }
                                );
                              });
                          } else if (result.size > 0) {
                            result.docs.forEach((docId) => {
                              let payload = {
                                id: r.id,
                                email: userData.email,
                                userName: userData.login,
                                githubAccessToken: githubAccessToken,
                              };

                              jwt.sign(
                                payload,
                                keys.secretOrKey,
                                {
                                  expiresIn: 3600, // 60 mins in seconds
                                },
                                (err, token) => {
                                  res.status(200).json({
                                    success: true,
                                    authToken: "Bearer " + token,
                                  });
                                }
                              );
                            });
                          }
                        });
                    })
                    .catch((e) => {
                      console.log("some error occured");
                      console.log(e);
                    });
                } else if (r._size > 0) {
                  let userId;
                  let userRelated;

                  r.forEach(async (doc) => {
                    userId = doc.id;
                    userRelated = doc.data();
                    if (
                      userRelated.stripe_customer_id == undefined ||
                      userRelated.stripe_customer_id == ""
                    ) {
                      let customer = await stripe.customers.create({
                        name: `${userRelated.userName}`,
                        email: userRelated.email,
                        metadata: {
                          username: userRelated.userName,
                          tensorplace_user_id: doc.id,
                        },
                      });
                      db.collection("User").doc(doc.id).update({
                        stripe_customer_id: customer.id,
                      });
                    }
                  });
                  // console.log('Doc ID', userId)
                  // console.log('Doc Data', userRelated)

                  const currentUserData = {
                    email: userRelated.email,
                    userName: userRelated.login,
                  };

                  await db
                    .collection("CURRENT_USER")
                    .where("userName", "==", userData.login)
                    .get()
                    .then(async (result) => {
                      if (result.size == 0) {
                        await db
                          .collection("CURRENT_USER")
                          .add(currentUserData)
                          .then((innerResult) => {
                            let payload = {
                              id: userId,
                              email: userRelated.email,
                              userName: userRelated.userName,
                              githubAccessToken: githubAccessToken,
                            };

                            jwt.sign(
                              payload,
                              keys.secretOrKey,
                              {
                                expiresIn: 3600, // 60 mins in seconds
                              },
                              (err, token) => {
                                res.status(200).json({
                                  success: true,
                                  authToken: "Bearer " + token,
                                });
                              }
                            );
                          });
                      } else if (result.size > 0) {
                        result.docs.forEach((docId) => {
                          let payload = {
                            id: userId,
                            email: userRelated.email,
                            userName: userRelated.userName,
                            githubAccessToken: githubAccessToken,
                          };

                          jwt.sign(
                            payload,
                            keys.secretOrKey,
                            {
                              expiresIn: 3600, // 60 mins in seconds
                            },
                            (err, token) => {
                              res.status(200).json({
                                success: true,
                                authToken: "Bearer " + token,
                              });
                            }
                          );
                        });
                      }
                    });
                }
              });
          }
        );
      }
    }
  );
};

/* 
method to login via email and password.
input: Login user 
output: Logged in user
dependencies: Firebase, Stripe.
author: Aman Sutariya
*/
module.exports.login_email_password = async (req, res) => {
  // Form validation
  const { errors, isValid } = validateLoginInput(req.body);

  // Check validation
  if (!isValid) {
    return res.status(400).json({ errors: errors });
  }

  const email = req.body.email;
  const password = req.body.password;

  const db = admin.firestore();
  await db
    .collection("User")
    .where("email", "==", email)
    .get()
    .then(async (data) => {
      if (data.docs.length == 1) {
        if (
          data.docs[0].data().stripe_customer_id == undefined ||
          data.docs[0].data().stripe_customer_id == ""
        ) {
          let customer = await stripe.customers.create({
            name: `${data.docs[0].data().userName}`,
            email: data.docs[0].data().email,
            metadata: {
              username: data.docs[0].data().userName,
              tensorplace_user_id: data.docs[0].id,
            },
          });
          db.collection("User").doc(data.docs[0].id).update({
            stripe_customer_id: customer.id,
          });
        }
        data.forEach((innerData) => {
          bcrypt
            .compare(password, innerData.data().password)
            .then(async (isMatch) => {
              if (isMatch) {
                await db
                  .collection("CURRENT_USER")
                  .where("userName", "==", innerData.data().userName)
                  .get()
                  .then(async (currentUser_data) => {
                    if (currentUser_data._size == 0) {
                      const cuData = {
                        email: innerData.data().email,
                        userName: innerData.data().userName,
                      };
                      await db
                        .collection("CURRENT_USER")
                        .add(cuData)
                        .then((insertedData) => {
                          const payload = {
                            id: innerData.id,
                            email: innerData.data().email,
                            userName: innerData.data().userName,
                          };
                          jwt.sign(
                            payload,
                            keys.secretOrKey,
                            {
                              expiresIn: 3600, // 60 mins in seconds
                            },
                            (err, token) => {
                              res.status(200).json({
                                success: true,
                                authToken: "Bearer " + token,
                              });
                            }
                          );
                        });
                    } else if (currentUser_data._size == 1) {
                      currentUser_data.docs.forEach((docId) => {
                        let payload = {
                          id: innerData.id,
                          email: innerData.data().email,
                          userName: innerData.data().userName,
                        };

                        jwt.sign(
                          payload,
                          keys.secretOrKey,
                          {
                            expiresIn: 3600, // 60 mins in seconds
                          },
                          (err, token) => {
                            res.status(200).json({
                              success: true,
                              authToken: "Bearer " + token,
                            });
                          }
                        );
                      });
                    }
                  });
              } else {
                return res
                  .status(400)
                  .json({ errors: { password: "Password incorrect" } });
              }
            });
        });
      } else {
        return res
          .status(400)
          .json({ errors: { email: "Email Doesn't Exist." } });
      }
    })
    .catch((e) => {
      res.status(501).json({
        error: `Firebase Error Occurred while fetching the user by email.`,
      });
    });
};

/* 
method remove payment method for user
input: Login user 
output: Detached Payment Methods.
dependencies: Firebase, Stripe.
author: Aman Sutariya
*/
module.exports.remove_payment_method = async (req, res) => {
  await stripe.paymentMethods
    .detach(req.body.payment_method_id)
    .then((success) => {
      res.status(200).json({
        status_code: 200,
        status: true,
        message: "Payment Method Successfully detached!",
      });
    })
    .catch((e) => {
      res.status(400).json({
        status: true,
        status_code: 400,
        error: `Error Occurred while removing payment method.`,
      });
    });
};

/* 
method update payment method for user
input: Login user 
output: updated Payment Methods.
dependencies: Firebase, Stripe.
author: Aman Sutariya
*/
module.exports.update_payment_method = async (req, res) => {
  await stripe.paymentMethods
    .update(req.body.payment_method_id, {
      billing_details: {
        address: {
          city: req.body.address.city ? req.body.address.city : null,
          country: req.body.address.country ? req.body.address.country : null,
          line1: req.body.address.line1 ? req.body.address.line1 : null,
          line2: req.body.address.line2 ? req.body.address.line2 : null,
          postal_code: req.body.address.postal_code
            ? req.body.address.postal_code
            : null,
          state: req.body.address.state ? req.body.address.state : null,
        },
        email: req.body.email ? req.body.email : null,
        name: req.body.name ? req.body.name : null,
        phone: req.body.phone ? req.body.phone : null,
      },
      metadata: {
        description: req.body.description ? req.body.description : null,
      },
    })
    .then((success) => {
      res.status(200).json({
        status: true,
        status_code: 200,
        message: "Payment Method Updated successfully!",
      });
    })
    .catch((e) => {
      res.status(400).json({
        status: false,
        status_code: 400,
        error: `Error Occurred while updating payment method.`,
      });
    });
};

/* 
method to get all payment methods for user
input: Login user 
output: List of Payment Methods.
dependencies: Firebase, Stripe.
author: Aman Sutariya
*/
module.exports.get_all_payment_method = async (req, res) => {
  // Currently only card is supported so this function will only retrieve
  // cards. In future this might change. Remove this comment if so.
  let paymentMethodList = [];

  // Payment Methods
  await stripe.paymentMethods
    .list({
      customer: req.user.data().stripe_customer_id,
      type: "card",
    })
    .then((paymentMethods) => {
      if (paymentMethods.object == "list") {
        paymentMethods.data.forEach((pm) => {
          let pm_json = {
            id: pm.id,
            type: pm.type,
            brand: pm.card.brand,
            last4: pm.card.last4,
            exp_month: pm.card.exp_month,
            exp_year: pm.card.exp_year,
            country: pm.card.country,
            funding: pm.card.funding,
          };
          paymentMethodList.push(pm_json);
        });
      }
    });

  res.status(200).json({
    status: true,
    status_code: 200,
    message: "Payment Methods fetched Successfully!",
    data: paymentMethodList,
  });
};

/* 
method to set a default payment method for user
input: paymentMethodId.
output: Default set in stripe for the user.
dependencies: Firebase, Stripe.
author: Aman Sutariya
*/
module.exports.set_default_payment_method = async (req, res) => {
  let userDetails = req.user.data();

  await stripe.customers
    .update(userDetails.stripe_customer_id, {
      invoice_settings: {
        default_payment_method: req.body.default_payment_method,
      },
    })
    .then((success) => {
      res.status(200).json({
        status_code: 200,
        status: true,
        message: "Default Set successfully!",
      });
    })
    .catch((e) => {
      res.status(400).json({
        status_code: 400,
        status: false,
        error: `Error Occurred while setting default payment method.`,
      });
    });
};

/* 
method to add a payment method for user
input: Card details from frontend. Detailed POST body in postman.
output: Card added in stripe for the user.
dependencies: Firebase, Stripe.
author: Aman Sutariya
*/
module.exports.add_payment_method = async (req, res) => {
  let db = admin.firestore();
  let requestBody = req.body;
  let paymentMethodId;
  let userDetails = req.user.data();

  if (requestBody.type) {
    /* 2 Step Process
               i) Add the paymentMethod to Stripe to get a PaymentMethod ID.
              ii) Attach that paymentMethodId to the stripe customer.    
        */
    if (requestBody.type === "card") {
      // Step i)
      await stripe.paymentMethods
        .create({
          type: requestBody.type,
          card: {
            number: requestBody.number,
            exp_month: requestBody.exp_month,
            exp_year: requestBody.exp_year,
            cvc: requestBody.cvc,
          },
        })
        .then((paymentMethod) => {
          paymentMethodId = paymentMethod.id;
        })
        .catch((e) => {
          res.status(400).json({
            status_code: 400,
            status: false,
            message: `Error Occurred while adding payment method.`,
          });
        });
    } else {
      res.status(501).json({
        status_code: 501,
        status: false,
        error: `Type : ${requestBody.type} is not supported yet!`,
      });
    }
    // Step ii)
    // 2nd Step outside of If condition as in future we might increase
    // payment methods, which only changes 1st Step and not the 2nd.
    // We'll always need to attach the Id to a customer.

    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: userDetails.stripe_customer_id,
      });

      res.status(200).json({
        status_code: 200,
        status: true,
        message: `Payment Method : ${requestBody.type} Added!`,
      });
    }
  } else {
    res.status(400).json({
      status_code: 400,
      status: false,
      error: "Type Not Provided.",
    });
  }
};

/* 
method to register a user(repos)
input: register user form fields from the frontend.
output: Response
dependencies: Firebase.
downside: None
author: Aman Sutariya
*/
module.exports.register_user = [
  async (req, res) => {
    let db = admin.firestore();

    const { errors, isValid } = validateRegisterInput(req.body);
    const userName = req.body.firstName;

    // Check validation
    if (!isValid) {
      return res.status(400).json(errors);
    }

    const user = await db
      .collection("User")
      .where("email", "==", req.body.email)
      .get();
    if (user.docs.length > 0) {
      return res.status(501).json({
        status: true,
        status_code: 501,
        message: "Email already exists.",
      });
    } else {
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(req.body.password, salt, async (err, hash) => {
          if (err) throw err;
          // Create a Stripe Customer
          let customer = await stripe.customers.create({
            name: `${userName}`,
            email: req.body.email,
            metadata: {
              username: userName,
              tensorplace_user_id: "",
            },
          });
          const data = {
            developerScore: 0,
            email: req.body.email,
            emaillVerificationCode: "",
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            numberOfRepositories: 0,
            password: hash,
            profileImg: "",
            repositoriesPurchased: 0,
            repositoriesViews: 0,
            userName: userName,
            accepted_tos: true,
            cards: [],
            subscribe_emails: false,
            tagline: "",
            paypalId: "",
            stripe_customer_id: customer.id,
          };

          const newUser = await db.collection("User").add(data);

          // Update the metadata in Stripe Customer
          let newStripeCustomer = await stripe.customers.update(customer.id, {
            metadata: {
              username: userName,
              tensorplace_user_id: newUser.id,
            },
          });

          await db.collection("UserPlugins").add({
            approved: [],
            pending: [],
            purchaseRef: [],
            userRef: `User/${newUser.id}`,
          });
          if (process.env["ENABLE_MAILING"] == "true") {
            mailUtils.register_normal(req.body);
          }
          return res.status(200).json({
            status: true,
            status_code: 200,
            message: "User registered successfully",
          });
        });
      });
    }
  },
];

//method to edit profile(user)
//input: edit form fields from the frontend.
//output: Response
//dependencies: Firebase.
//downside:
//author: Aman Sutariya
module.exports.update_profile = [
  async (req, res) => {
    let db = admin.firestore();
    // Form validation
    const userData = req.body;
    const { errors, isValid } = validateUserInput(userData);

    //Check validation
    if (!isValid) {
      return res.status(400).json(errors);
    }
    // Support for Profile Image coming later
    // Cannot change githubId
    if (req.user.id != " " || req.user.id != "undefined") {
      const userRef = db.collection("User").doc(req.user.id);
      if (userData.developerAvailability.isAvailable) {
        await userRef.update({
          email: userData?.email,
          firstName: userData?.firstName,
          lastName: userData?.lastName,
          tagline: userData?.tagline,
          subscribe_emails: userData?.subscribe_emails,
          accepted_tos: userData?.accepted_tos,
          yearsOfExperience: userData?.yearsOfExperience,
          profession: userData?.profession,
          industry: userData?.industry,
          paypalId: userData?.paypalId,
          developerAvailability: userData?.developerAvailability,
        });
      } else {
        await userRef.update({
          email: userData?.email,
          firstName: userData?.firstName,
          lastName: userData?.lastName,
          tagline: userData?.tagline,
          subscribe_emails: userData?.subscribe_emails,
          accepted_tos: userData?.accepted_tos,
          yearsOfExperience: userData?.yearsOfExperience,
          profession: userData?.profession,
          industry: userData?.industry,
          paypalId: userData?.paypalId,
          developerAvailability: {
            isAvailable: false,
          },
        });
      }

      return res.status(200).json({
        status: true,
        status_code: 200,
        message: "Profile Updated Successfully!",
      });
    }
  },
];

//method to get profile(user)
//input: Login for the user
//output: Get user profile
//dependencies: Firebase.
//author: Aman Sutariya
module.exports.get_profile = [
  async (req, res) => {
    let db = admin.firestore();
    // Support for Profile Image coming later
    // Cannot change githubId
    if (req.user.id != " " || req.user.id != "undefined") {
      const userRef = req.user;
      if (userRef) {
        return res.status(200).json({
          status: true,
          status_code: 200,
          data: userRef.data(),
          message: "User Profile fetched successfully!",
        });
      } else {
        userData = {};
        console.log("No Document Found!");
        return res.status(404).json({
          status: false,
          status_code: 404,
          data: {},
          message: "User Profile not found!",
        });
      }
    }
  },
];

/* 
method to reset password for the user
input: email and password fields.
output: Response
dependencies: Firebase.
downside: None
author: Aman Sutariya
*/
module.exports.forgot_password_api = [
  async (req, res) => {
    let db = admin.firestore();

    const email = req.body.email;

    await db
      .collection("User")
      .where("email", "==", email)
      .get()
      .then((data) => {
        if ((data.r_size = 1)) {
          data.forEach(async (innerData) => {
            // console.log(innerData.id);
            bcrypt.genSalt(10, (err, salt) => {
              bcrypt.hash(req.body.password, salt, async (err, hash) => {
                if (err) throw err;
                await db
                  .collection("User")
                  .doc(innerData.id)
                  .update({
                    password: hash,
                  })
                  .then(
                    res.status(200).json({
                      status: true,
                      status_code: 200,
                      message: "Password resetted successfully",
                    })
                  );
              });
            });
          });
        } else {
          res.status(404).json({
            status: false,
            status_code: 404,
            message: "Email not found, please provide correct email!!",
          });
        }
      });
  },
];

module.exports.get_unique_url_for_user_email = async (req, res) => {
  const db = admin.firestore();
  let email = req.params.email;
  let url;
  let userRef;
  let responseData = {};
  let userDataToBeSent = {};
  let pluginDataToBeSent = [];

  const user = await db.collection("User").where("email", "==", email).get();
  if (user.docs.length == 1) {
    userRef = user.docs[0].id;
    userData = user.docs[0].data();

    userDataToBeSent = {
      tagline: userData.tagline,
      yearsOfExperience: userData.yearsOfExperience,
      numberOfRepositories: userData.numberOfRepositories,
      profession: userData.profession,
      industry: userData.industry,
      avgDevRatings: userData.avgDevRatings,
      developerScore: userData.developerScore,
      firstName: userData.firstName,
      lastName: userData.lastName,
      developerAvailability: userData.developerAvailability,
    };
    url = `${process.env.react_url}/users/${userData.userName}/${userRef}`;

    const plugins = await db
      .collection("Plugin")
      .where("userRef", "==", `User/${userRef}`)
      .where("status", "==", "Approved")
      .get();
    if (plugins.docs.length > 0) {
      plugins.forEach((plugin) => {
        pluginDataToBeSent.push(plugin.data());
      });
    } else {
      pluginDataToBeSent = [];
    }

    responseData = {
      user_url: url,
      user_data: userDataToBeSent,
      plugin_data: pluginDataToBeSent,
    };
    return res.status(200).json({
      status: true,
      status_code: 200,
      data: responseData,
      message: "User url and data fetched successfully",
    });
  } else if (user.docs.length > 1) {
    return res.status(300).json({
      status: true,
      status_code: 300,
      message:
        "Multiple users found. Contact Admin. Unique URL can't be made. Add a new email to solve this.",
    });
  } else {
    return res.status(404).json({
      status: true,
      status_code: 404,
      message: "User with the following email not found",
    });
  }
};

module.exports.get_unique_url_for_user_username_uuid = async (req, res) => {
  const db = admin.firestore();
  let username = req.params.username;
  let uuid = req.params.uuid;
  let url;
  let responseData = {};
  let userDataToBeSent = {};
  let pluginDataToBeSent = [];
  let userRef;
  let userData;
  const user = await db.collection("User").doc(uuid).get();
  userRef = user.id;
  userData = user.data();
  if (userData != undefined) {
    userDataToBeSent = {
      tagline: userData?.tagline,
      yearsOfExperience: userData?.yearsOfExperience,
      numberOfRepositories: userData?.numberOfRepositories,
      profession: userData?.profession,
      industry: userData?.industry,
      avgDevRatings: userData?.avgDevRatings,
      developerScore: userData?.developerScore,
      firstName: userData?.firstName,
      lastName: userData?.lastName,
      developerAvailability: userData?.developerAvailability,
    };
    url = `${process.env.react_url}/users/${userData.userName}/${userRef}`;
    const plugins = await db
      .collection("Plugin")
      .where("userRef", "==", `User/${userRef}`)
      .where("status", "==", "Approved")
      .get();

    if (plugins.docs.length > 0) {
      plugins.forEach((plugin) => {
        pluginDataToBeSent.push(plugin.data());
      });
    } else {
      pluginDataToBeSent = [];
    }

    responseData = {
      user_url: url,
      user_data: userDataToBeSent,
      plugin_data: pluginDataToBeSent,
    };
    return res.status(200).json({
      status: true,
      status_code: 200,
      data: responseData,
      message: "User url and data fetched successfully",
    });
  } else {
    return res.status(404).json({
      status: false,
      status_code: 400,
      message: "Not a valid UUID.",
    });
  }
};
