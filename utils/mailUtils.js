const nodemailer = require('nodemailer')

let transporter = nodemailer.createTransport({
    host: "smtp.zoho.in",
    secure: true,
    port: 465,
    auth: {
        user: `${process.env.tensorPlaceMailId}`,
        pass: `${process.env.tensorPlaceMailPassword}`,
    },
});

/**
 * Description : Approve Request Mail, can only be done by Seller
 * Called in : api/controllers/contactDeveloper-api.js
 * Developer : Aman Sutariya
 * Email Used : Check ENV File.
 */
module.exports.meeting_decision_request_buyer = (buyerDetails, pluginDetails, requestId, requestDetails, message) => {
    let mailOptions = {
        from: process.env.tensorPlaceMailId,
        to: buyerDetails.email,
        subject: `Hey ${buyerDetails.userName || buyerDetails.firstName || buyerDetails.lastName}, you have an update on the meeting request!`,
        text: "This is a message, for updation on request on TensorPlace.",
        html: `<h1>Hey, ${buyerDetails.userName || buyerDetails.buyerDetails || buyerDetails.lastName}! <p>You have an update on the meeting .</p></h1>
        <p>Request  Details:</p>
        <ul>
            <li>Request ID: ${requestId}</li>
            <li>Meeting Time : ${requestDetails.timeslot}</li>
            <li>Meeting Timezone : ${requestDetails.timezone}</li>
            <li>Plugin Details : ${pluginDetails.title}</li>
            <li>Message: ${message ? message : "No message."}</li>
        </ul>
        <p>TimeSlots and Timezone Details</p>
        <footer>Copyright © 2021 TensorPlace. All Rights Reserved</footer>`
    }
    transporter.sendMail(mailOptions, (err, res) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log(`Sent mail to ${emailMask(buyerDetails.email)}`)
        }

    })

}

/**
 * Description : Create meeting Request Mail
 * Called in : api/controllers/contactDeveloper-api.js
 * Developer : Aman Sutariya
 * Email Used : Check ENV File.
 */
module.exports.create_meeting_request = (buyerDetails, sellerDetails, pluginDetails, requestDetails, timeslotForTimezone, requestId, jwt_token) => {
    let mailOptions = {
        from: process.env.tensorPlaceMailId,
        to: sellerDetails.email,
        subject: `Hey ${sellerDetails.userName || sellerDetails.firstName || sellerDetails.lastName}, you have one meeting request!`,
        text: "This is a message, for getting a meeting request on TensorPlace.",
        html: `<h1>Hey, ${sellerDetails.userName || sellerDetails.firstName || sellerDetails.lastName}! <p>You have a meeting request.</p></h1>
        <p>Request  Details:</p>
        <ul>
            <li>Request ID: ${requestId}</li>
            <li>Plugin Details : ${pluginDetails.title}</li>
            <li>Buyer Details : </li>
            <ul>
                <li>Username : ${buyerDetails.userName}</li>
                <li>Profession :${buyerDetails.profession ? buyerDetails.profession : "Not Provided"}</li>
                <li>Industry : ${buyerDetails.industry ? buyerDetails.industry : "Not Provided"}</li>
                <li>Developer Score :${buyerDetails.developerScore}</li> 
                <li>Avg. Developer Ratings : ${buyerDetails.avgDevRatings}</li>
                <li>Years of Experience :${buyerDetails.yearsOfExperience ? buyerDetails.yearsOfExperience : "Not Provided"}</li> 
            </ul>
            <li>Agreed To Pay for Extended Meeting: ${requestDetails.agreedToPayForExtendedMeeting}</li>
            <li>Message from the User: ${requestDetails.message ? requestDetails.message : "No message."}</li>
        </ul>
        <p>TimeSlots and Timezone Details</p>
        <ul>
            <li>Timezone : ${requestDetails.timezone}</li>
            <li>Timeslot : ${timeslotForTimezone}</li>
        </ul>
        <br>
        <p> Approve/Reject the Meeting: </p>
        <br>
        <a href="${process.env.node_url}/contactDeveloper/request/confirm/${requestId}/${jwt_token}"><button name="approve" type="submit" >Approve</button></a>
        <a href="${process.env.node_url}/contactDeveloper/request/reject/${requestId}/${jwt_token}"><button name="reject" type="submit" >Reject</button></a>
        <footer>Copyright © 2021 TensorPlace. All Rights Reserved</footer>`
    }

    transporter.sendMail(mailOptions, (err, res) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log(`Sent mail to ${emailMask(sellerDetails.email)}`)
        }

    })


}

/**
 * Description : Auto Mail sender on successful approval of repo
 * Called in : api/controllers/contactDeveloper-api.js
 * Developer : Aman Sutariya
 * Email Used : Check ENV File.
 */

