const Promise = require("bluebird")
const generateJwtToken = require('../utils/generateJwtToken')
const User = require('../models/user')
const _ = require('lodash')

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