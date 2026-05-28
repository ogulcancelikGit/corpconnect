import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api.service'
import leaveService from '../../services/leave.service'
import { formatDate } from '../../utils/dateFormat'
import toast from 'react-hot-toast'

const LEAVE_TYPE_LABELS = {
  ANNUAL: 'Yıllık İzin',
  SICK: 'Hastalık İzni',
  EXCUSE: 'Mazeret İzni',
  UNPAID: 'Ücretsiz İzin',
}

const ROLE_LABELS = { ADMIN: 'Admin', MANAGER: 'Manager', EMPLOYEE: 'Çalışan' }
const ROLE_COLORS = {
  ADMIN: 'bg-purple-100 text-purple-700',
  MANAGER: 'bg-blue-100 text-blue-700',
  EMPLOYEE: 'bg-gray-100 text-gray-600',
}

const sections = [
  { key: 'overview', label: 'Genel Bakış', icon: '📊' },
  { key: 'leaves', label: 'İzin Talepleri', icon: '🗓️' },
  { key: 'users', label: 'Kullanıcılar', icon: '👥' },
  { key: 'settings', label: 'Sistem Ayarları', icon: '⚙️' },
]

// ─── OVERVIEW ──────────────────────────────────────────────────────────────
const OverviewSection = () => {
  const [stats, setStats] = useState(null)
  const [leaveStats, setLeaveStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats').then((r) => setStats(r.data.data)),
      leaveService.getLeaveStats().then((r) => setLeaveStats(r.data)),
    ]).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>

  const cards = [
    { label: 'Toplam Kullanıcı', value: stats?.users?.total, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Aktif Kullanıcı', value: stats?.users?.active, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Bekleyen İzin', value: leaveStats?.pending, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Toplam Haber', value: stats?.content?.news, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Aktif Anket', value: stats?.content?.activePolls, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Toplam Mesaj', value: stats?.activity?.messages, color: 'text-gray-600', bg: 'bg-gray-50' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className={`${c.bg} rounded-xl p-5`}>
            <div className={`text-3xl font-bold ${c.color}`}>{c.value ?? 0}</div>
            <div className="text-sm text-gray-500 mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Rol Dağılımı</h3>
          {[
            { label: 'Admin', value: stats?.users?.byRole?.admin, cls: 'bg-purple-500' },
            { label: 'Manager', value: stats?.users?.byRole?.manager, cls: 'bg-blue-500' },
            { label: 'Çalışan', value: stats?.users?.byRole?.employee, cls: 'bg-gray-400' },
          ].map((r) => {
            const pct = stats?.users?.total ? Math.round((r.value / stats.users.total) * 100) : 0
            return (
              <div key={r.label} className="mb-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{r.label}</span><span>{r.value} ({pct}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div className={`h-2 ${r.cls} rounded-full`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">İzin Durumu</h3>
          {[
            { label: 'Bekliyor', value: leaveStats?.pending, cls: 'bg-yellow-400' },
            { label: 'Onaylandı', value: leaveStats?.approved, cls: 'bg-green-500' },
            { label: 'Reddedildi', value: leaveStats?.rejected, cls: 'bg-red-400' },
          ].map((r) => {
            const pct = leaveStats?.total ? Math.round((r.value / leaveStats.total) * 100) : 0
            return (
              <div key={r.label} className="mb-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{r.label}</span><span>{r.value ?? 0}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div className={`h-2 ${r.cls} rounded-full`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── LEAVES ────────────────────────────────────────────────────────────────
const LeavesSection = () => {
  const [leaves, setLeaves] = useState([])
  const [filter, setFilter] = useState('PENDING')
  const [loading, setLoading] = useState(true)
  const [reviewModal, setReviewModal] = useState(null)
  const [reviewNote, setReviewNote] = useState('')

  useEffect(() => { fetchLeaves() }, [filter])

  const fetchLeaves = async () => {
    setLoading(true)
    try {
      const res = await leaveService.getAllLeaves({ limit: 50, status: filter || undefined })
      setLeaves(res.data)
    } catch { toast.error('İzin talepleri getirilemedi') }
    finally { setLoading(false) }
  }

  const handleReview = async (status) => {
    try {
      await leaveService.reviewLeave(reviewModal.id, { status, reviewNote })
      toast.success(status === 'APPROVED' ? 'Onaylandı' : 'Reddedildi')
      setReviewModal(null)
      setReviewNote('')
      fetchLeaves()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'İşlem başarısız')
    }
  }

  const STATUS_STYLES = {
    PENDING:   { label: 'Bekliyor',   cls: 'bg-yellow-100 text-yellow-700' },
    APPROVED:  { label: 'Onaylandı',  cls: 'bg-green-100 text-green-700' },
    REJECTED:  { label: 'Reddedildi', cls: 'bg-red-100 text-red-700' },
    CANCELLED: { label: 'İptal',      cls: 'bg-gray-100 text-gray-500' },
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {[['PENDING','Bekleyenler'], ['APPROVED','Onaylananlar'], ['REJECTED','Reddedilenler'], ['','Tümü']].map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === v ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : leaves.length === 0 ? (
        <div className="text-center text-gray-400 py-12">İzin talebi bulunamadı</div>
      ) : (
        <div className="space-y-2">
          {leaves.map((leave) => {
            const st = STATUS_STYLES[leave.status]
            return (
              <div key={leave.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {leave.user?.firstName} {leave.user?.lastName}
                    {leave.user?.profile?.department && <span className="text-gray-400 font-normal ml-2">· {leave.user.profile.department}</span>}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {LEAVE_TYPE_LABELS[leave.type]} · {leave.days} gün · {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
                  </p>
                  {leave.reason && <p className="text-xs text-gray-400 mt-0.5">"{leave.reason}"</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.cls}`}>{st.label}</span>
                  {leave.status === 'PENDING' && (
                    <button onClick={() => setReviewModal(leave)}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">
                      İncele
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {reviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-1">İzin Talebi İncele</h2>
            <p className="text-sm text-gray-500 mb-1">{reviewModal.user?.firstName} {reviewModal.user?.lastName} — {LEAVE_TYPE_LABELS[reviewModal.type]} ({reviewModal.days} gün)</p>
            <p className="text-xs text-gray-400 mb-4">{formatDate(reviewModal.startDate)} – {formatDate(reviewModal.endDate)}</p>
            {reviewModal.reason && <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mb-4">"{reviewModal.reason}"</p>}
            <div className="mb-4">
              <label className="text-sm text-gray-600 mb-1 block">Not (opsiyonel)</label>
              <textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Red sebebi veya açıklama..." />
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleReview('APPROVED')} className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm hover:bg-green-700">Onayla</button>
              <button onClick={() => handleReview('REJECTED')} className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm hover:bg-red-700">Reddet</button>
              <button onClick={() => { setReviewModal(null); setReviewNote('') }} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50">Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── USERS ─────────────────────────────────────────────────────────────────
const UsersSection = () => {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchUsers() }, [search])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/users', { params: { search: search || undefined, limit: 50 } })
      setUsers(res.data.data)
    } catch { toast.error('Kullanıcılar getirilemedi') }
    finally { setLoading(false) }
  }

  const toggleActive = async (userId, current) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { isActive: !current })
      toast.success(current ? 'Kullanıcı devre dışı bırakıldı' : 'Kullanıcı aktif edildi')
      fetchUsers()
    } catch { toast.error('İşlem başarısız') }
  }

  const changeRole = async (userId, role) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role })
      toast.success('Rol güncellendi')
      fetchUsers()
    } catch { toast.error('Rol güncellenemedi') }
  }

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="İsim veya e-posta ile ara..."
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-800">{u.firstName} {u.lastName}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role]}`}>{ROLE_LABELS[u.role]}</span>
                  {!u.isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">Pasif</span>}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{u.email} {u.profile?.department && `· ${u.profile.department}`}</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={u.role}
                  onChange={(e) => changeRole(u.id, e.target.value)}
                  className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="EMPLOYEE">Çalışan</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <button
                  onClick={() => toggleActive(u.id, u.isActive)}
                  className={`px-3 py-1.5 text-xs rounded-lg ${u.isActive ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                >
                  {u.isActive ? 'Devre Dışı' : 'Aktif Et'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── SETTINGS ──────────────────────────────────────────────────────────────
const SettingsSection = () => {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/admin/settings').then((r) => {
      setSettings(r.data.data || {})
    }).finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/admin/settings', settings)
      toast.success('Ayarlar kaydedildi')
    } catch { toast.error('Ayarlar kaydedilemedi') }
    finally { setSaving(false) }
  }

  const fields = [
    { key: 'company_name', label: 'Şirket Adı', type: 'text' },
    { key: 'max_annual_leave', label: 'Yıllık İzin Günü (varsayılan)', type: 'number' },
    { key: 'leave_approval_required', label: 'İzin Onayı Zorunlu', type: 'select', options: [['true','Evet'],['false','Hayır']] },
    { key: 'maintenance_mode', label: 'Bakım Modu', type: 'select', options: [['false','Kapalı'],['true','Açık']] },
  ]

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>

  return (
    <div className="max-w-lg space-y-4">
      {fields.map((f) => (
        <div key={f.key}>
          <label className="text-sm text-gray-600 mb-1 block">{f.label}</label>
          {f.type === 'select' ? (
            <select
              value={settings[f.key] || ''}
              onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ) : (
            <input
              type={f.type}
              value={settings[f.key] || ''}
              onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          )}
        </div>
      ))}
      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? 'Kaydediliyor...' : 'Kaydet'}
      </button>
    </div>
  )
}

// ─── ANA SAYFA ─────────────────────────────────────────────────────────────
const SuperAdminPage = () => {
  const [active, setActive] = useState('overview')

  const renderSection = () => {
    switch (active) {
      case 'overview': return <OverviewSection />
      case 'leaves':   return <LeavesSection />
      case 'users':    return <UsersSection />
      case 'settings': return <SettingsSection />
      default:         return null
    }
  }

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <aside className="w-52 flex-shrink-0">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-900">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">SuperAdmin</p>
          </div>
          <nav className="p-2 space-y-1">
            {sections.map((s) => (
              <button
                key={s.key}
                onClick={() => setActive(s.key)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                  active === s.key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </nav>
          <div className="p-2 border-t border-gray-100">
            <Link
              to="/admin/users"
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100"
            >
              <span>👤</span>
              <span>Eski Admin</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0">
        <h1 className="text-xl font-semibold text-gray-800 mb-6">
          {sections.find((s) => s.key === active)?.icon}{' '}
          {sections.find((s) => s.key === active)?.label}
        </h1>
        {renderSection()}
      </main>
    </div>
  )
}

export default SuperAdminPage
