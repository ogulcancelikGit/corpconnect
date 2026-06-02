const logger = require('../utils/logger')
const prisma = require('../config/database')
const { success, error } = require('../utils/response.util')

// GET /api/reports/leaves - Departman bazlı izin raporu
const leaveReport = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query
    const startOfYear = new Date(`${year}-01-01`)
    const endOfYear = new Date(`${year}-12-31T23:59:59`)

    const leaves = await prisma.leaveRequest.findMany({
      where: {
        deletedAt: null,
        status: 'APPROVED',
        startDate: { gte: startOfYear, lte: endOfYear },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            profile: { select: { department: true, position: true } },
          },
        },
      },
    })

    // Departman bazlı grupla
    const byDepartment = {}
    for (const leave of leaves) {
      const dept = leave.user?.profile?.department || 'Belirsiz'
      if (!byDepartment[dept]) {
        byDepartment[dept] = { department: dept, totalDays: 0, count: 0, breakdown: {} }
      }
      byDepartment[dept].totalDays += leave.days
      byDepartment[dept].count += 1
      byDepartment[dept].breakdown[leave.type] = (byDepartment[dept].breakdown[leave.type] || 0) + leave.days
    }

    // Aylık dağılım
    const byMonth = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      label: new Date(2000, i).toLocaleString('tr-TR', { month: 'long' }),
      days: 0,
      count: 0,
    }))

    for (const leave of leaves) {
      const month = new Date(leave.startDate).getMonth()
      byMonth[month].days += leave.days
      byMonth[month].count += 1
    }

    // Kişi bazlı özet
    const byUser = {}
    for (const leave of leaves) {
      const key = leave.userId || 'unknown'
      const name = `${leave.user?.firstName} ${leave.user?.lastName}`
      if (!byUser[key]) {
        byUser[key] = { name, department: leave.user?.profile?.department || '—', totalDays: 0, ANNUAL: 0, SICK: 0, EXCUSE: 0, UNPAID: 0 }
      }
      byUser[key].totalDays += leave.days
      byUser[key][leave.type] = (byUser[key][leave.type] || 0) + leave.days
    }

    return success(res, {
      year: parseInt(year),
      totalApprovedLeaves: leaves.length,
      totalDays: leaves.reduce((s, l) => s + l.days, 0),
      byDepartment: Object.values(byDepartment).sort((a, b) => b.totalDays - a.totalDays),
      byMonth,
      byUser: Object.values(byUser).sort((a, b) => b.totalDays - a.totalDays),
    }, 'İzin raporu getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Rapor getirilemedi', 500)
  }
}

// GET /api/reports/leaves/csv - CSV export
const leaveReportCsv = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query
    const startOfYear = new Date(`${year}-01-01`)
    const endOfYear = new Date(`${year}-12-31T23:59:59`)

    const leaves = await prisma.leaveRequest.findMany({
      where: {
        deletedAt: null,
        status: 'APPROVED',
        startDate: { gte: startOfYear, lte: endOfYear },
      },
      orderBy: { startDate: 'asc' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            profile: { select: { department: true, position: true } },
          },
        },
        reviewer: { select: { firstName: true, lastName: true } },
      },
    })

    const TYPE_LABELS = { ANNUAL: 'Yıllık İzin', SICK: 'Hastalık İzni', EXCUSE: 'Mazeret İzni', UNPAID: 'Ücretsiz İzin' }

    const rows = [
      ['Ad Soyad', 'E-posta', 'Departman', 'Pozisyon', 'İzin Türü', 'Başlangıç', 'Bitiş', 'Gün', 'Onaylayan', 'Onay Tarihi'],
      ...leaves.map((l) => [
        `${l.user?.firstName} ${l.user?.lastName}`,
        l.user?.email || '',
        l.user?.profile?.department || '',
        l.user?.profile?.position || '',
        TYPE_LABELS[l.type] || l.type,
        new Date(l.startDate).toLocaleDateString('tr-TR'),
        new Date(l.endDate).toLocaleDateString('tr-TR'),
        l.days,
        l.reviewer ? `${l.reviewer.firstName} ${l.reviewer.lastName}` : '',
        l.reviewedAt ? new Date(l.reviewedAt).toLocaleDateString('tr-TR') : '',
      ]),
    ]

    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const bom = '﻿'

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="izin-raporu-${year}.csv"`)
    res.send(bom + csv)
  } catch (err) {
    logger.error(err)
    return error(res, 'CSV oluşturulamadı', 500)
  }
}

// GET /api/reports/users - Kullanıcı aktivite raporu
const userReport = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
        profile: { select: { department: true, position: true } },
        _count: {
          select: {
            leaveRequests: true,
            sentMessages: true,
            pollVotes: true,
          },
        },
      },
      orderBy: { lastLoginAt: 'desc' },
    })

    return success(res, users, 'Kullanıcı raporu getirildi')
  } catch (err) {
    logger.error(err)
    return error(res, 'Kullanıcı raporu getirilemedi', 500)
  }
}

module.exports = { leaveReport, leaveReportCsv, userReport }
