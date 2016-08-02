const express = require('express')
const router = express.Router()
const userAccountController = require('../controllers/userAccount')
const userAuthController = require('../controllers/localAuth')
const userOauthController = require('../controllers/oAuth')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send({home: 'home'})
})

router.get('/ping', function(req, res, next) {
  res.send({state: true})
})

router.post('/login', userAuthController.loginPost)
router.post('/forgot_password', userAuthController.forgotPasswordPost)
router.post('/reset_password/:token', userAuthController.resetPasswordPost)

router.post('/oauth/google', userOauthController.authGoogle)
router.post('/oauth/github', userOauthController.authGithub)

module.exports = router
