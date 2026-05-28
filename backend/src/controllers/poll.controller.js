const logger = require('../utils/logger')
const prisma = require('../config/database')
const { success, error, paginated } = require('../utils/response.util')
const { getPagination, getPaginationMeta } = require('../utils/pagination.util')
const { getIO } = require('../config/socket')
const { notifyAll } = require('../utils/notification.util')
const { log } = require('../utils/activityLog.util')

// GET /api/polls
const getPolls = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query
    const { take, skip } = getPagination(page, limit)
    const now = new Date()

    const where = {
      deletedAt: null,
      ...(status === 'active' && {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      }),
      ...(status === 'ended' && {
        OR: [{ isActive: false }, { endDate: { lt: now } }],
      }),
    }

    const [polls, total] = await Promise.all([
      prisma.poll.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        select: {
          id: true,
          question: true,
          startDate: true,
          endDate: true,
          isActive: true,
          totalVotes: true,
          createdAt: true,
          author: {
            select: { id: true, firstName: true, lastName: true },
          },
          options: {
            select: { id: true, optionText: true, voteCount: true },
          },
          votes: {
            where: { userId: req.user.id },
            select: { optionId: true },
          },
        },
      }),
      prisma.poll.count({ where }),
    ])

    const pollsWithStatus = polls.map((poll) => ({
      ...poll,
      hasVoted: poll.votes.length > 0,
      myVote: poll.votes[0]?.optionId || null,
      isExpired: new Date(poll.endDate) < now,
      votes: undefined,
    }))

    return paginated(res, pollsWithStatus, getPaginationMeta(total, page, limit), 'Anketler getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Anketler getirilemedi', 500)
  }
}

// GET /api/polls/:id
const getPollById = async (req, res) => {
  try {
    const { id } = req.params
    const now = new Date()

    const poll = await prisma.poll.findFirst({
      where: { id: parseInt(id), deletedAt: null },
      select: {
        id: true,
        question: true,
        startDate: true,
        endDate: true,
        isActive: true,
        totalVotes: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: { id: true, firstName: true, lastName: true },
        },
        options: {
          select: { id: true, optionText: true, voteCount: true },
        },
        votes: {
          where: { userId: req.user.id },
          select: { optionId: true },
        },
      },
    })

    if (!poll) {
      return error(res, 'Anket bulunamadı', 404)
    }

    return success(res, {
      ...poll,
      hasVoted: poll.votes.length > 0,
      myVote: poll.votes[0]?.optionId || null,
      isExpired: new Date(poll.endDate) < now,
      votes: undefined,
    }, 'Anket getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Anket getirilemedi', 500)
  }
}

// POST /api/polls
const createPoll = async (req, res) => {
  try {
    const { question, options, startDate, endDate } = req.body

    const poll = await prisma.poll.create({
      data: {
        question,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        authorId: req.user.id,
        options: {
          create: options.map((optionText) => ({ optionText })),
        },
      },
      select: {
        id: true,
        question: true,
        startDate: true,
        endDate: true,
        isActive: true,
        totalVotes: true,
        createdAt: true,
        author: {
          select: { id: true, firstName: true, lastName: true },
        },
        options: {
          select: { id: true, optionText: true, voteCount: true },
        },
      },
    })

    notifyAll({
      title: 'Yeni Anket',
      body: poll.question,
      type: 'POLL',
      link: `/polls`,
      excludeUserId: req.user.id,
    }).catch((e) => logger.error('Anket bildirimi gönderilemedi', { e }))

    log({ userId: req.user.id, action: 'POLL_CREATE', entity: 'Poll', entityId: poll.id, detail: poll.question, ip: req.ip })

    return success(res, poll, 'Anket oluşturuldu', 201)
  } catch (err) {
    logger.error(err)
    return error(res, 'Anket oluşturulamadı', 500)
  }
}

// PUT /api/polls/:id
const updatePoll = async (req, res) => {
  try {
    const { id } = req.params
    const { question, endDate } = req.body

    const existing = await prisma.poll.findFirst({
      where: { id: parseInt(id), deletedAt: null },
    })

    if (!existing) {
      return error(res, 'Anket bulunamadı', 404)
    }

    if (req.user.role !== 'ADMIN' && existing.authorId !== req.user.id) {
      return error(res, 'Bu anketi düzenleme yetkiniz yok', 403)
    }

    if (existing.totalVotes > 0) {
      return error(res, 'Oy verilmiş anket düzenlenemez', 400)
    }

    const poll = await prisma.poll.update({
      where: { id: parseInt(id) },
      data: {
        ...(question && { question }),
        ...(endDate && { endDate: new Date(endDate) }),
      },
      select: {
        id: true,
        question: true,
        startDate: true,
        endDate: true,
        isActive: true,
        totalVotes: true,
        updatedAt: true,
      },
    })

    return success(res, poll, 'Anket güncellendi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Anket güncellenemedi', 500)
  }
}

