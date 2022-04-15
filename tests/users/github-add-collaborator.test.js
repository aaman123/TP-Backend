const request = require("supertest");
const app = require("../../app");
const testUserData = require("../../fixtures/users");
const testPluginData = require("../../fixtures/plugins");
const octo = require("@octokit/request");
const admin = require("firebase-admin");
const keys = require("../../config/keys");

describe("Add Collaborator - Unit Test", () => {
  jest.useFakeTimers("legacy");
  jest.setTimeout(14400000);
  let bearer_token;
  let user_num_repository_count;
  const db = admin.firestore();

  beforeAll(async () => {
    // Getting Bearer Token
    const response = await request(app)
      .post("/users/login/github/pat")
      .send({ personal_access_token: testUserData.user1.githubPAT });
    bearer_token = response.body.authToken;

    const user = await db
      .collection("User")
      .doc(testUserData.user1.userRef)
      .get();
    user_num_repository_count = user.data().numberOfRepositories;

    // Creating a Repo for the given user.
    const result = await octo.request(`POST /user/repos`, {
      headers: {
        accept: "application/vnd.github.v3+json",
        authorization: "token " + testUserData.user1.githubPAT + "",
      },
      name: testPluginData.repoAddCollaborator.title,
      description: testPluginData.repoAddCollaborator.description,
      private: true,
      auto_init: true,
    });
  });

  afterAll(async () => {
    // Deleting the repository after Each tests.
    const result = await octo.request(`DELETE /repos/{owner}/{repo}`, {
      headers: {
        accept: "application/vnd.github.v3+json",
        authorization: "token " + testUserData.user1.githubPAT + "",
      },
      owner: testUserData.user1.githubUsername,
      repo: testPluginData.repoAddCollaborator.title,
    });

    //Getting record ID for Unit Test repo for Add collaborator.
    const plugin = await db
      .collection("Plugin")
      .where("title", "==", testPluginData.repoAddCollaborator.title)
      .get();
    const pluginRef = plugin.docs[0].id;
    // Deleting Plugin Record.
    await db.collection("Plugin").doc(pluginRef).delete();
    // Delete Entry for UserPlugins
    const userPlugins = await db
      .collection("UserPlugins")
      .doc(testUserData.user1.userPluginsRef)
      .get();
    const pending = userPlugins.data().pending;
    await db
      .collection("UserPlugins")
      .doc(testUserData.user1.userPluginsRef)
      .update({
        pending: pending.filter(
          (pendingItems) =>
            pendingItems != testPluginData.repoAddCollaborator.title
        ),
      });

    // Decrement value of User's Repository Count.
    await db
      .collection("User")
      .doc(testUserData.user1.userRef)
      .update({
        numberOfRepositories: admin.firestore.FieldValue.increment(-1),
      });
  });
  describe("After Initial Creation of Repo", () => {
    test("adding collaborator to repository 'unit-test-add-collaborator'.", async () => {
      return await request(app)
        .post("/users/addCollaborator")
        .set("Authorization", bearer_token)
        .send({
          owner_username: testUserData.user1.githubUsername,
          owner_repo: testPluginData.repoAddCollaborator.title,
        })
        .expect(200)
        .expect({
          msg: "Repository added successfully",
        });
    });

    test("check Plugin Document created for unit-test-add-collaborator", async () => {
      const plugin = await db
        .collection("Plugin")
        .where("title", "==", testPluginData.repoAddCollaborator.title)
        .get();
      const pluginData = plugin.docs[0].data();
      return expect(pluginData.title).toBe(
        testPluginData.repoAddCollaborator.title
      );
    });

    test("check UserPlugins has an entry in pending array", async () => {
      const userPlugins = await db
        .collection("UserPlugins")
        .doc(testUserData.user1.userPluginsRef)
        .get();
      const userPluginsData = userPlugins.data();
      return expect(userPluginsData.pending).toContain(
        testPluginData.repoAddCollaborator.title
      );
    });

    test("check User Document has increased value of numOfRepositories field", async () => {
      const user = await db
        .collection("User")
        .doc(testUserData.user1.userRef)
        .get();
      const userData = user.data();
      return expect(userData.numberOfRepositories).toBe(
        Number(user_num_repository_count + 1)
      );
    });
  });

  describe("Reinviting after uploading Repository Information", () => {
    test("adding collaborator to already added repository 'unit-test-add-collaborator'.", async () => {
      return await request(app)
        .post("/users/addCollaborator")
        .set("Authorization", bearer_token)
        .send({
          owner_username: testUserData.user1.githubUsername,
          owner_repo: testPluginData.repoAddCollaborator.title,
        })
        .expect(208)
        .expect({
          msg: "Repository already exists with same name. Please change the name of the repository.",
        });
    });
  });

  describe("After accepting the invitation ", () => {
    let invitation;
    beforeAll(async () => {
      // Getting invitation id to accept the invitation of the repository.
      const invitation_result = await octo.request(
        `GET /user/repository_invitations`,
        {
          headers: {
            accept: "application/vnd.github.v3+json",
            authorization: "token " + keys.TENSORPLACE_PAT + "",
          },
        }
      );
      if (invitation_result.data.length >= 1) {
        let response = invitation_result.data;
        invitation = response.filter(
          (arrVal) =>
            arrVal.repository.name == testPluginData.repoAddCollaborator.title
        )[0];
      }

      // Accepting the invitation.
      const accept_invitation_result = await octo.request(
        `PATCH /user/repository_invitations/{invitation_id}`,
        {
          headers: {
            accept: "application/vnd.github.v3+json",
            authorization: "token " + keys.TENSORPLACE_PAT + "",
          },
          invitation_id: invitation.id,
        }
      );
    });

    test("adding collaborator to already accepted repository 'unit-test-add-collaborator'.", async () => {
      return await request(app)
        .post("/users/addCollaborator")
        .set("Authorization", bearer_token)
        .send({
          owner_username: testUserData.user1.githubUsername,
          owner_repo: testPluginData.repoAddCollaborator.title,
        })
        .expect(400)
        .expect({ error: "Invitation Already Accepted." });
    });
  });
});
