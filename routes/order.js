const express = require("express");
const passport = require("passport");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const orderLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message:
    "Too many requests received from this IP, please try again after an 30 mins",
});

router.use(orderLimiter);

/* API CONTROLLERS */

let order_controller = require("../api/controllers/order-api");

/* API Endpoint to store an order after purchase of a plugin */
router.post(
  "/store_order",
  passport.authenticate("jwt", { session: false }),
  order_controller.store_order
);

/* API Endpoint to get order details for a particular order */
router.get(
  "/get_order_details/:order_id",
  passport.authenticate("jwt", { session: false }),
  order_controller.get_OrderDetails
);

module.exports = router;
