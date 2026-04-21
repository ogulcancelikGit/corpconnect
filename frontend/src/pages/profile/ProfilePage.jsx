import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import userService from '../../services/user.service'
import authService from '../../services/auth.service'
import toast from 'react-hot-toast'

const ProfilePage = () => {
  const { user, updateUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    department: '',
    position: '',
    bio: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.profile?.phone || '',
        department: user.profile?.department || '',
        position: user.profile?.position || '',
        bio: user.profile?.bio || '',
      })
    }
  }, [user])

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await userService.updateMe(form)
      updateUser(res.data)
      toast.success('Profil güncellendi')
    } catch {
      toast.error('Profil güncellenemedi')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Yeni şifreler eşleşmiyor')
      return
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Şifre en az 8 karakter olmalı')
      return
    }
    setChangingPassword(true)
    try {
      await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      toast.success('Şifre değiştirildi')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Şifre değiştirilemedi')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLoading(true)
    try {
      await userService.uploadAvatar(file)
      const res = await userService.getMe()
      updateUser(res.data)
      toast.success('Avatar güncellendi')
    } catch {
      toast.error('Avatar güncellenemedi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-gray-800 mb-6">Profil</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-semibold">
              {user?.profile?.avatar ? (
                <img
                  src={`/${user.profile.avatar}`}
                  alt="avatar"
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                `${user?.firstName?.[0]}${user?.lastName?.[0]}`
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700">
              <span className="text-white text-xs">+</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">{user?.firstName} {user?.lastName}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              user?.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' :
              user?.role === 'MANAGER' ? 'bg-green-100 text-green-600' :
              'bg-gray-100 text-gray-600'
            }`}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {['profile', 'password'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab === 'profile' ? 'Profil Bilgileri' : 'Şifre Değiştir'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {activeTab === 'profile' ? (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Ad</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Soyad</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Telefon</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Departman</label>
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Pozisyon</label>
                <input
                  type="text"
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Biyografi</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Kendiniz hakkında kısa bir bilgi..."
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Mevcut Şifre</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Yeni Şifre</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Yeni Şifre Tekrar</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <button
              type="submit"
              disabled={changingPassword}
              className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {changingPassword ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default ProfilePage