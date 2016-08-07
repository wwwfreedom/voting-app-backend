const express = require('express')
const router = express.Router()
const poll = require('../controllers/poll')
const requireAuth = require('../controllers/localAuth').ensureAuthenticated

router.get('/:id', poll.readPoll)
router.post('/', requireAuth, poll.createPoll)
router.put('/:id', requireAuth, poll.updatePoll)
router.put('/publicVote/:id', poll.publicVote)
router.delete('/:id', requireAuth, poll.deletePoll)

module.exports = router
