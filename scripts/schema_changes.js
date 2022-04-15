const admin = require("firebase-admin");

module.exports = async function() {
    let db = admin.firestore();

    await db.collection('Plugin')
    .get()
    .then( (results) => {
        results.forEach( async(innerResult) => {
            if ( innerResult.get('githubRepoUrl') ) {
                let gitRepoUrl = innerResult.data().githubRepoUrl
                await db.collection('Plugin').doc(innerResult.id).update({
                    hostedOn : "Github",
                    repoUrl: gitRepoUrl,
                    githubRepoUrl: admin.firestore.FieldValue.delete()
                })
            }
            else if ( innerResult.get('bitbucketRepoUrl')) {
                let bitRepoUrl = innerResult.data().bitbucketRepoUrl
                await db.collection('Plugin').doc(innerResult.id).update({
                    hostedOn: "Bitbucket",
                    repoUrl: bitRepoUrl,
                    bitbucketRepoUrl: admin.firestore.FieldValue.delete()
                })
            }
        })
    })
}
