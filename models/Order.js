const { Model, schema, field } = require('firestore-schema-validator')

const orderSchema = schema({
  userRef: field('User')
    .string(),
  pluginsRef: field('Plugin')
    .array(),
  total: field('Total Amount to be paid.')   // TODO : Add methods to auto update these.
    .number(),
  paymentID: field('Transaction/Payment ID') // TODO : Should be added after the payment
    .string()
})

class OrderModel extends Model {
  static get _collectionPath() {
    return 'Order'
  }
  static get _schema() {
    return orderSchema
  }
  // TODO : Need better getters
  // static async getByUser(user) {
  //   return await this.getBy('user', user)
  // }
  get total() {
    return this._data.total
  }
  get paymentID() {
    return this._data.paymentID
  }

  toJSON() {
    return {
      id: this._id, // ID of Document stored in Cloud Firestore
      createdAt: this._createdAt, // ISO String format date of Document's creation.
      updatedAt: this._updatedAt, // ISO String format date of Document's last update.
      userRef: this.userRef,
      pluginsRef: this.pluginsRef,
      total: this.total,
      paymentID: this.paymentID
    }
  }
}

module.exports = orderSchema
module.exports = OrderModel