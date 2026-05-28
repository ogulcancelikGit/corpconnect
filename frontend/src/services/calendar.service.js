import api from './api.service'

const getEvents = (params) => api.get('/calendar', { params }).then((r) => r.data)
const createEvent = (data) => api.post('/calendar', data).then((r) => r.data)
const updateEvent = (id, data) => api.put(`/calendar/${id}`, data).then((r) => r.data)
const deleteEvent = (id) => api.delete(`/calendar/${id}`).then((r) => r.data)
const respondToEvent = (id, status) => api.patch(`/calendar/${id}/rsvp`, { status }).then((r) => r.data)

export default { getEvents, createEvent, updateEvent, deleteEvent, respondToEvent }
