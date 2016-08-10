const Promise = require("bluebird")
const Poll = require('../models/poll')
const User = require('../models/user')
const _ = require('lodash')
const appUrl = process.env.APPURL
const errorResponse = require('../utils/errorResponse')

/**
 * POST /poll
 * Create new poll for user
 */
exports.createPoll = function(req, res, next) {
  req.assert('question', 'Question cannot be blank').notEmpty()
  req.assert('options', 'Options cannot be blank').notEmpty()
  req.assert('createdBy', 'createdBy cannot be blank').notEmpty()

  var errors = req.validationErrors()

  if (errors) return res.status(400).send(errors)

  const newPoll = new Poll({
    question: req.body.question,
    options: req.body.options,
    createdBy: req.body.createdBy
  })
  .save()
  .then((poll) => res.send({message: 'Poll created.', poll}) )
  .catch((err) => {
    console.log(err)
    return errorResponse(req, res, 'standardError')
  })
}

/**
 * getPoll
 * return a poll given it's id
 */
exports.readPoll = function(req, res, next) {
  Poll.findById(req.params.id).lean()
  .populate('createdBy', 'firstName lastName').exec()
  .then((poll) => {
    if (!poll) return res.status(400).send({message: 'Poll Not Found'})
    if (poll.voters.some((voterip) => voterip === req.clientIp)) {
      let hasVoted = Object.assign({}, poll, { hasVoted: true})
      return res.send({poll: hasVoted})
    }
    let hasNotVoted = Object.assign({}, poll, { hasVoted: false })
    return res.send({poll: hasNotVoted})
  })
  .catch((err) => {
    console.log(err)
    return errorResponse(req, res, 'standardError')
  })
}

/**
 * getLatest20Poll
 * return a poll given it's id
 */
exports.getLatest20Poll = function(req, res, next) {
  Poll.find({}).limit(20).sort({createdAt: 'desc'}).lean()
  .populate('createdBy', 'firstName lastName').exec()
  .then((polls) => {
    return res.send(polls)
  })
  .catch((err) => {
    console.log(err)
    return errorResponse(req, res, 'standardError')
  })
}

/**
 * updatePoll (secure route only logged in user can update via this route)
 * return an updated poll given it's id
 */
exports.updatePoll = function(req, res, next) {
  Poll.findByIdAndUpdate(req.params.id, {
    $set: req.body,
  }, {new: true})
  .then((poll) => {
    if (!poll) return res.status(400).send({message: 'Poll Not Found'})
    return res.send({poll, message: 'Your vote was submmited'})
  })
  .catch((err) => {
    console.log(err)
    return errorResponse(req, res, 'standardError')
  })
}

/**
 * vote route
 * return an voted poll given it's id
 */
exports.vote = function(req, res, next) {
  req.assert('options', 'Options object cannot be blank').notEmpty()

  var errors = req.validationErrors()

  if (errors) return res.status(400).send(errors)

  Promise.coroutine(function* () {
    const poll = yield Poll.findById(req.params.id).lean().exec()
    const hasVoted = poll.voters.some((voterip) => voterip === req.clientIp)

    if (hasVoted) {
      return res.status(403).send({message: 'You have already voted'})
    }

    // lesson: To update nested embedded documents you use the primary _id, then the arrayname._id and so on.
    // use arrayname.$.fieldname the $ is the placeholder of the index of the array you found.
    const updatedPoll = yield Poll.findOneAndUpdate(
      {_id: req.params.id, "options._id": req.body.options._id},
      {
        $inc: {"options.$.votes": 1},
        $push: {voters: req.clientIp}
      },
      {new: true}
    ).lean().exec()
    if (!updatedPoll) return res.status(400).send({message: 'Poll Not Found'})
    return res.send({
      poll: Object.assign({}, updatedPoll, { hasVoted: true}),
      message: 'Your vote was submmited'
    })
  })()
  .catch((err) => {
    console.log(err)
    return errorResponse(req, res, 'standardError')
  })
}

/**
 * deletePoll the user is logged in and is the onwner of the poll
 * return an updated poll given it's id
 */
exports.deletePoll = function(req, res, next) {
  Promise.coroutine(function* () {
    const poll = yield Poll.findById(req.params.id).lean().exec()
    if (poll.createdBy.toString() !== req.user.id.toString()) {
      console.log('inside if')
      return res.status(403).send({message: 'You are not authorized to delete this poll'})
    }
    const removePoll = yield Poll.findByIdAndRemove(req.params.id).lean().exec()
    if (!removePoll) return res.status(400).send({message: 'Poll Not Found'})
    return res.send({poll: removePoll, message: 'Poll has been deleted'})
  })()
  .catch((err) => {
    console.log(err)
    return errorResponse(req, res, 'standardError')
  })
}