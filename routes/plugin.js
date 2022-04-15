const express = require("express");
const router = express.Router();
const passport = require("passport");
const rateLimit = require("express-rate-limit");

const pluginLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message:
    "Too many requests received from this IP, please try again after an 30 mins",
});

router.use(pluginLimiter);

/* API CONTROLLERS CALLS*/
let plugin_Controller = require("../api/controllers/plugin-api");

/* api call for fetching Status for plugin if purchased or not
input parameters: controller name
output: Response json
dependencies: firebase */
router.get(
  "/tensorplace-plugin-api/purchase/status/:pluginName",
  passport.authenticate("jwt", { session: false }),
  plugin_Controller.plugin_purchase_status
);

/* api call for fetching BlockchainLogs for plugin
input parameters: controller name
output: Response json
dependencies: firebase */
router.get(
  "/tensorplace-plugin-api/blockchain_transaction_logs/:pluginName",
  plugin_Controller.plugin_blockchain_logs
);

/* api call for fetching Purchased Repos for User
input parameters: controller name
output: Response json
dependencies: firebase */
router.get(
  "/tensorplace-plugin-api/purchased_repository/:page_no",
  passport.authenticate("jwt", { session: false }),
  plugin_Controller.plugin_purchased
);

/* api call for fetching Purchased Repos for User without page number
input parameters: controller name
output: Response json
dependencies: firebase */
router.get(
  "/tensorplace-plugin-api/purchased_repository",
  passport.authenticate("jwt", { session: false }),
  plugin_Controller.plugin_purchased_no_page
);

/* api call for fetching category-lists
input parameters: controller name
output: Response json
dependencies: firebase */
router.get(
  "/tensorplace-plugin-api/category_list",
  plugin_Controller.plugin_category_list
);

/* api call for fetching all trending repositories
input parameters: controller name
output: Response json
dependencies: firebase */
router.get(
  "/tensorplace-plugin-api/trending_repository/:page_no",
  passport.authenticate("jwt", { session: false }),
  plugin_Controller.plugin_trending
);

// Trending Repo without page number
router.get(
  "/tensorplace-plugin-api/trending_repository",
  passport.authenticate("jwt", { session: false }),
  plugin_Controller.plugin_trending_no_page
);

/* api call for editing repo details using form
input parameters: controller name
output: Response json
dependencies: firebase */
router.put(
  "/tensorplace-plugin-api/update_repo_details",
  passport.authenticate("jwt", { session: false }),
  plugin_Controller.plugin_edit
);

/* api call for viewing repo details
input parameters: controller name
output: Response json
dependencies: firebase */
router.get(
  "/tensorplace-plugin-api/view_detailed_plugin/:pluginName",
  plugin_Controller.plugin_view
);

/* api call for filtering plugins(repositories)
input parameters: controller name
output: Response json
dependencies: firebase */
router.post(
  "/tensorplace-plugin-api/category_filter",
  passport.authenticate("jwt", { session: false }),
  plugin_Controller.plugin_filter
);

/*
API call for fetching the language list
input parameters: controller name
output: JSON response
dependencies: firebase
*/
router.get(
  "/tensorplace-plugin-api/language_list",
  plugin_Controller.get_all_languages
);

/* api call for searching plugins(repositories)
input parameters: controller name
output: Response json
dependencies: Python Backend on FastAPI */
router.get("/search-plugins", plugin_Controller.search_plugins);

module.exports = router;
