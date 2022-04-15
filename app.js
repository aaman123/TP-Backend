const express = require("express");
const bodyParser = require("body-parser");
const passport = require("passport");
const cors = require("cors");

require("dotenv").config();

const users = require("./routes/users");
const plugin = require("./routes/plugin");
const wishlist = require("./routes/wishlist");
const order = require("./routes/order");
const review = require("./routes/review");
const contactDeveloper = require("./routes/contactDeveloper");
const schemaScripts = require("./scripts/schema_changes");
const stripe_api = require("./routes/stripe");
const version_api = require("./api/controllers/version-api");

const admin = require("firebase-admin");

const serviceAccount = require("./firebase-key-imp");
const router = express.Router();

const app = express();

// Bodyparser middleware
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

app.use(cors());

app.use("/uploads", express.static("uploads"));
app.use("/files", express.static("files"));

//Firebase configuration
if (process.env["FIREBASE_ENVIRONMENT"] == 'cloud'){
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `${process.env.firebase_database_url}`,
  });
}
else if (process.env["FIREBASE_ENVIRONMENT"] == 'local'){
  admin.initializeApp({ projectId: `${process.env["GCLOUD_PROJECT"]}` });
}
else{
  new Error(`FIREBASE_ENVIRONMENT not proper.`)
}
let database = admin.firestore();
database.settings({ ignoreUndefinedProperties: true });

function searchIntialize() {
  router.get(`${process.env.search_url}/search/initialize`, (req, res) => {
    console.log(res);
  });
}

setInterval(searchIntialize, 14400);

// Passport middleware
app.use(passport.initialize());

// Passport config
require("./config/passport")(passport);

// Rate Limiter Config
app.set("trust proxy", 1);

// Routes
app.get("/", version_api.fetch_backend_version);

app.use("/users", users);
app.use("/", plugin);
app.use("/tensorplace-wishlist-api", wishlist);
app.use("/tensorplace-order-api", order);
app.use("/tensorplace-review-api", review);
app.use("/contactDeveloper", contactDeveloper);
app.use("/stripe", stripe_api);
app.use("/version", version_api.fetch_backend_version);

/* UNCOMMENT ONLY WHEN U NEED TO RUN SCHEMA UPADTE SCRIPTS */
//schemaScripts()

module.exports = app;