module.exports.add_availability = (userDetails, availabilityDetails, message) => {
    if (availabilityDetails.isAvailable) {
        let details_html_template = "";
        let count = 1
        availabilityDetails.details.forEach(detail => {
            let timeslotCount = `<li>Timeslot ${count}</li>
            <ul><li>Timezone : ${detail.timezone}</li>
            <li>Start Time: ${detail.start_time}</li>
            <li>Start Time: ${detail.end_time}</li>
            <li>Duration: ${detail.duration}</li></ul>`
            details_html_template += timeslotCount
            timeslotCount = ""
            entire = ""
            count = count + 1
        })

        let mailOptions = {
            from: process.env.tensorPlaceMailId,
            to: userDetails.email,
            subject: `Hey ${userDetails.userName || userDetails.firstName || userDetails.lastName}, you  added your Availability Details!`,
            text: "This is a message, for adding Contacting availability details on TensorPlace.",
            html: `<h1>Hey, ${userDetails.userName || userDetails.firstName || userDetails.lastName}! <p>You added your Availability Details.</p></h1>
            <p>Details:</p>
            <ul>
                <li>Available for Contacting : ${availabilityDetails.isAvailable}</li>
                <li>Rate per 0.5 hrs : ${availabilityDetails.rate}</li>
                <li>Currency: ${String(availabilityDetails.currency).toUpperCase()}</li>
                <li>Email for contact : ${availabilityDetails.email}</li>
                <li>Save Preferences: ${availabilityDetails.savePreferences}</li>
            </ul>
            <p>TimeZone & Slots Details</p>
            <ul>
            <p>${details_html_template}</p>
            </ul>
            <p>${message}</p>
            <footer>Copyright © 2021 TensorPlace. All Rights Reserved</footer>`
        }
    }

    else {
        let mailOptions = {
            from: process.env.tensorPlaceMailId,
            to: userDetails.email,
            subject: `Hey ${userDetails.userName || userDetails.firstName || userDetails.lastName}, you  added your Availability Details!`,
            text: "This is a message, for adding Contacting availability details on TensorPlace.",
            html: `<h1>Hey, ${userDetails.userName || userDetails.firstName || userDetails.lastName}! <p>You added your Availability Details.</p></h1>
            <p>Details:</p>
            <ul>
                <li>Available for Contacting : ${availabilityDetails.isAvailable}</li>
            </ul>
            <p>${message}</p>
            <footer>Copyright © 2021 TensorPlace. All Rights Reserved</footer>`
        }
    }


    transporter.sendMail(mailOptions, (err, res) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log(`Sent mail to ${emailMask(sellerDetails.email)}`)
        }

    })
}


/**
 * Description : Auto Mail sender on successful approval of repo
 * Called in : routes/user.js
 * Developer : Aman Sutariya
 * Email Used : Check ENV File.
 */
module.exports.repo_approved = (repoDetails, sellerDetails) => {
    let mailOptions = {
        from: process.env.tensorPlaceMailId,
        to: sellerDetails.email,
        subject: `Hey ${sellerDetails.userName || sellerDetails.firstName || sellerDetails.lastName}, your Repository named ${repoDetails.title} is approved to be on TensorPlace! Well Done!`,
        text: "This is a test message, for acceptance of repo on TensorPlace.",
        html: `<h1>Hey, ${sellerDetails.userName || sellerDetails.firstName || sellerDetails.lastName}! <p>your Repository named ${repoDetails.title} is approved.</p></h1>
        <p>Details for ${repoDetails.title}</p>
        <ul>
            <li>Description : ${repoDetails.description}</li>
            <li>Price : ${repoDetails.price}</li>
            <li>Input File Type : ${repoDetails.inputType}</li>
            <li>Output File Type : ${repoDetails.outputType}</li></ul>
        <p>Current Metrics for your Repository.</p>
        <ul>
            <li>Reputation : ${repoDetails.reputationScore}</li>
            <li>Avg. Ratings : ${repoDetails.avgRatings}</li>
        </ul>
        <footer>Copyright © 2021 TensorPlace. All Rights Reserved</footer>`
    }

    transporter.sendMail(mailOptions, (err, res) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log(`Sent mail to ${emailMask(sellerDetails.email)}`)
        }

    })
}

/**
 * Description : E-mail Masker
 * Called in : utils/mailUtils.js
 * Developer : Aman Sutariya
 * Email Used : Check ENV File.
 * Gist Link : https://gist.github.com/gabrielfroes/282b2f38c7888eaacfc07ca3997e72fa
 */
