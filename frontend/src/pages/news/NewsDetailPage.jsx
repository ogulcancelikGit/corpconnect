import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Pin, Eye, Edit2, Trash2 } from 'lucide-react'
import newsService from '../../services/news.service'
import { useAuth } from '../../context/AuthContext'
import { formatTimeAgo } from '../../utils/dateFormat'
import toast from 'react-hot-toast'
import StatusPill from '../../components/common/StatusPill'

const CATEGORIES = ['Duyuru', 'Etkinlik', 'Politika', 'Eğitim']

const NewsDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasRole } = useAuth()
  const [news, setNews] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', category: '', isPinned: false })
  const [saving, setSaving] = useState(false)
  const viewedRef = useRef(false)

  const fetchNews = useCallback(async () => {
    try {
      const res = await newsService.getNewsById(id)
      setNews(res.data)
      setForm({
        title: res.data.title,
        content: res.data.content,
        category: res.data.category || '',
        isPinned: res.data.isPinned,
      })
    } catch {
      toast.error('Haber bulunamadı')
      navigate('/news')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    fetchNews()
    if (!viewedRef.current) {
      viewedRef.current = true
      newsService.markAsViewed(id).catch(() => {})
    }
  }, [id, fetchNews])

  const handleUpdate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await newsService.updateNews(id, form)
      toast.success('Haber güncellendi')
      setEditMode(false)
      fetchNews()
    } catch {
      toast.error('Haber güncellenemedi')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Haberi silmek istediğinize emin misiniz?')) return
    try {
      await newsService.deleteNews(id)
      toast.success('Haber silindi')
      navigate('/news')
    } catch {
      toast.error('Haber silinemedi')
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto pb-12">
        <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
          <div className="h-4 w-20 bg-gray-100 rounded mb-4" />
          <div className="h-7 w-3/4 bg-gray-100 rounded mb-3" />
          <div className="h-3 w-48 bg-gray-100 rounded mb-6" />
          <div className="space-y-2">
            <div className="h-3 w-full bg-gray-100 rounded" />
            <div className="h-3 w-full bg-gray-100 rounded" />
            <div className="h-3 w-2/3 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!news) return null

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <Link
          to="/news"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={14} strokeWidth={1.75} /> Haberlere dön
        </Link>
        {hasRole('ADMIN', 'MANAGER') && !editMode && (
          <div className="flex gap-2">
            <button
              onClick={() => setEditMode(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-700 rounded-md text-sm font-medium hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <Edit2 size={13} strokeWidth={1.75} /> Düzenle
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-red-600 rounded-md text-sm font-medium hover:border-red-200 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={13} strokeWidth={1.75} /> Sil
            </button>
          </div>
        )}
      </div>

      <article className="bg-white rounded-lg border border-gray-200 p-6">
        {editMode ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Başlık</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">İçerik</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={8}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Kategori</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              >
                <option value="">Kategori seç</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPinned}
                onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
                className="rounded"
              />
              Sabitle
            </label>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-gray-900 text-white rounded-md py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="flex-1 border border-gray-200 rounded-md py-2 text-sm hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {news.isPinned && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-orange-700 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded">
                  <Pin size={10} strokeWidth={2.5} /> Sabit
                </span>
              )}
              {news.category && <StatusPill label={news.category} />}
            </div>
            <h1 className="text-2xl font-medium text-gray-900 tracking-tight mb-3">{news.title}</h1>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-6 pb-4 border-b border-gray-100">
              <span>{news.author?.firstName} {news.author?.lastName}</span>
              <span>·</span>
              <span>{formatTimeAgo(news.createdAt)}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Eye size={11} strokeWidth={1.75} /> {news.viewCount}
              </span>
            </div>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {news.content}
            </div>
          </>
        )}
      </article>
    </div>
  )
}

export default NewsDetailPage
