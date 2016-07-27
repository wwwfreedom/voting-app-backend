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

module.exports = router
