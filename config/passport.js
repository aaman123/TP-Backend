const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const keys = require("./keys");
const opts = {};
const admin = require("firebase-admin");

opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = keys.secretOrKey;

module.exports = (passport) => {
  passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
      let db = admin.firestore();
      console.log("ID from Payload", jwt_payload.id);
      const userRef = db.collection("User").doc(jwt_payload.id);
      await userRef
        .get()
        .then((user) => {
          if (user) {
            if (jwt_payload.githubAccessToken) {
              user.githubAccessToken = jwt_payload.githubAccessToken;
            }
            if (jwt_payload.bitbucketAccessToken) {
              user.bitbucketAccessToken = jwt_payload.bitbucketAccessToken;
            }

            return done(null, user);
          }
          return done(null, user);
        })
        .catch((err) => {
          return done(err, null);
        });
    })
  );
};
