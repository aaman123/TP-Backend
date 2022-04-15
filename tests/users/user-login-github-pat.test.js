const request = require("supertest");
const app = require("../../app");
const testUserData = require("../../fixtures/users");

describe("User Login GitHub with PAT - Unit Test", () => {
  jest.useFakeTimers("legacy");
  jest.setTimeout(14400000);
  test("GET /users/login/github/pat - Test User 1", async () => {
    return await request(app)
      .post("/users/login/github/pat")
      .send({ personal_access_token: testUserData.user1.githubPAT })
      .expect(200);
  });
  test("GET /users/login/github/pat - Test User 2", async () => {
    return await request(app)
      .post("/users/login/github/pat")
      .send({ personal_access_token: testUserData.user2.githubPAT })
      .expect(200);
  });
  test("GET /users/login/github/pat - Test User 3", async () => {
    return await request(app)
      .post("/users/login/github/pat")
      .send({ personal_access_token: testUserData.user3.githubPAT })
      .expect(200);
  });
});
