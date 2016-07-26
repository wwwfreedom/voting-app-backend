const jwt = require('jsonwebtoken')
const moment = require('moment')
const generateJwtToken = function(user, expiresIn) {
  var payload = {
    iat: moment().unix(), // issue time
    iss: process.env.APPURL, // issuer 'put the website name here'
    sub: user.id // convention sub = subject
  }
  return jwt.sign(payload, process.env.TOKEN_SECRET, { expiresIn }) // expiresIn uses seconds
}

// exports.generateJwtToken = generateJwtToken
module.exports = generateJwtToken