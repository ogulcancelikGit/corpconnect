import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  User,
  AlertTriangle,
  Play,
  Check,
  X,
  Trash2,
  Pencil,
  MessageSquare,
  History,
  Send,
  Plus,
  ListTodo,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import taskService from '../../services/task.service'
import { useAuth } from '../../context/AuthContext'
import { formatDate, formatDateTime, formatTimeAgo } from '../../utils/dateFormat'
import { taskSchema } from '../../schemas/task.schema'
import PageHeader from '../../components/common/PageHeader'
import StatusPill from '../../components/common/StatusPill'
import EmptyState from '../../components/common/EmptyState'
import UserPicker from '../../components/common/UserPicker'
import LabelChips from '../../components/common/LabelChips'

const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT']
const PRIORITY_LABELS = { LOW: 'Düşük', NORMAL: 'Normal', HIGH: 'Yüksek', URGENT: 'Acil' }
const STATUS_LABELS = { TODO: 'Yapılacak', IN_PROGRESS: 'Devam Ediyor', REVIEW: 'İncelemede', DONE: 'Tamamlandı', CANCELLED: 'İptal' }
const ALL_STATUSES = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']

const NEXT_STATUS = { TODO: 'IN_PROGRESS', IN_PROGRESS: 'REVIEW', REVIEW: 'DONE' }
const NEXT_LABEL = { TODO: 'Başlat', IN_PROGRESS: 'İncelemeye Al', REVIEW: 'Tamamla' }

const initials = (u) => `${u?.firstName?.[0] || ''}${u?.lastName?.[0] || ''}`.toUpperCase() || '?'

const TaskDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, hasRole } = useAuth()
  const isManager = hasRole('ADMIN', 'MANAGER')

  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [assignee, setAssignee] = useState(null)
  const [commentBody, setCommentBody] = useState('')
  const [posting, setPosting] = useState(false)
  const [newItemText, setNewItemText] = useState('')
  const commentRef = useRef(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(taskSchema) })

  useEffect(() => {
    fetchTask()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchTask = async () => {
    setLoading(true)
    try {
      const res = await taskService.getTaskById(id)
      setTask(res.data)
    } catch (err) {
      const status = err?.response?.status
      if (status === 404) toast.error('Görev bulunamadı')
      else if (status === 403) toast.error('Bu görevi görme yetkiniz yok')
      else toast.error('Görev getirilemedi')
      navigate('/tasks')
    } finally {
      setLoading(false)
    }
  }

  const openEdit = () => {
    reset({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      assignedTo: task.assignee?.id ? String(task.assignee.id) : '',
    })
    setAssignee(task.assignee || null)
    setEditing(true)
  }

  const onSubmitEdit = async (data) => {
    try {
      const payload = {
        title: data.title,
        description: data.description || undefined,
        priority: data.priority,
        dueDate: data.dueDate || null,
        assignedTo: assignee?.id ?? null,
      }
      await taskService.updateTask(task.id, payload)
      toast.success('Görev güncellendi')
      setEditing(false)
      fetchTask()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Güncelleme başarısız')
    }
  }

  const handleStatus = async (status) => {
    try {
      await taskService.updateTask(task.id, { status })
      fetchTask()
    } catch {
      toast.error('Durum güncellenemedi')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Görevi silmek istediğinize emin misiniz?')) return
    try {
      await taskService.deleteTask(task.id)
      toast.success('Görev silindi')
      navigate('/tasks')
    } catch {
      toast.error('Silinemedi')
    }
  }

  const submitComment = async (e) => {
    e?.preventDefault()
    const body = commentBody.trim()
    if (!body) return
    setPosting(true)
    try {
      await taskService.addComment(task.id, body)
      setCommentBody('')
      fetchTask()
      setTimeout(() => commentRef.current?.focus(), 0)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Yorum eklenemedi')
    } finally {
      setPosting(false)
    }
  }

  const removeComment = async (commentId) => {
    if (!confirm('Yorum silinsin mi?')) return
    try {
      await taskService.deleteComment(task.id, commentId)
      fetchTask()
    } catch {
      toast.error('Yorum silinemedi')
    }
  }

  const addItem = async (e) => {
    e?.preventDefault()
    const text = newItemText.trim()
    if (!text) return
    try {
      await taskService.addChecklistItem(task.id, text)
      setNewItemText('')
      fetchTask()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Madde eklenemedi')
    }
  }

  const toggleItem = async (item) => {
    // İyimser güncelleme: anında işaretle, sonra sunucuya yaz
    setTask((prev) => ({
      ...prev,
      checklist: prev.checklist.map((i) => (i.id === item.id ? { ...i, isDone: !i.isDone } : i)),
    }))
    try {
      await taskService.updateChecklistItem(task.id, item.id, { isDone: !item.isDone })
    } catch {
      toast.error('Madde güncellenemedi')
      fetchTask()
    }
  }

  const removeItem = async (itemId) => {
    try {
      await taskService.deleteChecklistItem(task.id, itemId)
      fetchTask()
    } catch {
      toast.error('Madde silinemedi')
    }
  }

  if (loading || !task) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-gray-700 rounded-full" />
      </div>
    )
  }

  const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE' && task.status !== 'CANCELLED'
  const canEdit = isManager || task.creator?.id === user?.id || task.assignee?.id === user?.id
  const canDelete = isManager || task.creator?.id === user?.id

  const checklist = task.checklist || []
  const doneCount = checklist.filter((i) => i.isDone).length
  const progress = checklist.length ? Math.round((doneCount / checklist.length) * 100) : 0

  return (
    <div className="space-y-6 pb-12">
      <div>
        <Link to="/tasks" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft size={14} /> Görevler
        </Link>
        <PageHeader
          title={task.title}
          description={`#${task.id} · ${formatDateTime(task.createdAt)} tarihinde oluşturuldu`}
          actions={
            canEdit && (
              <div className="flex items-center gap-2">
                {NEXT_STATUS[task.status] && (
                  <button
                    onClick={() => handleStatus(NEXT_STATUS[task.status])}
                    className="inline-flex items-center gap-1.5 bg-gray-900 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-800"
                  >
                    {task.status === 'REVIEW' ? <Check size={13} /> : <Play size={13} />} {NEXT_LABEL[task.status]}
                  </button>
                )}
                {['TODO', 'IN_PROGRESS', 'REVIEW'].includes(task.status) && (
                  <button
                    onClick={() => handleStatus('CANCELLED')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    <X size={13} /> İptal Et
                  </button>
                )}
                {task.status === 'CANCELLED' && (
                  <button
                    onClick={() => handleStatus('TODO')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    <Play size={13} /> Geri Al
                  </button>
                )}
                <button
                  onClick={openEdit}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <Pencil size={13} /> Düzenle
                </button>
                {canDelete && (
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50"
                  >
                    <Trash2 size={13} /> Sil
                  </button>
                )}
              </div>
            )
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol kolon: detay + yorumlar */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <StatusPill status={task.status} />
              <StatusPill priority={task.priority} />
              {overdue && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded border bg-red-50 text-red-700 border-red-200">
                  <AlertTriangle size={11} /> Gecikti
                </span>
              )}
            </div>

            {task.labels?.length > 0 && <LabelChips labels={task.labels} size="md" className="mb-4" />}

            {task.description ? (
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{task.description}</p>
            ) : (
              <p className="text-sm text-gray-400 italic">Açıklama eklenmemiş.</p>
            )}
          </div>

          {/* Kontrol Listesi */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
              <ListTodo size={14} className="text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-700">Kontrol Listesi</h3>
              {checklist.length > 0 && (
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                  {doneCount}/{checklist.length}
                </span>
              )}
              {checklist.length > 0 && (
                <div className="flex items-center gap-2 ml-auto w-32">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="text-[11px] text-gray-500 tabular-nums">%{progress}</span>
                </div>
              )}
            </div>

            <div className="divide-y divide-gray-100">
              {checklist.length === 0 ? (
                <p className="text-xs text-gray-400 px-5 py-4 italic">Henüz madde yok.</p>
              ) : (
                checklist.map((item) => (
                  <div key={item.id} className="px-5 py-2.5 flex items-center gap-3 group">
                    <button
                      type="button"
                      onClick={() => canEdit && toggleItem(item)}
                      disabled={!canEdit}
                      className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors ${
                        item.isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 hover:border-gray-400'
                      } ${!canEdit ? 'cursor-default' : ''}`}
                    >
                      {item.isDone && <Check size={11} strokeWidth={3} />}
                    </button>
                    <span className={`flex-1 text-sm ${item.isDone ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {item.text}
                    </span>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Sil"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {canEdit && (
              <form onSubmit={addItem} className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex gap-2">
                <input
                  type="text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  placeholder="Yeni madde ekle..."
                  maxLength={500}
                  className="flex-1 border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400 bg-white"
                />
                <button
                  type="submit"
                  disabled={!newItemText.trim()}
                  className="inline-flex items-center gap-1 bg-gray-900 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-40"
                >
                  <Plus size={14} /> Ekle
                </button>
              </form>
            )}
          </div>

          {/* Yorumlar */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
              <MessageSquare size={14} className="text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-700">Yorumlar</h3>
              <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                {task.comments.length}
              </span>
            </div>

            <div className="divide-y divide-gray-100">
              {task.comments.length === 0 ? (
                <EmptyState
                  icon={MessageSquare}
                  title="Henüz yorum yok"
                  description="İlk yorumu sen ekle."
                />
              ) : (
                task.comments.map((c) => (
                  <div key={c.id} className="px-5 py-4 flex gap-3">
                    <div className="w-8 h-8 shrink-0 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-xs font-semibold">
                      {initials(c.user)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {c.user.firstName} {c.user.lastName}
                        </span>
                        <span className="text-[11px] text-gray-400">{formatTimeAgo(c.createdAt)}</span>
                        {(c.user.id === user?.id || hasRole('ADMIN')) && (
                          <button
                            onClick={() => removeComment(c.id)}
                            className="ml-auto text-[11px] text-gray-400 hover:text-red-600"
                          >
                            Sil
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{c.body}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={submitComment} className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
              <div className="flex gap-2 items-start">
                <div className="w-8 h-8 shrink-0 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                  {initials(user)}
                </div>
                <textarea
                  ref={commentRef}
                  rows={2}
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitComment(e)
                  }}
                  placeholder="Yorum yaz... (Ctrl+Enter ile gönder)"
                  className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:border-gray-400"
                />
                <button
                  type="submit"
                  disabled={posting || !commentBody.trim()}
                  className="bg-gray-900 text-white p-2 rounded-md hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Gönder"
                >
                  <Send size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sağ kolon: meta + aktivite */}
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Oluşturan</p>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-[11px] font-semibold">
                  {initials(task.creator)}
                </div>
                <span className="text-sm text-gray-700">{task.creator.firstName} {task.creator.lastName}</span>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User size={11} /> Atanan
              </p>
              {task.assignee ? (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-[11px] font-semibold">
                    {initials(task.assignee)}
                  </div>
                  <span className="text-sm text-gray-700">{task.assignee.firstName} {task.assignee.lastName}</span>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Atanmamış</p>
              )}
            </div>

            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar size={11} /> Bitiş Tarihi
              </p>
              <p className={`text-sm ${overdue ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                {task.dueDate ? formatDate(task.dueDate) : '—'}
              </p>
            </div>
          </div>

          {/* Aktivite */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
              <History size={14} className="text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-700">Aktivite</h3>
            </div>
            {task.activity.length === 0 ? (
              <p className="text-xs text-gray-400 px-5 py-4 italic">Henüz aktivite yok</p>
            ) : (
              <ul className="px-5 py-3 space-y-3 max-h-96 overflow-y-auto">
                {task.activity.map((a) => (
                  <li key={a.id} className="text-xs flex gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-gray-700 leading-snug">{a.detail || a.action}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{formatTimeAgo(a.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Düzenleme modalı */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-screen overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Görevi Düzenle</h2>
            <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-4" noValidate>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Başlık *</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  {...register('title')}
                />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Açıklama</label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  {...register('description')}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Öncelik</label>
                  <select
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                    {...register('priority')}
                  >
                    {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Bitiş Tarihi</label>
                  <input
                    type="date"
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                    {...register('dueDate')}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Kişiye Ata</label>
                <UserPicker value={assignee} onChange={setAssignee} />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Durum</label>
                <div className="flex gap-2 flex-wrap">
                  {ALL_STATUSES.map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => { handleStatus(s); setEditing(false) }}
                      className={`text-xs px-3 py-1.5 rounded-md border ${
                        task.status === s
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit" disabled={isSubmitting}
                  className="flex-1 bg-gray-900 text-white rounded-md py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                >
                  {isSubmitting ? 'Kaydediliyor...' : 'Güncelle'}
                </button>
                <button
                  type="button" onClick={() => setEditing(false)}
                  className="flex-1 border border-gray-200 rounded-md py-2 text-sm hover:bg-gray-50"
                >
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

export default TaskDetailPage
