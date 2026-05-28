import { useState, useEffect, useCallback } from 'react'
import { Download, BarChart3 } from 'lucide-react'
import api from '../../../services/api.service'
import toast from 'react-hot-toast'
import PageHeader from '../../../components/common/PageHeader'
import SectionLabel from '../../../components/common/SectionLabel'
import StatCard from '../../../components/common/StatCard'
import SkeletonCard from '../../../components/common/SkeletonCard'
import EmptyState from '../../../components/common/EmptyState'

const LEAVE_TYPE_LABELS = {
  ANNUAL: 'Yıllık', SICK: 'Hastalık', EXCUSE: 'Mazeret', UNPAID: 'Ücretsiz',
}

const ReportsAdminPage = () => {
  const [tab, setTab] = useState('leaves')
  const [leaveData, setLeaveData] = useState(null)
  const [userData, setUserData] = useState(null)
  const [year, setYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)

  const fetchLeaveReport = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/reports/leaves', { params: { year } })
      setLeaveData(res.data.data)
    } catch {
      toast.error('Rapor getirilemedi')
    } finally {
      setLoading(false)
    }
  }, [year])

  const fetchUserReport = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/reports/users')
      setUserData(res.data.data)
    } catch {
      toast.error('Rapor getirilemedi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tab === 'leaves') fetchLeaveReport()
    if (tab === 'users') fetchUserReport()
  }, [tab, fetchLeaveReport, fetchUserReport])

  const downloadCsv = async () => {
    try {
      const res = await api.get('/reports/leaves/csv', {
        params: { year },
        responseType: 'blob',
      })
      const blobUrl = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = blobUrl
      a.setAttribute('download', `izin-raporu-${year}.csv`)
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch {
      toast.error('CSV indirilemedi')
    }
  }

  const maxMonth = leaveData ? Math.max(...leaveData.byMonth.map((m) => m.days), 1) : 1

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Raporlar"
        description="Detaylı veri analizi ve dışa aktarım"
      />

      <div className="flex gap-2">
        {[['leaves', 'İzin Raporu'], ['users', 'Kullanıcı Aktivitesi']].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === k
                ? 'bg-gray-900 text-white'
                : 'border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} variant="stat" />)}
        </div>
      ) : tab === 'leaves' && leaveData ? (
        <div className="space-y-6">
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              onClick={downloadCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <Download size={13} strokeWidth={1.75} /> CSV İndir
            </button>
          </div>

          <div>
            <SectionLabel>Yıllık Özet</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard label="Onaylanan Talep" value={leaveData.totalApprovedLeaves ?? 0} />
              <StatCard label="Toplam İzin Günü" value={leaveData.totalDays ?? 0} />
              <StatCard
                label="Ortalama İzin Günü"
                value={leaveData.totalApprovedLeaves > 0
                  ? Math.round(leaveData.totalDays / leaveData.totalApprovedLeaves * 10) / 10
                  : 0}
              />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Aylık Dağılım ({year})</h3>
            <div className="flex items-end gap-2 h-32">
              {leaveData.byMonth.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500 tabular-nums">{m.days > 0 ? m.days : ''}</span>
                  <div
                    className="w-full bg-gray-900 rounded-t-sm transition-all"
                    style={{
                      height: `${Math.max(4, (m.days / maxMonth) * 100)}px`,
                      minHeight: m.days > 0 ? '8px' : '4px',
                      opacity: m.days > 0 ? 1 : 0.3,
                    }}
                    title={`${m.label}: ${m.days} gün`}
                  />
                  <span className="text-[10px] text-gray-500">{m.label.slice(0, 3)}</span>
                </div>
              ))}
            </div>
          </div>

          {leaveData.byDepartment.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Departman Bazlı</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Departman</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Talep</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Toplam Gün</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dağılım</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leaveData.byDepartment.map((d) => (
                    <tr key={d.department} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900">{d.department}</td>
                      <td className="px-5 py-3 text-gray-600 tabular-nums">{d.count}</td>
                      <td className="px-5 py-3 font-semibold text-gray-900 tabular-nums">{d.totalDays}</td>
                      <td className="px-5 py-3 text-xs text-gray-500">
                        {Object.entries(d.breakdown).map(([type, days]) => `${LEAVE_TYPE_LABELS[type] || type}: ${days}g`).join(' · ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {leaveData.byUser.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Kişi Bazlı</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Çalışan</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Toplam</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Yıllık</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hastalık</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mazeret</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ücretsiz</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leaveData.byUser.map((u) => (
                    <tr key={u.name} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.department}</p>
                      </td>
                      <td className="px-5 py-3 font-semibold text-gray-900 tabular-nums">{u.totalDays}</td>
                      <td className="px-5 py-3 text-gray-600 tabular-nums">{u.ANNUAL || 0}</td>
                      <td className="px-5 py-3 text-gray-600 tabular-nums">{u.SICK || 0}</td>
                      <td className="px-5 py-3 text-gray-600 tabular-nums">{u.EXCUSE || 0}</td>
                      <td className="px-5 py-3 text-gray-600 tabular-nums">{u.UNPAID || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : tab === 'users' && userData ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kullanıcı</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Departman</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Son Giriş</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">İzin</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mesaj</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Anket Oyu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {userData.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-gray-500">{u.role}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-600 text-xs">{u.profile?.department || '—'}</td>
                  <td className="px-5 py-3 text-xs text-gray-500 tabular-nums">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('tr-TR') : 'Hiç giriş yapmadı'}
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-900 tabular-nums">{u._count?.leaveRequests ?? 0}</td>
                  <td className="px-5 py-3 font-medium text-gray-900 tabular-nums">{u._count?.sentMessages ?? 0}</td>
                  <td className="px-5 py-3 font-medium text-gray-900 tabular-nums">{u._count?.pollVotes ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg">
          <EmptyState icon={BarChart3} title="Veri yok" />
        </div>
      )}
    </div>
  )
}

export default ReportsAdminPage
