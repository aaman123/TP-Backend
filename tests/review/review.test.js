const request = require("supertest");
const app = require("../../app");
const testUserData = require("../../fixtures/users");
const testPluginData = require("../../fixtures/plugins");
const admin = require("firebase-admin");

describe("Reviews - Unit Tests", () => {
  const db = admin.firestore();
  let bearer_token;
  let addedReviewRef;

  beforeAll(async () => {
    // Getting Bearer Token
    const response = await request(app)
      .post("/users/login/github/pat")
      .send({ personal_access_token: testUserData.user1.githubPAT });
    bearer_token = response.body.authToken;
  });

  afterAll(async () => {
    await db.collection("Review").doc(addedReviewRef.split("/")[1]).delete();
  });

  describe("Add Review Test Case", () => {
    test(`Plugin named ${testPluginData.nonExistRepo.title} doesn't exists So Review Can't Be Added`, async () => {
      return await request(app)
        .post(`/tensorplace-review-api/store_rating`)
        .set({ Authorization: bearer_token })
        .send({
          codeRating: 4,
          docRating: 1,
          devRating: 4,
          reviewMsg: "Demo Review 1",
          repoName: testPluginData.nonExistRepo.title,
        })
        .expect(404)
        .then((response) => {
          expect(response.body.message).toBe("No Plugin Found");
        });
    });

    test(`Plugin named ${testPluginData.pendingRepo.title} not approved yet so Review can't be added`, async () => {
      return await request(app)
        .post(`/tensorplace-review-api/store_rating`)
        .set({ Authorization: bearer_token })
        .send({
          codeRating: 4,
          docRating: 1,
          devRating: 4,
          reviewMsg: "Demo Review 1",
          repoName: testPluginData.pendingRepo.title,
        })
        .expect(404)
        .then((response) => {
          expect(response.body.message).toBe("Repo Is Not Approved Yet");
        });
    });

    test(`Plugin Owned By Reviewer So Review can't Be Added`, async () => {
      const response = await request(app)
        .post("/users/login/github/pat")
        .send({ personal_access_token: testUserData.user2.githubPAT });
      user_two_bearer_token = response.body.authToken;

      return await request(app)
        .post(`/tensorplace-review-api/store_rating`)
        .set({ Authorization: user_two_bearer_token })
        .send({
          codeRating: 4,
          docRating: 1,
          devRating: 4,
          reviewMsg: "Demo Review 1",
          repoName: testPluginData.purchasedRepo.title,
        })
        .expect(404)
        .then((response) => {
          expect(response.body.message).toBe(
            "Can't add a review, it's owned by you"
          );
        });
    });

    test(`Plugin not purchased by User So Review can't Be added`, async () => {
      const response = await request(app)
        .post("/users/login/github/pat")
        .send({ personal_access_token: testUserData.user3.githubPAT });
      user_three_bearer_token = response.body.authToken;

      return await request(app)
        .post(`/tensorplace-review-api/store_rating`)
        .set({ Authorization: user_three_bearer_token })
        .send({
          codeRating: 4,
          docRating: 1,
          devRating: 4,
          reviewMsg: "Demo Review 1",
          repoName: testPluginData.purchasedRepo.title,
        })
        .expect(403)
        .then((response) => {
          expect(response.body.message).toBe(
            "You need to purchase the Repo to add a review."
          );
        });
    });

    test(`Valid Data, Review should be added successfully`, async () => {
      return await request(app)
        .post(`/tensorplace-review-api/store_rating`)
        .set({ Authorization: bearer_token })
        .send({
          codeRating: 4,
          docRating: 1,
          devRating: 4,
          reviewMsg: "Demo Review 1",
          repoName: testPluginData.purchasedRepo.title,
        })
        .expect(200)
        .then((response) => {
          expect(response.body.data).toBeTruthy();
          expect(response.body.message).toBe("Review added successfully!");
        });
    });

    test(`Review Already Done, Can't Add Another Review`, async () => {
      return await request(app)
        .post(`/tensorplace-review-api/store_rating`)
        .set({ Authorization: bearer_token })
        .send({
          codeRating: 4,
          docRating: 1,
          devRating: 4,
          reviewMsg: "Demo Review 1",
          repoName: testPluginData.purchasedRepo.title,
        })
        .expect(404)
        .then((response) => {
          expect(response.body.message).toBe("Already Added a Review");
        });
    });
  });

  describe(`Review Status API - Unit Tests`, () => {
    test(`Plugin doesn't exist can't get status`, async () => {
      return await request(app)
        .get(
          `/tensorplace-review-api/review/status/${testPluginData.nonExistRepo.title}`
        )
        .set({ Authorization: bearer_token })
        .expect(404)
        .then((response) => {
          expect(response.body.message).toBe("No Plugin Found");
          expect(response.body.isReviewAdded).toBeFalsy();
        });
    });

    test(`Repo Not Approved Yet Can't Get Status`, async () => {
      return await request(app)
        .get(
          `/tensorplace-review-api/review/status/${testPluginData.pendingRepo.title}`
        )
        .set({ Authorization: bearer_token })
        .expect(404)
        .then((response) => {
          expect(response.body.message).toBe("Repo Is Not Approved Yet");
          expect(response.body.isReviewAdded).toBeFalsy();
        });
    });

    test(`Plugin owned by self, can't get status`, async () => {
      const response = await request(app)
        .post("/users/login/github/pat")
        .send({ personal_access_token: testUserData.user2.githubPAT });
      user_two_bearer_token = response.body.authToken;

      return await request(app)
        .get(
          `/tensorplace-review-api/review/status/${testPluginData.purchasedRepo.title}`
        )
        .set({ Authorization: user_two_bearer_token })
        .expect(404)
        .then((response) => {
          expect(response.body.isReviewAdded).toBeFalsy();
          expect(response.body.message).toBe(
            "Can't get a status, it's owned by you"
          );
        });
    });

    test(`Review Not Added So Status isReviewAdded : False ${testPluginData.noReviewsRepo.title}`, async () => {
      return await request(app)
        .get(
          `/tensorplace-review-api/review/status/${testPluginData.noReviewsRepo.title}`
        )
        .set({ Authorization: bearer_token })
        .expect(404)
        .then((response) => {
          expect(response.body.message).toBeTruthy();
          expect(response.body.isReviewAdded).toBeFalsy();
        });
    });

    test(`Review Already Added So Status isReviewAdded : True ${testPluginData.purchasedRepo.title}`, async () => {
      return await request(app)
        .get(
          `/tensorplace-review-api/review/status/${testPluginData.purchasedRepo.title}`
        )
        .set({ Authorization: bearer_token })
        .expect(200)
        .then((response) => {
          expect(response.body.data).toBeTruthy();
          expect(response.body.isReviewAdded).toBeTruthy();
          addedReviewRef = response.body.data.reviewRef;
        });
    });
  });

  describe(`All Update reviews API test Case`, () => {
    test(`Reference of Document id doesn't exist`, async () => {
      return await request(app)
        .post(`/tensorplace-review-api/review/update/not_exist_id_is_abc123`)
        .set({ Authorization: bearer_token })
        .send({
          codeRating: 4,
          docRating: 1,
          devRating: 4,
          reviewMsg: "update review",
        })
        .expect(404)
        .then((response) => {
          expect(response.body.message).toBe("Review Document not found!");
        });
    });

    test(`Not Authorized To Update Review Status:False`, async () => {
      const response = await request(app)
        .post("/users/login/github/pat")
        .send({ personal_access_token: testUserData.user2.githubPAT });
      user_two_bearer_token = response.body.authToken;
      return await request(app)
        .post(
          `/tensorplace-review-api/review/update/${
            addedReviewRef.split("Review/")[1]
          }`
        )
        .set({ Authorization: user_two_bearer_token })
        .send({
          codeRating: 4,
          docRating: 1,
          devRating: 4,
          reviewMsg: "update review",
        })
        .expect(401)
        .then((response) => {
          expect(response.body.message).toBe(
            "You are not Authorized to update the review!"
          );
        });
    });

    test(`trying to change Plugin name and UserRef, should error out`, async () => {
      return await request(app)
        .post(
          `/tensorplace-review-api/review/update/${
            addedReviewRef.split("/")[1]
          }`
        )
        .set({ Authorization: bearer_token })
        .send({
          codeRating: 4,
          docRating: 1,
          devRating: 4,
          reviewMsg: "update review",
          repoName: testPluginData.pendingRepo.title,
          userRef: `User/${testUserData.user2.userRef}`,
        })
        .expect(403)
        .then((response) => {
          expect(response.body.message).toBe(
            "Cannot Update Repository Name or User Reference!"
          );
        });
    });

    test(`Review Updated Successfully`, async () => {
      return await request(app)
        .post(
          `/tensorplace-review-api/review/update/${
            addedReviewRef.split("Review/")[1]
          }`
        )
        .set({ Authorization: bearer_token })
        .send({
          codeRating: 4,
          docRating: 1,
          devRating: 4,
          reviewMsg: "update review",
        })
        .expect(200)
        .then((response) => {
          expect(response.body.message).toBe("Review Updated Successfully!");
        });
    });
  });

  describe("Get all Review Test case", () => {
    test(`Plugin Not Found So No Review Exist`, async () => {
      return await request(app)
        .get(
          `/tensorplace-review-api/review/${testPluginData.nonExistRepo.title}`
        )
        .set({ Authorization: bearer_token })
        .expect(404)
        .then((response) => {
          expect(response.body.message).toBe("No Plugin Found");
        });
    });

    test("Plugin Not Approved Yet So No Review Exist", async () => {
      return await request(app)
        .get(
          `/tensorplace-review-api/review/${testPluginData.pendingRepo.title}`
        )
        .set({ Authorization: bearer_token })
        .expect(404)
        .then((response) => {
          expect(response.body.message).toBe("Repo Is Not Approved Yet");
        });
    });

    test(`No Reviews Found Of Plugin is ${testPluginData.noReviewsRepo.title}`, async () => {
      return await request(app)
        .get(
          `/tensorplace-review-api/review/${testPluginData.noReviewsRepo.title}`
        )
        .set({ Authorization: bearer_token })
        .expect(404)
        .then((response) => {
          expect(response.body.message).toBe("No Reviews found!");
        });
    });

    test(`Reviews Found Plugin Name is ${testPluginData.purchasedRepo.title}`, async () => {
      return await request(app)
        .get(
          `/tensorplace-review-api/review/${testPluginData.purchasedRepo.title}`
        )
        .set({ Authorization: bearer_token })
        .expect(200)
        .then((response) => {
          expect(response.body.data).toBeTruthy();
          reviews = response.body.data;
        });
    });
  });
});
