import { useState } from 'react'
import { Link } from 'react-router-dom'
import authService from '../../services/auth.service'
import toast from 'react-hot-toast'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      toast.error('Email adresi gerekli')
      return
    }
    setLoading(true)
    try {
      await authService.forgotPassword(email)
      setSent(true)
      toast.success('Şifre sıfırlama maili gönderildi')
    } catch {
      toast.error('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">CC</span>
            </div>
            <h1 className="text-2xl font-semibold text-gray-800">CorpConnect</h1>
          </div>
          <p className="text-gray-500 text-sm">Şifrenizi sıfırlayın</p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="text-4xl mb-3">📧</div>
            <p className="text-gray-600 text-sm mb-4">
              Şifre sıfırlama bağlantısı <strong>{email}</strong> adresine gönderildi.
            </p>
            <Link
              to="/login"
              className="w-full block text-center bg-blue-600 text-white rounded-lg py-2.5 text-sm hover:bg-blue-700"
            >
              Giriş sayfasına dön
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email adresi</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="name@company.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Gönderiliyor...' : 'Sıfırlama Maili Gönder'}
            </button>
            <Link
              to="/login"
              className="w-full block text-center border border-gray-300 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              Giriş sayfasına dön
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}

export default ForgotPasswordPage