const request = require('supertest')
const { app } = require('../src/server')
const prisma = require('../src/config/database')

// Rol bazlı yetkilendirme (RBAC) smoke testleri.
// Önkoşul: MySQL ayakta + seed (admin/employee hesapları).

let adminToken
let employeeToken

const login = async (email, password) => {
  const res = await request(app).post('/api/auth/login').send({ email, password })
  return res.body.data.accessToken
}

beforeAll(async () => {
  adminToken = await login('admin@corpconnect.com', 'Admin123!')
  employeeToken = await login('employee@corpconnect.com', 'Admin123!')
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('Admin-only endpoint (/api/admin/stats)', () => {
  test('EMPLOYEE erişimi → 403', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${employeeToken}`)
    expect(res.status).toBe(403)
  })

  test('ADMIN erişimi → 200', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })
})
