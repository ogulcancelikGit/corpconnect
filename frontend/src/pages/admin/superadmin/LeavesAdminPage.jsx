import { useState, useEffect, useCallback } from 'react'
import { CalendarOff, Check, X } from 'lucide-react'
import leaveService from '../../../services/leave.service'
import { formatDate } from '../../../utils/dateFormat'
import toast from 'react-hot-toast'
import PageHeader from '../../../components/common/PageHeader'
import SectionLabel from '../../../components/common/SectionLabel'
import StatCard from '../../../components/common/StatCard'
import SkeletonCard from '../../../components/common/SkeletonCard'
import EmptyState from '../../../components/common/EmptyState'
import StatusPill from '../../../components/common/StatusPill'

const LEAVE_TYPE_LABELS = {
  ANNUAL: 'Yıllık İzin',
  SICK: 'Hastalık İzni',
  EXCUSE: 'Mazeret İzni',
  UNPAID: 'Ücretsiz İzin',
}

const FILTERS = [
  { value: 'PENDING',  label: 'Bekleyenler' },
  { value: 'APPROVED', label: 'Onaylananlar' },
  { value: 'REJECTED', label: 'Reddedilenler' },
  { value: '',         label: 'Tümü' },
]

const LeavesAdminPage = () => {
  const [leaves, setLeaves] = useState([])
  const [stats, setStats] = useState(null)
  const [filter, setFilter] = useState('PENDING')
  const [loading, setLoading] = useState(true)
  const [reviewModal, setReviewModal] = useState(null)
  const [reviewNote, setReviewNote] = useState('')

  const fetchLeaves = useCallback(async () => {
    setLoading(true)
    try {
      const [leavesRes, statsRes] = await Promise.all([
        leaveService.getAllLeaves({ limit: 100, status: filter || undefined }),
        leaveService.getLeaveStats(),
      ])
      setLeaves(leavesRes.data)
      setStats(statsRes.data)
    } catch {
      toast.error('Veriler getirilemedi')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { fetchLeaves() }, [fetchLeaves])

  const handleReview = async (status) => {
    try {
      await leaveService.reviewLeave(reviewModal.id, { status, reviewNote })
      toast.success(status === 'APPROVED' ? 'İzin onaylandı' : 'İzin reddedildi')
      setReviewModal(null)
      setReviewNote('')
      fetchLeaves()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'İşlem başarısız')
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="İzin Talepleri"
        description="Tüm çalışan izin taleplerini görüntüle ve yönet"
      />

      {stats && (
        <div>
          <SectionLabel>Özet</SectionLabel>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Bekliyor" value={stats.pending ?? 0} />
            <StatCard label="Onaylandı" value={stats.approved ?? 0} />
            <StatCard label="Reddedildi" value={stats.rejected ?? 0} />
            <StatCard label="Toplam" value={stats.total ?? 0} />
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === value
                ? 'bg-gray-900 text-white'
                : 'border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} variant="row" />)}
        </div>
      ) : leaves.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg">
          <EmptyState icon={CalendarOff} title="İzin talebi bulunamadı" />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Çalışan</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">İzin Türü</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tarih</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gün</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Durum</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leaves.map((leave) => (
                <tr key={leave.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-gray-900">{leave.user?.firstName} {leave.user?.lastName}</p>
                    {leave.user?.profile?.department && (
                      <p className="text-xs text-gray-500">{leave.user.profile.department}</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-700">{LEAVE_TYPE_LABELS[leave.type]}</td>
                  <td className="px-5 py-3 text-xs text-gray-600 tabular-nums">
                    {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
                  </td>
                  <td className="px-5 py-3 text-sm font-medium text-gray-900 tabular-nums">{leave.days}</td>
                  <td className="px-5 py-3">
                    <StatusPill status={leave.status} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    {leave.status === 'PENDING' && (
                      <button
                        onClick={() => setReviewModal(leave)}
                        className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md hover:bg-gray-800 transition-colors"
                      >
                        İncele
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-1 text-gray-900">İzin Talebi İncele</h2>
            <p className="text-sm text-gray-500 mb-1">
              {reviewModal.user?.firstName} {reviewModal.user?.lastName} — {LEAVE_TYPE_LABELS[reviewModal.type]} ({reviewModal.days} gün)
            </p>
            <p className="text-xs text-gray-500 mb-4 tabular-nums">
              {formatDate(reviewModal.startDate)} – {formatDate(reviewModal.endDate)}
            </p>
            {reviewModal.reason && (
              <p className="text-sm text-gray-700 bg-gray-50 rounded-md p-3 mb-4">"{reviewModal.reason}"</p>
            )}
            <div className="mb-4">
              <label className="text-sm text-gray-600 mb-1 block">Not (opsiyonel)</label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={2}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                placeholder="Açıklama..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleReview('APPROVED')}
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-600 text-white rounded-md py-2 text-sm font-medium hover:bg-emerald-700 transition-colors"
              >
                <Check size={14} strokeWidth={2.5} /> Onayla
              </button>
              <button
                onClick={() => handleReview('REJECTED')}
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-red-600 text-white rounded-md py-2 text-sm font-medium hover:bg-red-700 transition-colors"
              >
                <X size={14} strokeWidth={2.5} /> Reddet
              </button>
              <button
                onClick={() => { setReviewModal(null); setReviewNote('') }}
                className="flex-1 border border-gray-200 rounded-md py-2 text-sm hover:bg-gray-50 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LeavesAdminPage
