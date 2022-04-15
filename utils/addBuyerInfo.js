const axios = require('axios')
const admin = require('firebase-admin')
const transaction = require('./addTransactionsToFirestore')

/*
Usage : Will add BuyerInfo to the Blockchain
after a successful review
Input : Buyer Collection (Firestore), reviewData
Output: Review on blockchain for the repoName
Developer: Aman Sutariya
*/
module.exports.addBuyerInfo = (buyer_details, reviewData) => {
    axios.post(`${process.env.blockchain_url}/api/login`, {
        password: `${process.env.blockchain_secret}`
    }).then((response) => {
        axios.post(`${process.env.blockchain_url}/api/AddBuyerInfo`,
            {
                repo_name: `${reviewData.repoName}`,
                buyers_name: `${buyer_details.userName}`,
                dict: {
                    codeRating: `${reviewData.codeRating}`,
                    docRating: `${reviewData.docRating}`,
                    devRating: `${reviewData.devRating}`,
                    reviewMsg: `${reviewData.reviewMsg}`
                }
            },
            {
                headers: {
                    Authorization: 'Bearer ' + response.data.token
                }
            })
            .then(async (response_block) => {

                let txnId = response_block.data.errorCode.txId
                let blockHeight = response_block.data.errorCode.blockHeight

                if (txnId === undefined && blockHeight === undefined) {
                    console.log('Transaction Failed due to concurrent request on same block!')
                }
                else {
                    // //Updating latest Transaction ID
                    // pluginRef.update({
                    //     transactionId: txnId,
                    //     blockNumber: blockHeight
                    // })
                    let db = admin.firestore()
                    let pluginRef = await db.collection('Plugin').where('title', '==', reviewData.repoName)

                    pluginRef.get()
                        .then((result) => {
                            let pluginId = ""
                            if (result.docs.length >= 1) {

                                result.forEach((doc) => {
                                    pluginId = doc.id
                                })

                                // Saving Transactions on Firestore

                                setTimeout(function () {
                                    transaction.addTransactionsToFirestore(pluginId,
                                        "",
                                        {
                                            txId: txnId,
                                            blockNumber: blockHeight,
                                            transactionType: "Add Buyer Information",
                                            data: {
                                                repo_name: `${reviewData.repoName}`,
                                                buyers_name: `${buyer_details.userName}`,
                                                dict: {
                                                    codeRating: `${reviewData.codeRating}`,
                                                    docRating: `${reviewData.docRating}`,
                                                    devRating: `${reviewData.devRating}`,
                                                    reviewMsg: `${reviewData.reviewMsg}`
                                                }
                                            }
                                        })
                                }, 2000)


                            }
                            else {
                                console.log("No Plugin Found!")
                            }
                        })



                }

            })
            .catch((e) => {
                // res.json({
                //     status: true,
                //     status_code: 500,
                //     message: "Asset Not created for the Plugin!"
                // })
                console.log(e)
            })
    })
        .catch((e) => {
            // res.json({
            //     status: true,
            //     status_code: 500,
            //     message: "Error Logging in!"
            // })
            console.log('Error Logging in.')
        })
}