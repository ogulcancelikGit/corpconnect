const prisma = require('../config/database')
const { success, error, paginated } = require('../utils/response.util')
const { getPagination, getPaginationMeta } = require('../utils/pagination.util')
const { getIO } = require('../config/socket')

// GET /api/conversations
const getConversations = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const { take, skip } = getPagination(page, limit)

    const where = {
      deletedAt: null,
      members: { some: { userId: req.user.id } },
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        orderBy: { lastMessageAt: 'desc' },
        take,
        skip,
        select: {
          id: true,
          type: true,
          name: true,
          avatar: true,
          lastMessageAt: true,
          createdAt: true,
          members: {
            select: {
              id: true,
              role: true,
              lastReadAt: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profile: { select: { avatar: true } },
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              content: true,
              createdAt: true,
              sender: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
        },
      }),
      prisma.conversation.count({ where }),
    ])

    return paginated(res, conversations, getPaginationMeta(total, page, limit), 'Konuşmalar getirildi')
  } catch (err) {
    console.error(err)
    return error(res, 'Konuşmalar getirilemedi', 500)
  }
}

// GET /api/conversations/:id
const getConversationById = async (req, res) => {
  try {
    const { id } = req.params

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: parseInt(id),
        deletedAt: null,
        members: { some: { userId: req.user.id } },
      },
      select: {
        id: true,
        type: true,
        name: true,
        avatar: true,
        lastMessageAt: true,
        createdAt: true,
        members: {
          select: {
            id: true,
            role: true,
            lastReadAt: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profile: { select: { avatar: true, department: true } },
              },
            },
          },
        },
      },
    })

    if (!conversation) {
      return error(res, 'Konuşma bulunamadı', 404)
    }

    return success(res, conversation, 'Konuşma getirildi')
  } catch (err) {
    console.error(err)
    return error(res, 'Konuşma getirilemedi', 500)
  }
}

// POST /api/conversations
const createConversation = async (req, res) => {
  try {
    const { type, memberIds, name } = req.body

    if (type === 'DIRECT') {
      if (memberIds.length !== 1) {
        return error(res, '1:1 konuşma için tek kullanıcı seçilmeli', 400)
      }

      const targetUserId = parseInt(memberIds[0])

      const existing = await prisma.conversation.findFirst({
        where: {
          type: 'DIRECT',
          deletedAt: null,
          members: { every: { userId: { in: [req.user.id, targetUserId] } } },
        },
        include: { members: true },
      })

      if (existing && existing.members.length === 2) {
        return success(res, existing, 'Mevcut konuşma getirildi')
      }
    }

    const allMemberIds = [...new Set([req.user.id, ...memberIds.map((id) => parseInt(id))])]

    const conversation = await prisma.conversation.create({
      data: {
        type,
        name: type === 'GROUP' ? name : null,
        createdBy: req.user.id,
        members: {
          create: allMemberIds.map((userId) => ({
            userId,
            role: userId === req.user.id ? 'ADMIN' : 'MEMBER',
          })),
        },
      },
      select: {
        id: true,
        type: true,
        name: true,
        avatar: true,
        createdAt: true,
        members: {
          select: {
            id: true,
            role: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profile: { select: { avatar: true } },
              },
            },
          },
        },
      },
    })

    return success(res, conversation, 'Konuşma oluşturuldu', 201)
  } catch (err) {
    console.error(err)
    return error(res, 'Konuşma oluşturulamadı', 500)
  }
}

// PUT /api/conversations/:id
const updateConversation = async (req, res) => {
  try {
    const { id } = req.params
    const { name } = req.body

    const member = await prisma.conversationMember.findFirst({
      where: { conversationId: parseInt(id), userId: req.user.id },
    })

    if (!member || member.role !== 'ADMIN') {
      return error(res, 'Bu konuşmayı düzenleme yetkiniz yok', 403)
    }

    const conversation = await prisma.conversation.update({
      where: { id: parseInt(id) },
      data: { ...(name && { name }) },
      select: { id: true, name: true, avatar: true, updatedAt: true },
    })

    return success(res, conversation, 'Konuşma güncellendi')
  } catch (err) {
    console.error(err)
    return error(res, 'Konuşma güncellenemedi', 500)
  }
}

