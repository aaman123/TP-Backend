const request = require("supertest");
const { response } = require("../../app");
const app = require("../../app");
const testUserData = require("../../fixtures/users");

describe("Fetch all repos for the user", () => {
  let bearer_token;
  beforeAll(async () => {
    const response = await request(app)
      .post("/users/login/github/pat")
      .send({ personal_access_token: testUserData.user1.githubPAT });

    bearer_token = response.body.authToken;
  });
  afterAll(() => {});
  test("Should fetch three repos for user 1.", async () => {
    return await request(app)
      .get("/users/allRepos")
      .set({ Authorization: bearer_token })
      .expect(200)
      .then((response) => {
        expect(response.body.repos.length).toBe(3);
      });
  });
});
