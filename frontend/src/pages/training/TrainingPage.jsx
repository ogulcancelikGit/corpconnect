import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  GraduationCap, Plus, Trash2, Search, Clock, HandHeart,
  ClipboardList, HeartPulse, TrendingUp, ShieldCheck, BookOpen,
} from 'lucide-react'
import trainingService from '../../services/training.service'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import useDebounce from '../../hooks/useDebounce'
import PageHeader from '../../components/common/PageHeader'
import SkeletonCard from '../../components/common/SkeletonCard'
import EmptyState from '../../components/common/EmptyState'
import StatusPill from '../../components/common/StatusPill'

const categoryIcons = {
  Onboarding: HandHeart,
  'HR Policies': ClipboardList,
  'Health & Safety': HeartPulse,
  Leadership: TrendingUp,
  Compliance: ShieldCheck,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    } catch {
      // sessizce yut
    }
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
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Eğitimler"
        description="Mesleki gelişim ve şirket içi eğitim materyalleri"
        actions={hasRole('ADMIN', 'MANAGER') && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 bg-gray-900 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus size={14} strokeWidth={2} /> Yeni Eğitim
          </button>
        )}
      />

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={14} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Eğitimlerde ara..."
            className="w-full border border-gray-200 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setCategory('')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            !category
              ? 'bg-gray-900 text-white'
              : 'border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          Tümü
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              category === cat
                ? 'bg-gray-900 text-white'
                : 'border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Yeni Eğitim</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Başlık</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  placeholder="Eğitim başlığı..."
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Açıklama</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  placeholder="Açıklama..."
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Video URL</label>
                <input
                  type="url"
                  value={form.videoUrl}
                  onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
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
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                    placeholder="Kategori..."
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Süre (dakika)</label>
                  <input
                    type="number"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                    placeholder="60"
                  />
                </div>
              </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} variant="card" />)}
        </div>
      ) : trainings.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg">
          <EmptyState
            icon={GraduationCap}
            title="Eğitim bulunamadı"
            description="Yeni eğitim materyalleri burada görünecek."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trainings.map((item) => {
            const Icon = categoryIcons[item.category] || BookOpen
            return (
              <article
                key={item.id}
                className="group bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors flex flex-col"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center text-gray-700">
                    <Icon size={18} strokeWidth={1.75} />
                  </div>
                  {!item.isViewed && (
                    <StatusPill label="Yeni" tone="green" />
                  )}
                </div>
                <Link to={`/training/${item.id}`} className="block">
                  <h3 className="text-sm font-semibold text-gray-900 leading-snug group-hover:text-gray-700 transition-colors">
                    {item.title}
                  </h3>
                </Link>
                <p className="text-sm text-gray-500 line-clamp-2 mt-2 flex-1">{item.description}</p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 min-w-0">
                    {item.category && <StatusPill label={item.category} />}
                    {item.duration && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={11} strokeWidth={1.75} /> {item.duration} dk
                      </span>
                    )}
                  </div>
                  {hasRole('ADMIN', 'MANAGER') && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                      title="Sil"
                    >
                      <Trash2 size={13} strokeWidth={1.75} />
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default TrainingPage
