const nodemailer = require('nodemailer')
const logger = require('./logger')

// SMTP transporter — sağlayıcıdan bağımsız (Mailtrap, Gmail, Outlook, SendGrid SMTP...).
// .env üzerinden yapılandırılır. Tek sefer oluşturulup yeniden kullanılır.
let transporter = null

const isConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER)

const getTransporter = () => {
  if (transporter) return transporter

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    // 465 → SSL (secure), diğer portlar (587/2525) → STARTTLS
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  return transporter
}

const sendMail = async ({ to, subject, html, text }) => {
  const from = process.env.SMTP_FROM || 'CorpConnect <no-reply@corpconnect.local>'

  // SMTP yapılandırılmamışsa hata fırlatma — geliştirme akışını bozmamak için logla.
  if (!isConfigured()) {
    logger.warn(`SMTP yapılandırılmamış — mail gönderilmedi. Alıcı: ${to}, Konu: ${subject}`)
    return { skipped: true }
  }

  const info = await getTransporter().sendMail({ from, to, subject, html, text })
  logger.info(`Mail gönderildi → ${to} (messageId: ${info.messageId})`)
  return info
}

// Şifre sıfırlama maili — resetUrl frontend'in /reset-password?token=... bağlantısıdır.
const sendPasswordResetEmail = async (to, resetUrl, firstName = '') => {
  const subject = 'CorpConnect — Şifre Sıfırlama'
  const greeting = firstName ? `Merhaba ${firstName},` : 'Merhaba,'

  const text =
    `${greeting}\n\n` +
    `Hesabınız için şifre sıfırlama talebinde bulunuldu. ` +
    `Yeni şifrenizi belirlemek için aşağıdaki bağlantıyı kullanın (1 saat geçerlidir):\n\n` +
    `${resetUrl}\n\n` +
    `Bu talebi siz yapmadıysanız bu e-postayı yok sayabilirsiniz.\n\nCorpConnect`

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#1f2937">
    <h2 style="font-size:18px;font-weight:600;margin:0 0 16px">CorpConnect — Şifre Sıfırlama</h2>
    <p style="font-size:14px;line-height:1.6">${greeting}</p>
    <p style="font-size:14px;line-height:1.6">
      Hesabınız için şifre sıfırlama talebinde bulunuldu. Yeni şifrenizi belirlemek için
      aşağıdaki düğmeye tıklayın. Bağlantı <strong>1 saat</strong> boyunca geçerlidir.
    </p>
    <p style="margin:24px 0">
      <a href="${resetUrl}"
         style="background:#111827;color:#fff;text-decoration:none;font-size:14px;font-weight:500;padding:10px 20px;border-radius:6px;display:inline-block">
        Şifremi Sıfırla
      </a>
    </p>
    <p style="font-size:12px;color:#6b7280;line-height:1.6">
      Düğme çalışmazsa bu bağlantıyı tarayıcınıza yapıştırın:<br>
      <a href="${resetUrl}" style="color:#2563eb;word-break:break-all">${resetUrl}</a>
    </p>
    <p style="font-size:12px;color:#6b7280;line-height:1.6;margin-top:24px">
      Bu talebi siz yapmadıysanız bu e-postayı yok sayabilirsiniz.
    </p>
  </div>`

  return sendMail({ to, subject, html, text })
}

module.exports = { sendMail, sendPasswordResetEmail, isConfigured }
