const logger = require('../utils/logger')
const prisma = require('../config/database')
const { success, error } = require('../utils/response.util')
const { notifyUsers } = require('../utils/notification.util')
const { log } = require('../utils/activityLog.util')

const eventSelect = {
  id: true,
  title: true,
  description: true,
  type: true,
  startDate: true,
  endDate: true,
  allDay: true,
  location: true,
  isPublic: true,
  createdBy: true,
  createdAt: true,
  creator: { select: { id: true, firstName: true, lastName: true } },
  attendees: {
    select: {
      id: true,
      userId: true,
      status: true,
      respondedAt: true,
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  },
}

// GET /api/calendar?start=&end=
const getEvents = async (req, res) => {
  try {
    const { start, end } = req.query

    const where = {
      deletedAt: null,
      OR: [
        { isPublic: true },
        { createdBy: req.user.id },
        { attendees: { some: { userId: req.user.id } } },
      ],
      ...(start && end && {
        startDate: { gte: new Date(start) },
        endDate: { lte: new Date(end) },
      }),
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: { startDate: 'asc' },
      select: eventSelect,
    })

    return success(res, events, 'Etkinlikler getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Etkinlikler getirilemedi', 500)
  }
}

// POST /api/calendar
const createEvent = async (req, res) => {
  try {
    const { title, description, type, startDate, endDate, allDay, location, isPublic, attendees = [] } = req.body

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description,
        type: type || 'OTHER',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        allDay: allDay || false,
        location,
        isPublic: isPublic !== false,
        createdBy: req.user.id,
        attendees: {
          create: [...new Set([...attendees.map(Number), req.user.id])]
            .filter((id) => !isNaN(id))
            .map((userId) => ({ userId })),
        },
      },
      select: eventSelect,
    })

    // Katılımcılara bildirim
    const notifyIds = attendees.map(Number).filter((id) => !isNaN(id) && id !== req.user.id)
    if (notifyIds.length > 0) {
      notifyUsers({
        userIds: notifyIds,
        title: 'Etkinliğe Davet Edildiniz',
        body: `"${title}" etkinliğine davet edildiniz`,
        type: 'CALENDAR',
        link: '/calendar',
      }).catch((e) => logger.error('Etkinlik bildirimi gönderilemedi', { e }))
    }

    log({ userId: req.user.id, action: 'EVENT_CREATE', entity: 'CalendarEvent', entityId: event.id, detail: event.title, ip: req.ip })

    return success(res, event, 'Etkinlik oluşturuldu', 201)
  } catch (err) {
    logger.error(err)
    return error(res, 'Etkinlik oluşturulamadı', 500)
  }
}

// PUT /api/calendar/:id
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params
    const { title, description, type, startDate, endDate, allDay, location, isPublic } = req.body

    const existing = await prisma.calendarEvent.findFirst({ where: { id: parseInt(id), deletedAt: null } })
    if (!existing) return error(res, 'Etkinlik bulunamadı', 404)
    if (existing.createdBy !== req.user.id && req.user.role === 'EMPLOYEE') {
      return error(res, 'Bu etkinliği düzenleme yetkiniz yok', 403)
    }

    const event = await prisma.calendarEvent.update({
      where: { id: parseInt(id) },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(allDay !== undefined && { allDay }),
        ...(location !== undefined && { location }),
        ...(isPublic !== undefined && { isPublic }),
      },
      select: eventSelect,
    })

    return success(res, event, 'Etkinlik güncellendi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Etkinlik güncellenemedi', 500)
  }
}

// PATCH /api/calendar/:id/rsvp  body: { status: 'GOING' | 'MAYBE' | 'DECLINED' }
const respondToEvent = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const validStatuses = ['GOING', 'MAYBE', 'DECLINED']
    if (!validStatuses.includes(status)) {
      return error(res, 'Geçersiz cevap (GOING, MAYBE, DECLINED)', 400)
    }

    const attendee = await prisma.eventAttendee.findUnique({
      where: { eventId_userId: { eventId: parseInt(id), userId: req.user.id } },
    })

    if (!attendee) {
      return error(res, 'Bu etkinliğe davet edilmediniz', 403)
    }

    const updated = await prisma.eventAttendee.update({
      where: { id: attendee.id },
      data: { status, respondedAt: new Date() },
      select: { id: true, status: true, respondedAt: true },
    })

    log({ userId: req.user.id, action: 'EVENT_RSVP', entity: 'CalendarEvent', entityId: parseInt(id), detail: status, ip: req.ip })

    return success(res, updated, 'Cevabınız kaydedildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Cevap kaydedilemedi', 500)
  }
}

// DELETE /api/calendar/:id
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params

    const existing = await prisma.calendarEvent.findFirst({ where: { id: parseInt(id), deletedAt: null } })
    if (!existing) return error(res, 'Etkinlik bulunamadı', 404)
    if (existing.createdBy !== req.user.id && req.user.role === 'EMPLOYEE') {
      return error(res, 'Bu etkinliği silme yetkiniz yok', 403)
    }

    await prisma.calendarEvent.update({ where: { id: parseInt(id) }, data: { deletedAt: new Date() } })

    return success(res, null, 'Etkinlik silindi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Etkinlik silinemedi', 500)
  }
}

module.exports = { getEvents, createEvent, updateEvent, deleteEvent, respondToEvent }
