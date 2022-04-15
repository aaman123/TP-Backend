const express = require("express");
const router = express.Router();
const passport = require("passport");
const rateLimit = require("express-rate-limit");

/* API CONTROLLERS CALLS*/
let user_Controller = require("../api/controllers/user-api");

// Utilities
const user_utils = require("../api/utils/user-utils");

const userLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 30, // limit each IP to 100 requests per windowMs
  message:
    "Too many accounts created from this IP, please try again after an 30 mins",
});

router.use(userLimiter);

/* 
api call for registering a user with the platform (stored on firestore)
input parameters: controller name
output: Response json
dependencies: firebase 
*/
router.post("/register", user_Controller.register_user);

/* 
api call for resetting the password of the user (stored on firestore)
input parameters: controller name
output: Response json
dependencies: firebase 
*/
router.post("/forgot_password", user_Controller.forgot_password_api);

/* 
api call for generating unique url for every user based on the UUID
input parameters: controller name
output: Response json
dependencies: firebase
*/
router.get(
  "/get_unique_url/:email",
  user_Controller.get_unique_url_for_user_email
);

/* 
api call for generating unique url for every user based on the UUID
input parameters: controller name
output: Response json
dependencies: firebase
*/
router.get(
  "/get_unique_url/:username/:uuid",
  user_Controller.get_unique_url_for_user_username_uuid
);

// @route POST api/users/login
// @desc Login user and return JWT token
// @access Public
router.post("/login", user_Controller.login_email_password);

// @route POST api/users/login/bitbucket
// @desc Login Bitbucket user and return JWT token
// @access Public
router.post("/login/bitbucket", user_Controller.login_bitbucket);

// @route GET users/login/github
// @desc Return github user and return JWT
// @access Public
router.post("/login/github", user_Controller.login_github);


// @route GET users/login/github/pat
// @desc Return github user and return JWT
// @access Public
router.post("/login/github/pat", user_Controller.login_github_pat);

// @route GET users/currentuser
// @desc Return current user
// @access Private
router.get(
  "/currentuser",
  passport.authenticate("jwt", { session: false }),
  user_Controller.currentuser
);

/* getCollabRepos
scheduler that checks pending and approved repos
against Tensorplace admin account every 4 hours
*/
setInterval(user_utils.getAllAdminGitRepos, 14400000);
// setInterval(getAllAdminGitRepos, 5000);

/* CURL REQUEST FOR ADDING BITBUCKET COLLABORATOR 
curl --user aaman123:Saman@1998 --request POST https://api.bitbucket.org/1.0/invitations/aaman123/bit-testing-tensor --data permission=write --data email=tensorplace@gmail.com
*/

router.post(
  "/bitbucketAddCollaborator",
  passport.authenticate("jwt", { session: false }),
  user_Controller.bitbucket_add_collaborator
);

router.post(
  "/addCollaborator",
  passport.authenticate("jwt", { session: false }),
  user_Controller.github_add_collaborator
);

router.get(
  "/allRepos",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    user_utils.getCollabRepos(req, res);
  }
);

//method to edit profile(user)
//input: edit form fields from the frontend.
//output: Response
//dependencies: Firebase.
//author: Aman Sutariya
router.post(
  "/update",
  passport.authenticate("jwt", { session: false }),
  user_Controller.update_profile
);

//method to get profile(user)
//input: Login for the user
//output: Get user profile
//dependencies: Firebase.
//author: Aman Sutariya
router.get(
  "/profile",
  passport.authenticate("jwt", { session: false }),
  user_Controller.get_profile
);

//method to add payment method
//input: Login for the user
//output: Payment Method Added and Attached.
//dependencies: Firebase, Stripe.
//author: Aman Sutariya
router.post(
  "/stripe/addPaymentMethod",
  passport.authenticate("jwt", { session: false }),
  user_Controller.add_payment_method
);

//method to set a Default payment method
//input: Login for the user
//output: Default Updated Added
//dependencies: Firebase, Stripe.
//author: Aman Sutariya
router.post(
  "/stripe/setDefaultPaymentMethod",
  passport.authenticate("jwt", { session: false }),
  user_Controller.set_default_payment_method
);

//method to get a list of payment methods for the user
//input: Login for the user
//output: List of Payment Methods
//dependencies: Firebase, Stripe.
//author: Aman Sutariya
router.get(
  "/stripe/getAllPaymentMethod",
  passport.authenticate("jwt", { session: false }),
  user_Controller.get_all_payment_method
);

//method to update a Payment Method
//input: Login for the user
//output: Updated Payment Method.
//dependencies: Firebase, Stripe.
//author: Aman Sutariya
router.put(
  "/stripe/updatePaymentMethod",
  passport.authenticate("jwt", { session: false }),
  user_Controller.update_payment_method
);

//method to delete a Payment Method
//input: Login for the user
//output: Detached Payment Method.
//dependencies: Firebase, Stripe.
//author: Aman Sutariya
router.delete(
  "/stripe/removePaymentMethod",
  passport.authenticate("jwt", { session: false }),
  user_Controller.remove_payment_method
);

module.exports = router;
