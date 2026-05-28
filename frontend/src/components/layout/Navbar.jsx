import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import toast from 'react-hot-toast'
import { Bell, LogOut, User, ChevronDown } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/',             label: 'Ana Sayfa',  end: true },
  { to: '/news',         label: 'Haberler' },
  { to: '/polls',        label: 'Anketler' },
  { to: '/training',     label: 'Eğitimler' },
  { to: '/messages',     label: 'Mesajlar' },
  { to: '/leaves',       label: 'İzinler' },
  { to: '/tasks',        label: 'Görevler' },
  { to: '/expenses',     label: 'Masraflar' },
  { to: '/calendar',     label: 'Takvim' },
  { to: '/suggestions',  label: 'Öneriler' },
  { to: '/celebrations', label: 'Kutlamalar' },
]

const Navbar = () => {
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      setDropdownOpen(false)
      await logout()
      toast.success('Çıkış yapıldı')
      navigate('/login')
    } catch {
      toast.error('Çıkış yapılamadı')
    }
  }

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center gap-6">

        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 bg-gray-900 rounded-md flex items-center justify-center">
            <span className="text-white text-[11px] font-bold tracking-tight">CC</span>
          </div>
          <span className="font-semibold text-gray-900 text-sm tracking-tight hidden sm:block">
            CorpConnect
          </span>
        </NavLink>

        {/* Nav tabs — underline active, centered */}
        <div className="flex items-center justify-center h-14 overflow-x-auto scrollbar-hide flex-1 min-w-0">
          {NAV_ITEMS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative h-full flex items-center px-3 text-[13px] whitespace-nowrap transition-colors ${
                  isActive
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-500 hover:text-gray-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Notification Bell */}
          <NavLink
            to="/notifications"
            className="relative w-9 h-9 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <Bell size={17} strokeWidth={1.75} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            )}
          </NavLink>

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
            >
              <div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-[11px] font-semibold text-white">
                {initials}
              </div>
              <span className="text-gray-800 text-[13px] font-medium hidden sm:block max-w-[120px] truncate">
                {user?.firstName} {user?.lastName}
              </span>
              <ChevronDown
                size={12}
                className={`text-gray-400 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-gray-900 text-sm font-medium truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-gray-500 text-xs truncate mt-0.5">{user?.email}</p>
                </div>
                <div className="py-1">
                  <NavLink
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User size={14} className="text-gray-400" />
                    Profilim
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={14} />
                    Çıkış Yap
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
