import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarOff, Plus, Check, X } from 'lucide-react'
import leaveService from '../../services/leave.service'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../utils/dateFormat'
import toast from 'react-hot-toast'
import { createLeaveSchema } from '../../schemas/leave.schema'
import PageHeader from '../../components/common/PageHeader'
import SectionLabel from '../../components/common/SectionLabel'
import SkeletonCard from '../../components/common/SkeletonCard'
import EmptyState from '../../components/common/EmptyState'
import StatusPill from '../../components/common/StatusPill'
import StatCard from '../../components/common/StatCard'
import Pagination from '../../components/common/Pagination'

const LEAVE_TYPES = {
  ANNUAL: 'Yıllık İzin',
  SICK: 'Hastalık İzni',
  EXCUSE: 'Mazeret İzni',
  UNPAID: 'Ücretsiz İzin',
}

const LeavePage = () => {
  const { hasRole } = useAuth()
  const isManager = hasRole('ADMIN', 'MANAGER')

  const [tab, setTab] = useState('my')
  const [myLeaves, setMyLeaves] = useState([])
  const [allLeaves, setAllLeaves] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [reviewModal, setReviewModal] = useState(null)
  const [reviewNote, setReviewNote] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createLeaveSchema),
    defaultValues: { type: 'ANNUAL', startDate: '', endDate: '', reason: '' },
  })
  const watchedStartDate = watch('startDate')
  const watchedEndDate = watch('endDate')

  useEffect(() => {
    setPage(1)
  }, [tab])

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (tab === 'my') {
        const res = await leaveService.getMyLeaves({ page, limit: 15 })
        setMyLeaves(res.data)
        setPagination(res.pagination ?? res.meta ?? null)
      } else {
        const [leavesRes, statsRes] = await Promise.all([
          leaveService.getAllLeaves({ page, limit: 15, status: tab === 'pending' ? 'PENDING' : undefined }),
          leaveService.getLeaveStats(),
        ])
        setAllLeaves(leavesRes.data)
        setPagination(leavesRes.pagination ?? leavesRes.meta ?? null)
        setStats(statsRes.data)
      }
    } catch {
      toast.error('Veriler getirilemedi')
    } finally {
      setLoading(false)
    }
  }

  const onCreate = async (data) => {
    try {
      await leaveService.createLeave({
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      })
      toast.success('İzin talebi oluşturuldu')
      setShowForm(false)
      reset({ type: 'ANNUAL', startDate: '', endDate: '', reason: '' })
      fetchData()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'İzin talebi oluşturulamadı')
    }
  }

  const handleCancel = async (id) => {
    if (!confirm('İzin talebini iptal etmek istediğinize emin misiniz?')) return
    try {
      await leaveService.cancelLeave(id)
      toast.success('İzin talebi iptal edildi')
      fetchData()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'İptal işlemi başarısız')
    }
  }

  const handleReview = async (status) => {
    try {
      await leaveService.reviewLeave(reviewModal.id, { status, reviewNote })
      toast.success(status === 'APPROVED' ? 'İzin onaylandı' : 'İzin reddedildi')
      setReviewModal(null)
      setReviewNote('')
      fetchData()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'İşlem başarısız')
    }
  }

  const tabs = [
    { key: 'my', label: 'Taleplerim' },
    ...(isManager ? [
      { key: 'pending', label: 'Bekleyenler' },
      { key: 'all', label: 'Tümü' },
    ] : []),
  ]

  const displayLeaves = tab === 'my' ? myLeaves : allLeaves

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="İzin Yönetimi"
        description="İzin taleplerini görüntüle ve yönet"
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 bg-gray-900 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus size={14} strokeWidth={2} /> Yeni İzin Talebi
          </button>
        }
      />

      {isManager && stats && tab !== 'my' && (
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

      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-gray-900 text-white'
                : 'border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} variant="row" />)}
        </div>
      ) : displayLeaves.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg">
          <EmptyState
            icon={CalendarOff}
            title="İzin talebi bulunamadı"
            description={tab === 'my' ? 'Yeni izin talebi oluşturabilirsin.' : undefined}
          />
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {displayLeaves.map((leave) => (
              <div key={leave.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {tab !== 'my' && leave.user && (
                      <p className="text-xs text-gray-500 mb-1">
                        <span className="font-medium text-gray-700">{leave.user.firstName} {leave.user.lastName}</span>
                        {leave.user.profile?.department && <span> · {leave.user.profile.department}</span>}
                      </p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{LEAVE_TYPES[leave.type]}</span>
                      <StatusPill status={leave.status} />
                      <span className="text-xs text-gray-500 tabular-nums">{leave.days} gün</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5">
                      {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                    </p>
                    {leave.reason && (
                      <p className="text-xs text-gray-600 mt-2 italic">"{leave.reason}"</p>
                    )}
                    {leave.reviewNote && (
                      <p className="text-xs text-gray-500 mt-1">Not: {leave.reviewNote}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isManager && leave.status === 'PENDING' && (
                      <button
                        onClick={() => setReviewModal(leave)}
                        className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md hover:bg-gray-800 transition-colors"
                      >
                        İncele
                      </button>
                    )}
                    {tab === 'my' && leave.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancel(leave.id)}
                        className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded-md hover:border-gray-300 hover:bg-gray-50 transition-colors"
                      >
                        İptal Et
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Yeni İzin Talebi</h2>
            <form onSubmit={handleSubmit(onCreate)} className="space-y-4" noValidate>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">İzin Türü</label>
                <select
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  {...register('type')}
                >
                  {Object.entries(LEAVE_TYPES).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Başlangıç</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                    {...register('startDate')}
                  />
                  {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate.message}</p>}
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Bitiş</label>
                  <input
                    type="date"
                    min={watchedStartDate || new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                    {...register('endDate')}
                  />
                  {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate.message}</p>}
                </div>
              </div>
              {watchedStartDate && watchedEndDate && !errors.endDate && (
                <p className="text-xs text-gray-600">
                  Toplam: <span className="font-semibold tabular-nums">{Math.ceil((new Date(watchedEndDate) - new Date(watchedStartDate)) / (1000 * 60 * 60 * 24)) + 1}</span> gün
                </p>
              )}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Açıklama (opsiyonel)</label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  placeholder="İzin sebebi..."
                  {...register('reason')}
                />
                {errors.reason && <p className="text-xs text-red-500 mt-1">{errors.reason.message}</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-900 text-white rounded-md py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Gönderiliyor...' : 'Gönder'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-200 rounded-md py-2 text-sm hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-1 text-gray-900">İzin Talebi İncele</h2>
            <p className="text-sm text-gray-500 mb-1">
              {reviewModal.user?.firstName} {reviewModal.user?.lastName} — {LEAVE_TYPES[reviewModal.type]} ({reviewModal.days} gün)
            </p>
            <p className="text-xs text-gray-500 mb-4">
              {formatDate(reviewModal.startDate)} — {formatDate(reviewModal.endDate)}
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
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                placeholder="Red sebebi veya açıklama..."
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

export default LeavePage
