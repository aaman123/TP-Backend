const express = require("express");
const router = express.Router();
const controller = require("../api/controllers/stripe-api.js");
const passport = require("passport");

router.post(
  "/create-checkout-session",
  passport.authenticate("jwt", { session: false }),
  controller.create_checkout_session
);

router.post(
  "/onboard-seller",
  passport.authenticate("jwt", { session: false }),
  controller.onboard_seller
);

router.post(
  "/onboard-seller/refresh/:account_id",
  passport.authenticate("jwt", { session: false }),
  controller.onboard_seller_refresh
);

router.get("/success", controller.success);

router.post(
  "/webhook",
  passport.authenticate("jwt", { session: false }),
  controller.webhook
);

module.exports = router;
