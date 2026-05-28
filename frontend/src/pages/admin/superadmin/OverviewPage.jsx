import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../../../services/api.service'
import leaveService from '../../../services/leave.service'
import toast from 'react-hot-toast'
import {
  Users, UserCheck, CalendarOff, Newspaper, BarChart2, MessageSquare,
  RefreshCw, ArrowRight, AlertCircle, Bell, GraduationCap,
  Server, Database, Wifi, FileText,
} from 'lucide-react'
import PageHeader from '../../../components/common/PageHeader'
import SectionLabel from '../../../components/common/SectionLabel'
import StatCard from '../../../components/common/StatCard'
import SkeletonCard from '../../../components/common/SkeletonCard'
import EmptyState from '../../../components/common/EmptyState'
import StatusPill from '../../../components/common/StatusPill'

const ACTION_LABELS = {
  LOGIN:              { label: 'Giriş',              tone: 'blue' },
  LEAVE_CREATE:       { label: 'İzin Talebi',        tone: 'orange' },
  LEAVE_APPROVED:     { label: 'İzin Onayı',         tone: 'green' },
  LEAVE_REJECTED:     { label: 'İzin Reddi',         tone: 'red' },
  LEAVE_CANCELLED:    { label: 'İzin İptali',        tone: undefined },
  USER_STATUS_CHANGE: { label: 'Kullanıcı Durumu',   tone: 'orange' },
  USER_ROLE_CHANGE:   { label: 'Rol Değişikliği',    tone: 'blue' },
  BROADCAST:          { label: 'Toplu Bildirim',     tone: 'blue' },
}

const ProgressRow = ({ label, value, total }) => {
  const pct = total ? Math.round(((value || 0) / total) * 100) : 0
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between items-baseline text-xs mb-1">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className="text-gray-500 tabular-nums">
          {value ?? 0}
          <span className="text-gray-400 ml-1">({pct}%)</span>
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-gray-900 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// eslint-disable-next-line no-unused-vars
const SystemPill = ({ icon: Icon, label, ok }) => (
  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-gray-200 bg-white">
    <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
    <Icon size={11} strokeWidth={1.75} className="text-gray-500" />
    <span className="text-xs text-gray-700">{label}</span>
    <span className={`text-[10px] font-semibold ${ok ? 'text-emerald-600' : 'text-red-600'}`}>
      {ok ? 'OK' : 'HATA'}
    </span>
  </div>
)

const OverviewPage = () => {
  const [stats, setStats] = useState(null)
  const [leaveStats, setLeaveStats] = useState(null)
  const [recentLogs, setRecentLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const [statsRes, leaveRes, logsRes] = await Promise.all([
        api.get('/admin/stats'),
        leaveService.getLeaveStats(),
        api.get('/logs', { params: { limit: 8 } }),
      ])
      setStats(statsRes.data.data)
      setLeaveStats(leaveRes.data)
      setRecentLogs(logsRes.data.data)
      setLastRefresh(new Date())
    } catch {
      toast.error('Veriler getirilemedi')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const formatLog = (d) =>
    new Date(d).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

  const lastRefreshStr = lastRefresh.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Sistem Kontrol Paneli"
        description={`Son güncelleme: ${lastRefreshStr}`}
        actions={
          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-700 rounded-md text-sm font-medium hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={13} strokeWidth={1.75} className={refreshing ? 'animate-spin' : ''} /> Yenile
          </button>
        }
      />

      {/* Sistem durumu şeridi */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-1">Sistem</span>
        <SystemPill icon={Server} label="API Sunucu" ok />
        <SystemPill icon={Database} label="Veritabanı" ok />
        <SystemPill icon={Wifi} label="WebSocket" ok />
      </div>

      {/* İşlem gerektiren uyarılar */}
      {leaveStats?.pending > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <AlertCircle size={16} className="text-orange-600 shrink-0" />
          <p className="text-sm text-orange-900">
            <span className="font-semibold tabular-nums">{leaveStats.pending} bekleyen izin talebi</span>
            {' '}inceleme bekliyor.
          </p>
          <Link
            to="/superadmin/leaves"
            className="ml-auto inline-flex items-center gap-1 text-xs text-orange-700 hover:text-orange-900 font-medium shrink-0"
          >
            İncele <ArrowRight size={11} strokeWidth={2} />
          </Link>
        </div>
      )}

      {/* Ana stat kartları */}
      <div>
        <SectionLabel>Özet</SectionLabel>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} variant="stat" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Toplam Kullanıcı" value={stats?.users?.total ?? 0}        icon={Users}         to="/superadmin/users" />
            <StatCard label="Aktif Kullanıcı"  value={stats?.users?.active ?? 0}       icon={UserCheck}     to="/superadmin/users" />
            <StatCard label="Bekleyen İzin"    value={leaveStats?.pending ?? 0}        icon={CalendarOff}   to="/superadmin/leaves" />
            <StatCard label="Toplam Mesaj"     value={stats?.activity?.messages ?? 0}  icon={MessageSquare} />
            <StatCard label="Toplam Haber"     value={stats?.content?.news ?? 0}       icon={Newspaper} />
            <StatCard label="Aktif Anket"      value={stats?.content?.activePolls ?? 0} icon={BarChart2} />
            <StatCard label="Bildirim"         value={stats?.activity?.notifications ?? 0} icon={Bell} />
            <StatCard label="Eğitim"           value={stats?.content?.trainings ?? 0}  icon={GraduationCap} />
          </div>
        )}
      </div>

      {/* Alt panel grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Rol & izin dağılımı */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-5">
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Rol Dağılımı</h3>
            <ProgressRow label="Admin"   value={stats?.users?.byRole?.admin}    total={stats?.users?.total} />
            <ProgressRow label="Manager" value={stats?.users?.byRole?.manager}  total={stats?.users?.total} />
            <ProgressRow label="Çalışan" value={stats?.users?.byRole?.employee} total={stats?.users?.total} />
          </div>
          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">İzin Durumu</h3>
            <ProgressRow label="Bekliyor"   value={leaveStats?.pending}  total={leaveStats?.total} />
            <ProgressRow label="Onaylandı"  value={leaveStats?.approved} total={leaveStats?.total} />
            <ProgressRow label="Reddedildi" value={leaveStats?.rejected} total={leaveStats?.total} />
          </div>
        </div>

        {/* Son aktivite logu */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <FileText size={13} strokeWidth={1.75} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900">Son Aktiviteler</h3>
            </div>
            <Link
              to="/superadmin/logs"
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors"
            >
              Tüm loglar <ArrowRight size={11} strokeWidth={2} />
            </Link>
          </div>
          {loading ? (
            <div className="divide-y divide-gray-100">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} variant="row" />)}
            </div>
          ) : recentLogs.length === 0 ? (
            <EmptyState icon={FileText} title="Log bulunamadı" />
          ) : (
            <div className="divide-y divide-gray-100">
              {recentLogs.map((log) => {
                const info = ACTION_LABELS[log.action]
                return (
                  <div key={log.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 transition-colors">
                    <StatusPill label={info?.label || log.action} tone={info?.tone} className="shrink-0" />
                    <span className="text-xs text-gray-700 font-medium truncate flex-1">
                      {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Sistem'}
                    </span>
                    <span className="text-xs text-gray-500 truncate max-w-[160px]">{log.detail || '—'}</span>
                    <span className="text-xs text-gray-400 tabular-nums whitespace-nowrap shrink-0">{formatLog(log.createdAt)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OverviewPage
