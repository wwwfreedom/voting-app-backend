const Promise = require("bluebird")
const User = require('../../models/user')
const _ = require('lodash')
const errorResponse = require('../../utils/errorResponse')

/**
 * GET /user_account  get current user profile detail
 */
exports.read = function(req, res, next) {
  User.findById({ _id: req.user.id }, function(err, user) {
    if (err) return errorResponse(req, res, 'standardError')

    let modUser = _.omit(user.toObject(), ['password', 'google', 'github'])
    return res.send({ user: modUser })
  })
}

/**
 * PUT /user_profile change user detail
 */
exports.update = function (req, res, next) {
  Promise.coroutine(function* () {
    // step 1: validate user input
    req.assert('email', 'Email is not valid').isEmail()
    req.assert('email', 'Email cannot be blank').notEmpty()
    req.sanitize('email').normalizeEmail({ remove_dots: false })

    var errors = req.validationErrors()
    if (errors) return res.status(400).send(errors)

    // step 2: find and update user detail
    const user = yield User.findById(req.user.id).exec()

    user.email = req.body.email
    user.firstName = req.body.firstName
    user.lastName = req.body.lastName
    user.gender = req.body.gender
    user.location = req.body.location
    user.website = req.body.website
    user.picture = req.body.picture

    // step 3: save the updates to db and return the result as object
    const updatedUser = yield user.save()

    // step 4: send the response of the updates back to user
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