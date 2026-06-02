const request = require('supertest')
const { app } = require('../src/server')
const prisma = require('../src/config/database')

// Görev CRUD yaşam döngüsü smoke testi (oluştur → oku → sil).
// Oluşturduğu kaydı sildiği için DB temiz kalır (self-cleaning).
// Önkoşul: MySQL ayakta + seed.

let token
let taskId

beforeAll(async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@corpconnect.com', password: 'Admin123!' })
  token = res.body.data.accessToken
})

afterAll(async () => {
  // Güvenlik ağı: test başarısız kalsa bile artık kaydı temizle
  if (taskId) {
    await request(app).delete(`/api/tasks/${taskId}`).set('Authorization', `Bearer ${token}`)
  }
  await prisma.$disconnect()
})

describe('Görev yaşam döngüsü', () => {
  test('POST /api/tasks → görev oluşturur', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Smoke test görevi', priority: 'HIGH' })
    expect(res.body.success).toBe(true)
    expect(res.body.data.id).toBeDefined()
    taskId = res.body.data.id
  })

  test('GET /api/tasks/:id → oluşturulan görevi döner', async () => {
    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.title).toBe('Smoke test görevi')
  })

  test('DELETE /api/tasks/:id → görevi siler', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    taskId = null
  })
})
