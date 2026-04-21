const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Seed başlıyor...')

  // Admin kullanıcısı oluştur
  const hashedPassword = await bcrypt.hash('Admin123!', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@corpconnect.com' },
    update: {},
    create: {
      email: 'admin@corpconnect.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isActive: true,
      emailVerified: true,
      profile: {
        create: {
          department: 'IT',
          position: 'System Administrator',
        },
      },
    },
  })

  console.log('Admin oluşturuldu:', admin.email)

  // Manager kullanıcısı oluştur
  const manager = await prisma.user.upsert({
    where: { email: 'manager@corpconnect.com' },
    update: {},
    create: {
      email: 'manager@corpconnect.com',
      password: hashedPassword,
      firstName: 'Manager',
      lastName: 'User',
      role: 'MANAGER',
      isActive: true,
      emailVerified: true,
      profile: {
        create: {
          department: 'HR',
          position: 'HR Manager',
        },
      },
    },
  })

  console.log('Manager oluşturuldu:', manager.email)

  // Employee kullanıcısı oluştur
  const employee = await prisma.user.upsert({
    where: { email: 'employee@corpconnect.com' },
    update: {},
    create: {
      email: 'employee@corpconnect.com',
      password: hashedPassword,
      firstName: 'Employee',
      lastName: 'User',
      role: 'EMPLOYEE',
      isActive: true,
      emailVerified: true,
      profile: {
        create: {
          department: 'Sales',
          position: 'Sales Representative',
        },
      },
    },
  })

  console.log('Employee oluşturuldu:', employee.email)

  // Sistem ayarları oluştur
  const settings = [
    { settingKey: 'app_name', settingValue: 'CorpConnect' },
    { settingKey: 'app_version', settingValue: '2.0.0' },
    { settingKey: 'max_file_size', settingValue: '10485760' },
    { settingKey: 'allowed_file_types', settingValue: 'jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,ppt,pptx,zip,mp4' },
    { settingKey: 'maintenance_mode', settingValue: 'false' },
  ]

  for (const setting of settings) {
    await prisma.systemSettings.upsert({
      where: { settingKey: setting.settingKey },
      update: { settingValue: setting.settingValue },
      create: setting,
    })
  }

  console.log('Sistem ayarları oluşturuldu')
  console.log('Seed tamamlandı!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })