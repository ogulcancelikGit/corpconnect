import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import newsService from '../../services/news.service'
import { useAuth } from '../../context/AuthContext'
import { formatDateTime } from '../../utils/dateFormat'
import toast from 'react-hot-toast'

const NewsDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasRole } = useAuth()
  const [news, setNews] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', category: '', isPinned: false })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchNews()
  }, [id])

  const fetchNews = async () => {
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
  }

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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!news) return null

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link to="/news" className="text-sm text-blue-600 hover:underline">
          ← Haberlere dön
        </Link>
        {hasRole('ADMIN', 'MANAGER') && (
          <div className="flex gap-2">
            <button
              onClick={() => setEditMode(!editMode)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              {editMode ? 'İptal' : 'Düzenle'}
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
            >
              Sil
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {editMode ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Başlık</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">İçerik</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={8}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Kategori</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Kategori seç</option>
                <option value="Duyuru">Duyuru</option>
                <option value="Etkinlik">Etkinlik</option>
                <option value="Politika">Politika</option>
                <option value="Eğitim">Eğitim</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPinned"
                checked={form.isPinned}
                onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
              />
              <label htmlFor="isPinned" className="text-sm text-gray-600">Pinle</label>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="flex-1 border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50"
              >
                İptal
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3">
              {news.isPinned && (
                <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full">📌 Pinned</span>
              )}
              {news.category && (
                <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">{news.category}</span>
              )}
            </div>
            <h1 className="text-2xl font-semibold text-gray-800 mb-3">{news.title}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-400 mb-6 pb-4 border-b border-gray-100">
              <span>{news.author?.firstName} {news.author?.lastName}</span>
              <span>•</span>
              <span>{formatDateTime(news.createdAt)}</span>
              <span>•</span>
              <span>👁 {news.viewCount} views</span>
            </div>
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {news.content}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default NewsDetailPage