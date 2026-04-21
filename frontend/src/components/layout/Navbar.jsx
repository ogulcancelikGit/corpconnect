import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import toast from 'react-hot-toast'

const Navbar = () => {
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Çıkış yapıldı')
      navigate('/login')
    } catch {
      toast.error('Çıkış yapılamadı')
    }
  }

  return (
    <nav className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">CC</span>
          </div>
          <span className="font-semibold text-sm">CorpConnect</span>
        </div>

        <div className="flex items-center gap-1">
          <Link to="/" className="px-3 py-1.5 rounded text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">Dashboard</Link>
          <Link to="/news" className="px-3 py-1.5 rounded text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">News</Link>
          <Link to="/polls" className="px-3 py-1.5 rounded text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">Polls</Link>
          <Link to="/training" className="px-3 py-1.5 rounded text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">Training</Link>
          <Link to="/messages" className="px-3 py-1.5 rounded text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">Messages</Link>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link to="/notifications" className="relative p-2 text-gray-300 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-yellow-500 rounded-full text-xs flex items-center justify-center text-black font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <Link to="/profile" className="text-sm text-gray-300 hover:text-white">
            {user?.firstName} {user?.lastName}
          </Link>
        </div>

        {user?.role === 'ADMIN' && (
          <Link to="/admin" className="px-3 py-1.5 bg-purple-700 rounded text-xs text-white hover:bg-purple-600 transition-colors">
            Admin
          </Link>
        )}

        <button
          onClick={handleLogout}
          className="px-3 py-1.5 bg-red-700 rounded text-xs text-white hover:bg-red-600 transition-colors"
        >
          Çıkış
        </button>
      </div>
    </nav>
  )
}

export default Navbar