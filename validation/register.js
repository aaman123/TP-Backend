const Validator = require("validator");
const isEmpty = require("is-empty");

module.exports = function validateRegisterInput(data) {
  let errors = {};
  // Converts all empty fileds to empty string
  data.firstName = !isEmpty(data.firstName) ? data.firstName : "";
  data.lastName = !isEmpty(data.lastName) ? data.lastName : "";
  data.email = !isEmpty(data.email) ? data.email : "";
  data.password = !isEmpty(data.password) ? data.password : "";
  data.password2 = !isEmpty(data.password2) ? data.password2 : "";

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

  // Password checks
  if (Validator.isEmpty(data.password)) {
    errors.password = "Password field is required";
  } else if (!Validator.isLength(data.password, { min: 6, max: 30 })) {
    errors.password = "Password must be atleast 6 characters";
  } else if (
    !Validator.matches(
      data.password,
      "(?=.*[A-Z])(?=.*[!@#$&*])(?=.*[0-9])(?=.*[a-z]).{8}"
    )
  ) {
    errors.password =
      "Must contain at least one number, one special character and one uppercase and lowercase letter, and at least 8 or more characters";
  }

  if (Validator.isEmpty(data.password2)) {
    errors.password2 = "Confirm Password is required";
  } else if (!Validator.equals(data.password, data.password2)) {
    errors.password2 = "Password must match";
  }

  if (
    data.termsAccepted == "false" ||
    data.termsAccepted == false ||
    data.termsAccepted == undefined
  ) {
    errors.termsAccepted = "Terms must be accepted";
  }
  return {
    errors,
    isValid: isEmpty(errors),
  };
};
