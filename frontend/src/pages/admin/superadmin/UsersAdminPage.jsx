import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import api from '../../../services/api.service'
import toast from 'react-hot-toast'
import {
  Users, Search, Plus, RefreshCw, UserCheck, UserX, Eye, EyeOff, X,
} from 'lucide-react'
import PageHeader from '../../../components/common/PageHeader'
import EmptyState from '../../../components/common/EmptyState'
import { createUserSchema } from '../../../schemas/admin.schema'

const ROLE_LABELS = { ADMIN: 'Admin', MANAGER: 'Manager', EMPLOYEE: 'Çalışan' }

const DEFAULT_FORM = {
  email: '', password: '', firstName: '', lastName: '',
  role: 'EMPLOYEE', department: '', position: '', phone: '',
}

const inputCls = 'w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors'

const UsersAdminPage = () => {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [total, setTotal] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const {
    register: registerCreate,
    handleSubmit: submitCreate,
    reset: resetCreate,
    formState: { errors: createErrors, isSubmitting: creating },
  } = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: DEFAULT_FORM,
  })

  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await api.get('/admin/users', {
        params: {
          search: search || undefined,
          role: roleFilter || undefined,
          isActive: statusFilter !== '' ? statusFilter : undefined,
          limit: 100,
        },
      })
      setUsers(res.data.data)
      setTotal(res.data.meta?.total ?? res.data.data.length)
    } catch {
      toast.error('Kullanıcılar getirilemedi')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [search, roleFilter, statusFilter])

  useEffect(() => {
    const t = setTimeout(() => fetchUsers(), 300)
    return () => clearTimeout(t)
  }, [fetchUsers])

  const toggleActive = async (userId, current) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { isActive: !current })
      toast.success(current ? 'Kullanıcı pasife alındı' : 'Kullanıcı aktif edildi')
      fetchUsers(true)
    } catch {
      toast.error('İşlem başarısız')
    }
  }

  const changeRole = async (userId, role) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role })
      toast.success('Rol güncellendi')
      fetchUsers(true)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Rol güncellenemedi')
    }
  }

  const onCreate = async (data) => {
    try {
      await api.post('/admin/users', data)
      toast.success('Kullanıcı oluşturuldu')
      setShowCreate(false)
      resetCreate(DEFAULT_FORM)
      fetchUsers(true)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Kullanıcı oluşturulamadı')
    }
  }

  const activeCount  = users.filter((u) => u.isActive).length
  const passiveCount = users.filter((u) => !u.isActive).length

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Kullanıcı Yönetimi"
        description={
          <>
            <span className="tabular-nums">{total}</span> kullanıcı
            {' · '}
            <span className="text-emerald-600 font-medium tabular-nums">{activeCount} aktif</span>
            {' · '}
            <span className="tabular-nums">{passiveCount} pasif</span>
          </>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchUsers(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-700 rounded-md text-sm font-medium hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <RefreshCw size={13} strokeWidth={1.75} className={refreshing ? 'animate-spin' : ''} /> Yenile
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 bg-gray-900 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <Plus size={14} strokeWidth={2} /> Yeni Kullanıcı
            </button>
          </div>
        }
      />

      {/* Filtreler */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ad, soyad veya e-posta ara..."
            className="w-full border border-gray-200 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
        >
          <option value="">Tüm Roller</option>
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Manager</option>
          <option value="EMPLOYEE">Çalışan</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
        >
          <option value="">Tüm Durumlar</option>
          <option value="true">Aktif</option>
          <option value="false">Pasif</option>
        </select>
      </div>

      {/* Tablo */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5">
              <div className="w-7 h-7 bg-gray-100 rounded-full" />
              <div className="h-3.5 w-36 bg-gray-100 rounded" />
              <div className="h-3.5 w-24 bg-gray-100 rounded ml-auto" />
              <div className="h-3.5 w-20 bg-gray-100 rounded" />
              <div className="h-3.5 w-16 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg">
          <EmptyState icon={Users} title="Kullanıcı bulunamadı" />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kullanıcı</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Departman / Pozisyon</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Durum</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Son Giriş</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 ${u.isActive ? 'bg-gray-100 text-gray-700' : 'bg-gray-50 text-gray-400'}`}>
                        {u.firstName?.[0]}{u.lastName?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm text-gray-700">{u.profile?.department || '—'}</p>
                    <p className="text-xs text-gray-500">{u.profile?.position || ''}</p>
                  </td>
                  <td className="px-5 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      className="text-xs px-2 py-1 rounded-md border border-gray-200 bg-white cursor-pointer focus:outline-none focus:border-gray-400 transition-colors"
                    >
                      {Object.entries(ROLE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <div className="inline-flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                      <span className={`text-xs font-medium ${u.isActive ? 'text-emerald-700' : 'text-gray-500'}`}>
                        {u.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500 tabular-nums">
                    {u.lastLoginAt
                      ? new Date(u.lastLoginAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => toggleActive(u.id, u.isActive)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                        u.isActive
                          ? 'text-red-600 border-gray-200 hover:border-red-200 hover:bg-red-50'
                          : 'text-emerald-700 border-gray-200 hover:border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      {u.isActive ? <><UserX size={11} strokeWidth={1.75} /> Pasife Al</> : <><UserCheck size={11} strokeWidth={1.75} /> Aktif Et</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Yeni Kullanıcı Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Yeni Kullanıcı Oluştur</h2>
                <p className="text-xs text-gray-500 mt-0.5">Sisteme yeni bir kullanıcı ekle</p>
              </div>
              <button
                onClick={() => { setShowCreate(false); resetCreate(DEFAULT_FORM) }}
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={submitCreate(onCreate)} className="p-6 space-y-4" noValidate>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Ad *</label>
                  <input className={inputCls} placeholder="Adı" {...registerCreate('firstName')} />
                  {createErrors.firstName && <p className="text-xs text-red-500 mt-1">{createErrors.firstName.message}</p>}
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Soyad *</label>
                  <input className={inputCls} placeholder="Soyadı" {...registerCreate('lastName')} />
                  {createErrors.lastName && <p className="text-xs text-red-500 mt-1">{createErrors.lastName.message}</p>}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">E-posta *</label>
                <input type="email" className={inputCls} placeholder="ornek@sirket.com" {...registerCreate('email')} />
                {createErrors.email && <p className="text-xs text-red-500 mt-1">{createErrors.email.message}</p>}
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Şifre *</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className={`${inputCls} pr-9`}
                    placeholder="En az 8 karakter"
                    {...registerCreate('password')}
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
                    {showPwd ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                {createErrors.password && <p className="text-xs text-red-500 mt-1">{createErrors.password.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Rol</label>
                  <select className={inputCls} {...registerCreate('role')}>
                    {Object.entries(ROLE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Departman</label>
                  <input className={inputCls} placeholder="Örn: Yazılım" {...registerCreate('department')} />
                  {createErrors.department && <p className="text-xs text-red-500 mt-1">{createErrors.department.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Pozisyon</label>
                  <input className={inputCls} placeholder="Örn: Developer" {...registerCreate('position')} />
                  {createErrors.position && <p className="text-xs text-red-500 mt-1">{createErrors.position.message}</p>}
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Telefon</label>
                  <input className={inputCls} placeholder="+90 5xx xxx xx xx" {...registerCreate('phone')} />
                  {createErrors.phone && <p className="text-xs text-red-500 mt-1">{createErrors.phone.message}</p>}
                </div>
              </div>
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="submit" disabled={creating}
                  className="flex-1 bg-gray-900 text-white rounded-md py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors">
                  {creating ? 'Oluşturuluyor...' : 'Kullanıcı Oluştur'}
                </button>
                <button type="button"
                  onClick={() => { setShowCreate(false); resetCreate(DEFAULT_FORM) }}
                  className="flex-1 border border-gray-200 rounded-md py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersAdminPage
