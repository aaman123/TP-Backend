const { Model, schema, field } = require('firestore-schema-validator')

const pluginSchema = schema({
  title: field('Title')
    .string()
    .trim(),
  slug: field('Slug')
    .string()
    .trim(),
  githubRepoUrl: field('GitHub Repository URL')
    .string(),
  codebaseRef: field('Codebase')
    .array(),
  languageRef: field('Language')
    .array(),
  reputationScore: field('Reputation Score')
    .number(),
  totalPurchase: field('Total Purchase')
    .number(),
  description: field('Description')
    .string()
    .trim(),
  inputType: field('Input Type')
    .string()
    .optional(),
  outputType: field('Output Type')
    .string()
    .optional(),
  price: field('Price')
    .number(),
  image: field('Image URL')
    .string()
    .optional(),
  userRef: field('User')
    .string(),
  status: field('Status')
    .string()
})


class PluginModel extends Model {
  static get _collectionPath() {
    return 'Plugin'
  }
  static get _schema() {
    return pluginSchema
  }

  static async getByTitle(title) {
    return await this.getBy('title', title)
  }
  static async getBySlug(slug) {
    return await this.getBy('slug', slug)
  }
  // static async getByUser(user) {
  //   return await this.getBy('user', user) // Not confident about this as of now.
  // }
  get collectionPathId() {
    return `${this._collectionPath}/${this._id}`
  }

  get githubRepoUrl() {
    return this._data.githubRepoUrl
  }
  get price() {
    return this._data.price
  }
  get reputationScore() {
    return this._data.reputationScore
  }
  get description() {
    return this._data.description
  }
  get totalPurchase() {
    return this._data.totalPurchase
  }
  get codebase() {
    return this._data.codebaseRef
  }
  get language() {
    return this._data.languageRef
  }
  get image() {
    this._data.image
  }
  get user() {
    this._data.userRef
  }
  get inputType() {
    this._data.inputType
  }
  get outputType() {
    this._data.outputType
  }

  get status() {
    return this._data.status
  }

  toJSON() {
    return {
      id: this._id, // ID of Document stored in Cloud Firestore
      createdAt: this._createdAt, // ISO String format date of Document's creation.
      updatedAt: this._updatedAt, // ISO String format date of Document's last update.
      title: this.title,
      slug: this.slug,
      githubRepoUrl: this.githubRepoUrl,
      codebaseRef: this.codebaseRef,
      languageRef: this.languageRef,
      reputationScore: this.reputationScore,
      totalPurchase: this.totalPurchase,
      description: this.description,
      inputType: this.inputType,
      outputType: this.outputType,
      price: this.price,
      image: this.image,
      userRef: this.userRef,
      status: this.status
    }
  }
}

module.exports = pluginSchema
module.exports = PluginModel