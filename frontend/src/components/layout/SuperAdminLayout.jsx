import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api.service'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, CalendarOff, Receipt, Users, FileText,
  BarChart2, Megaphone, Lightbulb, Settings, LogOut,
  ChevronLeft, ChevronRight, ShieldCheck, AlertTriangle,
  Clock,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/superadmin',             label: 'Genel Bakış',     icon: LayoutDashboard, end: true },
  { to: '/superadmin/leaves',      label: 'İzin Talepleri',  icon: CalendarOff },
  { to: '/superadmin/expenses',    label: 'Masraf Yönetimi', icon: Receipt },
  { to: '/superadmin/users',       label: 'Kullanıcılar',    icon: Users },
  { to: '/superadmin/logs',        label: 'Sistem Logları',  icon: FileText },
  { to: '/superadmin/reports',     label: 'Raporlar',        icon: BarChart2 },
  { to: '/superadmin/broadcast',   label: 'Toplu Bildirim',  icon: Megaphone },
  { to: '/superadmin/suggestions', label: 'Öneriler',        icon: Lightbulb },
  { to: '/superadmin/settings',    label: 'Sistem Ayarları', icon: Settings },
]

const SuperAdminLayout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    api.get('/admin/settings')
      .then((r) => setMaintenanceMode(r.data.data?.maintenance_mode === 'true'))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Çıkış yapıldı')
      navigate('/login')
    } catch {
      toast.error('Çıkış yapılamadı')
    }
  }

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`
  const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-[56px]' : 'w-56'} shrink-0 bg-gray-950 flex flex-col transition-all duration-200 border-r border-gray-900`}>

        {/* Brand */}
        <div className="flex items-center gap-3 px-3 py-3.5 border-b border-gray-900">
          <div className="w-8 h-8 bg-white/10 rounded-md flex items-center justify-center shrink-0">
            <ShieldCheck size={15} className="text-white" strokeWidth={2} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold tracking-wide">SUPERADMIN</p>
              <p className="text-gray-500 text-[10px]">CorpConnect</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 space-y-0.5 px-2 overflow-y-auto">
          {/* eslint-disable-next-line no-unused-vars */}
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={14} strokeWidth={isActive ? 2 : 1.75} className="shrink-0" />
                  {!collapsed && <span className="truncate font-medium">{label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom user section */}
        <div className="border-t border-gray-900 p-2 space-y-1">
          {!collapsed && (
            <div className="flex items-center gap-2 px-2 py-2 rounded-md bg-white/5 mb-1">
              <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-semibold text-white shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-gray-200 text-[11px] font-medium truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-gray-500 text-[10px] truncate">{user?.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title={collapsed ? 'Çıkış Yap' : undefined}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs text-gray-500 hover:text-red-400 hover:bg-white/5 transition-colors"
          >
            <LogOut size={13} className="shrink-0" />
            {!collapsed && <span className="font-medium">Çıkış Yap</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-7 border-t border-gray-900 text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-colors"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Right side */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="h-10 bg-gray-950 border-b border-gray-900 flex items-center justify-between px-5 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${maintenanceMode ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
              <span className="text-[11px] text-gray-400 font-medium">
                {maintenanceMode ? 'Bakım Modu Aktif' : 'Sistem Çevrimiçi'}
              </span>
            </div>
            {maintenanceMode && (
              <div className="flex items-center gap-1 bg-amber-950/60 border border-amber-900/60 rounded px-2 py-0.5">
                <AlertTriangle size={10} className="text-amber-400" />
                <span className="text-[10px] text-amber-400 font-medium">BAKIM MODU</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <Clock size={11} strokeWidth={1.75} />
            <span className="tabular-nums">{timeStr}</span>
            <span className="text-gray-700 mx-1">·</span>
            <span>{dateStr}</span>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default SuperAdminLayout
