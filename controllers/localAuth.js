const Promise = require("bluebird")
const randomBytes = Promise.promisify(require('crypto').randomBytes)
const generateJwtToken = require('../utils/generateJwtToken')
const User = require('../models/user')
const _ = require('lodash')
const nodemailer = require('nodemailer')
const moment = require('moment')
const appUrl = process.env.APPURL
const errorResponse = require('../utils/errorResponse')

/**
 * POST /login
 * Sign in with email and password
 */
exports.loginPost = function(req, res, next) {
  req.assert('email', 'Email is not valid').isEmail()
  req.assert('email', 'Email cannot be blank').notEmpty()
  req.assert('password', 'Password cannot be blank').notEmpty()
  req.sanitize('email').normalizeEmail({ lowercase: true, remove_dots: false })

  var errors = req.validationErrors()

  if (errors) {
    return res.status(400).send(errors)
  }

  Promise.coroutine(function* () {
    // step 1: find if user exist by that email
    const user = yield User.findOne({ email: req.body.email })
    if (!user) return errorResponse(res, req, 'loginPostError')

    // step 2: check whether if user has password store in db. For Oauth user.
    if (!user.password) return errorResponse(res, req, 'loginPostError')

    // step 3: if password is in db then check if password match
    const passwordIsMatch = yield user.comparePassword(req.body.password)
    if (!passwordIsMatch) return errorResponse(res, req, 'loginPostError')

    // step 4: check if user check remember me option and return the appropriate token with user detail
    const modUser = _.omit(user.toObject(), ['password', 'google', 'github'])
    if (req.body.rememberMe === 'true') return res.send({ token: generateJwtToken(user, '7 days'), user: modUser })

    res.send({ token: generateJwtToken(user), user: modUser })
  })()
  .catch((err) => {
    console.log(err)
    return errorResponse(res, req, 'standardError')
  })
}

/**
 * POST /forgot
 */
exports.forgotPasswordPost = function (req, res, next) {
  req.assert('email', 'Email is not valid').isEmail()
  req.assert('email', 'Email cannot be blank').notEmpty()
  req.sanitize('email').normalizeEmail({ lowercase: true, remove_dost: false })

  var errors = req.validationErrors()

  if (errors) return res.status(400).send(errors)

  Promise.coroutine(function* () {
    // step 1: find user if no user return with error message
    let user = yield User.findOne({ email: req.body.email }).exec()
    if (!user) return errorResponse(res, req, 'forgotPasswordPostError')

    // step 2: if user then generate reset token
    const token = yield randomBytes(16).then(buf => buf.toString('hex'))

    // step 3: update user with the reset token and the expiry date
    user.passwordResetToken = token
    user.passwordResetExpires = moment().utc().add(1, 'hour').valueOf()
    const updatedUser = yield user.save()

    // step4: setup mailer
    const transporter = nodemailer.createTransport({
      service: 'Mailgun',
      auth: {
        user: process.env.MAILGUN_USERNAME,
        pass: process.env.MAILGUN_PASSWORD
      }
    })
    const mailOptions = {
      to: updatedUser.email,
      from: 'Kevin',
      subject: `✔ Instruction to reset your password from ${appUrl}`,
      text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
      Please click on the following link, or paste this into your browser to complete the process:\n\n
      ${process.env.APPURL}reset/${token}\n\n If you did not request this, please ignore this email and your password will remain unchanged.\n`
    }

    // step 5: send mail using the mailer
    transporter.sendMail(mailOptions, function (err) {
      if (err) return errorResponse(res, req, 'standardError')

      res.send({ message: `A link to reset your password has been sent to ${updatedUser.email}`})
    })
  })()
  .catch((err) => {
    console.log(err)
    return errorResponse(res, req, 'standardError')
  })
}


/**
 * POST /reset
 */
exports.resetPasswordPost = function(req, res, next) {
  req.assert('password', 'Password must be at least 8 characters long').len(6)

  var errors = req.validationErrors()

  if (errors) return res.status(400).send(errors)

  Promise.coroutine(function* () {
    let user = yield User.findOne({ passwordResetToken: req.params.token })
      .where('passwordResetExpires').gt(Date.now())
      .exec()

    if (!user) return res.status(400).send({ message: 'Password reset token is invalid or has expired.' })

    user.password = req.body.password
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    const updatedUser = yield user.save()

    const transporter = nodemailer.createTransport({
      service: 'Mailgun',
      auth: {
        user: process.env.MAILGUN_USERNAME,
        pass: process.env.MAILGUN_PASSWORD
      }
    })

    const mailOptions = {
      from: 'support@yourdomain.com',
      to: updatedUser.email,
      subject: `Your password has been changed from ${appUrl}`,
      text: `Hello ${updatedUser.firstName},\n\n
      This is a confirmation that the password for your account ${updatedUser.email} has just been changed.\n`
    }
    transporter.sendMail(mailOptions, (err) => {
      if (err) return errorResponse(res, req, 'standardError')
      res.send({ message: 'Your password has been changed successfully.' })
    })
  })()
  .catch((err) => {
    console.log(err)
    return errorResponse(res, req, 'standardError')
  })
}