// DELETE /api/polls/:id
const deletePoll = async (req, res) => {
  try {
    const { id } = req.params

    const existing = await prisma.poll.findFirst({
      where: { id: parseInt(id), deletedAt: null },
    })

    if (!existing) {
      return error(res, 'Anket bulunamadı', 404)
    }

    if (req.user.role !== 'ADMIN' && existing.authorId !== req.user.id) {
      return error(res, 'Bu anketi silme yetkiniz yok', 403)
    }

    await prisma.poll.update({
      where: { id: parseInt(id) },
      data: { deletedAt: new Date() },
    })

    return success(res, null, 'Anket silindi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Anket silinemedi', 500)
  }
}

// POST /api/polls/:id/vote
const votePoll = async (req, res) => {
  try {
    const { id } = req.params
    const { optionId } = req.body
    const now = new Date()

    const poll = await prisma.poll.findFirst({
      where: { id: parseInt(id), deletedAt: null },
      include: { options: true },
    })

    if (!poll) {
      return error(res, 'Anket bulunamadı', 404)
    }

    if (!poll.isActive || now > new Date(poll.endDate) || now < new Date(poll.startDate)) {
      return error(res, 'Bu anket aktif değil', 400)
    }

    const optionExists = poll.options.some((o) => o.id === parseInt(optionId))
    if (!optionExists) {
      return error(res, 'Geçersiz seçenek', 400)
    }

    const existingVote = await prisma.pollVote.findUnique({
      where: { pollId_userId: { pollId: parseInt(id), userId: req.user.id } },
    })

    if (existingVote) {
      return error(res, 'Bu ankete zaten oy verdiniz', 400)
    }

    await prisma.$transaction([
      prisma.pollVote.create({
        data: {
          pollId: parseInt(id),
          optionId: parseInt(optionId),
          userId: req.user.id,
        },
      }),
      prisma.pollOption.update({
        where: { id: parseInt(optionId) },
        data: { voteCount: { increment: 1 } },
      }),
      prisma.poll.update({
        where: { id: parseInt(id) },
        data: { totalVotes: { increment: 1 } },
      }),
    ])

    const updatedPoll = await prisma.poll.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        question: true,
        totalVotes: true,
        options: {
          select: { id: true, optionText: true, voteCount: true },
        },
      },
    })

    try {
      const io = getIO()
      io.emit('poll:results:update', updatedPoll)
    } catch (e) {}

    return success(res, updatedPoll, 'Oyunuz kaydedildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Oy verilemedi', 500)
  }
}

// GET /api/polls/:id/results
const getPollResults = async (req, res) => {
  try {
    const { id } = req.params

    const poll = await prisma.poll.findFirst({
      where: { id: parseInt(id), deletedAt: null },
      select: {
        id: true,
        question: true,
        totalVotes: true,
        isActive: true,
        endDate: true,
        options: {
          select: { id: true, optionText: true, voteCount: true },
        },
      },
    })

    if (!poll) {
      return error(res, 'Anket bulunamadı', 404)
    }

    const results = poll.options.map((option) => ({
      ...option,
      percentage: poll.totalVotes > 0
        ? Math.round((option.voteCount / poll.totalVotes) * 100)
        : 0,
    }))

    return success(res, { ...poll, options: results }, 'Anket sonuçları getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Anket sonuçları getirilemedi', 500)
  }
}

// GET /api/polls/:id/my-vote
const getMyVote = async (req, res) => {
  try {
    const { id } = req.params

    const vote = await prisma.pollVote.findUnique({
      where: { pollId_userId: { pollId: parseInt(id), userId: req.user.id } },
      select: { optionId: true, createdAt: true },
    })

    return success(res, { hasVoted: !!vote, optionId: vote?.optionId || null }, 'Oy bilgisi getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Oy bilgisi getirilemedi', 500)
  }
}

module.exports = {
  getPolls,
  getPollById,
  createPoll,
  updatePoll,
  deletePoll,
  votePoll,
  getPollResults,
  getMyVote,
}