// DELETE /api/conversations/:id
const leaveConversation = async (req, res) => {
  try {
    const { id } = req.params

    const member = await prisma.conversationMember.findFirst({
      where: { conversationId: parseInt(id), userId: req.user.id },
    })

    if (!member) {
      return error(res, 'Bu konuşmada değilsiniz', 404)
    }

    await prisma.conversationMember.delete({
      where: { id: member.id },
    })

    return success(res, null, 'Konuşmadan ayrıldınız')
  } catch (err) {
    console.error(err)
    return error(res, 'Konuşmadan ayrılınamadı', 500)
  }
}

// GET /api/conversations/:id/members
const getMembers = async (req, res) => {
  try {
    const { id } = req.params

    const isMember = await prisma.conversationMember.findFirst({
      where: { conversationId: parseInt(id), userId: req.user.id },
    })

    if (!isMember) {
      return error(res, 'Bu konuşmaya erişim yetkiniz yok', 403)
    }

    const members = await prisma.conversationMember.findMany({
      where: { conversationId: parseInt(id) },
      select: {
        id: true,
        role: true,
        joinedAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: { select: { avatar: true, department: true, position: true } },
          },
        },
      },
    })

    return success(res, members, 'Üyeler getirildi')
  } catch (err) {
    console.error(err)
    return error(res, 'Üyeler getirilemedi', 500)
  }
}

// POST /api/conversations/:id/members
const addMember = async (req, res) => {
  try {
    const { id } = req.params
    const { memberIds } = req.body

    const isAdmin = await prisma.conversationMember.findFirst({
      where: { conversationId: parseInt(id), userId: req.user.id, role: 'ADMIN' },
    })

    if (!isAdmin) {
      return error(res, 'Üye ekleme yetkiniz yok', 403)
    }

    const newMembers = await Promise.all(
      memberIds.map((userId) =>
        prisma.conversationMember.upsert({
          where: {
            conversationId_userId: {
              conversationId: parseInt(id),
              userId: parseInt(userId),
            },
          },
          update: {},
          create: {
            conversationId: parseInt(id),
            userId: parseInt(userId),
            role: 'MEMBER',
          },
        })
      )
    )

    return success(res, newMembers, 'Üyeler eklendi', 201)
  } catch (err) {
    console.error(err)
    return error(res, 'Üye eklenemedi', 500)
  }
}

// DELETE /api/conversations/:id/members/:userId
const removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params

    const isAdmin = await prisma.conversationMember.findFirst({
      where: { conversationId: parseInt(id), userId: req.user.id, role: 'ADMIN' },
    })

    if (!isAdmin && req.user.id !== parseInt(userId)) {
      return error(res, 'Üye çıkarma yetkiniz yok', 403)
    }

    await prisma.conversationMember.deleteMany({
      where: { conversationId: parseInt(id), userId: parseInt(userId) },
    })

    return success(res, null, 'Üye çıkarıldı')
  } catch (err) {
    console.error(err)
    return error(res, 'Üye çıkarılamadı', 500)
  }
}

// PATCH /api/conversations/:id/members/:userId/role
const updateMemberRole = async (req, res) => {
  try {
    const { id, userId } = req.params
    const { role } = req.body

    const isAdmin = await prisma.conversationMember.findFirst({
      where: { conversationId: parseInt(id), userId: req.user.id, role: 'ADMIN' },
    })

    if (!isAdmin) {
      return error(res, 'Rol değiştirme yetkiniz yok', 403)
    }

    const member = await prisma.conversationMember.updateMany({
      where: { conversationId: parseInt(id), userId: parseInt(userId) },
      data: { role },
    })

    return success(res, member, 'Üye rolü güncellendi')
  } catch (err) {
    console.error(err)
    return error(res, 'Üye rolü güncellenemedi', 500)
  }
}

module.exports = {
  getConversations,
  getConversationById,
  createConversation,
  updateConversation,
  leaveConversation,
  getMembers,
  addMember,
  removeMember,
  updateMemberRole,
}