import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import trainingService from '../../services/training.service'
import { useAuth } from '../../context/AuthContext'
import { formatDateTime } from '../../utils/dateFormat'
import toast from 'react-hot-toast'

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

  useEffect(() => {
    fetchTraining()
  }, [id])

  const fetchTraining = async () => {
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
  }

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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!training) return null

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link to="/training" className="text-sm text-blue-600 hover:underline">
          &larr; Egitim listesi
        </Link>
        {hasRole('ADMIN', 'MANAGER') && (
          <div className="flex gap-2">
            <button
              onClick={() => setEditMode(!editMode)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              {editMode ? 'Iptal' : 'Duzenle'}
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
              <label className="text-sm text-gray-600 mb-1 block">Baslik</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Aciklama</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Video URL</label>
              <input
                type="url"
                value={form.videoUrl}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Sure (dakika)</label>
                <input
                  type="number"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
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
                Iptal
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                📚
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-800 mb-1">{training.title}</h1>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  {training.category && (
                    <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                      {training.category}
                    </span>
                  )}
                  {training.duration && <span>⏱ {training.duration} dk</span>}
                  <span>👁 {training.viewCount} goruntulenme</span>
                  <span>{formatDateTime(training.createdAt)}</span>
                </div>
              </div>
            </div>

            {training.description && (
              <p className="text-gray-600 mb-6 leading-relaxed">{training.description}</p>
            )}

            {training.videoUrl && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Video</h3>
                <a
                  href={training.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm break-all"
                >
                  {training.videoUrl}
                </a>
              </div>
            )}

            {training.files && training.files.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Dosyalar</h3>
                <div className="space-y-2">
                  {training.files.map(({ file }) => (
                    <div key={file.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-lg">📄</span>
                      <span className="text-sm text-gray-700 flex-1">{file.originalName}</span>
                      <a
                        href={`/api/files/${file.id}/download`}
                        className="text-blue-600 text-xs hover:underline"
                      >
                        Indir
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