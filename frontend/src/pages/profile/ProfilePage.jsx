import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Camera } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import userService from '../../services/user.service'
import authService from '../../services/auth.service'
import notificationService from '../../services/notification.service'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import StatusPill from '../../components/common/StatusPill'
import { profileSchema, changePasswordSchema } from '../../schemas/profile.schema'

const ROLE_LABELS = { ADMIN: 'Yönetici', MANAGER: 'Müdür', EMPLOYEE: 'Çalışan' }

const NOTIF_TYPES = [
  { key: 'MESSAGE',     label: 'Mesajlar',      desc: 'Yeni mesaj, yanıt ve emoji tepkileri' },
  { key: 'MENTION',     label: 'Bahsetmeler',   desc: 'Mesajlarda @ ile etiketlendiğinizde' },
  { key: 'NEWS',        label: 'Haberler',      desc: 'Yeni şirket duyuruları' },
  { key: 'POLL',        label: 'Anketler',      desc: 'Yeni anket ve sonuçlar' },
  { key: 'CALENDAR',    label: 'Etkinlikler',   desc: 'Takvim davetleri ve hatırlatmalar' },
  { key: 'TASK',        label: 'Görevler',      desc: 'Atanan ve güncellenen görevler' },
  { key: 'LEAVE',       label: 'İzin',          desc: 'İzin talepleri ve onay durumu' },
  { key: 'EXPENSE',     label: 'Masraflar',     desc: 'Masraf talepleri ve onay durumu' },
  { key: 'SUGGESTION',  label: 'Öneriler',      desc: 'Önerileriniz hakkında güncellemeler' },
  { key: 'TRAINING',    label: 'Eğitimler',     desc: 'Yeni eğitim materyalleri' },
  { key: 'CELEBRATION', label: 'Kutlamalar',    desc: 'Doğum günü ve iş yıldönümleri' },
  { key: 'SYSTEM',      label: 'Sistem',        desc: 'Yönetici duyuruları ve sistem mesajları' },
]

const PROFILE_DEFAULTS = {
  firstName: '', lastName: '', phone: '', department: '',
  position: '', bio: '', birthDate: '', hireDate: '',
}

const PASSWORD_DEFAULTS = { currentPassword: '', newPassword: '', confirmPassword: '' }

