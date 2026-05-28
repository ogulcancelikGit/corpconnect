import { useState, useEffect, useCallback } from 'react'
import {
  Receipt, Check, X, Plane, UtensilsCrossed, Hotel, Package, ExternalLink,
} from 'lucide-react'
import expenseService from '../../../services/expense.service'
import { formatDate } from '../../../utils/dateFormat'
import toast from 'react-hot-toast'
import PageHeader from '../../../components/common/PageHeader'
import SectionLabel from '../../../components/common/SectionLabel'
import StatCard from '../../../components/common/StatCard'
import SkeletonCard from '../../../components/common/SkeletonCard'
import EmptyState from '../../../components/common/EmptyState'
import StatusPill from '../../../components/common/StatusPill'
import Pagination from '../../../components/common/Pagination'

const CATEGORIES = {
  TRAVEL:        { label: 'Seyahat',        icon: Plane },
  FOOD:          { label: 'Yemek',          icon: UtensilsCrossed },
  ACCOMMODATION: { label: 'Konaklama',      icon: Hotel },
  OFFICE:        { label: 'Ofis Malzemesi', icon: Package },
  OTHER:         { label: 'Diğer',          icon: Receipt },
}

const formatAmount = (amount, currency = 'TRY') =>
  `${parseFloat(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${currency}`

const TABS = [
  { key: 'pending',  label: 'Bekleyenler' },
  { key: 'approved', label: 'Onaylananlar' },
  { key: 'rejected', label: 'Reddedilenler' },
  { key: 'all',      label: 'Tümü' },
]

const ExpensesAdminPage = () => {
  const [expenses, setExpenses] = useState([])
  const [stats, setStats] = useState(null)
  const [tab, setTab] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [reviewModal, setReviewModal] = useState(null)
  const [reviewNote, setReviewNote] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  useEffect(() => { setPage(1) }, [tab])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const statusMap = { pending: 'PENDING', approved: 'APPROVED', rejected: 'REJECTED', all: undefined }
      const [expRes, statsRes] = await Promise.all([
        expenseService.getAllExpenses({ status: statusMap[tab], page, limit: 20 }),
        expenseService.getExpenseStats(),
      ])
      setExpenses(expRes.data)
      setPagination(expRes.pagination ?? expRes.meta ?? null)
      setStats(statsRes.data)
    } catch {
      toast.error('Veriler getirilemedi')
    } finally {
      setLoading(false)
    }
  }, [tab, page])

  useEffect(() => { fetchData() }, [fetchData])

  const handleReview = async (status) => {
    try {
      await expenseService.reviewExpense(reviewModal.id, { status, reviewNote })
      toast.success(status === 'APPROVED' ? 'Masraf onaylandı' : 'Masraf reddedildi')
      setReviewModal(null)
      setReviewNote('')
      fetchData()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'İşlem başarısız')
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Masraf Yönetimi"
        description="Çalışan masraf bildirimlerini incele ve onayla"
      />

      {stats && (
        <div>
          <SectionLabel>Özet</SectionLabel>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Bekliyor" value={stats.pending ?? 0} />
            <StatCard label="Onaylandı" value={stats.approved ?? 0} />
            <StatCard label="Reddedildi" value={stats.rejected ?? 0} />
            <StatCard label="Onaylanan Tutar" value={formatAmount(stats.totalApprovedAmount ?? 0)} />
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
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
      ) : expenses.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg">
          <EmptyState icon={Receipt} title="Masraf bildirimi bulunamadı" />
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {expenses.map((exp) => {
              const cat = CATEGORIES[exp.category] || CATEGORIES.OTHER
              const Icon = cat.icon
              return (
                <div key={exp.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center text-gray-700 shrink-0">
                        <Icon size={16} strokeWidth={1.75} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-0.5">
                          <span className="font-medium text-gray-700">{exp.user?.firstName} {exp.user?.lastName}</span>
                          {exp.user?.profile?.department && <span> · {exp.user.profile.department}</span>}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900">{exp.title}</p>
                          <StatusPill status={exp.status} />
                          <StatusPill label={cat.label} />
                        </div>
                        <p className="text-base font-semibold text-gray-900 tabular-nums tracking-tight mt-1">
                          {formatAmount(exp.amount, exp.currency)}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">Harcama: {formatDate(exp.expenseDate)}</p>
                        {exp.description && <p className="text-xs text-gray-600 mt-1 italic">"{exp.description}"</p>}
                        {exp.reviewNote && <p className="text-xs text-gray-500 mt-1">Not: {exp.reviewNote}</p>}
                        {exp.receiptUrl && (
                          <a
                            href={exp.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-gray-700 hover:text-gray-900 transition-colors mt-1.5"
                          >
                            <ExternalLink size={11} strokeWidth={1.75} /> Fişi görüntüle
                          </a>
                        )}
                      </div>
                    </div>
                    {exp.status === 'PENDING' && (
                      <button
                        onClick={() => setReviewModal(exp)}
                        className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md hover:bg-gray-800 transition-colors shrink-0"
                      >
                        İncele
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}

      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-1 text-gray-900">Masraf İncele</h2>
            <p className="text-sm text-gray-500 mb-1">
              {reviewModal.user?.firstName} {reviewModal.user?.lastName} — {(CATEGORIES[reviewModal.category] || CATEGORIES.OTHER).label}
            </p>
            <p className="text-2xl font-semibold text-gray-900 tabular-nums tracking-tight mb-1">
              {formatAmount(reviewModal.amount, reviewModal.currency)}
            </p>
            <p className="text-xs text-gray-500 mb-4">Harcama tarihi: {formatDate(reviewModal.expenseDate)}</p>
            {reviewModal.description && (
              <p className="text-sm text-gray-700 bg-gray-50 rounded-md p-3 mb-4">"{reviewModal.description}"</p>
            )}
            {reviewModal.receiptUrl && (
              <a
                href={reviewModal.receiptUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900 mb-4 transition-colors"
              >
                <ExternalLink size={13} strokeWidth={1.75} /> Fişi görüntüle
              </a>
            )}
            <div className="mb-4">
              <label className="text-sm text-gray-600 mb-1 block">Not (opsiyonel)</label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={2}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
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
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExpensesAdminPage
