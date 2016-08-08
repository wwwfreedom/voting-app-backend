const mongoose = require('mongoose')
const bcrypt = require('bcrypt-nodejs')
const Promise = require("bluebird")
const shortid = require('shortid')

// Define user model
var schemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true
  }
}

var pollSchema = new mongoose.Schema({
  question: {type: String, maxlength: 1000},
  options: [{
    name: {type: String, maxlength: 1000},
    votes: {type: Number, default: 0}
  }],
  voters: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true
  },
  _id: {
    type: String,
    unique: true,
    default: shortid.generate
  }
}, schemaOptions)


// Create the model class
// create a collection name User using the pollSchema for each new documents
const ModelClass = mongoose.model('Poll', pollSchema)

// Export the model
module.exports = ModelClass