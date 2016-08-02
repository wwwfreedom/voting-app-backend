const express = require('express')
const router = express.Router()
const userProfile = require('../controllers/user/profile')
const userAccount = require('../controllers/user/account')
const userSecurity = require('../controllers/user/security')
const requireAuth = require('../controllers/localAuth').ensureAuthenticated

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource')
})

router.get('/profile', requireAuth, userProfile.read)

router.put('/profile/edit', requireAuth, userProfile.update )
router.put('/security', requireAuth, userSecurity.updatePassword )

// create a new user upon user registration
router.post('/signup', userAccount.create)
router.delete('/account', requireAuth, userAccount.delete)

module.exports = router
