const express = require('express')
const router = express.Router()
const controller = require('../api/controllers/contactDeveloper-api');
const passport = require('passport');
const rateLimit = require("express-rate-limit");

const contactDeveloperLimiter = rateLimit({
    windowMs: 30 * 60 * 1000, // 30 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests received from this IP, please try again after an 30 mins"
});

// Contact Developer Related APIs.

router.use(contactDeveloperLimiter)

router.post('/addAvailability', passport.authenticate("jwt", { session: false }), controller.add_availability);

router.get('/getAvailability', passport.authenticate("jwt", { session: false }), controller.get_availability);

router.put('/updateAvailability', passport.authenticate("jwt", { session: false }), controller.update_availability);

router.post('/createMeetingRequest', passport.authenticate("jwt", { session: false }), controller.create_meeting_request);


// Request Confirm/Reject Related APIs.
router.post('/request/confirm/:requestId/:access_token', controller.approve_request);

router.post('/request/reject/:requestId/:access_token', controller.reject_request);

// Calendly/Zoom Related APIs
// router.post('/meeting/create', controller.create_meeting);

// router.put('/meeting/update/:meetingid', controller.update_meeting);

// router.delete('/meeting/delete/:meetingid', controller.delete_meeting);

// router.get('/meeting/:meetingid', controller.get_meeting);

module.exports = router;