function emailMask(email) {
    let maskedEmail = email.replace(/([^@\.])/g, "*").split('');
    let previous = "";
    for (i = 0; i < maskedEmail.length; i++) {
        if (i <= 1 || previous == "." || previous == "@") {
            maskedEmail[i] = email[i];
        }
        previous = email[i];
    }
    return maskedEmail.join('');
}


/**
 * Description : Auto Mail Sender on Adding a Review to repository
 * Called in : api/controllers/review-api.js
 * Developer : Aman Sutariya
 * Email Used : Check ENV File.
 */
module.exports.review_added = (buyerDetails, repoDetails, reviewDetails) => {
    let mailOptions = {
        from: process.env.tensorPlaceMailId,
        to: buyerDetails.email,
        subject: `Hey ${buyerDetails.userName || buyerDetails.firstName || buyerDetails.lastName}, you recently added a review for ${repoDetails.title} !`,
        text: "This is a test message, Thanks for Adding a Review on TensorPlace.",
        html: `<h1>Hey, ${buyerDetails.userName || buyerDetails.firstName || buyerDetails.lastName}! <p>You recently added a review for ${repoDetails.title} </p></h1>
        <p>Review Details for ${repoDetails.title}</p>
        <ul>
            <li>Code Rating : ${reviewDetails.codeRating}</li>
            <li>Documentation Rating : ${reviewDetails.docRating}</li>
            <li>Dev Rating : ${reviewDetails.devRating}</li>
            <li>Review Message : ${reviewDetails.reviewMsg}</li></ul>
        <p>Repository Detail.</p>
        <ul>
            <li>Title : ${repoDetails.title}</li>
            <li>Description : ${repoDetails.description}</li>
        </ul>
        <footer>Copyright © 2021 TensorPlace. All Rights Reserved</footer>`
    }

    transporter.sendMail(mailOptions, (err, res) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log(`Sent mail to ${emailMask(buyerDetails.email)}`)
        }

    })
}

/**
 * Description : Auto Mail Sender on Updation of repository Details
 * Called in : api/controllers/plugin-api.js
 * Developer : Aman Sutariya
 * Email Used : Check ENV File.
 */
module.exports.update_repo_details = (userDetails, repoDetails) => {

    let mailOptions = {
        from: process.env.tensorPlaceMailId,
        to: userDetails.email,
        subject: `Hey ${userDetails.userName || userDetails.firstName || userDetails.lastName}, you recently updated details for ${repoDetails.title} !`,
        text: "This is a test message, Thanks for Registering on TensorPlace via GitHub.",
        html: `<h1>Hey, ${userDetails.userName || userDetails.firstName || userDetails.lastName}! <p>You recently updated details for ${repoDetails.title} </p></h1>
        <p>Updated Details for ${repoDetails.title}</p>
        <ul>
            <li>Description : ${repoDetails.description}</li>
            <li>Price : ${repoDetails.price}</li>
            <li>Input File Type : ${repoDetails.inputType}</li>
            <li>Output File Type : ${repoDetails.outputType}</li></ul>
        <p>Current Metrics for your Repository.</p>
        <ul>
            <li>Acceptance Status: ${repoDetails.status}</li>
            <li>Reputation : ${repoDetails.reputationScore}</li>
            <li>Avg. Ratings : ${repoDetails.avgRatings}</li>
        </ul>
        <footer>Copyright © 2021 TensorPlace. All Rights Reserved</footer>`
    }

    transporter.sendMail(mailOptions, (err, res) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log(`Sent mail to ${emailMask(userDetails.email)}`)
        }

    })
}

/**
 * Description : Auto Mail Sender on New GitHub Login
 * Called in : routes/users.js
 * Developer : Aman Sutariya
 * Email Used : Check ENV File. */

module.exports.register_github = (userDetails) => {
    let mailOptions = {
        from: process.env.tensorPlaceMailId,
        to: userDetails.email,
        subject: `Welcome ${userDetails.login || userDetails.name.split(' ')[0] || userDetails.name.split(' ')[1]}!`,
        text: "This is a test message, Thanks for Registering on TensorPlace via GitHub.",
        html: `<h1>Thanks for Registering via GitHub, ${userDetails.login || userDetails.name.split(' ')[0] || userDetails.name.split(' ')[1]}!</h1><footer>Copyright © 2021 TensorPlace. All Rights Reserved</footer>`
    }

    transporter.sendMail(mailOptions, (err, res) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log(`Sent mail to ${emailMask(userDetails.email)}`)
        }

    })
}


/**
 * Description : Auto Mail Sender on New BitBucket Login
 * Called in : Implementation Left
 * Developer : Aman Sutariya
 * Email Used : Check ENV File. */

