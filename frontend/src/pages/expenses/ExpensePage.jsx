import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Receipt, Plus, Check, X, Plane, UtensilsCrossed,
  Hotel, Package, Paperclip,
} from 'lucide-react'
import expenseService from '../../services/expense.service'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../utils/dateFormat'
import toast from 'react-hot-toast'
import { createExpenseSchema } from '../../schemas/expense.schema'
import PageHeader from '../../components/common/PageHeader'
import SectionLabel from '../../components/common/SectionLabel'
import SkeletonCard from '../../components/common/SkeletonCard'
import EmptyState from '../../components/common/EmptyState'
import StatusPill from '../../components/common/StatusPill'
import StatCard from '../../components/common/StatCard'
import Pagination from '../../components/common/Pagination'

const CATEGORIES = {
  TRAVEL:        { label: 'Seyahat',        icon: Plane },
  FOOD:          { label: 'Yemek',          icon: UtensilsCrossed },
  ACCOMMODATION: { label: 'Konaklama',      icon: Hotel },
  OFFICE:        { label: 'Ofis Malzemesi', icon: Package },
  OTHER:         { label: 'Diğer',          icon: Receipt },
}

const formatAmount = (amount, currency = 'TRY') =>
  `${parseFloat(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${currency}`

const DEFAULT_FORM = { title: '', amount: '', currency: 'TRY', category: 'OFFICE', description: '', expenseDate: '' }

