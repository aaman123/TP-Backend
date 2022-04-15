const Validator = require('validator');
const isEmpty = require('is-empty');
const validateCurrencyCode = require('validate-currency-code');
const validatorTimezone = require('timezone-validator')

/**
 * 
 * Post Data Example:
 * 
 *      {
            pluginRef : 'Plugin/UUIdForPlugin',
            timezone : "Asia/Kolkata",
            timeslot : "2020-01-02T12:30:00",
            duration : 30,
            agreedToPayForExtendedMeeting : true/false,
            message : "Message from the Buyer.",
            preferredPlatform : "Zoom/Google Meet/Teams",
        }
 * 
 */
module.exports = function validateCreateMeetingRequestInput(data) {
    let errors = {

    };
    let preferredPlatformList = ["Zoom"];
    // Timezone Checks
    if (!validatorTimezone(data.timezone)) {
        errors.timezone = "Timezone not valid!"
    }

    // Timeslot Checks
    if (/^(?:[1-9]\d{3}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1\d|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[1-9]\d(?:0[48]|[2468][048]|[13579][26])|(?:[2468][048]|[13579][26])00)-02-29)T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(data.timeslot) == false) {
        errors.timeslot = "Timeslot in invalid Format!"
    }

    // Duration Checks
    if (!Number.isInteger(data.duration)) {
        errors.duration = "Duration must be an Integer, in minutes."
    }

    // AgreedToPay Checks
    if (typeof data.agreedToPayForExtendedMeeting != "boolean") {
        errors.agreedToPayForExtendedMeeting = "This field should be Boolean!"
    }

    // Preferred Platform
    if (!preferredPlatformList.includes(data.preferredPlatform)) {
        errors.preferredPlatform = `Platform : ${data.preferredPlatform} is not supported yet.`
    }
    return {
        errors,
        isValid: isEmpty(errors)
    };

}