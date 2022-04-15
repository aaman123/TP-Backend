const { Model, schema, field } = require('firestore-schema-validator')

const languageSchema = schema({
    name: field('Name')
        .string(),
    url: field('URL')
        .string()
        .trim(),
    bytes_written: field('Bytes Written')
        .nullable()
        .number()
})

class LanguageModel extends Model {
    static get _collectionPath() {
        return 'Language'
    }
    static get _schema() {
        return languageSchema
    }
    static async getByName(name) {
        return await this.getBy('name', name)
    }

    get url() {
        return this._data.url
    }
    get bytes_written() {
        return this._data.bytes_written
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
            url: this.url,
            bytes_written: this.bytes_written
        }
    }
}

module.exports = languageSchema
module.exports = LanguageModel