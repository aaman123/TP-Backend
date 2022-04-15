const admin = require('firebase-admin');
const axios = require('axios')
const transaction = require('./addTransactionsToFirestore')

function updateReputationScoreBlockchain(reputationScore, pluginDetails, pluginRef, pluginId) {
    // Updating on BlockChain
    axios.post(`${process.env.blockchain_url}/api/login`, {
        password: `${process.env.blockchain_secret}`
    })
        .then((response) => {
            axios.post(`${process.env.blockchain_url}/api/UpdateRepoScore`,
                {
                    repo_name: `${pluginDetails.title}`,
                    new_repo_score: `${reputationScore}`
                }, {
                headers: {
                    Authorization: 'Bearer ' + response.data.token
                }
            })
                .then((response_block) => {

                    let txnId = response_block.data.errorCode.txId
                    let blockHeight = response_block.data.errorCode.blockHeight

                    if (txnId === undefined && blockHeight === undefined) {
                        console.log('Transaction Failed due to concurrent request on same block!')
                    }
                    else {
                        //Updating latest Transaction ID
                        // pluginRef.update({
                        //     transactionId: txnId,
                        //     blockNumber: blockHeight
                        // })

                        // Saving Transactions on Firestore
                        transaction.addTransactionsToFirestore(pluginId,
                            "",
                            {
                                txId: txnId,
                                blockNumber: blockHeight,
                                transactionType: "Update Reputation Score",
                                data: {
                                    repo_name: `${pluginDetails.title}`,
                                    new_repo_score: `${reputationScore}`
                                }
                            })
                    }

                })
                .catch((e) => {
                    console.log(e)
                })
        })
        .catch((e) => {
            console.log("Error Logging in Blockchain!")
        })

}

/*
Usage : Will Update Reputation Score after a 
successful review/order
Input : Plugin Id (Firestore)
Output: Update Reputation Score on Blockchain
and Firestore, alongwith TransactionId and 
Block Number.
Developer: Aman Sutariya
*/
module.exports.update_reputation_score = async (pluginId) => {
    let db = admin.firestore();
    let pluginDetails = ""

    await db.collection('Plugin').doc(pluginId).get()
        .then((plugin) => {
            pluginDetails = plugin.data()
        })
    let pluginRef = await db.collection('Plugin').doc(pluginId)

    // Fetching latest value for Purchase Count and Avg rating
    let totalPurchase = pluginDetails.totalPurchase
    let avgRatings = pluginDetails.avgRatings

    // Evaluating Reputation Score
    let reputationScore = Math.log10(totalPurchase) * avgRatings * 0.5

    // Updating on firestore
    pluginRef.update({
        reputationScore: reputationScore
    })

    setTimeout(function () {
        updateReputationScoreBlockchain(reputationScore, pluginDetails, pluginRef, pluginId)
    }, 2000)





}