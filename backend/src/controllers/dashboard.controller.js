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
    console.error(err)
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
    console.error(err)
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
    console.error(err)
    return error(res, 'Aktif anketler getirilemedi', 500)
  }
}

module.exports = { getStats, getRecentNews, getActivePolls }