// Implementation Left, as Bitbucket login is still
// sending the data to MongoDB.
module.exports.register_bitbucket = (userDetails) => {
    let mailOptions = {
        from: process.env.tensorPlaceMailId,
        to: userDetails.email,
        subject: `Welcome ${userDetails.firstName || userDetails.lastName || userDetails.userName}`,
        text: "This is a test message, Thanks for Registering on TensorPlace via Bitbucket.",
        html: `<h1>Thanks for Registering, ${userDetails.firstName || userDetails.lastName || userDetails.userName}!</h1><footer>Copyright © 2021 TensorPlace. All Rights Reserved</footer>`
    }

    transporter.sendMail(mailOptions, (err, res) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log('Mail Sent Successfully!')
        }
    })
}

/*
 * Description : Auto Mail Sender on New User Registration
 * Called in : api/controllers/users-api.js
 * Developer : Aman Sutariya
 * Email Used : Check ENV File. 
*/
module.exports.register_normal = (userDetails) => {
    let mailOptions = {
        from: process.env.tensorPlaceMailId,
        to: userDetails.email,
        subject: `Welcome ${userDetails.firstName || userDetails.lastName || userDetails.userName}`,
        text: "This is a test message, Thanks for Registering on TensorPlace.",
        html: `<h1>Thanks for Registering, ${userDetails.firstName || userDetails.lastName || userDetails.userName}!</h1><footer>Copyright © 2021 TensorPlace. All Rights Reserved</footer>`
    }

    transporter.sendMail(mailOptions, (err, res) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log(`Mail Sent to ${emailMask(userDetails.email)} Successfully!`)
        }
    })
}


module.exports.publish_repo = (userDetails, repoDetails) => {
    let mailOptions = {
        from: process.env.tensorPlaceMailId,
        to: userDetails.email,
        subject: `Hey ${userDetails.userName || userDetails.firstName || userDetails.lastName}, You recently published ${repoDetails.repository.name} to Tensorplace !`,
        text: "This is a test message, Thanks for publishing to TensorPlace via Github.",
        html: `<h1>Hey, ${userDetails.userName || userDetails.firstName || userDetails.lastName}! <p>You recently published ${repoDetails.repository.name} to Tensorplace ! </p></h1>
        <p>Published Repo Details</p>
        <ul>
            <li>Name : ${repoDetails.repository.name}</li>
            <li>Description : ${repoDetails.repository.description}</li>
            <li>Github Repo URL : ${repoDetails.repository.html_url}</li></ul>
        <footer>Copyright © 2021 TensorPlace. All Rights Reserved</footer>`
    }

    transporter.sendMail(mailOptions, (err, res) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log(`Mail sent successfully`);
        }
    })
}

module.exports.purchase_mail_shoot_to_buyer = (buyerDetails, repoDetails) => {
    let mailOptionsBuyer = {
        from: process.env.tensorPlaceMailId,
        to: buyerDetails.email,
        subject: `Hey ${buyerDetails.userName || buyerDetails.firstName || buyerDetails.lastName}, You recently purchased ${repoDetails.title} from Tensorplace`,
        text: "This is a test message, Thanks for purchasing from TensorPlace.",
        html: `<h1>Hey, ${buyerDetails.userName || buyerDetails.firstName || buyerDetails.lastName}! <p>You recently purchased ${repoDetails.title} from Tensorplace ! </p></h1>
        <p>Purchased Repo Details</p>
        <ul>
            <li>Name : ${repoDetails.title}</li>
            <li>Description : ${repoDetails.description}</li>
            <li>Price : ${repoDetails.price}</li>
        </ul>
        <footer>Copyright © 2021 TensorPlace. All Rights Reserved</footer>`
    }

    transporter.sendMail(mailOptionsBuyer, (err, res) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log(`Mail sent to successfully`);
        }
    })


}

module.exports.purchase_mail_shoot_to_seller = (sellerDetails, repoDetails) => {
    let mailOptionsSeller = {
        from: process.env.tensorPlaceMailId,
        to: sellerDetails.email,
        subject: `Hey ${sellerDetails.userName || sellerDetails.firstName || sellerDetails.lastName}, Your repository ${repoDetails.title} was recently purchased. !`,
        text: "This is a test message, Thanks for selling using TensorPlace.",
        html: `<h1>Hey, ${sellerDetails.userName || sellerDetails.firstName || sellerDetails.lastName}! <p>Your repository ${repoDetails.title} was recently purchased.</p></h1>
        <p>Published Repo Details</p>
        <ul>
            <li>Name : ${repoDetails.title}</li>
            <li>Description : ${repoDetails.description}</li>
            <li>Price : ${repoDetails.price}</li>
        </ul>
        <footer>Copyright © 2021 TensorPlace. All Rights Reserved</footer>`
    }

    transporter.sendMail(mailOptionsSeller, (err, res) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log(`Mail sent successfully`);
        }
    })
}