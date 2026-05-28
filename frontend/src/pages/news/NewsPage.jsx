import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Newspaper, Pin, Plus, Eye, Trash2, Search } from 'lucide-react'
import newsService from '../../services/news.service'
import { useAuth } from '../../context/AuthContext'
import { formatTimeAgo } from '../../utils/dateFormat'
import toast from 'react-hot-toast'
import useDebounce from '../../hooks/useDebounce'
import PageHeader from '../../components/common/PageHeader'
import SkeletonCard from '../../components/common/SkeletonCard'
import EmptyState from '../../components/common/EmptyState'
import StatusPill from '../../components/common/StatusPill'
import Pagination from '../../components/common/Pagination'

const CATEGORIES = ['Duyuru', 'Etkinlik', 'Politika', 'Eğitim']

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Haberler"
        description="Şirket içi duyurular ve güncellemeler"
        actions={hasRole('ADMIN', 'MANAGER') && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 bg-gray-900 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus size={14} strokeWidth={2} /> Yeni Haber
          </button>
        )}
      />

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={14} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Haberlerde ara..."
            className="w-full border border-gray-200 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1) }}
          className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
        >
          <option value="">Tüm Kategoriler</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Yeni Haber</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Başlık</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  placeholder="Haber başlığı..."
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">İçerik</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={5}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  placeholder="Haber içeriği..."
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
                  disabled={formLoading}
                  className="flex-1 bg-gray-900 text-white rounded-md py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {formLoading ? 'Kaydediliyor...' : 'Kaydet'}
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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} variant="card" />)}
        </div>
      ) : news.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg">
          <EmptyState
            icon={Newspaper}
            title="Henüz haber yok"
            description="Yeni duyurular burada görünecek."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {news.map((item) => (
            <article key={item.id} className="group bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {item.isPinned && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-orange-700 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded">
                      <Pin size={10} strokeWidth={2.5} /> Sabit
                    </span>
                  )}
                  {item.category && (
                    <StatusPill label={item.category} />
                  )}
                  {!item.isViewed && (
                    <StatusPill label="Yeni" tone="green" />
                  )}
                </div>
                {hasRole('ADMIN', 'MANAGER') && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <button
                      onClick={() => handlePin(item.id)}
                      className="hover:text-orange-500 transition-colors"
                      title={item.isPinned ? 'Sabitlemeyi kaldır' : 'Sabitle'}
                    >
                      <Pin size={13} strokeWidth={1.75} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="hover:text-red-500 transition-colors"
                      title="Sil"
                    >
                      <Trash2 size={13} strokeWidth={1.75} />
                    </button>
                  </div>
                )}
              </div>

              <Link to={`/news/${item.id}`} className="block">
                <h3 className="text-sm font-semibold text-gray-900 leading-snug group-hover:text-gray-700 transition-colors">
                  {item.title}
                </h3>
              </Link>
              <p className="text-sm text-gray-500 line-clamp-2 mt-2 flex-1">{item.content}</p>
              <div className="flex items-center justify-between text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
                <span>{formatTimeAgo(item.createdAt)}</span>
                <span className="inline-flex items-center gap-1">
                  <Eye size={11} strokeWidth={1.75} /> {item.viewCount}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />
    </div>
  )
}

export default NewsPage
