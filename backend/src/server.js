const express = require('express')
const http = require('http')
const cors = require('cors')
const dotenv = require('dotenv')
const rateLimit = require('express-rate-limit')
const corsOptions = require('./config/cors')
const helmetConfig = require('./config/helmet')
const { initSocket } = require('./config/socket')
const { errorHandler } = require('./middleware/error.middleware')
const routes = require('./routes/index')
const path = require('path')
const logger = require('./utils/logger')
const celebrationJob = require('./jobs/celebrationJob')

dotenv.config()

const app = express()
const server = http.createServer(app)

initSocket(server)

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Çok fazla istek gönderildi, lütfen bekleyin' },
  skip: (req) => req.path === '/api/health',
})

app.use(helmetConfig)
app.use(cors(corsOptions))
app.use(globalLimiter)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.use('/api', routes)

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server çalışıyor', timestamp: new Date() })
})

app.use(errorHandler)

const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
  logger.info(`Server ${PORT} portunda çalışıyor — ortam: ${process.env.NODE_ENV || 'development'}`)
  celebrationJob.start()
})

module.exports = { app, server }