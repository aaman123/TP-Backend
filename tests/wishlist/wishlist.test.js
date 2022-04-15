const request = require("supertest");
const app = require("../../app");
const testUserData = require("../../fixtures/users");
const testPluginData = require("../../fixtures/plugins");
const admin = require("firebase-admin");
const assert = require("assert");

describe("Wishlist - Unit Tests", () => {
  const db = admin.firestore();
  let bearer_token;

  beforeAll(async () => {
    // Getting Bearer Token
    const response = await request(app)
      .post("/users/login/github/pat")
      .send({ personal_access_token: testUserData.user1.githubPAT });
    bearer_token = response.body.authToken;
  });

  afterAll(() => {});
  describe("Initial get wishlist check", () => {
    test("getting wishlist if none present", async () => {
      return await request(app)
        .get("/tensorplace-wishlist-api/get_wishlist")
        .set({ Authorization: bearer_token })
        .expect(404)
        .expect({
          status: true,
          status_code: 404,
          data: [],
          message: "No Plugins in Wishlist for the User.",
        });
    });
  });

  describe("Add to Wishlist - Scenarios", () => {
    describe("if repo not already present in wishlist", () => {
      test("repo should be added in wishlist", async () => {
        return await request(app)
          .post("/tensorplace-wishlist-api/add_to_wishlist")
          .set({ Authorization: bearer_token })
          .send({ repo_name: testPluginData.repo4.title })
          .expect(200)
          .expect({
            status: true,
            status_code: 200,
            message: "Plugin saved to wishlist successfully",
          });
      });
      test("repo status must be true", async () => {
        return await request(app)
          .get(
            `/tensorplace-wishlist-api/wishlist/status/${testPluginData.repo4.title}`
          )
          .set({ Authorization: bearer_token })
          .expect(200)
          .expect((response) => {
            assert(response.body.inWishlist == true);
          });
      });
    });

    describe("if repo already present in wishlist", () => {
      test("repo should not get duplicated", async () => {
        return await request(app)
          .post("/tensorplace-wishlist-api/add_to_wishlist")
          .set({ Authorization: bearer_token })
          .send({ repo_name: testPluginData.repo4.title })
          .expect(200)
          .expect({
            status: true,
            status_code: 200,
            message: "Plugin saved to wishlist successfully",
          });
      });
      test("repo status should be true", async () => {
        return await request(app)
          .get(
            `/tensorplace-wishlist-api/wishlist/status/${testPluginData.repo4.title}`
          )
          .set({ Authorization: bearer_token })
          .expect(200)
          .expect((response) => {
            assert(response.body.inWishlist == true);
          });
      });
    });
    describe("if repo is non-approved", () => {
      test("repo should not be added", async () => {
        return await request(app)
          .post("/tensorplace-wishlist-api/add_to_wishlist")
          .set({ Authorization: bearer_token })
          .send({ repo_name: testPluginData.pendingRepo.title })
          .expect(405)
          .expect({
            status: false,
            status_code: 405,
            error: "Plugin Not yet Approved by our team!",
          });
      });
      test("repo status should be false", async () => {
        return await request(app)
          .get(
            `/tensorplace-wishlist-api/wishlist/status/${testPluginData.pendingRepo.title}`
          )
          .set({ Authorization: bearer_token })
          .expect(404)
          .expect((response) => {
            assert(response.body.inWishlist == false);
          });
      });
    });
    describe("if repo self owned", () => {
      test("repo should not be allowed to add.", async () => {
        return await request(app)
          .post("/tensorplace-wishlist-api/add_to_wishlist")
          .set({ Authorization: bearer_token })
          .send({ repo_name: testPluginData.repo1.title })
          .expect(405)
          .expect({
            status: false,
            status_code: 405,
            error: "You cannot wishlist your own plugin.",
          });
      });
      test("repo status should be false", async () => {
        return await request(app)
          .get(
            `/tensorplace-wishlist-api/wishlist/status/${testPluginData.repo1.title}`
          )
          .set({ Authorization: bearer_token })
          .expect(404)
          .expect((response) => {
            assert(response.body.inWishlist == false);
          });
      });
    });
  });
  describe("After Add Wishlist scenarios", () => {
    test("one repo should be in wishlist", async () => {
      return await request(app)
        .get("/tensorplace-wishlist-api/get_wishlist")
        .set({ Authorization: bearer_token })
        .expect(200)
        .expect((response) => {
          assert(response.body.data.length == 1);
        });
    });
  });

  describe("Remove from Wishlist - Scenarios", () => {
    describe("if repo not already present in wishlist", () => {
      test("repo cant be removed from wishlist", async () => {
        return await request(app)
          .post("/tensorplace-wishlist-api/remove_from_wishlist")
          .set({ Authorization: bearer_token })
          .send({ repo_name: testPluginData.repo5.title })
          .expect(404)
          .expect({
            status: false,
            status_code: 404,
            error: "Plugin not present in the wishlist.",
          });
      });
      test("repo status must be false", async () => {
        return await request(app)
          .get(
            `/tensorplace-wishlist-api/wishlist/status/${testPluginData.repo5.title}`
          )
          .set({ Authorization: bearer_token })
          .expect(404)
          .expect((response) => {
            assert(response.body.inWishlist == false);
          });
      });
    });

    describe("if repo already present in wishlist", () => {
      test("repo should get removed", async () => {
        return await request(app)
          .post("/tensorplace-wishlist-api/remove_from_wishlist")
          .set({ Authorization: bearer_token })
          .send({ repo_name: testPluginData.repo4.title })
          .expect(200)
          .expect({
            status: true,
            status_code: 200,
            message: "Plugin removed from wishlist successfully",
          });
      });
      test("repo status should be false", async () => {
        return await request(app)
          .get(
            `/tensorplace-wishlist-api/wishlist/status/${testPluginData.repo4.title}`
          )
          .set({ Authorization: bearer_token })
          .expect(404)
          .expect((response) => {
            assert(response.body.inWishlist == false);
          });
      });
    });
    describe("if repo is non-approved", () => {
      test("repo should can't be removed", async () => {
        return await request(app)
          .post("/tensorplace-wishlist-api/remove_from_wishlist")
          .set({ Authorization: bearer_token })
          .send({ repo_name: testPluginData.pendingRepo.title })
          .expect(405)
          .expect({
            status: false,
            status_code: 405,
            error: "Plugin Not yet Approved by our team!",
          });
      });
      test("repo status should be false", async () => {
        return await request(app)
          .get(
            `/tensorplace-wishlist-api/wishlist/status/${testPluginData.pendingRepo.title}`
          )
          .set({ Authorization: bearer_token })
          .expect(404)
          .expect((response) => {
            assert(response.body.inWishlist == false);
          });
      });
    });

    describe("if repo self owned", () => {
      test("repo should not be allowed to remove.", async () => {
        return await request(app)
          .post("/tensorplace-wishlist-api/remove_from_wishlist")
          .set({ Authorization: bearer_token })
          .send({ repo_name: testPluginData.repo1.title })
          .expect(405)
          .expect({
            status: false,
            status_code: 405,
            error: "Can't remove your own Plugin.",
          });
      });
      test("repo status should be false", async () => {
        return await request(app)
          .get(
            `/tensorplace-wishlist-api/wishlist/status/${testPluginData.repo1.title}`
          )
          .set({ Authorization: bearer_token })
          .expect(404)
          .expect((response) => {
            assert(response.body.inWishlist == false);
          });
      });
    });
  });
  describe("After Remove Wishlist Scenarios", () => {
    test("no repo should be in wishlist", async () => {
      return await request(app)
        .get("/tensorplace-wishlist-api/get_wishlist")
        .set({ Authorization: bearer_token })
        .expect(404)
        .expect({
          status: true,
          status_code: 404,
          data: [],
          message: "No Plugins in Wishlist for the User.",
        });
    });
  });
});
