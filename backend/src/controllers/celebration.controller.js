const logger = require('../utils/logger')
const prisma = require('../config/database')
const { success, error } = require('../utils/response.util')

// GET /api/celebrations/today - Bugünkü doğum günleri ve yıldönümleri
const getTodayCelebrations = async (req, res) => {
  try {
    const today = new Date()
    const month = today.getMonth() + 1
    const day = today.getDate()

    const users = await prisma.user.findMany({
      where: { isActive: true, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profile: {
          select: {
            department: true,
            position: true,
            birthDate: true,
            hireDate: true,
          },
        },
      },
    })

    const birthdays = []
    const anniversaries = []

    for (const user of users) {
      if (!user.profile) continue

      if (user.profile.birthDate) {
        const bd = new Date(user.profile.birthDate)
        if (bd.getMonth() + 1 === month && bd.getDate() === day) {
          birthdays.push({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            department: user.profile.department,
            position: user.profile.position,
          })
        }
      }

      if (user.profile.hireDate) {
        const hd = new Date(user.profile.hireDate)
        if (hd.getMonth() + 1 === month && hd.getDate() === day) {
          const years = today.getFullYear() - hd.getFullYear()
          if (years > 0) {
            anniversaries.push({
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              department: user.profile.department,
              position: user.profile.position,
              years,
            })
          }
        }
      }
    }

    return success(res, { birthdays, anniversaries }, 'Kutlamalar getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Kutlamalar getirilemedi', 500)
  }
}

// GET /api/celebrations/upcoming?days=7 - Yaklaşan kutlamalar
const getUpcomingCelebrations = async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 7, 30)
    const today = new Date()

    const users = await prisma.user.findMany({
      where: { isActive: true, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profile: {
          select: {
            department: true,
            position: true,
            birthDate: true,
            hireDate: true,
          },
        },
      },
    })

    const upcoming = []

    for (const user of users) {
      if (!user.profile) continue

      for (let i = 0; i <= days; i++) {
        const checkDate = new Date(today)
        checkDate.setDate(today.getDate() + i)
        const checkMonth = checkDate.getMonth() + 1
        const checkDay = checkDate.getDate()

        if (user.profile.birthDate) {
          const bd = new Date(user.profile.birthDate)
          if (bd.getMonth() + 1 === checkMonth && bd.getDate() === checkDay) {
            upcoming.push({
              type: 'BIRTHDAY',
              daysUntil: i,
              date: checkDate.toISOString().split('T')[0],
              user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                department: user.profile.department,
                position: user.profile.position,
              },
            })
          }
        }

        if (user.profile.hireDate) {
          const hd = new Date(user.profile.hireDate)
          if (hd.getMonth() + 1 === checkMonth && hd.getDate() === checkDay) {
            const years = checkDate.getFullYear() - hd.getFullYear()
            if (years > 0) {
              upcoming.push({
                type: 'ANNIVERSARY',
                daysUntil: i,
                date: checkDate.toISOString().split('T')[0],
                years,
                user: {
                  id: user.id,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  department: user.profile.department,
                  position: user.profile.position,
                },
              })
            }
          }
        }
      }
    }

    upcoming.sort((a, b) => a.daysUntil - b.daysUntil)

    return success(res, upcoming, 'Yaklaşan kutlamalar getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Yaklaşan kutlamalar getirilemedi', 500)
  }
}

module.exports = { getTodayCelebrations, getUpcomingCelebrations }
