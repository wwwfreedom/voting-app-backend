const Promise = require("bluebird")
const User = require('../../models/user')
const _ = require('lodash')
const errorResponse = require('../../utils/errorResponse')

/**
 * PUT /user_profile change user detail
 */
exports.updatePassword = function (req, res, next) {
  Promise.coroutine(function* () {
    // step 1: validate user input
    req.assert('password', 'Password cannot be blank').notEmpty()
    req.assert('password', 'Password must be at least 6 characters').len(6)

    var errors = req.validationErrors()
    if (errors) return res.status(400).send(errors)

    // step 2: find and update user detail
    const user = yield User.findById(req.user.id).exec()

    user.password = req.body.password

    // step 3: save the updates to db and return the result as object
    const updatedUser = yield user.save()

    // step 4: send the response of the updates back to user
    return res.send({message: 'Your password has been changed.'})
  })()
  .catch((err) => {
    if (err.code === 11000) return errorResponse(req, res, 'accountPutError')
    return errorResponse(req, res, 'standardError')
  })
}