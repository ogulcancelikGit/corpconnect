import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
  e.preventDefault()
  if (!email || !password) {
    toast.error('Email ve şifre gerekli')
    return
  }
  setLoading(true)
  try {
    await login({ email, password })
    toast.success('Giriş başarılı')
    navigate('/')
  } catch (err) {
    console.error('Login error:', err)
    toast.error(err?.response?.data?.message || 'Email veya şifre hatalı')
    setPassword('')
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">CC</span>
            </div>
            <h1 className="text-2xl font-semibold text-gray-800">CorpConnect</h1>
          </div>
          <p className="text-gray-500 text-sm">Integrated Corporate Communication Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Giriş yapılıyor...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-4">
          <Link to="/forgot-password" className="text-blue-600 text-sm hover:underline">
            Forgot password?
          </Link>
        </div>

        <div className="border-t border-gray-200 mt-6 pt-4">
          <Link
            to="/register"
            className="w-full block text-center border border-gray-300 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Create new account
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage