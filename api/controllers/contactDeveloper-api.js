const axios = require("axios");
const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");

const validateContactDeveloperInput = require("../../validation/contactDeveloper");
const validateCreateMeetingRequestInput = require("../../validation/createMeetingRequest");
const mailUtils = require("../../utils/mailUtils");
const keys = require("../../config/keys");

/* Method for Seller to Reject Request for a Meeting 
Input: Request ID and Access Token
Output: Mail Trigger
Dependencies: Firebase.
Features: Will check the privileges and then make a Decision.
Author: Aman Sutariya 
*/
module.exports.reject_request = async (req, res) => {
  let db = admin.firestore();
  let access_token = req.params.access_token;
  let requestId = req.params.requestId;
  let pluginDetails;
  let buyerDetails;

  try {
    let auth_check = jwt.verify(access_token, keys.secretOrKey);

    if (auth_check.id) {
      let requestRef = await db.collection("Request").doc(requestId).get();

      if (requestRef.data().status == "Pending") {
        //Checking Seller ID matches or not.
        if (requestRef.data().sellerRef == auth_check.id) {
          db.collection("Request")
            .doc(requestId)
            .update({
              status: "Reject",
            })
            .then(async (request) => {
              requestDetails = requestRef;
              await db
                .collection("Plugin")
                .doc(requestRef.data().pluginRef)
                .get()
                .then((plugin) => {
                  pluginDetails = plugin.data();
                });
              await db
                .collection("User")
                .doc(requestRef.data().buyerRef)
                .get()
                .then((buyer) => {
                  buyerDetails = buyer.data();
                });

              // Mail the users with the Meeting Details
              mailUtils.meeting_decision_request_buyer(
                buyerDetails,
                pluginDetails,
                requestRef.id,
                requestRef.data(),
                `Unfortunately, Meeting scheduled with ${auth_check.userName} from Tensorplace is rejected.`
              );
              res.status(200).json({
                status_code: 200,
                status: true,
                message: "Request Rejected.",
                requestId: request.id,
              });
            });
        } else {
          res.status(401).json({
            error: "No Privilege.",
          });
        }
      } else {
        res.status(400).json({
          error: "This meeting is already Approved/Rejected.",
        });
      }
    } else {
      res.status(404).json({
        error: "User Not Found!",
      });
    }
  } catch (err) {
    res.status(400).json({
      error: "Malformed Access Token/ Invalid Request ID",
    });
  }
};

/* Method for Seller to Approve Request for a Meeting 
Input: Request ID and Access Token
Output: Mail Trigger
Dependencies: Firebase.
Features: Will check the privileges and then make a Decision.
Author: Aman Sutariya 
*/
module.exports.approve_request = async (req, res) => {
  let db = admin.firestore();
  let access_token = req.params.access_token;
  let requestId = req.params.requestId;
  let pluginDetails;
  let buyerDetails;
  let requestDetails;
  try {
    let auth_check = jwt.verify(access_token, keys.secretOrKey);

    if (auth_check.id) {
      let requestRef = await db.collection("Request").doc(requestId).get();

      if (requestRef.data().status == "Pending") {
        //Checking Seller ID matches or not.
        if (requestRef.data().sellerRef == auth_check.id) {
          db.collection("Request")
            .doc(requestId)
            .update({
              status: "Approved",
            })
            .then(async (request) => {
              requestDetails = requestRef;
              await db
                .collection("Plugin")
                .doc(requestRef.data().pluginRef)
                .get()
                .then((plugin) => {
                  pluginDetails = plugin.data();
                });
              await db
                .collection("User")
                .doc(requestRef.data().buyerRef)
                .get()
                .then((buyer) => {
                  buyerDetails = buyer.data();
                });

              // Mail the users with the Meeting Details
              mailUtils.meeting_decision_request_buyer(
                buyerDetails,
                pluginDetails,
                requestDetails.id,
                requestDetails.data(),
                `Congratulations, Meeting scheduled with ${auth_check.userName} from Tensorplace.`
              );
              res.status(200).json({
                status_code: 200,
                status: true,
                message: "Request Approved.",
                requestId: request.id,
              });
            });
        } else {
          res.status(401).json({
            error: "No Privilege.",
          });
        }
      } else {
        res.status(400).json({
          error: "This meeting is already Approved/Rejected.",
        });
      }
    } else {
      res.status(404).json({
        error: "User Not Found!",
      });
    }
  } catch (err) {
    res.status(400).json({
      error: "Malformed Access Token/ Invalid Request ID",
    });
  }
};

/* Method for Buyer to Request a Meeting 
Input: Refer Post Body below
Output: Mail Trigger
Dependencies: Firebase.
Features: Will be checking if the developer is available or not in the time provided and then trigger a mail for the same.
Author: Aman Sutariya
Demo Request:
    Headers: 

        X-Current-Userid :FIreBaseUuId
        Authorization: Bearer <access_token>
    Post Body

        {
            pluginRef : 'Plugin/UUIdForPlugin',
            timezone : "Asia/Kolkata",
            timeslot : "2020-01-02T12:30:00",
            duration : 30,
            agreedToPayForExtendedMeeting : true/false,
            message : "Message from the Buyer.",
            preferredPlatform : "Zoom/Google Meet/Teams",
        }
*/

