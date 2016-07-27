const express = require('express')
const router = express.Router()
const userAccountController = require('../controllers/userAccount')
const userAuthController = require('../controllers/localAuth')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send({home: 'home'})
})

router.post('/login', userAuthController.loginPost)
router.post('/signup', userAccountController.signupPost)
router.post('/forgot_password', userAuthController.forgotPasswordPost)
router.post('/reset_password/:token', userAuthController.resetPasswordPost)
router.delete('/user_account/', userAuthController.ensureAuthenticated, userAccountController.accountDelete)

module.exports = router
