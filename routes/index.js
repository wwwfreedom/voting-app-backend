const express = require('express')
const router = express.Router()
const userAccountController = require('../controllers/userAccount')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send({home: 'home'})
})

router.post('/signup', userAccountController.signupPost)

module.exports = router
