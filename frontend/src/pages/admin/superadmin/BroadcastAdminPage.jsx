import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Megaphone, Send } from 'lucide-react'
import api from '../../../services/api.service'
import toast from 'react-hot-toast'
import PageHeader from '../../../components/common/PageHeader'
import SkeletonCard from '../../../components/common/SkeletonCard'
import EmptyState from '../../../components/common/EmptyState'
import { broadcastSchema } from '../../../schemas/admin.schema'

const ROLE_OPTIONS = [
  { value: 'EMPLOYEE', label: 'Çalışanlar' },
  { value: 'MANAGER', label: 'Yöneticiler' },
  { value: 'ADMIN', label: 'Adminler' },
]

const DEFAULT_FORM = { title: '', body: '', targetRoles: ['EMPLOYEE', 'MANAGER'], link: '' }

const BroadcastAdminPage = () => {
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(broadcastSchema),
    defaultValues: DEFAULT_FORM,
  })
  const watchedRoles = watch('targetRoles')
  const watchedBody = watch('body')

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const res = await api.get('/broadcast/history')
      setHistory(res.data.data)
    } catch {
      // sessizce geç
    } finally {
      setHistoryLoading(false)
    }
  }

  const toggleRole = (role) => {
    const current = watchedRoles || []
    const next = current.includes(role) ? current.filter((r) => r !== role) : [...current, role]
    setValue('targetRoles', next, { shouldValidate: true, shouldDirty: true })
  }

  const onSend = async (data) => {
    if (!confirm(`${data.targetRoles.join(', ')} rolündeki kullanıcılara bildirim gönderilecek. Onaylıyor musunuz?`)) return
    try {
      const res = await api.post('/broadcast', {
        title: data.title.trim(),
        body: data.body.trim(),
        targetRoles: data.targetRoles,
        link: data.link?.trim() || undefined,
      })
      toast.success(`${res.data.data.sent} kişiye bildirim gönderildi`)
      reset(DEFAULT_FORM)
      fetchHistory()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gönderme başarısız')
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Toplu Bildirim"
        description="Tüm kullanıcılara veya belirli gruplara bildirim gönder"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Yeni Bildirim</h2>
          <form onSubmit={handleSubmit(onSend)} className="space-y-4" noValidate>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Başlık <span className="text-red-500">*</span></label>
              <input
                type="text"
                maxLength={100}
                placeholder="Bildirim başlığı"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                {...register('title')}
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">Mesaj <span className="text-red-500">*</span></label>
              <textarea
                rows={4}
                maxLength={500}
                placeholder="Bildirim içeriği..."
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors resize-none"
                {...register('body')}
              />
              <p className="text-xs text-gray-400 text-right mt-0.5 tabular-nums">{(watchedBody || '').length}/500</p>
              {errors.body && <p className="text-xs text-red-500 mt-1">{errors.body.message}</p>}
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-2 block">Hedef Grup</label>
              <div className="flex gap-2">
                {ROLE_OPTIONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => toggleRole(r.value)}
                    className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${
                      (watchedRoles || []).includes(r.value)
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              {errors.targetRoles && <p className="text-xs text-red-500 mt-1">{errors.targetRoles.message}</p>}
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">Link (opsiyonel)</label>
              <input
                type="text"
                placeholder="/leaves veya /news"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                {...register('link')}
              />
              {errors.link && <p className="text-xs text-red-500 mt-1">{errors.link.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-gray-900 text-white rounded-md py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              <Send size={13} strokeWidth={2} />
              {isSubmitting ? 'Gönderiliyor...' : 'Gönder'}
            </button>
          </form>
        </div>

        {/* Geçmiş */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Gönderim Geçmişi</h2>
          </div>
          {historyLoading ? (
            <div className="divide-y divide-gray-100">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} variant="row" />)}
            </div>
          ) : history.length === 0 ? (
            <EmptyState icon={Megaphone} title="Henüz bildirim gönderilmedi" />
          ) : (
            <div className="divide-y divide-gray-100 max-h-[480px] overflow-y-auto">
              {history.map((h) => (
                <div key={h.id} className="px-5 py-3.5">
                  <p className="text-sm text-gray-900">{h.detail}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {h.user?.firstName} {h.user?.lastName} ·{' '}
                    {new Date(h.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BroadcastAdminPage
