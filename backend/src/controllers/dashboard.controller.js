const logger = require('../utils/logger')
const prisma = require('../config/database')
const { success, error } = require('../utils/response.util')

// GET /api/dashboard/stats
const getStats = async (req, res) => {
  try {
    const [newsCount, pollCount, messageCount, trainingCount] = await Promise.all([
      prisma.news.count({ where: { deletedAt: null } }),
      prisma.poll.count({ where: { deletedAt: null, isActive: true } }),
      prisma.message.count({
        where: {
          deletedAt: null,
          conversation: {
            members: {
              some: { userId: req.user.id },
            },
          },
        },
      }),
      prisma.training.count({ where: { deletedAt: null } }),
    ])

    return success(res, {
      newsCount,
      pollCount,
      messageCount,
      trainingCount,
    }, 'İstatistikler getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'İstatistikler getirilemedi', 500)
  }
}

// GET /api/dashboard/recent-news
const getRecentNews = async (req, res) => {
  try {
    const news = await prisma.news.findMany({
      where: { deletedAt: null },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 5,
      select: {
        id: true,
        title: true,
        category: true,
        isPinned: true,
        viewCount: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return success(res, news, 'Son haberler getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Son haberler getirilemedi', 500)
  }
}

// GET /api/dashboard/active-polls
const getActivePolls = async (req, res) => {
  try {
    const now = new Date()

    const polls = await prisma.poll.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        question: true,
        totalVotes: true,
        endDate: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        options: {
          select: {
            id: true,
            optionText: true,
            voteCount: true,
          },
        },
        votes: {
          where: { userId: req.user.id },
          select: { optionId: true },
        },
      },
    })

    const pollsWithVoteStatus = polls.map((poll) => ({
      ...poll,
      hasVoted: poll.votes.length > 0,
      myVote: poll.votes[0]?.optionId || null,
      votes: undefined,
    }))

    return success(res, pollsWithVoteStatus, 'Aktif anketler getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Aktif anketler getirilemedi', 500)
  }
}

// GET /api/dashboard/feed — engagement ana akışı
const getFeed = async (req, res) => {
  try {
    const userId = req.user.id
    const now = new Date()
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [
      profiles,
      upcomingEvents,
      pendingPolls,
      recentActivity,
      unreadNotifications,
    ] = await Promise.all([
      // Bugün doğum günü/iş yıldönümü olan aktif kullanıcılar
      prisma.userProfile.findMany({
        where: {
          OR: [{ birthDate: { not: null } }, { hireDate: { not: null } }],
          // ADMIN sistem hesabıdır, çalışan değildir — kutlamalara dahil edilmez
          user: { isActive: true, deletedAt: null, role: { not: 'ADMIN' } },
        },
        select: {
          userId: true,
          birthDate: true,
          hireDate: true,
          avatar: true,
          department: true,
          position: true,
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      }),

      // Önümüzdeki 7 gün içindeki etkinlikler (kullanıcının görebildiği)
      prisma.calendarEvent.findMany({
        where: {
          deletedAt: null,
          OR: [
            { isPublic: true },
            { createdBy: userId },
            { attendees: { some: { userId } } },
          ],
          startDate: { gte: todayStart, lte: in7Days },
        },
        orderBy: { startDate: 'asc' },
        take: 5,
        select: {
          id: true,
          title: true,
          type: true,
          startDate: true,
          endDate: true,
          allDay: true,
          location: true,
        },
      }),

      // Aktif olup henüz oy vermediğiniz anketler
      prisma.poll.findMany({
        where: {
          deletedAt: null,
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now },
          NOT: { votes: { some: { userId } } },
        },
        orderBy: { endDate: 'asc' },
        take: 5,
        select: {
          id: true,
          question: true,
          endDate: true,
          totalVotes: true,
          options: { select: { id: true, optionText: true } },
        },
      }),

      // Son aktivite akışı (kullanıcıya görünür eylemler)
      prisma.activityLog.findMany({
        where: {
          action: { in: ['NEWS_CREATE', 'POLL_CREATE', 'TRAINING_CREATE', 'SUGGESTION_CREATE', 'BROADCAST', 'EVENT_CREATE'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: {
          id: true,
          action: true,
          entity: true,
          entityId: true,
          detail: true,
          createdAt: true,
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      }),

      prisma.notification.count({ where: { userId, isRead: false } }),
    ])

    const isSameMonthDay = (a, b) =>
      a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

    const todayCelebrations = profiles.flatMap((p) => {
      const items = []
      if (p.birthDate && isSameMonthDay(new Date(p.birthDate), now)) {
        items.push({
          kind: 'BIRTHDAY',
          user: p.user,
          avatar: p.avatar,
          department: p.department,
          position: p.position,
        })
      }
      if (p.hireDate && isSameMonthDay(new Date(p.hireDate), now)) {
        const years = now.getFullYear() - new Date(p.hireDate).getFullYear()
        if (years > 0) {
          items.push({
            kind: 'ANNIVERSARY',
            years,
            user: p.user,
            avatar: p.avatar,
            department: p.department,
            position: p.position,
          })
        }
      }
      return items
    })

    return success(res, {
      todayCelebrations,
      upcomingEvents,
      pendingPolls,
      recentActivity,
      unreadNotifications,
    }, 'Akış getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Akış getirilemedi', 500)
  }
}

module.exports = { getStats, getRecentNews, getActivePolls, getFeed }