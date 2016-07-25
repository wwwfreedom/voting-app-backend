const mongoose = require('mongoose')
const bcrypt = require('bcrypt-nodejs')

// Define user model
var schemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true
  }
}

var userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true, required: true},
  password: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  gender: String,
  location: String,
  website: String,
  picture: String,
  google: String,
  github: String,
}, schemaOptions)

/**
 * Password hash middleware (encrypt password)
 * the pre here means before saving this model run this function
 */

userSchema.pre('save', function (next) {
  // get access to user model
  const user = this
  // step 0: if password is not modified then return otherwise salt it
  if (!user.isModified('password')) { return next() }
  // step 1: generate a salt
  bcrypt.genSalt(10, (err, salt) => {
    if (err) { return next(err) }

    // step 2: hash (encrypt) our password using the salt
    bcrypt.hash(user.password, salt, null, (err, hash) => {
      if (err) { return next(err) }
      // overwrite plain text password with encrypted password
      user.password = hash
      // call next to proceed and save the model
      next()
    })
  })
})

// this method will be avail when ever you use this model
userSchema.methods.comparePassword = function (candidatePassword, callback) {
// this is a reference to user model, this.password is our hash + salt password
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    if (err) { return callback(err) }

    callback(null, isMatch)
  })
}

// Create the model class
// create a collection name User using the userSchema for each new documents
const ModelClass = mongoose.model('User', userSchema)

// Export the model
module.exports = ModelClass