import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import trainingService from '../../services/training.service'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../utils/dateFormat'
import toast from 'react-hot-toast'
import useDebounce from '../../hooks/useDebounce'

const categoryIcons = {
  Onboarding: '👋',
  'HR Policies': '📋',
  'Health & Safety': '🏥',
  Leadership: '📈',
  Compliance: '🛡️',
}

const TrainingPage = () => {
  const [trainings, setTrainings] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    videoUrl: '',
    category: '',
    duration: '',
  })
  const [formLoading, setFormLoading] = useState(false)
  const { hasRole } = useAuth()
  const debouncedSearch = useDebounce(search, 500)

  useEffect(() => {
    fetchTrainings()
  }, [debouncedSearch, category])

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchTrainings = async () => {
    try {
      setLoading(true)
      const res = await trainingService.getTrainings({
        search: debouncedSearch || undefined,
        category: category || undefined,
        limit: 20,
      })
      setTrainings(res.data)
    } catch {
      toast.error('Eğitimler getirilemedi')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await trainingService.getCategories()
      setCategories(res.data)
    } catch {}
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.title) {
      toast.error('Başlık gerekli')
      return
    }
    setFormLoading(true)
    try {
      await trainingService.createTraining({
        ...form,
        duration: form.duration ? parseInt(form.duration) : undefined,
      })
      toast.success('Eğitim oluşturuldu')
      setShowForm(false)
      setForm({ title: '', description: '', videoUrl: '', category: '', duration: '' })
      fetchTrainings()
      fetchCategories()
    } catch {
      toast.error('Eğitim oluşturulamadı')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Eğitimi silmek istediğinize emin misiniz?')) return
    try {
      await trainingService.deleteTraining(id)
      toast.success('Eğitim silindi')
      fetchTrainings()
    } catch {
      toast.error('Eğitim silinemedi')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-800">Training Resources</h1>
        {hasRole('ADMIN', 'MANAGER') && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            + Add Resource
          </button>
        )}
      </div>

      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search resources..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setCategory('')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            !category ? 'bg-gray-800 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              category === cat ? 'bg-gray-800 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4">Yeni Eğitim</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Başlık</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Eğitim başlığı..."
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Açıklama</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Açıklama..."
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Video URL</label>
                <input
                  type="url"
                  value={form.videoUrl}
                  onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Kategori</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Kategori..."
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Süre (dakika)</label>
                  <input
                    type="number"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="60"
                  />
                </div>
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
      ) : trainings.length === 0 ? (
        <div className="text-center text-gray-400 py-12">Eğitim bulunamadı</div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {trainings.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-xl mb-3">
                {categoryIcons[item.category] || '📚'}
              </div>
              <Link to={`/training/${item.id}`}>
                <h3 className="font-semibold text-gray-800 hover:text-blue-600 transition-colors mb-1">
                  {item.title}
                </h3>
              </Link>
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">{item.description}</p>
              <div className="flex items-center justify-between">
                {item.category && (
                  <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                    {item.category}
                  </span>
                )}
                {hasRole('ADMIN', 'MANAGER') && (
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-gray-400 hover:text-red-500 text-xs ml-auto"
                  >
                    Sil
                  </button>
                )}
              </div>
              {item.duration && (
                <div className="text-xs text-gray-400 mt-2">⏱ {item.duration} dk</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TrainingPage