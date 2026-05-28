import { useState, useEffect } from 'react'
import { AlertTriangle, Save, RefreshCw, CheckCircle2 } from 'lucide-react'
import api from '../../../services/api.service'
import toast from 'react-hot-toast'
import PageHeader from '../../../components/common/PageHeader'
import SkeletonCard from '../../../components/common/SkeletonCard'

const FIELDS = [
  {
    key: 'company_name',
    label: 'Şirket Adı',
    type: 'text',
    placeholder: 'CorpConnect',
    description: 'Uygulama genelinde görünen şirket adı.',
    danger: false,
  },
  {
    key: 'max_annual_leave',
    label: 'Varsayılan Yıllık İzin (Gün)',
    type: 'number',
    placeholder: '14',
    description: 'Yeni kullanıcılara atanan varsayılan yıllık izin günü sayısı.',
    danger: false,
  },
  {
    key: 'leave_approval_required',
    label: 'İzin Onayı Zorunlu',
    type: 'select',
    options: [['true', 'Evet — Yönetici onayı gerekli'], ['false', 'Hayır — Otomatik onay']],
    description: 'Çalışan izin taleplerinin yönetici onayı gerektirip gerektirmediğini belirler.',
    danger: false,
  },
  {
    key: 'maintenance_mode',
    label: 'Bakım Modu',
    type: 'select',
    options: [['false', 'Kapalı — Sistem aktif'], ['true', 'Açık — Bakım aktif']],
    description: 'Aktif edildiğinde tüm kullanıcılar sisteme erişemez. Sadece admin girişine izin verilir.',
    danger: true,
  },
]

const SettingsAdminPage = () => {
  const [settings, setSettings] = useState({})
  const [original, setOriginal] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.get('/admin/settings')
      .then((r) => {
        const data = r.data.data || {}
        setSettings(data)
        setOriginal(data)
      })
      .catch(() => toast.error('Ayarlar getirilemedi'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/admin/settings', settings)
      setOriginal({ ...settings })
      setSaved(true)
      toast.success('Ayarlar kaydedildi')
      setTimeout(() => setSaved(false), 2500)
    } catch {
      toast.error('Ayarlar kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  const reset = () => setSettings({ ...original })

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(original)
  const maintenanceActive = settings['maintenance_mode'] === 'true'

  return (
    <div className="space-y-6 pb-12 max-w-2xl">
      <PageHeader
        title="Sistem Ayarları"
        description="Uygulama genelindeki konfigürasyonlar"
        actions={hasChanges && (
          <div className="inline-flex items-center gap-1.5 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-md px-2 py-1">
            <AlertTriangle size={11} strokeWidth={1.75} />
            Kaydedilmemiş değişiklik
          </div>
        )}
      />

      {/* Bakım modu uyarısı */}
      {maintenanceActive && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 flex items-start gap-3">
          <AlertTriangle size={16} className="text-orange-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-orange-900">Bakım Modu Şu An Aktif</p>
            <p className="text-xs text-orange-700 mt-0.5">Kullanıcılar sisteme erişemiyor. Bakımı tamamladıktan sonra kapatmayı unutmayın.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} variant="card" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {FIELDS.map((f) => {
            const changed = settings[f.key] !== original[f.key]
            const dangerActive = f.danger && settings[f.key] === 'true'
            return (
              <div
                key={f.key}
                className={`bg-white border rounded-lg p-5 transition-colors ${
                  dangerActive
                    ? 'border-orange-300'
                    : changed
                    ? 'border-gray-400'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <label className="text-sm font-semibold text-gray-900">{f.label}</label>
                  {f.danger && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded px-1.5 py-0.5">
                      <AlertTriangle size={9} strokeWidth={2} /> DİKKAT
                    </span>
                  )}
                  {changed && (
                    <span className="text-[10px] font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5">
                      DEĞİŞTİ
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-3">{f.description}</p>
                {f.type === 'select' ? (
                  <select
                    value={settings[f.key] ?? ''}
                    onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
                    className={`border rounded-md px-3 py-2 text-sm focus:outline-none transition-colors ${
                      dangerActive
                        ? 'border-orange-300 bg-orange-50 text-orange-900 focus:border-orange-400'
                        : 'border-gray-200 focus:border-gray-400'
                    }`}
                  >
                    {f.options.map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={f.type}
                    value={settings[f.key] ?? ''}
                    onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors w-64"
                  />
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? (
            <RefreshCw size={13} strokeWidth={1.75} className="animate-spin" />
          ) : saved ? (
            <CheckCircle2 size={13} strokeWidth={1.75} />
          ) : (
            <Save size={13} strokeWidth={1.75} />
          )}
          {saving ? 'Kaydediliyor...' : saved ? 'Kaydedildi!' : 'Değişiklikleri Kaydet'}
        </button>
        {hasChanges && (
          <button
            onClick={reset}
            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-md text-sm font-medium hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Geri Al
          </button>
        )}
      </div>
    </div>
  )
}

export default SettingsAdminPage
