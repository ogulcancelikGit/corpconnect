import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Lightbulb, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import suggestionService from '../../services/suggestion.service'
import { formatTimeAgo } from '../../utils/dateFormat'
import PageHeader from '../../components/common/PageHeader'
import SkeletonCard from '../../components/common/SkeletonCard'
import EmptyState from '../../components/common/EmptyState'
import StatusPill from '../../components/common/StatusPill'
import Pagination from '../../components/common/Pagination'
import { createSuggestionSchema } from '../../schemas/suggestion.schema'

const categoryLabels = {
  PROCESS: 'Süreç İyileştirme',
  TECHNOLOGY: 'Teknoloji',
  CULTURE: 'Şirket Kültürü',
  SAFETY: 'İş Güvenliği',
  OTHER: 'Diğer',
}

const DEFAULT_FORM = { title: '', content: '', category: 'OTHER', isAnonymous: false }

const SuggestionsPage = () => {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createSuggestionSchema),
    defaultValues: DEFAULT_FORM,
  })

  const fetchSuggestions = useCallback(async () => {
    try {
      setLoading(true)
      const res = await suggestionService.getMySuggestions({ page, limit: 10 })
      setSuggestions(res.data.data)
      setMeta(res.data.meta)
    } catch {
      toast.error('Öneriler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchSuggestions() }, [fetchSuggestions])

  const onSubmit = async (data) => {
    try {
      await suggestionService.create(data)
      toast.success('Öneriniz iletildi!')
      reset(DEFAULT_FORM)
      setShowForm(false)
      setPage(1)
      fetchSuggestions()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Öneri gönderilemedi')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bu öneriyi silmek istediğinize emin misiniz?')) return
    try {
      await suggestionService.delete(id)
      toast.success('Öneri silindi')
      fetchSuggestions()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Silinemedi')
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="Önerilerim"
        description="Şirket gelişimine katkıda bulun"
        actions={
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1.5 bg-gray-900 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus size={14} strokeWidth={2} /> Yeni Öneri
          </button>
        }
      />

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Yeni Öneri</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Başlık</label>
              <input
                type="text"
                placeholder="Önerinizin başlığı"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                {...register('title')}
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Kategori</label>
              <select
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                {...register('category')}
              >
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Açıklama</label>
              <textarea
                placeholder="Önerinizi detaylıca açıklayın..."
                rows={5}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-none"
                {...register('content')}
              />
              {errors.content && <p className="text-xs text-red-500 mt-1">{errors.content.message}</p>}
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                {...register('isAnonymous')}
              />
              <span className="text-sm text-gray-700">Anonim olarak gönder</span>
            </label>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Gönderiliyor...' : 'Gönder'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); reset(DEFAULT_FORM) }}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} variant="card" />)}
        </div>
      ) : suggestions.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg">
          <EmptyState
            icon={Lightbulb}
            title="Henüz öneri göndermediniz"
            description="Şirketi daha iyi yapmak için fikirlerinizi paylaşın."
          />
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
                      {s.isAnonymous && <StatusPill label="Anonim" />}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{s.content}</p>
                    {s.adminNote && (
                      <p className="text-xs text-gray-700 mt-2 bg-gray-50 border border-gray-100 rounded-md px-3 py-2">
                        <span className="font-medium">Yönetici notu:</span> {s.adminNote}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <StatusPill status={s.status} />
                      <span className="text-xs text-gray-500">{categoryLabels[s.category]}</span>
                      <span className="text-xs text-gray-400">· {formatTimeAgo(s.createdAt)}</span>
                    </div>
                  </div>
                  {s.status === 'PENDING' && (
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                      title="Sil"
                    >
                      <Trash2 size={14} strokeWidth={1.75} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Pagination pagination={meta} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}

export default SuggestionsPage
