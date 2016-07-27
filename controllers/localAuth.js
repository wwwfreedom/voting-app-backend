const Promise = require("bluebird")
const randomBytes = Promise.promisify(require('crypto').randomBytes)
const generateJwtToken = require('../utils/generateJwtToken')
const User = require('../models/user')
const _ = require('lodash')
const nodemailer = require('nodemailer')
const moment = require('moment')

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
    const user = yield User.findOne({ email: req.body.email }).exec()
    const passwordIsMatch = yield user.comparePassword(req.body.password)
    const modUser = _.omit(user.toObject(), ['password', 'google', 'github'])

    if (!user) return res.status(400).send({ errors: ["Invalid login credentials. Please try again."]})

    if (!user.password) {
      if (user.google) return res.status(400).send({ errors: ["Invalid email or password. If you previously logged in with Google, click 'Log in with Google' to access your account"]})

      if (user.github) return res.status(400).send({ errors: ["Invalid email or password. If you previously logged in with Github, click 'Log in with Github' to access your account"]})
    }

    if (!passwordIsMatch) return res.status(401).send({ message: 'Invalid email or password' })

    if (req.body.rememberMe === 'true') return res.send({ token: generateJwtToken(user, '7 days'), user: modUser })

    return res.send({ token: generateJwtToken(user, '1 day'), user: modUser })
  })()
  .catch((err) => {
    console.log(err)
    return res.status(500).send({ message: "We're experiencing technical difficulties at the moment. Please wait and try again later. Thank you." })
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
    const user = yield User.findOne({ email: req.body.email }).exec()
    if (!user) return res.status(400).send({ message: `No account exists for ${req.body.email}. Maybe you signed up using a different/incorrect e-mail address`
      })

    // step 2: if user then generate reset token
    const token = yield randomBytes(16).then(buf => buf.toString('hex'))

    // step 3: update user with the reset token
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
    const appUrl = process.env.APPURL
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
      if (err) return res.status(500).send({ message: "We're experiencing technical difficulties at the moment. Please wait and try again later. Thank you."})

      res.send({ message: `A link to reset your password has been sent to ${updatedUser.email}`})
    })
  })()
  .catch((err) => {
    console.log(err)
    res.status(500).send({ message: "We're experiencing technical difficulties at the moment. Please wait and try again later. Thank you."})
  })
}