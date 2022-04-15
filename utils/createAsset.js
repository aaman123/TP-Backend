const axios = require('axios')
const admin = require('firebase-admin')
const transaction = require('./addTransactionsToFirestore')


/*
Usage : Will create an asset to the Blockchain
after sending a collaboration mail
Input : Plugin Snapshot
Output: Will add the Plugin on Blockchain, and 
will add transactionId and BlockNumber in the
plugin collection
Developer: Aman Sutariya
*/
module.exports.create_asset = async(pluginRef) => {
    let db = admin.firestore()
    let pluginDetails = {}
    let sellerDetails = {}

    await db.collection('Plugin').doc(pluginRef.id).get()
        .then((plugin) => {
            pluginDetails = plugin.data()
        })
    await db.collection('User').doc(pluginDetails.userRef.split('/')[1]).get()
        .then((seller) => {
            sellerDetails = seller.data()
        })
    axios.post(`${process.env.blockchain_url}/api/login`, {
            password: `${process.env.blockchain_secret}`
        })
        .then((response) => {
            axios.post(`${process.env.blockchain_url}/api/CreateAsset`, {
                    repo_name: `${pluginDetails.title}`,
                    dev_rating: `${sellerDetails.developerScore}`,
                    repos_rating: `${pluginDetails.reputationScore}`
                }, {
                    headers: {
                        Authorization: 'Bearer ' + response.data.token
                    }
                })
                .then(async(response_block) => {
                    console.log('Creating Asset for ', pluginDetails.title, '...')
                    console.log('Transaction Id: ', response_block.data.errorCode.txId)
                    console.log('Block Number: ', response_block.data.errorCode.blockNumber)

                    let txnId = response_block.data.errorCode.txId
                    let blockHeight = response_block.data.errorCode.blockNumber

                    await db.collection('Plugin').doc(pluginRef.id).update({
                        transactionId: txnId,
                        blockNumber: blockHeight
                    })

                    // Saving Transactions on Firestore
                    transaction.addTransactionsToFirestore(pluginRef.id,
                        pluginDetails.userRef.split('/')[1], {
                            txId: txnId,
                            blockNumber: blockHeight,
                            transactionType: "Create Asset",
                            data: {
                                repo_name: `${pluginDetails.title}`,
                                dev_rating: `${sellerDetails.developerScore}`,
                                repos_rating: `${pluginDetails.reputationScore}`
                            }
                        })
                })

            .catch((e) => {
                console.log(e)
                console.log('Error Creating Asset!')
            })
        })
        .catch((e) => {
            console.log('Error Logging in Blockchain')

        })
}