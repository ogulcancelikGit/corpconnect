import { useState, useEffect, useCallback } from 'react'
import { Lightbulb } from 'lucide-react'
import toast from 'react-hot-toast'
import suggestionService from '../../../services/suggestion.service'
import PageHeader from '../../../components/common/PageHeader'
import SectionLabel from '../../../components/common/SectionLabel'
import StatCard from '../../../components/common/StatCard'
import SkeletonCard from '../../../components/common/SkeletonCard'
import EmptyState from '../../../components/common/EmptyState'
import StatusPill from '../../../components/common/StatusPill'
import Pagination from '../../../components/common/Pagination'

const categoryLabels = {
  PROCESS: 'Süreç İyileştirme',
  TECHNOLOGY: 'Teknoloji',
  CULTURE: 'Şirket Kültürü',
  SAFETY: 'İş Güvenliği',
  OTHER: 'Diğer',
}

const statusLabels = {
  PENDING: 'Beklemede',
  UNDER_REVIEW: 'İnceleniyor',
  APPROVED: 'Onayla',
  REJECTED: 'Reddet',
}

const SuggestionsAdminPage = () => {
  const [suggestions, setSuggestions] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)
  const [reviewing, setReviewing] = useState(null)
  const [reviewForm, setReviewForm] = useState({ status: 'UNDER_REVIEW', adminNote: '' })
  const [submitting, setSubmitting] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const [sugRes, statRes] = await Promise.all([
        suggestionService.getAllSuggestions({ page, limit: 15, status: filterStatus || undefined, category: filterCategory || undefined }),
        suggestionService.getStats(),
      ])
      setSuggestions(sugRes.data.data)
      setMeta(sugRes.data.pagination)
      setStats(statRes.data.data)
    } catch {
      toast.error('Veriler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [page, filterStatus, filterCategory])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleReview = async () => {
    if (!reviewing) return
    try {
      setSubmitting(true)
      await suggestionService.review(reviewing.id, reviewForm)
      toast.success('Öneri güncellendi')
      setReviewing(null)
      setReviewForm({ status: 'UNDER_REVIEW', adminNote: '' })
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Güncelleme başarısız')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Öneri Yönetimi"
        description="Çalışan önerilerini inceleyin ve değerlendirin"
      />

      {stats && (
        <div>
          <SectionLabel>Özet</SectionLabel>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard label="Toplam" value={stats.total ?? 0} />
            <StatCard label="Beklemede" value={stats.pending ?? 0} />
            <StatCard label="İnceleniyor" value={stats.underReview ?? 0} />
            <StatCard label="Onaylandı" value={stats.approved ?? 0} />
            <StatCard label="Reddedildi" value={stats.rejected ?? 0} />
          </div>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
          className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
        >
          <option value="">Tüm Durumlar</option>
          {Object.entries(statusLabels).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={(e) => { setFilterCategory(e.target.value); setPage(1) }}
          className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
        >
          <option value="">Tüm Kategoriler</option>
          {Object.entries(categoryLabels).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} variant="card" />)}
        </div>
      ) : suggestions.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg">
          <EmptyState icon={Lightbulb} title="Öneri bulunamadı" />
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {suggestions.map((s) => (
              <div key={s.id} className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h3 className="text-sm font-semibold text-gray-900">{s.title}</h3>
                      <StatusPill status={s.status} />
                      <StatusPill label={categoryLabels[s.category]} />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{s.content}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                      {s.isAnonymous ? (
                        <span className="font-medium">Anonim</span>
                      ) : s.user ? (
                        <span>
                          <span className="font-medium text-gray-700">{s.user.firstName} {s.user.lastName}</span>
                          {s.user.profile?.department && <span> · {s.user.profile.department}</span>}
                        </span>
                      ) : null}
                      <span>· {new Date(s.createdAt).toLocaleDateString('tr-TR')}</span>
                    </div>
                    {s.adminNote && (
                      <p className="text-xs text-gray-700 mt-2 bg-gray-50 border border-gray-100 rounded-md px-3 py-2">
                        <span className="font-medium">Not:</span> {s.adminNote}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => { setReviewing(s); setReviewForm({ status: s.status === 'PENDING' ? 'UNDER_REVIEW' : s.status, adminNote: s.adminNote || '' }) }}
                    className="px-3 py-1.5 border border-gray-200 rounded-md text-xs font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors shrink-0"
                  >
                    Değerlendir
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Pagination pagination={meta} onPageChange={setPage} />
        </>
      )}

      {reviewing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Öneri Değerlendirme</h2>
            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{reviewing.title}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Durum</label>
                <select
                  value={reviewForm.status}
                  onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                >
                  <option value="UNDER_REVIEW">İnceleniyor</option>
                  <option value="APPROVED">Onayla</option>
                  <option value="REJECTED">Reddet</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Not (opsiyonel)</label>
                <textarea
                  value={reviewForm.adminNote}
                  onChange={(e) => setReviewForm({ ...reviewForm, adminNote: e.target.value })}
                  placeholder="Çalışana iletilecek not..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleReview}
                disabled={submitting}
                className="flex-1 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
              <button
                onClick={() => setReviewing(null)}
                className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
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

export default SuggestionsAdminPage