const ExpensePage = () => {
  const { hasRole } = useAuth()
  const isManager = hasRole('ADMIN', 'MANAGER')

  const [tab, setTab] = useState('my')
  const [myExpenses, setMyExpenses] = useState([])
  const [allExpenses, setAllExpenses] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [reviewModal, setReviewModal] = useState(null)
  const [reviewNote, setReviewNote] = useState('')
  const [receiptFile, setReceiptFile] = useState(null)
  const [receiptUploading, setReceiptUploading] = useState(false)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: DEFAULT_FORM,
  })

  useEffect(() => { setPage(1) }, [tab])
  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (tab === 'my') {
        const res = await expenseService.getMyExpenses({ page, limit: 15 })
        setMyExpenses(res.data)
        setPagination(res.pagination ?? res.meta ?? null)
      } else {
        const [expRes, statsRes] = await Promise.all([
          expenseService.getAllExpenses({ page, limit: 15, status: tab === 'pending' ? 'PENDING' : undefined }),
          expenseService.getExpenseStats(),
        ])
        setAllExpenses(expRes.data)
        setPagination(expRes.pagination ?? expRes.meta ?? null)
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
      let receiptUrl
      if (receiptFile) {
        setReceiptUploading(true)
        const uploadRes = await expenseService.uploadReceipt(receiptFile)
        receiptUrl = uploadRes.data?.url
        setReceiptUploading(false)
      }
      await expenseService.createExpense({
        ...data,
        expenseDate: new Date(data.expenseDate).toISOString(),
        ...(receiptUrl && { receiptUrl }),
      })
      toast.success('Masraf bildirimi oluşturuldu')
      setShowForm(false)
      reset(DEFAULT_FORM)
      setReceiptFile(null)
      fetchData()
    } catch (err) {
      setReceiptUploading(false)
      toast.error(err?.response?.data?.message || 'İşlem başarısız')
    }
  }

  const handleCancel = async (id) => {
    if (!confirm('Masraf bildirimini iptal etmek istediğinize emin misiniz?')) return
    try {
      await expenseService.cancelExpense(id)
      toast.success('Masraf bildirimi iptal edildi')
      fetchData()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'İptal başarısız')
    }
  }

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

  const tabs = [
    { key: 'my', label: 'Masraflarım' },
    ...(isManager ? [{ key: 'pending', label: 'Bekleyenler' }, { key: 'all', label: 'Tümü' }] : []),
  ]

  const list = tab === 'my' ? myExpenses : allExpenses

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Masraf Bildirimi"
        description="Masraflarını gir, fiş yükle ve onay sürecini takip et"
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 bg-gray-900 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus size={14} strokeWidth={2} /> Yeni Bildirim
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
            <StatCard label="Onaylanan Tutar" value={formatAmount(stats.totalApprovedAmount ?? 0)} />
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
      ) : list.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg">
          <EmptyState
            icon={Receipt}
            title="Masraf bildirimi bulunamadı"
            description={tab === 'my' ? 'Yeni bir masraf bildirimi oluşturabilirsin.' : undefined}
          />
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {list.map((exp) => {
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
                        {tab !== 'my' && exp.user && (
                          <p className="text-xs text-gray-500 mb-0.5">
                            <span className="font-medium text-gray-700">{exp.user.firstName} {exp.user.lastName}</span>
                            {exp.user.profile?.department && <span> · {exp.user.profile.department}</span>}
                          </p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900">{exp.title}</p>
                          <StatusPill status={exp.status} />
                          <StatusPill label={cat.label} />
                        </div>
                        <p className="text-base font-semibold text-gray-900 tabular-nums tracking-tight mt-1">
                          {formatAmount(exp.amount, exp.currency)}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">Harcama tarihi: {formatDate(exp.expenseDate)}</p>
                        {exp.description && <p className="text-xs text-gray-600 mt-1 italic">"{exp.description}"</p>}
                        {exp.reviewNote && <p className="text-xs text-gray-500 mt-1">Not: {exp.reviewNote}</p>}
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {isManager && exp.status === 'PENDING' && (
                        <button
                          onClick={() => setReviewModal(exp)}
                          className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md hover:bg-gray-800 transition-colors"
                        >
                          İncele
                        </button>
                      )}
                      {tab === 'my' && exp.status === 'PENDING' && (
                        <button
                          onClick={() => handleCancel(exp.id)}
                          className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded-md hover:border-gray-300 hover:bg-gray-50 transition-colors"
                        >
                          İptal Et
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Yeni Masraf Bildirimi</h2>
            <form onSubmit={handleSubmit(onCreate)} className="space-y-4" noValidate>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Başlık *</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  placeholder="Masraf başlığı..."
                  {...register('title')}
                />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Tutar *</label>
                  <input
                    type="number" step="0.01"
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm tabular-nums focus:outline-none focus:border-gray-400"
                    placeholder="0.00"
                    {...register('amount')}
                  />
                  {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Para Birimi</label>
                  <select
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                    {...register('currency')}
                  >
                    <option value="TRY">TRY ₺</option>
                    <option value="USD">USD $</option>
                    <option value="EUR">EUR €</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Kategori</label>
                  <select
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                    {...register('category')}
                  >
                    {Object.entries(CATEGORIES).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Harcama Tarihi *</label>
                  <input
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                    {...register('expenseDate')}
                  />
                  {errors.expenseDate && <p className="text-xs text-red-500 mt-1">{errors.expenseDate.message}</p>}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">Açıklama (opsiyonel)</label>
                <textarea
                  rows={2}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  placeholder="Harcama detayı..."
                  {...register('description')}
                />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">Fiş / Makbuz (opsiyonel)</label>
                <label className={`flex items-center gap-2 w-full border border-dashed rounded-md px-3 py-2.5 text-sm cursor-pointer transition-colors ${receiptFile ? 'border-gray-400 bg-gray-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}>
                  <Paperclip size={14} strokeWidth={1.75} className="text-gray-400 shrink-0" />
                  <span className="text-gray-600 flex-1 truncate">
                    {receiptFile ? receiptFile.name : 'Dosya seç (JPG, PNG, PDF)'}
                  </span>
                  {receiptFile && (
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setReceiptFile(null) }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X size={13} strokeWidth={2} />
                    </button>
                  )}
                  <input
                    type="file" accept="image/*,application/pdf" className="hidden"
                    onChange={(e) => setReceiptFile(e.target.files[0] || null)}
                  />
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit" disabled={isSubmitting || receiptUploading}
                  className="flex-1 bg-gray-900 text-white rounded-md py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {receiptUploading ? 'Fiş yükleniyor...' : isSubmitting ? 'Gönderiliyor...' : 'Gönder'}
                </button>
                <button
                  type="button" onClick={() => setShowForm(false)}
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
            <div className="mb-4">
              <label className="text-sm text-gray-600 mb-1 block">Not (opsiyonel)</label>
              <textarea
                value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} rows={2}
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

export default ExpensePage
