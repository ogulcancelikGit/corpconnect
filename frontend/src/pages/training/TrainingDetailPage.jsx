import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, GraduationCap, Eye, Clock, Edit2, Trash2,
  ExternalLink, FileText,
} from 'lucide-react'
import trainingService from '../../services/training.service'
import { useAuth } from '../../context/AuthContext'
import { formatTimeAgo } from '../../utils/dateFormat'
import toast from 'react-hot-toast'
import StatusPill from '../../components/common/StatusPill'

const TrainingDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasRole } = useAuth()
  const [training, setTraining] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    videoUrl: '',
    category: '',
    duration: '',
  })
  const [saving, setSaving] = useState(false)
  const viewedRef = useRef(false)

  const fetchTraining = useCallback(async () => {
    try {
      const res = await trainingService.getTrainingById(id)
      setTraining(res.data)
      setForm({
        title: res.data.title,
        description: res.data.description || '',
        videoUrl: res.data.videoUrl || '',
        category: res.data.category || '',
        duration: res.data.duration || '',
      })
    } catch {
      toast.error('Eğitim bulunamadı')
      navigate('/training')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    fetchTraining()
    if (!viewedRef.current) {
      viewedRef.current = true
      trainingService.markAsViewed(id).catch(() => {})
    }
  }, [id, fetchTraining])

  const handleUpdate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await trainingService.updateTraining(id, {
        ...form,
        duration: form.duration ? parseInt(form.duration) : undefined,
      })
      toast.success('Eğitim güncellendi')
      setEditMode(false)
      fetchTraining()
    } catch {
      toast.error('Eğitim güncellenemedi')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Eğitimi silmek istediğinize emin misiniz?')) return
    try {
      await trainingService.deleteTraining(id)
      toast.success('Eğitim silindi')
      navigate('/training')
    } catch {
      toast.error('Eğitim silinemedi')
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto pb-12">
        <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-gray-100 rounded-md" />
            <div className="flex-1 space-y-2">
              <div className="h-6 w-3/4 bg-gray-100 rounded" />
              <div className="h-3 w-48 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-gray-100 rounded" />
            <div className="h-3 w-2/3 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!training) return null

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <Link
          to="/training"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={14} strokeWidth={1.75} /> Eğitim listesi
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

      <div className="bg-white rounded-lg border border-gray-200 p-6">
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
              <label className="text-sm text-gray-600 mb-1 block">Açıklama</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Video URL</label>
              <input
                type="url"
                value={form.videoUrl}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
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
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Süre (dakika)</label>
                <input
                  type="number"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                />
              </div>
            </div>
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
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center text-gray-700 shrink-0">
                <GraduationCap size={20} strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-medium text-gray-900 tracking-tight mb-2">{training.title}</h1>
                <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500">
                  {training.category && <StatusPill label={training.category} />}
                  {training.duration && (
                    <span className="inline-flex items-center gap-1">
                      <Clock size={11} strokeWidth={1.75} /> {training.duration} dk
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Eye size={11} strokeWidth={1.75} /> {training.viewCount}
                  </span>
                  <span>· {formatTimeAgo(training.createdAt)}</span>
                </div>
              </div>
            </div>

            {training.description && (
              <p className="text-sm text-gray-700 leading-relaxed mt-6 mb-6 whitespace-pre-wrap">
                {training.description}
              </p>
            )}

            {training.videoUrl && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Video</h3>
                <a
                  href={training.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900 transition-colors break-all"
                >
                  <ExternalLink size={13} strokeWidth={1.75} /> {training.videoUrl}
                </a>
              </div>
            )}

            {training.files && training.files.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Dosyalar</h3>
                <div className="space-y-2">
                  {training.files.map(({ file }) => (
                    <div key={file.id} className="flex items-center gap-3 px-4 py-2.5 border border-gray-200 rounded-md hover:border-gray-300 transition-colors">
                      <FileText size={14} strokeWidth={1.75} className="text-gray-500 shrink-0" />
                      <span className="text-sm text-gray-700 flex-1 truncate">{file.originalName}</span>
                      <a
                        href={`/api/files/${file.id}/download`}
                        className="text-xs text-gray-500 hover:text-gray-900 transition-colors shrink-0"
                      >
                        İndir →
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default TrainingDetailPage
