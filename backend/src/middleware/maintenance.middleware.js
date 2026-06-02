const prisma = require('../config/database')
const { verifyAccessToken } = require('../utils/jwt.util')
const logger = require('../utils/logger')

// Bakım modu bayrağı bellekte tutulur; her istekte DB okunmaz.
// - Başlangıçta loadMaintenanceMode() ile DB'den yüklenir
// - Ayar değiştiğinde setMaintenanceMode() ile güncellenir
let maintenanceMode = false

const isMaintenanceMode = () => maintenanceMode

const setMaintenanceMode = (value) => {
  maintenanceMode = value === true || value === 'true'
}

const loadMaintenanceMode = async () => {
  try {
    const setting = await prisma.systemSettings.findUnique({
      where: { settingKey: 'maintenance_mode' },
    })
    setMaintenanceMode(setting?.settingValue)
    logger.info(`Bakım modu durumu yüklendi: ${maintenanceMode ? 'AÇIK' : 'kapalı'}`)
  } catch (err) {
    // Ayar okunamazsa sistemi kilitleme — kapalı varsay
    maintenanceMode = false
    logger.error(err)
  }
}

// Bakım açıkken yalnızca ADMIN sistemi kullanabilir; diğer herkes 503 alır.
// /auth ve /maintenance yolları muaftır (admin giriş yapabilsin, durum sorgulanabilsin).
const maintenanceGuard = (req, res, next) => {
  if (!maintenanceMode) return next()

  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null

  if (token) {
    try {
      const decoded = verifyAccessToken(token)
      if (decoded.role === 'ADMIN') return next()
    } catch {
      // geçersiz/expired token → engelle
    }
  }

  return res.status(503).json({
    success: false,
    maintenance: true,
    message: 'Sistem şu anda bakımda. Lütfen daha sonra tekrar deneyin.',
  })
}

module.exports = {
  maintenanceGuard,
  isMaintenanceMode,
  setMaintenanceMode,
  loadMaintenanceMode,
}
