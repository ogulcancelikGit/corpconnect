const request = require('supertest')
const { app } = require('../src/server')
const prisma = require('../src/config/database')

// Sağlık + kimlik doğrulama smoke testleri.
// Önkoşul: MySQL ayakta ve `npm run seed` ile demo hesaplar oluşturulmuş olmalı.

afterAll(async () => {
  await prisma.$disconnect()
})

describe('Sağlık', () => {
  test('GET /api/health → 200 ve success', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })
})

describe('Kimlik doğrulama', () => {
  test('Doğru bilgilerle login → 200 ve accessToken', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@corpconnect.com', password: 'Admin123!' })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(typeof res.body.data.accessToken).toBe('string')
  })

  test('Yanlış şifre → 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@corpconnect.com', password: 'yanlis-sifre' })
    expect(res.status).toBe(401)
  })

  test('Eksik alan (şifre yok) → 400 doğrulama hatası', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@corpconnect.com' })
    expect(res.status).toBe(400)
  })

  test('Token olmadan korumalı endpoint → 401', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })
})
