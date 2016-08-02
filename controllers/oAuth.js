const Promise = require("bluebird")
const axios = require('axios')
const qs = require('querystring')
const User = require('../models/user')
const generateJwtToken = require('../utils/generateJwtToken')
const _ = require('lodash')
const errorResponse = require('../utils/errorResponse')

/**
 * POST /auth/google
 * Sign in with Google
 * refer to https://developers.google.com/identity/protocols/OAuth2WebServer
 */
exports.authGoogle = function(req, res) {
  let accessTokenUrl = 'https://accounts.google.com/o/oauth2/token'
  let peopleApiUrl = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect'
  let params = {
    code: req.body.code,
    client_id: req.body.client_id,
    client_secret: process.env.GOOGLE_SECRET,
    redirect_uri: req.body.redirect_uri,
    grant_type: 'authorization_code'
  }

  Promise.coroutine(function* () {
    // lesson: can't send json to google Oauth, must send form url encode as a query string
    // Step 1. Exchange authorization code for access token.
    const access_token = yield axios.post(accessTokenUrl, qs.stringify(params))
      .then((response) => response.data.access_token)

    // Step 2. Retrieve user's profile information.
    const profile = yield axios.get(peopleApiUrl, { headers: { Authorization: `Bearer ${access_token}`} })
      .then(({data}) => data)

    if (!profile.email) return errorResponse(req, res, 'oAuthGoogle')

    // Step 3b. Create a new user account or return an existing one.
    const user = yield User.findOne({email: profile.email}).exec()

    // if user is found then check for user profile for missing details and update them with the social auth account details
    if (user) {
      // if user aleady has google profile just return the token and user without updating the user.
      if (user.google) {
        return res.send({
          token: generateJwtToken(user, '1 day'),
          user: _.omit(user.toObject(), ['password', 'google'])
        })
      }

      // update user on first login with google
      user.firstName = user.firstName || profile.given_name
      user.lastName = user.lastName || profile.family_name
      user.gender = user.gender || profile.gender
      user.location = user.location || profile.location
      user.picture = user.picture || profile.picture
      user.google = profile.sub

      const updatedUser = yield user.save()
      return res.send({
        token: generateJwtToken(updatedUser, '1 day'),
        // lesson: object return from  mongoose is mod object and need to be convert to normal object using toObject() to use method on it.
        user: _.omit(updatedUser.toObject(), ['password', 'google'])
      })
    }

    // if user is not found then create a new user
    const newUser = yield new User({
      firstName: profile.given_name,
      lastName: profile.family_name,
      email: profile.email,
      picture: profile.picture,
      gender: profile.gender,
      location: profile.location,
      google: profile.sub,
    }).save()

    return res.send({
      token: generateJwtToken(newUser, '1 day'),
      user: _.omit(newUser.toObject(), ['password', 'google'])
    })

  })() // self invoke Promise coroutine and end
  .catch((err) => {
    console.log(err)
    return errorResponse(req, res, 'standardError')
  })
}

/**
 * POST /auth/github
 * Sign in with Github
 */
exports.authGithub = function(req, res) {
  let accessTokenUrl = 'https://github.com/login/oauth/access_token'
  let userUrl = 'https://api.github.com/user'
  let params = {
    code: req.body.code,
    client_id: req.body.client_id,
    client_secret: process.env.GITHUB_SECRET,
    redirect_uri: req.body.redirect_uri,
    grant_type: 'authorization_code'
  }

  Promise.coroutine(function* () {
    // Step 1. Exchange authorization code for access token.
    const access_token = yield axios.post(accessTokenUrl, qs.stringify(params)).then((response) => qs.parse(response.data).access_token)

    // Step 2. Retrieve user's profile information.
    const profile = yield axios.get(userUrl, {headers:{ Authorization: `Bearer ${access_token}`} }).then(({data}) => data)

    if (!profile.email) return errorResponse(req, res, 'oAuthGithub')

    // Step 3b. Create a new user account or return an existing one.
    const user = yield User.findOne({email: profile.email}).exec()

    if (user) {
      if (user.google) {
        return res.send({
          token: generateJwtToken(user, '1 day'),
          user: _.omit(user.toObject(), ['password', 'google'])
        })
      }

      // update user on first login with google
      user.firstName = user.firstName || profile.name
      user.gender = user.gender || profile.gender
      user.location = user.location || profile.location
      user.picture = user.picture || profile.picture
      user.github = profile.id

      const updatedUser = yield user.save()
      return res.send({
        token: generateJwtToken(updatedUser, '1 day'),
        user: _.omit(updatedUser.toObject(), ['password', 'google'])
      })
    }

    // if user is not found then create a new user
    const newUser = yield new User({
      firstName: profile.name,
      email: profile.email,
      picture: profile.picture,
      location: profile.location,
      github: profile.id,
    }).save()

    return res.send({
      token: generateJwtToken(newUser, '1 day'),
      user: _.omit(newUser.toObject(), ['password', 'google'])
    })
  })() // self invoke Promise coroutine and end
  .catch((err) => {
    console.log(err)
    return errorResponse(req, res, 'standardError')
  })
}
