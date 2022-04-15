const axios = require('axios')
const admin = require('firebase-admin')

/*
Function for updating Developer Score based
on totalPurchaseList. The list will be the 
purchase count of the sold repositories. 
For eg. If user has 5 repository published
then totalPurchaseList will be : 
[5,2,5,6,1], each number corresponds to purchase
count of the purchased repos.
Input : totalPurchaseList
Output : h-index like DeveloperScore.
Developer : Aman Sutariya
*/
function getDeveloperScore(totalPurchaseList) {
    // Sorting the array is ascending order
    totalPurchaseList.sort(function (a, b) { return a - b })

    let result = 0
    // Looping over all the elements of the list
    for (let i = 0; i <= totalPurchaseList.length; i++) {
        result = totalPurchaseList.length - i

        if (result <= totalPurchaseList[i]) {
            return result
        }
    }
    return 0
}
/*
Usage : Will Update Developer Score after a 
successful review
Input : Developer ID
Output: Review on blockchain for the repoName
Developer: Aman Sutariya
*/
module.exports.update_developer_score = async (devID) => {
    let db = admin.firestore()
    let totalPurchaseList = []
    const devRef = db.collection('User').doc(devID)
    const soldRepos = await db.collection('Plugin')
        .where('userRef', '==', `User/${devID}`)
        .get()

    soldRepos.docs.forEach((doc) => {
        totalPurchaseList.push(doc.data().totalPurchase)
    })

    let newDeveloperScore = getDeveloperScore(totalPurchaseList)

    await devRef.update({
        developerScore: newDeveloperScore
    })

}
