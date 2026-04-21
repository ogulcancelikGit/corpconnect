const express = require('express')
const http = require('http')
const cors = require('cors')
const dotenv = require('dotenv')
const corsOptions = require('./config/cors')
const helmetConfig = require('./config/helmet')
const { initSocket } = require('./config/socket')
const { errorHandler } = require('./middleware/error.middleware')
const routes = require('./routes/index')
const path = require('path')

dotenv.config()

const app = express()
const server = http.createServer(app)

initSocket(server)

app.use(helmetConfig)
app.use(cors(corsOptions))
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
  console.log(`Server ${PORT} portunda çalışıyor`)
  console.log(`Ortam: ${process.env.NODE_ENV}`)
})

module.exports = { app, server }