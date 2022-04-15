const { Model, schema, field } = require('firestore-schema-validator')

const userSchema = schema({
  firstName: field('First Name')
    .string()
    .trim(),
  lastName: field('Last Name')
    .string()
    .trim(),
  userName: field('Username')
    .string()
    .trim(),
  email: field('Email Address')
    .string()
    .email(),
  emailVerificationCode: field('Email Verification Code')
    .string()
    .nullable(),
  password: field('Password')
    .string()
    .match(/[A-Z]/, '%s must contain an uppercase letter.')
    .match(/[a-z]/, '%s must contain a lowercase letter.')
    .match(/[0-9]/, '%s must contain a digit.')
    .minLength(8),
  githubId: field('GitHub ID')
    .string()
    .trim()
  ,
  githubToken: field('GitHub Token')  // No idea why this is here.
    .string()
    .nullable(),
  profileImg: field('Profile Image URL')
    .string()
    .trim(),
  numberOfRepositories: field('Number of Repositories')
    .number(),
  developerScore: field('Developer Score')
    .number(),
  repositoriesPurchased: field('Number of Repositories Sold')
    .number(),
  repositoriesViews: field('Total Repository views.')
    .number(),
  tagline: field('Tagline')
    .string(),
  subscribe_emails: field('Subscribed Emails')
    .boolean(),
  accepted_tos: field('Accepted Terms of Services')
    .boolean(),
  cards: field('Cards')
    .array(),
  yearsOfExperience: field('Total Years of Experience')
    .number(),
  profession: field('Profession')
    .string(),
  industry: field('Industry')
    .string()
})

class UserModel extends Model {
  static get _collectionPath() {
    return 'User'
  }
  static get _schema() {
    return userSchema
  }
  static async getByEmail(email) {
    return await this.getBy('email', email)
  }
  static async getByFirstName(firstName) {
    return await this.getBy('firstName', firstName)
  }
  static async getByLastName(lastName) {
    return await this.getBy('lastName', lastName)
  }
  static async getByUsername(userName) {
    return await this.getBy('userName', userName)
  }
  static async getByGitHubID(githubId) {
    return await this.getBy('githubId', githubId)
  }

  get fullName() {
    return `${this._data.firstName} ${this._data.lastName}`
  }
  get email() {
    return `${this._data.email}`
  }
  get githubId() {
    return `${this._data.githubId}`
  }
  get githubToken() {
    return `${this._data.githubToken}`
  }

  get isEmailVerified() {
    return Boolean(this._data.emailVerificationCode)
  }

  get isAcceptedTOS() {
    return this._data.accepted_tos
  }

  get isSubscribedEmails() {
    return this._data.subscribe_emails
  }

  get numberOfRepositories() {
    return this.numberOfRepositories
  }
  get developerScore() {
    return this.developerScore
  }
  get hasSavedCards() {
    return Boolean(this._data.cards.length)
  }
  get repositoriesPurchased() {
    return this.repositoriesPurchased
  }
  get repositoriesViews() {
    return this.repositoriesViews
  }
  get collectionPathId() {
    return `${this._collectionPath}/${this._id}`
  }

  toJSON() {
    return {
      id: this._id, // ID of Document stored in Cloud Firestore
      createdAt: this._createdAt, // ISO String format date of Document's creation.
      updatedAt: this._updatedAt, // ISO String format date of Document's last update.
      firstName: this.firstName,
      lastName: this.lastName,
      userName: this.userName,
      email: this.email,
      githubId: this.githubId,
      githubToken: this.githubToken,  // No idea why this is here.
      profileImg: this.profileImg,
      isEmailVerified: this.isEmailVerified,
      numberOfRepositories: this.numberOfRepositories,
      developerScore: this.developerScore,
      repositoriesPurchased: this.repositoriesPurchased,
      repositoriesViews: this.repositoriesViews,
      tagline: this.tagline,
      accepted_tos: this.accepted_tos,
      subscribe_emails: this.subscribe_emails,
      yearsOfExperience: this.yearsOfExperience,
      profession: this.profession,
      industry: this.industry
    }
  }
}

// Fired when new user is successfully created and stored.
UserModel.on('created', async (user) => {
  // TODO : eg. send Welcome Email to User
})

// Fired when user is successfully updated and stored.
UserModel.on('updated', async (user) => {
  // eg. log info to console
  console.log(`User with name ${this._data.firstName} has been updated.`)
})

// Fired when user is succsessfully deleted.
UserModel.on('deleted', async (user) => {
  // TODO : eg. delete repos uploaded by User
})

// Fired during user.validate() if user.email has changed,
// but *before* actually validating and storing the data.
UserModel.prehook('email', (data, user) => {
  // TODO : eg. set emailVerificationCode
})

// Fired during user.validate() if user.email has changed,
// but *after* actually validating and storing the data.
UserModel.posthook('email', (data, user) => {
  // TODO : eg. send Email Verification Email to User
})

UserModel.posthook('password', (data, user) => {
  // TODO : eg. hash password to store it securely
})

module.exports = userSchema
module.exports = UserModel
