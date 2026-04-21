import { useState, useEffect } from 'react'
import userService from '../../services/user.service'
import { formatDate } from '../../utils/dateFormat'
import toast from 'react-hot-toast'
import useDebounce from '../../hooks/useDebounce'

const ROLES = ['ADMIN', 'MANAGER', 'EMPLOYEE']

const AdminUsersPage = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const debouncedSearch = useDebounce(search, 500)

  useEffect(() => {
    fetchUsers()
  }, [debouncedSearch, roleFilter, page])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await userService.getUsers({
        page,
        limit: 10,
        search: debouncedSearch || undefined,
        role: roleFilter || undefined,
      })
      setUsers(res.data)
      setPagination(res.pagination)
    } catch {
      toast.error('Kullanıcılar getirilemedi')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId, role) => {
    try {
      await userService.updateUserRole(userId, role)
      toast.success('Rol güncellendi')
      fetchUsers()
    } catch {
      toast.error('Rol güncellenemedi')
    }
  }

  const handleStatusChange = async (userId, isActive) => {
    try {
      await userService.updateUserStatus(userId, isActive)
      toast.success(`Kullanıcı ${isActive ? 'aktif' : 'pasif'} yapıldı`)
      fetchUsers()
    } catch {
      toast.error('Durum güncellenemedi')
    }
  }

  const handleDelete = async (userId) => {
    if (!confirm('Kullanıcıyı silmek istediğinize emin misiniz?')) return
    try {
      await userService.deleteUser(userId)
      toast.success('Kullanıcı silindi')
      fetchUsers()
    } catch {
      toast.error('Kullanıcı silinemedi')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-800">Kullanıcı Yönetimi</h1>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="İsim veya email ara..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Tüm Roller</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Kullanıcı</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Departman</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Rol</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Durum</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Son Giriş</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400 text-sm">
                  Kullanıcı bulunamadı
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {u.firstName[0]}{u.lastName[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">{u.firstName} {u.lastName}</div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{u.profile?.department || '-'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleStatusChange(u.id, !u.isActive)}
                      className={`text-xs px-2 py-1 rounded-full ${
                        u.isActive
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-red-100 text-red-600 hover:bg-red-200'
                      }`}
                    >
                      {u.isActive ? 'Aktif' : 'Pasif'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Hiç giriş yapmadı'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!pagination.hasPrev}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            Önceki
          </button>
          <span className="text-sm text-gray-500">{pagination.page} / {pagination.totalPages}</span>
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

export default AdminUsersPage