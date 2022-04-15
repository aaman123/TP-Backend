const request = require("supertest");
const app = require("../../app");
const testUserData = require("../../fixtures/users");
const admin = require("firebase-admin");

const firestoreAutoId = () => {
  const CHARS =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let autoId = "";

  for (let i = 0; i < 20; i++) {
    autoId += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return autoId;
};

describe("User Registration using Email and Password", () => {
  const db = admin.firestore();
  const stripe = require("stripe")(process.env["stripe_key"]);

  let newUserRef;
  let newUserData;
  let userPluginsRef;
  let userPluginsData;
  let currentUserRef;
  let currentUserData;
  let bearerToken;

  beforeAll(() => {});
  afterAll(async () => {
    await db.collection("User").doc(newUserRef).delete();
    await db.collection("UserPlugins").doc(userPluginsRef).delete();
    await db.collection("CURRENT_USER").doc(currentUserRef).delete();
    await stripe.customers.del(newUserData.stripe_customer_id);
  });

  describe("Unique URL Tests before creating user", () => {
    test("by email", async () => {
      return await request(app)
        .get(`/users/get_unique_url/${testUserData.emailUser.email}`)
        .expect(404)
        .then((response) => {
          expect(response.body.message).toBe(
            "User with the following email not found"
          );
        });
    });
    test("by username and uuid", async () => {
      return await request(app)
        .get(
          `/users/get_unique_url/${
            testUserData.emailUser.firstName
          }/${firestoreAutoId()}`
        )
        .expect(404)
        .then((response) => {
          expect(response.body.message).toBe("Not a valid UUID.");
        });
    });
  });
  describe("Empty fields", () => {
    test("First and Last name are empty, should error out", async () => {
      const requestData = {
        firstName: "",
        lastName: "",
        email: testUserData.emailUser.email,
        password: testUserData.emailUser.password,
        password2: testUserData.emailUser.password,
        termsAccepted: true,
      };
      return await request(app)
        .post("/users/register")
        .send(requestData)
        .expect(400)
        .then((response) => {
          expect(response.body.firstName).toBe("First name field is required");
          expect(response.body.lastName).toBe("Last name field is required");
        });
    });
    test("Email is empty, should error out", async () => {
      const requestData = {
        firstName: testUserData.emailUser.firstName,
        lastName: testUserData.emailUser.lastName,
        email: "",
        password: testUserData.emailUser.password,
        password2: testUserData.emailUser.password,
        termsAccepted: true,
      };
      return await request(app)
        .post("/users/register")
        .send(requestData)
        .expect(400)
        .then((response) => {
          expect(response.body.email).toBe("Email field is required");
        });
    });
    test("Email is invalid, should error out", async () => {
      const requestData = {
        firstName: testUserData.emailUser.firstName,
        lastName: testUserData.emailUser.lastName,
        email: "test.com",
        password: testUserData.emailUser.password,
        password2: testUserData.emailUser.password,
        termsAccepted: true,
      };
      return await request(app)
        .post("/users/register")
        .send(requestData)
        .expect(400)
        .then((response) => {
          expect(response.body.email).toBe("Email is invalid");
        });
    });
    test("Password is empty, should error out", async () => {
      const requestData = {
        firstName: testUserData.emailUser.firstName,
        lastName: testUserData.emailUser.lastName,
        email: testUserData.emailUser.email,
        password: "",
        password2: "",
        termsAccepted: true,
      };
      return await request(app)
        .post("/users/register")
        .send(requestData)
        .expect(400)
        .then((response) => {
          expect(response.body.password).toBe("Password field is required");
          expect(response.body.password2).toBe("Confirm Password is required");
        });
    });
    test("Password is less than 6 characters, should error out", async () => {
      const requestData = {
        firstName: testUserData.emailUser.firstName,
        lastName: testUserData.emailUser.lastName,
        email: testUserData.emailUser.email,
        password: "12345",
        password2: "12345",
        termsAccepted: true,
      };
      return await request(app)
        .post("/users/register")
        .send(requestData)
        .expect(400)
        .then((response) => {
          expect(response.body.password).toBe(
            "Password must be atleast 6 characters"
          );
        });
    });
    test("Password is invalid, should error out", async () => {
      const requestData = {
        firstName: testUserData.emailUser.firstName,
        lastName: testUserData.emailUser.lastName,
        email: testUserData.emailUser.email,
        password: "invalidpassword",
        password2: "invalidpassword",
        termsAccepted: true,
      };
      return await request(app)
        .post("/users/register")
        .send(requestData)
        .expect(400)
        .then((response) => {
          expect(response.body.password).toBe(
            "Must contain at least one number, one special character and one uppercase and lowercase letter, and at least 8 or more characters"
          );
        });
    });
    test("Password not matching, should error out", async () => {
      const requestData = {
        firstName: testUserData.emailUser.firstName,
        lastName: testUserData.emailUser.lastName,
        email: testUserData.emailUser.email,
        password: "Test@1234",
        password2: "Test@12345",
        termsAccepted: true,
      };
      return await request(app)
        .post("/users/register")
        .send(requestData)
        .expect(400)
        .then((response) => {
          expect(response.body.password2).toBe("Password must match");
        });
    });
    test("Terms not accepted, should error out", async () => {
      const requestData = {
        firstName: testUserData.emailUser.firstName,
        lastName: testUserData.emailUser.lastName,
        email: testUserData.emailUser.email,
        password: testUserData.emailUser.password,
        password2: testUserData.emailUser.password,
        termsAccepted: false,
      };
      return await request(app)
        .post("/users/register")
        .send(requestData)
        .expect(400)
        .then((response) => {
          expect(response.body.termsAccepted).toBe("Terms must be accepted");
        });
    });
  });

  describe("Register User with Proper fields", () => {
    test("should create a new user", async () => {
      const requestData = {
        firstName: testUserData.emailUser.firstName,
        lastName: testUserData.emailUser.lastName,
        email: testUserData.emailUser.email,
        password: testUserData.emailUser.password,
        password2: testUserData.emailUser.password,
        termsAccepted: true,
      };
      return await request(app)
        .post("/users/register")
        .send(requestData)
        .expect(200)
        .then((response) => {
          expect(response.body.message).toBe("User registered successfully");
        });
    });
    test("re-register same user, should error out", async () => {
      const requestData = {
        firstName: testUserData.emailUser.firstName,
        lastName: testUserData.emailUser.lastName,
        email: testUserData.emailUser.email,
        password: testUserData.emailUser.password,
        password2: testUserData.emailUser.password,
        termsAccepted: true,
      };
      return await request(app)
        .post("/users/register")
        .send(requestData)
        .expect(501)
        .then((response) => {
          expect(response.body.message).toBe("Email already exists.");
        });
    });
  });

  describe("Firestore related tests", () => {
    test("User got a created with Stripe Customer ID", async () => {
      const newUser = await db
        .collection("User")
        .where("email", "==", testUserData.emailUser.email)
        .get();

      expect(newUser.docs.length).toBeGreaterThan(0);
      newUserRef = newUser.docs[0].id;
      newUserData = newUser.docs[0].data();
      expect(newUserData.stripe_customer_id).toBeTruthy();
    });
    test("UserPlugins got populated", async () => {
      const userPlugins = await db
        .collection("UserPlugins")
        .where("userRef", "==", `User/${newUserRef}`)
        .get();

      expect(userPlugins.docs.length).toBeGreaterThan(0);
      userPluginsRef = userPlugins.docs[0].id;
      userPluginsData = userPlugins.docs[0].data();
      expect(userPluginsData.approved.length).toBe(0);
      expect(userPluginsData.pending.length).toBe(0);
      expect(userPluginsData.purchaseRef.length).toBe(0);
    });
    test("by email", async () => {
      return await request(app)
        .get(`/users/get_unique_url/${testUserData.emailUser.email}`)
        .expect(200)
        .then((response) => {
          expect(
            response.body.message == "User url and data fetched successfully"
          );
          expect(response.body.data.user_url).not.toBe("");
          expect(response.body.data.user_data).toBeTruthy();
          expect(response.body.data.plugin_data.length).toBeGreaterThanOrEqual(
            0
          );
        });
    });
    test("by username and uuid", async () => {
      return await request(app)
        .get(
          `/users/get_unique_url/${testUserData.emailUser.firstName}/${newUserRef}`
        )
        .expect(200)
        .then((response) => {
          expect(response.body.message).toBe(
            "User url and data fetched successfully"
          );
          expect(response.body.data.user_url).not.toBe("");
          expect(response.body.data.user_data).toBeTruthy();
          expect(response.body.data.plugin_data.length).toBeGreaterThanOrEqual(
            0
          );
        });
    });
  });

  describe("Login using Email and Password", () => {
    test("Email is empty, should error out", async () => {
      const requestData = {
        email: "",
        password: testUserData.emailUser.password,
      };
      return await request(app)
        .post("/users/login")
        .send(requestData)
        .expect(400)
        .then((response) => {
          expect(response.body.errors.email).toBe("Email field is required");
        });
    });
    test("Email is invalid, should error out", async () => {
      const requestData = {
        email: "test.com",
        password: testUserData.emailUser.password,
      };
      return await request(app)
        .post("/users/login")
        .send(requestData)
        .expect(400)
        .then((response) => {
          expect(response.body.errors.email).toBe("Email is invalid");
        });
    });
    test("Password is empty, should error out", async () => {
      const requestData = {
        email: testUserData.emailUser.email,
        password: "",
      };
      return await request(app)
        .post("/users/login")
        .send(requestData)
        .expect(400)
        .then((response) => {
          expect(response.body.errors.password).toBe(
            "Password field is required"
          );
        });
    });
    test("Password is incorrect, should error out", async () => {
      const requestData = {
        email: testUserData.emailUser.email,
        password: "incorrectPassword",
      };
      return await request(app)
        .post("/users/login")
        .send(requestData)
        .expect(400)
        .expect({
          errors: { password: "Password incorrect" },
        });
    });
    test("Email is non-existing, should error out", async () => {
      const requestData = {
        email: "non-existing@tensorplace.io",
        password: testUserData.emailUser.password,
      };
      return await request(app)
        .post("/users/login")
        .send(requestData)
        .expect(400)
        .expect({
          errors: { email: "Email Doesn't Exist." },
        });
    });
    test("Credentials are proper, should login", async () => {
      const requestData = {
        email: testUserData.emailUser.email,
        password: testUserData.emailUser.password,
      };
      return await request(app)
        .post("/users/login")
        .send(requestData)
        .expect(200)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.authToken).toBeTruthy();
          bearerToken = response.body.authToken;
        });
    });
    test("CURRENT_USER collection should get a new document", async () => {
      const currentUser = await db
        .collection("CURRENT_USER")
        .where("email", "==", testUserData.emailUser.email)
        .get();
      expect(currentUser.docs.length).toBeGreaterThan(0);
      currentUserRef = currentUser.docs[0].id;
      currentUserData = currentUser.docs[0].data();
      expect(currentUserData.email).toBe(testUserData.emailUser.email);
    });
    test("Current User endpoint should return user using email user token", async () => {
      return await request(app)
        .get("/users/currentuser")
        .set({ Authorization: bearerToken })
        .expect(200)
        .then((response) => {
          expect(response.body.data).toBeTruthy();
          expect(response.body.message).toBe(
            "User Details fetched Successfully!"
          );
        });
    });
    test("Current User endpoint should return user using github user token", async () => {
      const githubLoginPAT = await request(app)
      .post("/users/login/github/pat")
      .send({ personal_access_token: testUserData.user1.githubPAT });

      return await request(app)
        .get("/users/currentuser")
        .set({ Authorization: githubLoginPAT.body.authToken })
        .expect(200)
        .then((response) => {
          expect(response.body.data).toBeTruthy();
          expect(response.body.message).toBe(
            "User Details fetched Successfully!"
          );
        });
    });
  });
});
