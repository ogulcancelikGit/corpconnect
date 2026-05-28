const express = require('express')
const router = express.Router()
const { getEvents, createEvent, updateEvent, deleteEvent, respondToEvent } = require('../controllers/calendar.controller')
const { authenticate } = require('../middleware/auth.middleware')
const { validate } = require('../middleware/validate.middleware')
const { createEventValidation, updateEventValidation } = require('../validations/calendar.validation')

router.use(authenticate)
router.get('/', getEvents)
router.post('/', createEventValidation, validate, createEvent)
router.put('/:id', updateEventValidation, validate, updateEvent)
router.patch('/:id/rsvp', respondToEvent)
router.delete('/:id', deleteEvent)

module.exports = router
