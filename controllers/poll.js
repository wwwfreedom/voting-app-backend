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
  req.assert('title', 'Title cannot be blank').notEmpty()
  req.assert('options', 'Options cannot be blank').notEmpty()
  req.assert('createdBy', 'createdBy cannot be blank').notEmpty()

  var errors = req.validationErrors()

  if (errors) return res.status(400).send(errors)

  const newPoll = new Poll({
    title: req.body.title,
    options: req.body.options,
    createdBy: req.body.createdBy
  })
  .save()
  .then(() => res.send({message: 'Poll created.'}) )
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
    if (!poll) return res.status(400).send('Item Not Found')
    return res.send({poll})
  })
  .catch((err) => {
    console.log(err)
    return errorResponse(req, res, 'standardError')
  })
}

/**
 * updatePoll
 * return an updated poll given it's id
 */
exports.updatePoll = function(req, res, next) {
  Poll.findByIdAndUpdate(req.params.id, req.body, {new: true})
  .then((poll) => {
    if (!poll) return res.status(400).send('Item Not Found')
    return res.send({poll})
  })
  .catch((err) => {
    console.log(err)
    return errorResponse(req, res, 'standardError')
  })
}

/**
 * deletePoll
 * return an updated poll given it's id
 */
exports.deletePoll = function(req, res, next) {
  Poll.findByIdAndRemove(req.params.id).exec()
  .then((poll) => {
    if (!poll) return res.status(400).send('Item Not Found')
    return res.send({message: 'Poll has been deleted'})
  })
  .catch((err) => {
    console.log(err)
    return errorResponse(req, res, 'standardError')
  })
}