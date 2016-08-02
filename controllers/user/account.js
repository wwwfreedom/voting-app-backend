const Promise = require("bluebird")
const User = require('../../models/user')
const generateJwtToken = require('../../utils/generateJwtToken')
const _ = require('lodash')
const errorResponse = require('../../utils/errorResponse')

/**
 * POST /login Create new account with email
 */
exports.create = function(req, res, next) {
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
exports.delete = function(req, res, next) {

  User.remove({ _id: req.user.id }, function(err) {
    if (err) return errorResponse(req, res, 'standardError')
    return res.send({ message: 'Your account has been permanently deleted.' })
  })
}