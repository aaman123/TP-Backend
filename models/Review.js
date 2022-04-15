const { Model, schema, field } = require('firestore-schema-validator')

const reviewSchema = schema({
  userRef: field('User')
    .string(),
  pluginRef: field('Plugin')
    .string(),
  docRating: field('Document Rating')
    .number(),
  codeRating: field('Code Rating')
    .number(),
  reviewMsg: field('Review Message')
    .string()
    .trim()
})

class ReviewModel extends Model {
  static get _collectionPath() {
    return 'Review'
  }
  static get _schema() {
    return reviewSchema
  }

  // TODO : add better getters.
  // static async getByUser(user) {
  //   return await this.getBy('user', user)
  // }
  // static async getByPlugin(plugin) {
  //   return await this.getBy('plugin', plugin)
  // }

  get codeRating() {
    return this._data.codeRating
  }
  get docRating() {
    return this._data.docRating
  }
  get reviewMsg() {
    return this._data.reviewMsg
  }

  toJSON() {
    return {
      id: this._id, // ID of Document stored in Cloud Firestore
      createdAt: this._createdAt, // ISO String format date of Document's creation.
      updatedAt: this._updatedAt, // ISO String format date of Document's last update.
      userRef: this.userRef,
      pluginRef: this.pluginRef,
      codeRating: this.codeRating,
      docRating: this.docRating,
      reviewMsg: this.reviewMsg,
    }
  }

}

module.exports = reviewSchema
module.exports = ReviewModel
