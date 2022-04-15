const request = require("supertest");
const app = require("../../app");
const testUserData = require("../../fixtures/users");
const admin = require("firebase-admin");

describe("User Profile Tests", () => {
  const db = admin.firestore();
  let bearer_token;
  let originalUserOneRef;
  let originalUserOneData;
  beforeAll(async () => {
    const response = await request(app)
      .post("/users/login/github/pat")
      .send({ personal_access_token: testUserData.user1.githubPAT });
    bearer_token = response.body.authToken;
    let originalUserOne = await db
      .collection("User")
      .doc(testUserData.user1.userRef)
      .get();
    originalUserOneRef = originalUserOne.id;
    originalUserOneData = originalUserOne.data();
  });
  afterAll(async () => {
    await db.collection("User").doc(originalUserOneRef).delete();
    await db
      .collection("User")
      .doc(originalUserOneRef)
      .set(originalUserOneData);
  });
  describe("get user profile initally", () => {
    test("should return profile of github user 1", async () => {
      return await request(app)
        .get("/users/profile")
        .set({ Authorization: bearer_token })
        .expect(200)
        .then((response) => {
          expect(response.body.data).toBeTruthy();
          expect(response.body.message).toBe(
            "User Profile fetched successfully!"
          );
        });
    });
  });
  describe("Errors for Update profile without Contact Developer", () => {
    test("empty firstname, should error out", async () => {
      const requestData = {
        developerAvailability: {
          isAvailable: false,
        },
        firstName: "",
        lastName: testUserData.user1.lastName,
        email: testUserData.user1.email,
      };
      return await request(app)
        .post("/users/update")
        .set({ Authorization: bearer_token })
        .send(requestData)
        .expect(400)
        .then((response) => {
          expect(response.body.firstName).toBe("First name field is required");
        });
    });
    test("empty lastname, should error out", async () => {
      const requestData = {
        developerAvailability: {
          isAvailable: false,
        },
        firstName: testUserData.user1.firstName,
        lastName: "",
        email: testUserData.user1.email,
      };
      return await request(app)
        .post("/users/update")
        .set({ Authorization: bearer_token })
        .send(requestData)
        .expect(400)
        .then((response) => {
          expect(response.body.lastName).toBe("Last name field is required");
        });
    });
    test("empty email, should error out", async () => {
      const requestData = {
        developerAvailability: {
          isAvailable: false,
        },
        firstName: testUserData.user1.firstName,
        lastName: testUserData.user1.lastName,
        email: "",
      };
      return await request(app)
        .post("/users/update")
        .set({ Authorization: bearer_token })
        .send(requestData)
        .expect(400)
        .then((response) => {
          expect(response.body.email).toBe("Email field is required");
        });
    });
    test("invalid email, should error out", async () => {
      const requestData = {
        developerAvailability: {
          isAvailable: false,
        },
        firstName: testUserData.user1.firstName,
        lastName: testUserData.user1.lastName,
        email: "invalid-email.com",
      };
      return await request(app)
        .post("/users/update")
        .set({ Authorization: bearer_token })
        .send(requestData)
        .expect(400)
        .then((response) => {
          expect(response.body.email).toBe("Email is invalid");
        });
    });
  });
  describe("Errors for Update profile Tests with Contact Developer", () => {
    test("developerAvailability is missing", async () => {
      const requestData = {
        firstName: testUserData.user1.firstName,
        lastName: testUserData.user1.lastName,
        email: testUserData.user1.email,
      };
      return await request(app)
        .post("/users/update")
        .set({ Authorization: bearer_token })
        .send(requestData)
        .expect(400)
        .then((response) => {
          expect(response.body.developerAvailability).toBe(
            "developerAvailability field is required and should be Boolean."
          );
        });
    });
    test("isAvailable is missing", async () => {
      const requestData = {
        developerAvailability: {},
        firstName: testUserData.user1.firstName,
        lastName: testUserData.user1.lastName,
        email: testUserData.user1.email,
      };
      return await request(app)
        .post("/users/update")
        .set({ Authorization: bearer_token })
        .send(requestData)
        .expect(400)
        .then((response) => {
          expect(response.body.developerAvailability.isAvailable).toBe(
            "isAvailable field is required and should be Boolean."
          );
        });
    });

    test("email is empty", async () => {
      const requestData = {
        developerAvailability: {
          isAvailable: true,
          email: "",
          currency: testUserData.user1.developerAvailability.currency,
          rate: testUserData.user1.developerAvailability.rate,
          timezone: testUserData.user1.developerAvailability.timezone,
          details: testUserData.user1.developerAvailability.details,
        },
        firstName: testUserData.user1.firstName,
        lastName: testUserData.user1.lastName,
        email: testUserData.user1.email,
      };
      return await request(app)
        .post("/users/update")
        .set({ Authorization: bearer_token })
        .send(requestData)
        .expect(400)
        .then((response) => {
          expect(response.body.developerAvailability.email).toBe(
            "Email field is required"
          );
        });
    });
    test("email is invalid", async () => {
      const requestData = {
        developerAvailability: {
          isAvailable: true,
          email: "invalid-email.com",
          currency: testUserData.user1.developerAvailability.currency,
          rate: testUserData.user1.developerAvailability.rate,
          timezone: testUserData.user1.developerAvailability.timezone,
          details: testUserData.user1.developerAvailability.details,
        },
        firstName: testUserData.user1.firstName,
        lastName: testUserData.user1.lastName,
        email: testUserData.user1.email,
      };
      return await request(app)
        .post("/users/update")
        .set({ Authorization: bearer_token })
        .send(requestData)
        .expect(400)
        .then((response) => {
          expect(response.body.developerAvailability.email).toBe(
            "Email is invalid"
          );
        });
    });
    test("rate is invalid", async () => {
      const requestData = {
        developerAvailability: {
          isAvailable: true,
          email: testUserData.user1.developerAvailability.email,
          currency: testUserData.user1.developerAvailability.currency,
          rate: 123.12345,
          timezone: testUserData.user1.developerAvailability.timezone,
          details: testUserData.user1.developerAvailability.details,
        },
        firstName: testUserData.user1.firstName,
        lastName: testUserData.user1.lastName,
        email: testUserData.user1.email,
      };
      return await request(app)
        .post("/users/update")
        .set({ Authorization: bearer_token })
        .send(requestData)
        .expect(400)
        .then((response) => {
          expect(response.body.developerAvailability.rate).toBe(
            "Only 2-3 Decimal digits allowed in Rate field."
          );
        });
    });
    test("currency is empty", async () => {
      const requestData = {
        developerAvailability: {
          isAvailable: true,
          email: testUserData.user1.developerAvailability.email,
          currency: "",
          rate: testUserData.user1.developerAvailability.rate,
          timezone: testUserData.user1.developerAvailability.timezone,
          details: testUserData.user1.developerAvailability.details,
        },
        firstName: testUserData.user1.firstName,
        lastName: testUserData.user1.lastName,
        email: testUserData.user1.email,
      };
      return await request(app)
        .post("/users/update")
        .set({ Authorization: bearer_token })
        .send(requestData)
        .expect(400)
        .then((response) => {
          expect(response.body.developerAvailability.currency).toBe(
            "Currency Field is required."
          );
        });
    });
    test("currency is invalid", async () => {
      const requestData = {
        developerAvailability: {
          isAvailable: true,
          email: testUserData.user1.developerAvailability.email,
          currency: "invalid-currency",
          rate: testUserData.user1.developerAvailability.rate,
          timezone: testUserData.user1.developerAvailability.timezone,
          details: testUserData.user1.developerAvailability.details,
        },
        firstName: testUserData.user1.firstName,
        lastName: testUserData.user1.lastName,
        email: testUserData.user1.email,
      };
      return await request(app)
        .post("/users/update")
        .set({ Authorization: bearer_token })
        .send(requestData)
        .expect(400)
        .then((response) => {
          expect(response.body.developerAvailability.currency).toBe(
            "Currency Code Not valid."
          );
        });
    });
    test("timezone is invalid", async () => {
      const requestData = {
        developerAvailability: {
          isAvailable: true,
          email: testUserData.user1.developerAvailability.email,
          currency: testUserData.user1.developerAvailability.currency,
          rate: testUserData.user1.developerAvailability.rate,
          timezone: "invalid-timezone",
          details: testUserData.user1.developerAvailability.details,
        },
        firstName: testUserData.user1.firstName,
        lastName: testUserData.user1.lastName,
        email: testUserData.user1.email,
      };
      return await request(app)
        .post("/users/update")
        .set({ Authorization: bearer_token })
        .send(requestData)
        .expect(400)
        .then((response) => {
          expect(response.body.developerAvailability.timezone).toBe(
            "Timezone not valid."
          );
        });
    });
    test("details is empty", async () => {
      const requestData = {
        developerAvailability: {
          isAvailable: true,
          email: testUserData.user1.developerAvailability.email,
          currency: testUserData.user1.developerAvailability.currency,
          rate: testUserData.user1.developerAvailability.rate,
          timezone: testUserData.user1.developerAvailability.timezone,
          details: [],
        },
        firstName: testUserData.user1.firstName,
        lastName: testUserData.user1.lastName,
        email: testUserData.user1.email,
      };
      return await request(app)
        .post("/users/update")
        .set({ Authorization: bearer_token })
        .send(requestData)
        .expect(400)
        .then((response) => {
          expect(response.body.developerAvailability.details).toBe(
            "Details Empty!"
          );
        });
    });
    test("start time is invalid", async () => {
      const requestData = {
        developerAvailability: {
          isAvailable: true,
          email: testUserData.user1.developerAvailability.email,
          currency: testUserData.user1.developerAvailability.currency,
          rate: testUserData.user1.developerAvailability.rate,
          timezone: testUserData.user1.developerAvailability.timezone,
          details: [
            {
              start_time: "invalid",
              end_time:
                testUserData.user1.developerAvailability.details[0].end_time,
              duration:
                testUserData.user1.developerAvailability.details[0].duration,
            },
          ],
        },
        firstName: testUserData.user1.firstName,
        lastName: testUserData.user1.lastName,
        email: testUserData.user1.email,
      };
      return await request(app)
        .post("/users/update")
        .set({ Authorization: bearer_token })
        .send(requestData)
        .expect(400)
        .then((response) => {
          expect(response.body.developerAvailability.details.start_time).toBe(
            "Start Time invalid."
          );
        });
    });
    test("end time is invalid", async () => {
      const requestData = {
        developerAvailability: {
          isAvailable: true,
          email: testUserData.user1.developerAvailability.email,
          currency: testUserData.user1.developerAvailability.currency,
          rate: testUserData.user1.developerAvailability.rate,
          timezone: testUserData.user1.developerAvailability.timezone,
          details: [
            {
              start_time:
                testUserData.user1.developerAvailability.details[0].start_time,
              end_time: "invalid-time",
              duration:
                testUserData.user1.developerAvailability.details[0].duration,
            },
          ],
        },
        firstName: testUserData.user1.firstName,
        lastName: testUserData.user1.lastName,
        email: testUserData.user1.email,
      };
      return await request(app)
        .post("/users/update")
        .set({ Authorization: bearer_token })
        .send(requestData)
        .expect(400)
        .then((response) => {
          expect(response.body.developerAvailability.details.end_time).toBe(
            "End Time invalid."
          );
        });
    });
    test("duration is invalid", async () => {
      const requestData = {
        developerAvailability: {
          isAvailable: true,
          email: testUserData.user1.developerAvailability.email,
          currency: testUserData.user1.developerAvailability.currency,
          rate: testUserData.user1.developerAvailability.rate,
          timezone: testUserData.user1.developerAvailability.timezone,
          details: [
            {
              start_time:
                testUserData.user1.developerAvailability.details[0].start_time,
              end_time:
                testUserData.user1.developerAvailability.details[0].end_time,
              duration: "invalid",
            },
          ],
        },
        firstName: testUserData.user1.firstName,
        lastName: testUserData.user1.lastName,
        email: testUserData.user1.email,
      };
      return await request(app)
        .post("/users/update")
        .set({ Authorization: bearer_token })
        .send(requestData)
        .expect(400)
        .then((response) => {
          expect(response.body.developerAvailability.details.duration).toBe(
            "Duration not valid!"
          );
        });
    });
  });

  describe("Updating Profile with Contact Developer Details", () => {
    test("should pass with valid data", async () => {
      const requestData = {
        developerAvailability: {
          isAvailable: true,
          email: testUserData.user1.developerAvailability.email,
          currency: testUserData.user1.developerAvailability.currency,
          rate: testUserData.user1.developerAvailability.rate,
          timezone: testUserData.user1.developerAvailability.timezone,
          details: testUserData.user1.developerAvailability.details,
        },
        firstName: testUserData.user1.firstName,
        lastName: testUserData.user1.lastName,
        email: testUserData.user1.email,
      };
      return await request(app)
        .post("/users/update")
        .set({ Authorization: bearer_token })
        .send(requestData)
        .expect(200)
        .then((response) => {
          expect(response.body.message).toBe("Profile Updated Successfully!");
        });
    });
  });
});