module.exports.create_meeting_request = async (req, res) => {
  let db = admin.firestore();
  let requestDetails = req.body;
  let sellerDetails;
  let pluginDetails;
  let timeslot;
  let sellerJwt;
  const { errors, isValid } = validateCreateMeetingRequestInput(requestDetails);
  if (!isValid) {
    return res.status(400).json(errors);
  } else {
    if (req.user.id != undefined || req.user.id != "") {
      try {
        // Fetching Plugin Details
        await db
          .collection("Plugin")
          .doc(requestDetails.pluginRef.split("/")[1])
          .get()
          .then((plugin) => {
            pluginDetails = plugin.data();
            pluginDetails.id = plugin.id;
          })
          .catch((e) => {
            res.status(501).json({
              error: `Firebase Error Occurred while fetching Plugin Details.`,
            });
          });

        // Fetching Seller Details
        await db
          .collection("User")
          .doc(pluginDetails.userRef.split("/")[1])
          .get()
          .then((seller) => {
            sellerDetails = seller.data();
            sellerDetails.id = seller.id;
          })
          .catch((e) => {
            res.status(501).json({
              error: `Firebase Error Occurred while fetching Seller Details.`,
            });
          });
      } catch {
        res.status(501).json({
          error: "Error Occurred while fetching Plugin and Seller Details.",
        });
      }
      // Checking if not requesting Meeting for own repo.

      if (sellerDetails.id != req.user.id) {
        // Check if Developer/Seller has Availability provided or not.
        if (sellerDetails.developerAvailability) {
          try {
            // Converting The provided timeslot to buyer's timezone.
            timeslot = Date.parse(requestDetails.timeslot);
            date = new Date(timeslot);
            timeslotForTimezone = date.toLocaleString("en-US", {
              timezone: sellerDetails.developerAvailability.timezone,
              dateStyle: "medium",
              timeStyle: "medium",
              timeZoneName: "long",
            });

            db.collection("Request")
              .where("buyerRef", "==", req.user.id)
              .where("pluginRef", "==", pluginDetails.id)
              .get()
              .then((result) => {
                // Checking if request already not created.
                if (result.docs.length >= 1) {
                  res.status(409).json({
                    message: `Request already existing, ID : ${result.docs[0].id}`,
                  });
                } else {
                  // Assumption : We are assuming that Buyer will only see the timeslots in which buyer is available.

                  db.collection("Request")
                    .add({
                      buyerRef: req.user.id,
                      sellerRef: sellerDetails.id,
                      pluginRef: pluginDetails.id,
                      timeslot: requestDetails.timeslot,
                      timezone: requestDetails.timezone,
                      duration: requestDetails.duration,
                      message: requestDetails.message,
                      agreedToPayForExtendedMeeting:
                        requestDetails.agreedToPayForExtendedMeeting,
                      preferredPlatform: requestDetails.preferredPlatform,
                      status: "Pending",
                    })
                    .then((meetingRequest) => {
                      // Creating a JWT Token for Seller to approve/reject the meeting.
                      let payload = {
                        id: sellerDetails.id,
                        email: sellerDetails.email,
                        userName: sellerDetails.userName,
                      };

                      jwt.sign(
                        payload,
                        keys.secretOrKey,
                        {
                          expiresIn: 259200, // 3 days in seconds
                        },
                        (err, token) => {
                          sellerJwt = token;
                          if (token) {
                            // Mailing the details
                            mailUtils.create_meeting_request(
                              req.user.data(),
                              sellerDetails,
                              pluginDetails,
                              requestDetails,
                              timeslotForTimezone,
                              meetingRequest.id,
                              sellerJwt
                            );
                          }
                          if (err) {
                            res.status(501).json({
                              status: true,
                              status_code: 501,
                              message: `Error Occurred.`,
                            });
                          }
                        }
                      );

                      res.status(200).json({
                        status_code: 200,
                        status: true,
                        message: "Request Sent to the Seller.",
                        requestId: meetingRequest.id,
                      });
                    })
                    .catch((e) => {
                      res.status(501).json({
                        status: true,
                        status_code: 501,
                        message: `Error Occurred.`,
                      });
                    });
                }
              });
          } catch (err) {
            res.status(501).json({
              error: `Error Occurred.`,
            });
          }
        } else {
          res.status(404).json({
            message: "Seller Doesn't have any availability Details.",
          });
        }
      } else {
        res.status(400).json({
          message:
            "Can't request meeting to yourself. Repository Belongs to you.",
        });
      }
    } else {
      res.status(401).json({
        status: true,
        status_code: 401,
        message: "Please Log In, Unauthorized!",
        isPresent: false,
      });
    }
  }
};

/* Method to update Contact Developer Availability
Input: UserData needed to be updated, UserId(present in req.user.id)
Output: Either Profile gets updated or error like Unauthorized or Missing Header.
Dependencies: Firebase.
Features: If isAvailable is False. It will clear out any previous availability details,
If  isAvailable is true, it will Validate the Post Body and Update the details accordingly.
Author: Aman Sutariya */

