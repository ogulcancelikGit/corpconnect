import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api.service'
import toast from 'react-hot-toast'

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats')
      setStats(res.data.data)
    } catch {
      toast.error('İstatistikler getirilemedi')
    } finally {
      setLoading(false)
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-800">Admin Panel</h1>
        <div className="flex gap-2">
          <Link
            to="/admin/users"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            Kullanıcı Yönetimi
          </Link>
          <Link
            to="/admin/settings"
            className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            Sistem Ayarları
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500 mb-3 font-medium">Kullanıcılar</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-800">{stats?.users?.total || 0}</div>
              <div className="text-xs text-gray-400">Toplam</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-green-600">{stats?.users?.active || 0}</div>
              <div className="text-xs text-gray-400">Aktif</div>
            </div>
          </div>
          <div className="flex justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="text-center">
              <div className="text-sm font-medium text-purple-600">{stats?.users?.byRole?.admin || 0}</div>
              <div className="text-xs text-gray-400">Admin</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-green-600">{stats?.users?.byRole?.manager || 0}</div>
              <div className="text-xs text-gray-400">Manager</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600">{stats?.users?.byRole?.employee || 0}</div>
              <div className="text-xs text-gray-400">Employee</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500 mb-3 font-medium">İçerik</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Haberler</span>
              <span className="font-semibold text-gray-800">{stats?.content?.news || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Anketler</span>
              <span className="font-semibold text-gray-800">{stats?.content?.polls || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Aktif Anketler</span>
              <span className="font-semibold text-green-600">{stats?.content?.activePolls || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Eğitimler</span>
              <span className="font-semibold text-gray-800">{stats?.content?.trainings || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500 mb-3 font-medium">Aktivite</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Mesajlar</span>
              <span className="font-semibold text-gray-800">{stats?.activity?.messages || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Dosyalar</span>
              <span className="font-semibold text-gray-800">{stats?.activity?.files || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Bildirimler</span>
              <span className="font-semibold text-gray-800">{stats?.activity?.notifications || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardPage