import { useState, useEffect, useCallback } from 'react'
import api from '../../../services/api.service'
import toast from 'react-hot-toast'
import { FileText, RefreshCw, Filter } from 'lucide-react'
import PageHeader from '../../../components/common/PageHeader'
import SkeletonCard from '../../../components/common/SkeletonCard'
import EmptyState from '../../../components/common/EmptyState'
import StatusPill from '../../../components/common/StatusPill'
import Pagination from '../../../components/common/Pagination'

const ACTION_META = {
  LOGIN:              { label: 'Giriş',            tone: 'blue' },
  LEAVE_CREATE:       { label: 'İzin Talebi',      tone: 'orange' },
  LEAVE_APPROVED:     { label: 'İzin Onayı',       tone: 'green' },
  LEAVE_REJECTED:     { label: 'İzin Reddi',       tone: 'red' },
  LEAVE_CANCELLED:    { label: 'İzin İptali',      tone: undefined },
  USER_STATUS_CHANGE: { label: 'Kullanıcı Durumu', tone: 'orange' },
  USER_ROLE_CHANGE:   { label: 'Rol Değişikliği',  tone: 'blue' },
  BROADCAST:          { label: 'Toplu Bildirim',   tone: 'blue' },
}

const formatDate = (d) =>
  new Date(d).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })

const LogsAdminPage = () => {
  const [logs, setLogs] = useState([])
  const [actionTypes, setActionTypes] = useState([])
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    api.get('/logs/actions').then((r) => setActionTypes(r.data.data)).catch(() => {})
  }, [])

  useEffect(() => { setPage(1) }, [filter])

  const fetchLogs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await api.get('/logs', { params: { page, limit: 25, action: filter || undefined } })
      setLogs(res.data.data)
      setMeta(res.data.meta)
    } catch {
      toast.error('Loglar getirilemedi')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [page, filter])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Sistem Audit Logu"
        description={`Tüm kritik işlemlerin zaman damgalı kaydı${meta ? ` · ${meta.total} kayıt` : ''}`}
        actions={
          <button
            onClick={() => fetchLogs(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-700 rounded-md text-sm font-medium hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={13} strokeWidth={1.75} className={refreshing ? 'animate-spin' : ''} /> Yenile
          </button>
        }
      />

      {/* Filtre çubuğu */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="inline-flex items-center gap-1.5 text-xs text-gray-500 mr-1">
          <Filter size={12} strokeWidth={1.75} />
          <span>Filtre:</span>
        </div>
        <button
          onClick={() => setFilter('')}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            filter === ''
              ? 'bg-gray-900 text-white'
              : 'border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          Tümü {meta && <span className="opacity-70 tabular-nums">({meta.total})</span>}
        </button>
        {actionTypes.map((a) => {
          const info = ACTION_META[a.action]
          const isActive = filter === a.action
          return (
            <button
              key={a.action}
              onClick={() => setFilter(a.action)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {info?.label || a.action} <span className="opacity-60 tabular-nums">({a.count})</span>
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} variant="row" />)}
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg">
          <EmptyState icon={FileText} title="Bu filtre için log bulunamadı" />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Zaman</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kullanıcı</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">İşlem</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Detay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => {
                const info = ACTION_META[log.action]
                return (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-xs text-gray-500 tabular-nums whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      {log.user ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-semibold text-gray-700 shrink-0">
                            {log.user.firstName?.[0]}{log.user.lastName?.[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">{log.user.firstName} {log.user.lastName}</p>
                            <p className="text-[10px] text-gray-500">{log.user.role}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Sistem</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill label={info?.label || log.action} tone={info?.tone} />
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-600 max-w-xs">
                      <span className="truncate block" title={log.detail}>{log.detail || '—'}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination pagination={meta} onPageChange={setPage} />
    </div>
  )
}

export default LogsAdminPage
