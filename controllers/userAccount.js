// responsible for create, update and delete account details of user
const Promise = require("bluebird")
const crypto = Promise.promisifyAll(require('crypto'))
const nodemailer = require('nodemailer')
const axios = require('axios')
const qs = require('querystring')
const User = require('../models/user')
// const async = require('asyncawait/async')
// const await = require('asyncawait/await')
const generateJwtToken = require('../utils/generateJwtToken')
const _ = require('lodash')

/**
 * POST /signup Create new account with email
 */
exports.signupPost = function(req, res, next) {
  req.assert('firstName', 'First name cannot be blank').notEmpty()
  req.assert('lastName', 'Last name cannot be blank').notEmpty()
  req.assert('email', 'Email is not valid').isEmail()
  req.assert('email', 'Email cannot be blank').notEmpty()
  req.assert('password', 'Password must be at least 6 characters long').len(6)
  req.sanitize('email').normalizeEmail({ remove_dots: false })

  var errors = req.validationErrors()

  if (errors) {
    return res.status(400).send(errors)
  }

  User.findOne({ email: req.body.email })
  .then((user) => {
    if (user) {
      return res.status(400).send({ msg: 'The email address you have entered is already associated with another account.' })
    }
    user = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password
    })
    return user.save()
  })
  .then((user) => {
    const modUser = _.omit(user.toObject(), ['password', 'google'])
    return res.send({ token: generateJwtToken(user), user: modUser })
  })
  .catch((err) => {
    return res.status(500).send({ message: "We're experiencing technical difficulties at the moment. Please wait and try again later. Thank you." })
  })
}