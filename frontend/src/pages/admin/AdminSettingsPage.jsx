import { useState, useEffect } from 'react'
import api from '../../services/api.service'
import toast from 'react-hot-toast'

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await api.get('/admin/settings')
      setSettings(res.data.data)
    } catch {
      toast.error('Ayarlar getirilemedi')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/admin/settings', settings)
      toast.success('Ayarlar güncellendi')
    } catch {
      toast.error('Ayarlar güncellenemedi')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-800 mb-6">Sistem Ayarları</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSave} className="space-y-4">
          {Object.entries(settings).map(([key, value]) => (
            <div key={key}>
              <label className="text-sm text-gray-600 mb-1 block">{key}</label>
              <input
                type="text"
                value={value}
                onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AdminSettingsPage