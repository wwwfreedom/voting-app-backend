const Promise = require('bluebird')
const User = require('../../models/user')
const _ = require('lodash')
const errorResponse = require('../../utils/errorResponse')
const Poll = require('../../models/poll')

/**
 * GET /user_account  get current user profile detail
 */
exports.findAllPollsByUser = function(req, res, next) {
  Promise.coroutine(function* () {
    const pollsByUser = yield Poll.find({createdBy: req.params.id})
    .populate('createdBy', 'firstName lastName')
    .sort({createdAt: 'desc'}).exec()

    if (pollsByUser.length === 0) {
      const userDetails = yield User.findById(req.params.id)
      return res.send(_.pick(userDetails, ['_id', 'firstName', 'lastName']))
    }

    return res.send(pollsByUser)
  })()
  .catch((err) => {
    console.log(err)
    return errorResponse(req, res, 'standardError')
  })
}