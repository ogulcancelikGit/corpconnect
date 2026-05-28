const logger = require('../utils/logger')
const prisma = require('../config/database')
const { success, error, paginated } = require('../utils/response.util')
const { getPagination, getPaginationMeta } = require('../utils/pagination.util')

const expenseSelect = {
  id: true,
  title: true,
  amount: true,
  currency: true,
  category: true,
  description: true,
  receiptUrl: true,
  status: true,
  reviewNote: true,
  reviewedAt: true,
  expenseDate: true,
  createdAt: true,
  user: { select: { id: true, firstName: true, lastName: true, profile: { select: { department: true } } } },
  reviewer: { select: { id: true, firstName: true, lastName: true } },
}

const CATEGORY_LABELS = {
  TRAVEL: 'Seyahat', FOOD: 'Yemek', ACCOMMODATION: 'Konaklama', OFFICE: 'Ofis Malzemesi', OTHER: 'Diğer',
}

// GET /api/expenses/my
const getMyExpenses = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query
    const { take, skip } = getPagination(page, limit)

    const where = { userId: req.user.id, deletedAt: null, ...(status && { status }) }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip, select: expenseSelect }),
      prisma.expense.count({ where }),
    ])

    return paginated(res, expenses, getPaginationMeta(total, page, limit), 'Masraflar getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Masraflar getirilemedi', 500)
  }
}

// GET /api/expenses  (ADMIN/MANAGER)
const getAllExpenses = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, category } = req.query
    const { take, skip } = getPagination(page, limit)

    const where = { deletedAt: null, ...(status && { status }), ...(category && { category }) }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip, select: expenseSelect }),
      prisma.expense.count({ where }),
    ])

    return paginated(res, expenses, getPaginationMeta(total, page, limit), 'Masraflar getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Masraflar getirilemedi', 500)
  }
}

// GET /api/expenses/stats
const getExpenseStats = async (req, res) => {
  try {
    const [pending, approved, rejected, totalAmount] = await Promise.all([
      prisma.expense.count({ where: { status: 'PENDING', deletedAt: null } }),
      prisma.expense.count({ where: { status: 'APPROVED', deletedAt: null } }),
      prisma.expense.count({ where: { status: 'REJECTED', deletedAt: null } }),
      prisma.expense.aggregate({ where: { status: 'APPROVED', deletedAt: null }, _sum: { amount: true } }),
    ])

    return success(res, {
      pending, approved, rejected,
      totalApprovedAmount: totalAmount._sum.amount || 0,
    }, 'İstatistikler getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'İstatistikler getirilemedi', 500)
  }
}

// POST /api/expenses
const createExpense = async (req, res) => {
  try {
    const { title, amount, currency = 'TRY', category, description, expenseDate, receiptUrl } = req.body

    const expense = await prisma.expense.create({
      data: {
        userId: req.user.id,
        title,
        amount: parseFloat(amount),
        currency,
        category,
        description,
        expenseDate: new Date(expenseDate),
        receiptUrl,
      },
      select: expenseSelect,
    })

    // Yöneticilere bildirim
    const managers = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'MANAGER'] }, isActive: true, deletedAt: null },
      select: { id: true },
    })
    await prisma.notification.createMany({
      data: managers.map((m) => ({
        userId: m.id,
        title: 'Yeni Masraf Bildirimi',
        body: `${expense.user.firstName} ${expense.user.lastName} - ${CATEGORY_LABELS[category]}: ${parseFloat(amount).toLocaleString('tr-TR')} ${currency}`,
        type: 'EXPENSE',
        link: '/superadmin/expenses',
      })),
    })

    return success(res, expense, 'Masraf bildirimi oluşturuldu', 201)
  } catch (err) {
    logger.error(err)
    return error(res, 'Masraf bildirimi oluşturulamadı', 500)
  }
}

// PUT /api/expenses/:id/review  (ADMIN/MANAGER)
const reviewExpense = async (req, res) => {
  try {
    const { id } = req.params
    const { status, reviewNote } = req.body

    const existing = await prisma.expense.findFirst({ where: { id: parseInt(id), deletedAt: null }, select: { ...expenseSelect, userId: true } })
    if (!existing) return error(res, 'Masraf bildirimi bulunamadı', 404)
    if (existing.status !== 'PENDING') return error(res, 'Bu bildirim zaten işleme alınmış', 400)

    const expense = await prisma.expense.update({
      where: { id: parseInt(id) },
      data: { status, reviewedBy: req.user.id, reviewNote, reviewedAt: new Date() },
      select: expenseSelect,
    })

    await prisma.notification.create({
      data: {
        userId: existing.user.id,
        title: status === 'APPROVED' ? 'Masraf Onaylandı' : 'Masraf Reddedildi',
        body: `"${existing.title}" masraf bildiriminiz ${status === 'APPROVED' ? 'onaylandı' : 'reddedildi'}${reviewNote ? `: ${reviewNote}` : ''}`,
        type: 'EXPENSE',
        link: '/expenses',
      },
    })

    return success(res, expense, `Masraf ${status === 'APPROVED' ? 'onaylandı' : 'reddedildi'}`)
  } catch (err) {
    logger.error(err)
    return error(res, 'İşlem gerçekleştirilemedi', 500)
  }
}

// DELETE /api/expenses/:id  (sadece kendi PENDING masrafı)
const cancelExpense = async (req, res) => {
  try {
    const { id } = req.params

    const existing = await prisma.expense.findFirst({ where: { id: parseInt(id), userId: req.user.id, deletedAt: null } })
    if (!existing) return error(res, 'Masraf bildirimi bulunamadı', 404)
    if (existing.status !== 'PENDING') return error(res, 'Sadece bekleyen bildirimler iptal edilebilir', 400)

    await prisma.expense.update({ where: { id: parseInt(id) }, data: { deletedAt: new Date() } })

    return success(res, null, 'Masraf bildirimi iptal edildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'İptal işlemi başarısız', 500)
  }
}

module.exports = { getMyExpenses, getAllExpenses, getExpenseStats, createExpense, reviewExpense, cancelExpense }
