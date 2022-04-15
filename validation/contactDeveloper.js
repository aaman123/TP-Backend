const Validator = require("validator");
const isEmpty = require("is-empty");
const validateCurrencyCode = require("validate-currency-code");
const moment = require("moment-timezone");

/**
 * 
 * Post Data Example:
 * 
 * {
    isAvailable : true, - Check Done
    email : tester@tensorplace.io, - Check Done
    rate: 15.99, - Check Done
    currency : "usd", - Check Done
    timezone : "Asia/Kolkata", - Check Done
    details: [
    {
      start_time : "2019-08-30T22:00:00",
      end_time : "2019-08-30T22:30:00",
      duration : 30,
    },
    {
      start_time : "2019-08-30T20:00:00",
      end_time : "2019-08-30T20:30:00",
      duration : 30,
    },
    {
      start_time : "2019-08-30T21:00:00",
      end_time : "2019-08-30T21:30:00",
      duration : 30,
    }
    ],
    savePreferences: true
}
 * 
 */
module.exports = function validateContactDeveloperInput(data) {
  let contactDeveloperErrors = {};
  if (data.isAvailable === true) {
    // Email checks
    data.email = !isEmpty(data.email) ? data.email : "";

    if (Validator.isEmpty(data.email)) {
      contactDeveloperErrors.email = "Email field is required";
    } else if (!Validator.isEmail(data.email)) {
      contactDeveloperErrors.email = "Email is invalid";
    }

    // Rate Checks
    data.rate = !isEmpty(data.rate) ? data.rate : "";

    if (!Validator.isDecimal(String(data.rate), { decimal_digits: "2,3" })) {
      contactDeveloperErrors.rate =
        "Only 2-3 Decimal digits allowed in Rate field.";
    }

    // Currency Checks
    data.currency = !isEmpty(data.currency) ? data.currency : "";
    if (Validator.isEmpty(String(data.currency))) {
      contactDeveloperErrors.currency = "Currency Field is required.";
    } else if (!validateCurrencyCode(String(data.currency).toUpperCase())) {
      contactDeveloperErrors.currency = "Currency Code Not valid.";
    }

    if (!moment.tz.zone(data.timezone)) {
      contactDeveloperErrors.timezone = "Timezone not valid.";
    }

    data.details = data.details?.length >= 0 ? data.details : [];
    if (data.details.length < 1) {
      contactDeveloperErrors.details = "Details Empty!";
    }

    if (
      data.details.some(
        (item) =>
          /^(?:[1-9]\d{3}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1\d|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[1-9]\d(?:0[48]|[2468][048]|[13579][26])|(?:[2468][048]|[13579][26])00)-02-29)T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(
            item.start_time
          ) == false
      )
    ) {
      contactDeveloperErrors.details = {
        start_time: "Start Time invalid.",
      };
    }

    if (
      data.details.some(
        (item) =>
          /^(?:[1-9]\d{3}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1\d|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[1-9]\d(?:0[48]|[2468][048]|[13579][26])|(?:[2468][048]|[13579][26])00)-02-29)T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(
            item.end_time
          ) == false
      )
    ) {
      contactDeveloperErrors.details = {
        end_time: "End Time invalid.",
      };
    }

    if (
      data.details.some((item) => !Validator.isNumeric(String(item.duration)))
    ) {
      contactDeveloperErrors.details = {
        duration: "Duration not valid!",
      };
    }
  }
  return {
    contactDeveloperErrors,
    isValid: isEmpty(contactDeveloperErrors),
  };
};
