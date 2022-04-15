const express = require("express");
const passport = require("passport");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const reviewLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message:
    "Too many requests received from this IP, please try again after an 30 mins",
});

router.use(reviewLimiter);

let review_Controller = require("../api/controllers/review-api");

/* api call for adding a Review for a Purchased Repo
input parameters: controller name
output: Response json
dependencies: firebase */
router.post(
  "/store_rating",
  passport.authenticate("jwt", { session: false }),
  review_Controller.add_review
);

/* api call for getting all Reviews for a Repo/Plugin
input parameters: controller name
output: Response json
dependencies: firebase */
router.get("/review/:plugin", review_Controller.get_reviews);

/* api call for getting status for a Review for a Purchased Repo
input parameters: controller name
output: Response json
dependencies: firebase */
router.get(
  "/review/status/:plugin",
  passport.authenticate("jwt", { session: false }),
  review_Controller.review_status
);

/* api call for updating a Review for a Purchased Repo
input parameters: controller name and Document Reference
output: Response json
dependencies: firebase */
router.post(
  "/review/update/:reviewRef",
  passport.authenticate("jwt", { session: false }),
  review_Controller.update_review
);

module.exports = router;
