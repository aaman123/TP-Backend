const Validator = require("validator");
const isEmpty = require("is-empty");
const validateContactDeveloperInput = require("./contactDeveloper");

module.exports = function validateUserInput(data) {
  let errors = {};
  if (data.developerAvailability) {
    if (data.developerAvailability.isAvailable) {
      let { contactDeveloperErrors, isValid } = validateContactDeveloperInput(
        data.developerAvailability
      );
      if (!isValid) {
        errors.developerAvailability = contactDeveloperErrors;
      }
    } else {
      errors.developerAvailability = {
        isAvailable: "isAvailable field is required and should be Boolean.",
      };
    }
  } else {
    errors.developerAvailability =
      "developerAvailability field is required and should be Boolean.";
  }

  // Converts all empty fileds to empty string
  // data.name = !isEmpty(data.name) ? data.name : '';
  data.firstName = !isEmpty(data.firstName) ? data.firstName : "";
  data.lastName = !isEmpty(data.lastName) ? data.lastName : "";
  data.email = !isEmpty(data.email) ? data.email : "";
  data.paypalId = !isEmpty(data.paypalId) ? data.paypalId : "";

  // Name checks
  if (Validator.isEmpty(data.firstName)) {
    errors.firstName = "First name field is required";
  }

  if (Validator.isEmpty(data.lastName)) {
    errors.lastName = "Last name field is required";
  }

  // Email checks
  if (Validator.isEmpty(data.email)) {
    errors.email = "Email field is required";
  } else if (!Validator.isEmail(data.email)) {
    errors.email = "Email is invalid";
  }
  return {
    errors,
    isValid: isEmpty(errors),
  };
};
