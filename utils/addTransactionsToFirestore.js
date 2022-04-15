const admin = require('firebase-admin')
const axios = require('axios')


/*
API for Adding Blockchain Transactions on Firebase
Transaction Types : Update Repo Score, Add Buyer Info, Create Asset
input : pluginId, userId, data
output : Data stored on Firestore.
Developer : Aman Sutariya
*/
module.exports.addTransactionsToFirestore = async (pluginId, userId, data) => {

    let db = admin.firestore()

    const transactionRef = db.collection('BlockchainTransactions').doc(pluginId)

    //Output for TxID is not similar to that of Block Number and we need the Block Number.
    const txId = data.txId
    const blockNumber = data.blockNumber
    let previous_hash = ""
    let data_hash = ""
    let timestamp = ""


    if (blockNumber) {
        axios.get(`${process.env.blockchain_url}/api/block?num=${blockNumber}`)
            .then(async (response) => {

                previous_hash = response.data.header.previous_hash
                data_hash = response.data.header.data_hash
                timestamp = response.data.data.data[0].payload.header.channel_header.timestamp

                data.data_hash = data_hash
                data.previous_hash = previous_hash
                data.timestamp = timestamp
                data.userId = userId


                dataToBeAdded = {
                    pluginId: pluginId,
                    transactions: admin.firestore.FieldValue.arrayUnion(data)
                }
                await transactionRef.set(dataToBeAdded, { merge: true })

                console.log("Added Transaction on Firebase")
            })
            .catch(async (e) => {
                data.userId = userId

                dataToBeAdded = {
                    pluginId: pluginId,
                    transactions: admin.firestore.FieldValue.arrayUnion(data)
                }
                await transactionRef.set(dataToBeAdded, { merge: true })

                console.log("Added Transaction on Firebase without Previous Hash")
            })

    }

    else {
        data.userId = userId

        dataToBeAdded = {
            pluginId: pluginId,
            transactions: admin.firestore.FieldValue.arrayUnion(data)
        }
        await transactionRef.set(dataToBeAdded, { merge: true })

        console.log("Added Transaction on Firebase without Previous Hash")
    }

}
