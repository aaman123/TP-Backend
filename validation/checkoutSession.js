const Validator = require('validator');
const isEmpty = require('is-empty');

/**
 *
 * Post Data Example:
 *{

 * "item_list":[
    {
      price: 'price_1IWGYxITBK9v2UhbDGbXrd6m',
      quantity: 1,
    },
    {
      price: 'price_1IWGYxITBK9v2UhbDGbXrd6m',
      quantity: 1,
    }
  ]
  "payment_method_types":[
    "card"
  ]
}
 *
 */

module.exports = function validateCreateCheckoutSession(data) {

  let errors = {

  };
  if (data.item_list.some(item => /^price_/.test(item.price) == false)) {
    errors.price = "Invalid Price Mentioned."
  }
  if (!data.payment_method_types.includes('card')) {
    errors.payment_method_types = "Only Type Card is supported as of now."
  }
  return {
    errors,
    isValid: isEmpty(errors)
  };
}