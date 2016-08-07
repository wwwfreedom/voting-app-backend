const express = require('express')
const router = express.Router()
const poll = require('../controllers/poll')
const requireAuth = require('../controllers/localAuth').ensureAuthenticated

router.get('/:id', poll.readPoll)
router.post('/', poll.createPoll)
router.put('/:id', poll.updatePoll)
router.delete('/:id', requireAuth, poll.deletePoll)

module.exports = router
