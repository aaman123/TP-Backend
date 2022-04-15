const { Model, schema, field } = require('firestore-schema-validator')

const codebaseSchema = schema({
    name: field('Name')
        .string()
        .trim()
})

class CodebaseModel extends Model {
    static get _collectionPath() {
        return 'Codebase'
    }
    static get _schema() {
        return codebaseSchema
    }

    static async getByName(name) {
        return this.getBy('name', name)
    }

    get collectionPathId() {
        return `${this._collectionPath}/${this._id}`
    }
    toJSON() {
        return {
            id: this._id, // ID of Document stored in Cloud Firestore
            createdAt: this._createdAt, // ISO String format date of Document's creation.
            updatedAt: this._updatedAt, // ISO String format date of Document's last update.
            name: this.name,
        }
    }
}

CodebaseModel.on('created', async (name) => {
    // eg. send Welcome Email to User
    console.log('MODEL : Codebase added to the database : ' + name)
})

// Fired when user is successfully updated and stored.
CodebaseModel.on('updated', async (name) => {
    // eg. log info to console
    console.log('MODEL : Codebase Updated in the database : ' + name)
})

// Fired when user is succsessfully deleted.
CodebaseModel.on('deleted', async (name) => {
    // eg. delete photos uploaded by User
    console.log('MODEL : Codebase deleted from the database : ' + name)
})

module.exports = codebaseSchema
module.exports = CodebaseModel