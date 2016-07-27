// responsible for create, update and delete account details of user
const Promise = require("bluebird")
const User = require('../models/user')
const generateJwtToken = require('../utils/generateJwtToken')
const _ = require('lodash')
const errorResponse = require('../utils/errorResponse')

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

  if (errors) return res.status(400).send(errors)

  Promise.coroutine(function* () {
    const user = yield User.findOne({ email: req.body.email }).exec()
    if (user) {
      if (user.google || user.github) return res.status(409).send({message: ['Email is in use, please log in']})

      return errorResponse(req, res, 'signupError')
    }
    const newUser = yield new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password
    }).save()
    let modUser = _.omit(newUser.toObject(), ['password', 'google', 'github'])
    res.send({ token: generateJwtToken(newUser), user: modUser })
  })()
  .catch((err) => {
    console.log(err)
    return errorResponse(req, res, 'standardError')
  })
}

/**
 * DELETE /account
 */
exports.accountDelete = function(req, res, next) {

  User.remove({ _id: req.user.id }, function(err) {
    if (err) return errorResponse(req, res, 'standardError')
    return res.send({ message: 'Your account has been permanently deleted.' })
  })
}

/**
 * GET /user_account  get current user account detail
 */
exports.accountGet = function(req, res, next) {
  User.findById({ _id: req.user.id }, function(err, user) {
    if (err) return errorResponse(req, res, 'standardError')

    let modUser = _.omit(user.toObject(), ['password', 'google', 'github'])
    return res.send({ user: modUser })
  })
}

/**
 * POST /user_account change user account detail
 */
exports.accountPut = function (req, res, next) {
  Promise.coroutine(function* () {
    // step 1: validate input
    if ('password' in req.body) {
      req.assert('password', 'Password must be at least 6 characters').len(6)
    } else {
      req.assert('email', 'Email is not valid').isEmail()
      req.assert('email', 'Email cannot be blank').notEmpty()
      req.sanitize('email').normalizeEmail({ remove_dots: false })
    }

    var errors = req.validationErrors()
    if (errors) return res.status(400).send(errors)

    // step 2: find and update user detail
    const user = yield User.findById(req.user.id).exec()

    if ('password' in req.body) {
      user.password = req.body.password
    } else {
      user.email = req.body.email
      user.firstName = req.body.firstName
      user.lastName = req.body.lastName
      user.gender = req.body.gender
      user.location = req.body.location
      user.website = req.body.website
      user.picture = req.body.picture
    }

    // step 3: save the updates to db and return the result as object
    const updatedUser = yield user.save()

    // step 4: send the response of the updates back to user
    if ('password' in req.body) return res.send({message: 'Your password has been changed.'})

    return res.send({
      user: _.omit(updatedUser.toObject(), ['password', 'google', 'github']),
      message: 'Your profile information has been updated.'
    })
  })()
  .catch((err) => {
    if (err.code === 11000) return errorResponse(req, res, 'accountPutError')
    return errorResponse(req, res, 'standardError')
  })
}