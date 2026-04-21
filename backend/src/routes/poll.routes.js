const express = require('express')
const router = express.Router()
const {
  getPolls,
  getPollById,
  createPoll,
  updatePoll,
  deletePoll,
  votePoll,
  getPollResults,
  getMyVote,
} = require('../controllers/poll.controller')
const { authenticate } = require('../middleware/auth.middleware')
const { authorize } = require('../middleware/role.middleware')
const { validate } = require('../middleware/validate.middleware')
const {
  createPollValidation,
  updatePollValidation,
  voteValidation,
} = require('../validations/poll.validation')

router.get('/', authenticate, getPolls)
router.get('/:id', authenticate, getPollById)
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), createPollValidation, validate, createPoll)
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), updatePollValidation, validate, updatePoll)
router.delete('/:id', authenticate, authorize('ADMIN', 'MANAGER'), deletePoll)
router.post('/:id/vote', authenticate, voteValidation, validate, votePoll)
router.get('/:id/results', authenticate, getPollResults)
router.get('/:id/my-vote', authenticate, getMyVote)

module.exports = router