module.exports.update_availability = async (req, res) => {
  let db = admin.firestore();
  const { errors, isValid } = validateContactDeveloperInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  } else {
    if (req.user.id != undefined || req.user.id != "") {
      if (req.body.isAvailable) {
        db.collection("User")
          .doc(req.user.id)
          .get()
          .then((doc) => {
            db.collection("User")
              .doc(req.user.id)
              .update({
                developerAvailability: req.body,
              })
              .then((result) => {
                res.status(200).json({
                  status: true,
                  status_code: 200,
                  message:
                    "Updated Availability Details, Developer available for interaction!",
                  isPresent: true,
                });
              });
          });
      } else {
        db.collection("User")
          .doc(req.user.id)
          .get()
          .then((doc) => {
            db.collection("User")
              .doc(req.user.id)
              .update({
                developerAvailability: {
                  isAvailable: false,
                },
              })
              .then((result) => {
                res.status(200).json({
                  status: true,
                  status_code: 200,
                  message:
                    "Updated Availability Details, Developer disagreed for interaction!",
                  isPresent: true,
                });
              });
          });
      }
    } else {
      res.status(401).json({
        status: true,
        status_code: 401,
        message: "Please Log In, Unauthorized!",
        isPresent: false,
      });
    }
  }
};

/* Method to Add Contact Developer Availability
Input: UserData needed to be Added, UserId(present in req.user.id)
Output: Either Profile gets Added or error like Unauthorized, Missing Header or Already Added Details.
Dependencies: Firebase.
Features: If the Details already added, it will raise error stating to use PUT method to update
the details. If not already present, it will validate the Post Body and add the details.
Author: Aman Sutariya */

module.exports.add_availability = async (req, res) => {
  let db = admin.firestore();
  const { errors, isValid } = validateContactDeveloperInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  } else {
    if (req.user.id != undefined && req.user.id != "") {
      db.collection("User")
        .doc(req.user.id)
        .get()
        .then((doc) => {
          if (doc.data().developerAvailability == undefined) {
            if (req.body.isAvailable) {
              db.collection("User")
                .doc(req.user.id)
                .update({
                  developerAvailability: req.body,
                })
                .then((result) => {
                  mailUtils.add_availability(
                    req.user.data(),
                    req.body,
                    "Added Availability Details."
                  );
                  res.status(200).json({
                    status: true,
                    status_code: 200,
                    message: "Added Availability Details!",
                    isPresent: true,
                  });
                });
            } else {
              db.collection("User")
                .doc(req.user.id)
                .update({
                  developerAvailability: {
                    isAvailable: false,
                  },
                })
                .then((result) => {
                  mailUtils.add_availability(
                    req.user.data(),
                    req.body,
                    "Added Availability Details, You Disagreed for Contacting!"
                  );
                  res.status(200).json({
                    status: true,
                    status_code: 200,
                    message: "Added Availability Details, User Disagreed!",
                    isPresent: true,
                  });
                });
            }
          } else {
            res.status(405).json({
              status: true,
              status_code: 405,
              message:
                "User already contains Availability details. Please use PUT method with endpoint /contactDeveloper/updateAvailability to update details.",
              isPresent: true,
            });
          }
        });
    } else {
      // Missing Header Info
      res.status(401).json({
        status: true,
        status_code: 401,
        message: "Please Log In, Unauthorized!",
        isPresent: false,
      });
    }
  }
};

/* Method to Get Contact Developer Availability
Input: UserId(present in req.user.id)
Output: Availability Details or error like Unauthorized or Missing Header.
Dependencies: Firebase.
Author: Aman Sutariya */

module.exports.get_availability = async (req, res) => {
  let db = admin.firestore();
  let userData;
  if (req.user.id != undefined) {
    // Fetching UserData
    db.collection("User")
      .doc(req.user.id)
      .get()
      .then((doc) => {
        userData = doc.data();

        if (userData.developerAvailability != undefined) {
          res.status(200).json({
            status: true,
            status_code: 200,
            message: "Availability Details fetched Successfully!",
            data: userData.developerAvailability,
            isPresent: true,
          });
        } else {
          res.status(404).json({
            status: true,
            status_code: 404,
            message: "Availability Details Not Present",
            isPresent: false,
          });
        }
      });
  } else {
    // Not Logged In
    res.status(401).json({
      status: true,
      status_code: 401,
      message: "Please Log in Again, Unauthorized!",
      isPresent: false,
    });
  }
};

function createUser(req, token) {
  // Requires Pro or Higher Plan
  console.log(token);
  axios({
    method: "POST",
    url: "https://api.zoom.us/v2/users/",
    data: {
      action: "create",
      user_info: {
        email: "kp@zoom.in",
        type: 1,
        first_name: "K",
        last_name: "P",
      },
    },
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "Zoom-api-Jwt-Request",
      "content-type": "application/json",
    },
  })
    .then((response) => {
      console.log(response.data);
      return response.data;
    })
    .catch((e) => {
      return e.response.data;
    });
}
