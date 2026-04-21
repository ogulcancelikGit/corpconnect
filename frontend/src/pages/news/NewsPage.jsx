import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import newsService from '../../services/news.service'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../utils/dateFormat'
import toast from 'react-hot-toast'
import useDebounce from '../../hooks/useDebounce'

const NewsPage = () => {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', category: '', isPinned: false })
  const [formLoading, setFormLoading] = useState(false)
  const { hasRole } = useAuth()
  const debouncedSearch = useDebounce(search, 500)

  useEffect(() => {
    fetchNews()
  }, [debouncedSearch, category, page])

  const fetchNews = async () => {
    try {
      setLoading(true)
      const res = await newsService.getNews({
        page,
        limit: 10,
        search: debouncedSearch || undefined,
        category: category || undefined,
      })
      setNews(res.data)
      setPagination(res.pagination)
    } catch {
      toast.error('Haberler getirilemedi')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.title || !form.content) {
      toast.error('Başlık ve içerik gerekli')
      return
    }
    setFormLoading(true)
    try {
      await newsService.createNews(form)
      toast.success('Haber oluşturuldu')
      setShowForm(false)
      setForm({ title: '', content: '', category: '', isPinned: false })
      fetchNews()
    } catch {
      toast.error('Haber oluşturulamadı')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Haberi silmek istediğinize emin misiniz?')) return
    try {
      await newsService.deleteNews(id)
      toast.success('Haber silindi')
      fetchNews()
    } catch {
      toast.error('Haber silinemedi')
    }
  }

  const handlePin = async (id) => {
    try {
      await newsService.togglePin(id)
      fetchNews()
    } catch {
      toast.error('Pin işlemi yapılamadı')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-800">News & Announcements</h1>
        {hasRole('ADMIN', 'MANAGER') && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            + New Post
          </button>
        )}
      </div>

      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search announcements..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All Categories</option>
          <option value="Duyuru">Duyuru</option>
          <option value="Etkinlik">Etkinlik</option>
          <option value="Politika">Politika</option>
          <option value="Eğitim">Eğitim</option>
        </select>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4">Yeni Haber</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Başlık</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Haber başlığı..."
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">İçerik</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={5}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Haber içeriği..."
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
                  className="rounded"
                />
                <label htmlFor="isPinned" className="text-sm text-gray-600">Pinle</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {formLoading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : news.length === 0 ? (
        <div className="text-center text-gray-400 py-12">Haber bulunamadı</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {news.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {item.isPinned && (
                    <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full">📌 Pinned</span>
                  )}
                  {item.category && (
                    <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">{item.category}</span>
                  )}
                </div>
                {hasRole('ADMIN', 'MANAGER') && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePin(item.id)}
                      className="text-gray-400 hover:text-orange-500 text-xs"
                    >
                      {item.isPinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-gray-400 hover:text-red-500 text-xs"
                    >
                      Sil
                    </button>
                  </div>
                )}
              </div>
              <Link to={`/news/${item.id}`}>
                <h3 className="font-semibold text-gray-800 hover:text-blue-600 transition-colors mb-1">
                  {item.title}
                </h3>
              </Link>
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">{item.content}</p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{formatDate(item.createdAt)}</span>
                <span>👁 {item.viewCount} views</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!pagination.hasPrev}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            Önceki
          </button>
          <span className="text-sm text-gray-500">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!pagination.hasNext}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            Sonraki
          </button>
        </div>
      )}
    </div>
  )
}

export default NewsPage