const ProfilePage = () => {
  const { user, updateUser } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [notifPrefs, setNotifPrefs] = useState(null)
  const [savingPrefs, setSavingPrefs] = useState(false)

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: PROFILE_DEFAULTS,
  })

  const passwordForm = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: PASSWORD_DEFAULTS,
  })

  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.profile?.phone || '',
        department: user.profile?.department || '',
        position: user.profile?.position || '',
        bio: user.profile?.bio || '',
        birthDate: user.profile?.birthDate ? user.profile.birthDate.split('T')[0] : '',
        hireDate: user.profile?.hireDate ? user.profile.hireDate.split('T')[0] : '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const onUpdateProfile = async (data) => {
    try {
      const res = await userService.updateMe(data)
      updateUser(res.data)
      toast.success('Profil güncellendi')
    } catch {
      toast.error('Profil güncellenemedi')
    }
  }

  const onChangePassword = async (data) => {
    try {
      await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      toast.success('Şifre değiştirildi')
      passwordForm.reset(PASSWORD_DEFAULTS)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Şifre değiştirilemedi')
    }
  }

  useEffect(() => {
    if (activeTab !== 'notifications' || notifPrefs) return
    notificationService.getPreferences()
      .then((res) => {
        const fromServer = res.data || {}
        const filled = NOTIF_TYPES.reduce((acc, t) => ({
          ...acc,
          [t.key]: fromServer[t.key] !== undefined ? fromServer[t.key] : true,
        }), {})
        setNotifPrefs(filled)
      })
      .catch(() => toast.error('Tercihler yüklenemedi'))
  }, [activeTab, notifPrefs])

  const togglePref = (key) => {
    setNotifPrefs((p) => ({ ...p, [key]: !p[key] }))
  }

  const handleSavePrefs = async () => {
    setSavingPrefs(true)
    try {
      await notificationService.updatePreferences(notifPrefs)
      toast.success('Tercihler kaydedildi')
    } catch {
      toast.error('Tercihler kaydedilemedi')
    } finally {
      setSavingPrefs(false)
    }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      await userService.uploadAvatar(file)
      const res = await userService.getMe()
      updateUser(res.data)
      toast.success('Avatar güncellendi')
    } catch {
      toast.error('Avatar güncellenemedi')
    }
  }

  const tabs = [
    { key: 'profile', label: 'Profil Bilgileri' },
    { key: 'password', label: 'Şifre Değiştir' },
    { key: 'notifications', label: 'Bildirim Tercihleri' },
  ]

  const { register: registerProfile, handleSubmit: submitProfile, formState: { errors: profileErrors, isSubmitting: profileSubmitting } } = profileForm
  const { register: registerPassword, handleSubmit: submitPassword, formState: { errors: passwordErrors, isSubmitting: passwordSubmitting } } = passwordForm

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <PageHeader title="Profil" description="Hesap bilgilerini ve ayarlarını yönet" />

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-lg font-semibold overflow-hidden">
              {user?.profile?.avatar ? (
                <img
                  src={`/${user.profile.avatar}`}
                  alt="avatar"
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <>{user?.firstName?.[0]}{user?.lastName?.[0]}</>
              )}
            </div>
            <label
              className="absolute bottom-0 right-0 w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors"
              title="Avatar değiştir"
            >
              <Camera size={11} strokeWidth={2} className="text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-gray-900">{user?.firstName} {user?.lastName}</h2>
            <p className="text-sm text-gray-500 truncate">{user?.email}</p>
            <div className="mt-1.5">
              <StatusPill label={ROLE_LABELS[user?.role] || user?.role} />
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.key
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {activeTab === 'profile' && (
          <form onSubmit={submitProfile(onUpdateProfile)} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Ad</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  {...registerProfile('firstName')}
                />
                {profileErrors.firstName && <p className="text-xs text-red-500 mt-1">{profileErrors.firstName.message}</p>}
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Soyad</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  {...registerProfile('lastName')}
                />
                {profileErrors.lastName && <p className="text-xs text-red-500 mt-1">{profileErrors.lastName.message}</p>}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Telefon</label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                {...registerProfile('phone')}
              />
              {profileErrors.phone && <p className="text-xs text-red-500 mt-1">{profileErrors.phone.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Departman</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  {...registerProfile('department')}
                />
                {profileErrors.department && <p className="text-xs text-red-500 mt-1">{profileErrors.department.message}</p>}
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Pozisyon</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  {...registerProfile('position')}
                />
                {profileErrors.position && <p className="text-xs text-red-500 mt-1">{profileErrors.position.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Doğum Tarihi</label>
                <input
                  type="date"
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  {...registerProfile('birthDate')}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">İşe Başlama Tarihi</label>
                <input
                  type="date"
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  {...registerProfile('hireDate')}
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Biyografi</label>
              <textarea
                rows={3}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                placeholder="Kendiniz hakkında kısa bir bilgi..."
                {...registerProfile('bio')}
              />
              {profileErrors.bio && <p className="text-xs text-red-500 mt-1">{profileErrors.bio.message}</p>}
            </div>
            <button
              type="submit" disabled={profileSubmitting}
              className="inline-flex items-center justify-center bg-gray-900 text-white rounded-md py-2 px-4 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {profileSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </form>
        )}
        {activeTab === 'password' && (
          <form onSubmit={submitPassword(onChangePassword)} className="space-y-4" noValidate>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Mevcut Şifre</label>
              <input
                type="password"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                {...registerPassword('currentPassword')}
              />
              {passwordErrors.currentPassword && <p className="text-xs text-red-500 mt-1">{passwordErrors.currentPassword.message}</p>}
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Yeni Şifre</label>
              <input
                type="password"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                {...registerPassword('newPassword')}
              />
              {passwordErrors.newPassword && <p className="text-xs text-red-500 mt-1">{passwordErrors.newPassword.message}</p>}
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Yeni Şifre Tekrar</label>
              <input
                type="password"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                {...registerPassword('confirmPassword')}
              />
              {passwordErrors.confirmPassword && <p className="text-xs text-red-500 mt-1">{passwordErrors.confirmPassword.message}</p>}
            </div>
            <button
              type="submit" disabled={passwordSubmitting}
              className="inline-flex items-center justify-center bg-gray-900 text-white rounded-md py-2 px-4 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {passwordSubmitting ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
            </button>
          </form>
        )}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Hangi bildirimleri almak istediğinizi seçin. Kapattığınız tipler artık gönderilmez.
            </p>
            {!notifPrefs ? (
              <p className="text-sm text-gray-400">Yükleniyor...</p>
            ) : (
              <>
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-md">
                  {NOTIF_TYPES.map((t) => (
                    <label
                      key={t.key}
                      className="flex items-center justify-between gap-4 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{t.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={!!notifPrefs[t.key]}
                        onClick={() => togglePref(t.key)}
                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                          notifPrefs[t.key] ? 'bg-gray-900' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            notifPrefs[t.key] ? 'translate-x-4' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleSavePrefs}
                  disabled={savingPrefs}
                  className="inline-flex items-center justify-center bg-gray-900 text-white rounded-md py-2 px-4 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {savingPrefs ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfilePage
