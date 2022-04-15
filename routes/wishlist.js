const express = require("express");
const passport = require("passport");
const router = express.Router();

// Load model
const rateLimit = require("express-rate-limit");

/* API CONTROLLERS CALLS*/
let wishlist_controller = require("../api/controllers/wishlist-api");

const wishlistLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message:
    "Too many requests received from this IP, please try again after an 30 mins",
});

router.use(wishlistLimiter);

/* api call for status check given a Repository for a User.
input parameters: controller name
output: Response json
dependencies: firebase */
router.get(
  "/wishlist/status/:plugin",
  passport.authenticate("jwt", { session: false }),
  wishlist_controller.wishlist_plugin_status
);

/* api call for getting wishlist of a particular user
input parameters: controller name
output: Response json
dependencies: firebase */
router.get(
  "/get_wishlist/:page_no",
  passport.authenticate("jwt", { session: false }),
  wishlist_controller.wishlist_plugin_get
);

/* api call for getting wishlist of a particular user
input parameters: controller name
output: Response json
dependencies: firebase */
router.get(
  "/get_wishlist",
  passport.authenticate("jwt", { session: false }),
  wishlist_controller.wishlist_plugin_get_no_page
);

/* api call for saving a repo to the wishlist
input parameters: controller name
output: Response json
dependencies: firebase */
router.post(
  "/add_to_wishlist",
  passport.authenticate("jwt", { session: false }),
  wishlist_controller.wishlist_plugin_save
);

/* api call for removing a repo from the wishlist
input parameters: controller name
output: Response json
dependencies: firebase */
router.post(
  "/remove_from_wishlist",
  passport.authenticate("jwt", { session: false }),
  wishlist_controller.wishlist_plugin_remove
);

module.exports = router;
