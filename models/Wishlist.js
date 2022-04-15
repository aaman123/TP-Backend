const { Model, schema, field } = require('firestore-schema-validator')

const wishlistSchema = schema({
  userRef: field('User')
    .string(),
  pluginsRef: field('Plugins')
    .array()
})


class WishlistModel extends Model {
  static get _collectionPath() {
    return 'Wishlist'
  }
  static get _schema() {
    return wishlistSchema
  }
  // static async getByUser(user) {
  //   return await this.getBy('user', user)
  // }

  get collectionPathId() {
    return `${this._collectionPath}/${this._id}`
  }
  get plugins() {
    return this._data.pluginsRef
  }

  toJSON() {
    return {
      id: this._id, // ID of Document stored in Cloud Firestore
      createdAt: this._createdAt, // ISO String format date of Document's creation.
      updatedAt: this._updatedAt, // ISO String format date of Document's last update.
      userRef: this.userRef,
      pluginsRef: this.pluginsRef
    }
  }
}

module.exports = wishlistSchema
module.exports = WishlistModel