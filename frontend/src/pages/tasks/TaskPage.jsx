import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckSquare, Plus, AlertTriangle, Play, Check, Clock, CheckCircle2, ListTodo, Tag } from 'lucide-react'
import taskService from '../../services/task.service'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../utils/dateFormat'
import toast from 'react-hot-toast'
import { taskSchema } from '../../schemas/task.schema'
import PageHeader from '../../components/common/PageHeader'
import SkeletonCard from '../../components/common/SkeletonCard'
import EmptyState from '../../components/common/EmptyState'
import StatusPill from '../../components/common/StatusPill'
import StatCard from '../../components/common/StatCard'
import UserPicker from '../../components/common/UserPicker'
import LabelChips from '../../components/common/LabelChips'

const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT']

// İptal artık bir kolon değil — pano sadece aktif akışı gösterir
const COLUMNS = [
  { status: 'TODO',        label: 'Yapılacak' },
  { status: 'IN_PROGRESS', label: 'Devam Ediyor' },
  { status: 'REVIEW',      label: 'İncelemede' },
  { status: 'DONE',        label: 'Tamamlandı' },
]

// Kolon başına eşzamanlı iş (WIP) limiti — aşılınca uyarı gösterilir
const WIP_LIMITS = { IN_PROGRESS: 5 }

const NEXT_STATUS = {
  TODO: 'IN_PROGRESS',
  IN_PROGRESS: 'REVIEW',
  REVIEW: 'DONE',
}
const NEXT_LABEL = { TODO: 'Başlat', IN_PROGRESS: 'İncelemeye Al', REVIEW: 'Tamamla' }

// Durum filtresi — pano kolonları + İptal (kolon olmayan)
const STATUS_FILTER_OPTIONS = [
  ...COLUMNS,
  { status: 'CANCELLED', label: 'İptal edildi' },
]

const PRIORITY_LABELS = { LOW: 'Düşük', NORMAL: 'Normal', HIGH: 'Yüksek', URGENT: 'Acil' }

const DEFAULT_FORM = { title: '', description: '', priority: 'NORMAL', dueDate: '', assignedTo: '' }

const TaskPage = () => {
  const { user, hasRole } = useAuth()
  const isManager = hasRole('ADMIN', 'MANAGER')

  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterLabel, setFilterLabel] = useState('')
  const [view, setView] = useState('board')
  const [assignee, setAssignee] = useState(null)
  const [stats, setStats] = useState(null)
  const [labels, setLabels] = useState([])
  const [selectedLabelIds, setSelectedLabelIds] = useState([])
  const [newLabelName, setNewLabelName] = useState('')
  const [draggingId, setDraggingId] = useState(null)
  const [dragOverCol, setDragOverCol] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: DEFAULT_FORM,
  })

  useEffect(() => {
    fetchTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterPriority, filterLabel])

  useEffect(() => {
    fetchLabels()
  }, [])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const res = await taskService.getTasks({
        limit: 100,
        status: filterStatus || undefined,
        priority: filterPriority || undefined,
        labelId: filterLabel || undefined,
      })
      setTasks(res.data)
    } catch {
      toast.error('Görevler getirilemedi')
    } finally {
      setLoading(false)
    }
    fetchStats()
  }

  const fetchStats = async () => {
    try {
      const res = await taskService.getStats()
      setStats(res.data)
    } catch {
      // istatistik kritik değil, sessiz geç
    }
  }

  const fetchLabels = async () => {
    try {
      const res = await taskService.getLabels()
      setLabels(res.data)
    } catch {
      // sessiz geç
    }
  }

  const handleCreateLabel = async () => {
    const name = newLabelName.trim()
    if (!name) return
    try {
      const res = await taskService.createLabel({ name })
      setLabels((prev) => [...prev, { ...res.data, taskCount: 0 }])
      setSelectedLabelIds((prev) => [...prev, res.data.id])
      setNewLabelName('')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Etiket eklenemedi')
    }
  }

  const toggleLabel = (id) =>
    setSelectedLabelIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const openCreate = () => {
    setEditTask(null)
    reset(DEFAULT_FORM)
    setAssignee(null)
    setSelectedLabelIds([])
    setNewLabelName('')
    setShowForm(true)
  }
  const openEdit = (task) => {
    setEditTask(task)
    reset({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      assignedTo: task.assignee?.id ? String(task.assignee.id) : '',
    })
    setAssignee(task.assignee || null)
    setSelectedLabelIds((task.labels || []).map((l) => l.id))
    setNewLabelName('')
    setShowForm(true)
  }

  const onSubmitTask = async (data) => {
    try {
      const payload = {
        title: data.title,
        description: data.description || undefined,
        priority: data.priority,
        dueDate: data.dueDate || undefined,
        assignedTo: assignee?.id ?? null,
        labelIds: selectedLabelIds,
      }
      if (editTask) {
        await taskService.updateTask(editTask.id, payload)
        toast.success('Görev güncellendi')
      } else {
        await taskService.createTask(payload)
        toast.success('Görev oluşturuldu')
      }
      setShowForm(false)
      fetchTasks()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'İşlem başarısız')
    }
  }

  const handleStatusChange = async (task, status) => {
    try {
      await taskService.updateTask(task.id, { status })
      fetchTasks()
    } catch {
      toast.error('Durum güncellenemedi')
    }
  }

  // Sürükle-bırak: kartı bir kolona bırakınca o kolonun durumuna geçir
  const handleDrop = (status) => {
    const id = draggingId
    setDragOverCol(null)
    setDraggingId(null)
    if (!id) return
    const t = tasks.find((x) => x.id === id)
    if (!t || t.status === status) return
    if (!canEdit(t)) { toast.error('Bu görevi taşıma yetkiniz yok'); return }
    handleStatusChange(t, status)
  }

  const handleDelete = async (id) => {
    if (!confirm('Görevi silmek istediğinize emin misiniz?')) return
    try {
      await taskService.deleteTask(id)
      toast.success('Görev silindi')
      fetchTasks()
    } catch {
      toast.error('Görev silinemedi')
    }
  }

  const byStatus = (status) => tasks.filter((t) => t.status === status)
  const isOverdue = (task) => task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE' && task.status !== 'CANCELLED'
  const canEdit = (task) => isManager || task.creator?.id === user?.id || task.assignee?.id === user?.id

  const TaskCard = ({ task }) => (
    <div
      draggable={canEdit(task)}
      onDragStart={() => setDraggingId(task.id)}
      onDragEnd={() => { setDraggingId(null); setDragOverCol(null) }}
      className={`bg-white border rounded-lg p-4 hover:border-gray-300 transition-colors ${isOverdue(task) ? 'border-red-200' : 'border-gray-200'} ${canEdit(task) ? 'cursor-grab active:cursor-grabbing' : ''} ${draggingId === task.id ? 'opacity-40' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link
          to={`/tasks/${task.id}`}
          className="text-sm font-medium text-gray-900 flex-1 leading-snug hover:underline decoration-gray-300"
        >
          {task.title}
        </Link>
        <StatusPill priority={task.priority} className="shrink-0" />
      </div>

      {task.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>
      )}

      {task.labels?.length > 0 && <LabelChips labels={task.labels} className="mb-3" />}

      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <div className="flex items-center gap-1.5 min-w-0">
          {task.assignee ? (
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="w-5 h-5 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0">
                {task.assignee.firstName[0]}
              </span>
              <span className="truncate">{task.assignee.firstName} {task.assignee.lastName}</span>
            </span>
          ) : (
            <span className="italic text-gray-400">Atanmamış</span>
          )}
        </div>
        {task.dueDate && (
          <span className={`inline-flex items-center gap-1 shrink-0 ${isOverdue(task) ? 'text-red-600 font-medium' : ''}`}>
            {isOverdue(task) && <AlertTriangle size={11} strokeWidth={2} />}
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>

      {canEdit(task) && (
        <div className="flex gap-1.5 flex-wrap">
          {NEXT_STATUS[task.status] && (
            <button
              onClick={() => handleStatusChange(task, NEXT_STATUS[task.status])}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-gray-900 text-white font-medium rounded-md hover:bg-gray-800 transition-colors"
            >
              {task.status === 'REVIEW'
                ? <><Check size={10} strokeWidth={2.5} /> {NEXT_LABEL[task.status]}</>
                : <><Play size={10} strokeWidth={2.5} /> {NEXT_LABEL[task.status]}</>}
            </button>
          )}
          {['TODO', 'IN_PROGRESS', 'REVIEW'].includes(task.status) && (
            <button
              onClick={() => handleStatusChange(task, 'CANCELLED')}
              className="text-xs px-2.5 py-1 border border-gray-200 text-gray-600 rounded-md hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
          )}
          {task.status === 'CANCELLED' && (
            <button
              onClick={() => handleStatusChange(task, 'TODO')}
              className="text-xs px-2.5 py-1 border border-gray-200 text-gray-600 rounded-md hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Geri Al
            </button>
          )}
          {(isManager || task.creator?.id === user?.id) && (
            <button
              onClick={() => openEdit(task)}
              className="text-xs px-2.5 py-1 border border-gray-200 text-gray-600 rounded-md hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Düzenle
            </button>
          )}
          {(isManager || task.creator?.id === user?.id) && (
            <button
              onClick={() => handleDelete(task.id)}
              className="text-xs px-2.5 py-1 text-red-500 hover:text-red-700 transition-colors"
            >
              Sil
            </button>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Görevler"
        description="Görev panonu yönet ve ilerlemeyi takip et"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex border border-gray-200 rounded-md overflow-hidden text-sm">
              <button
                onClick={() => setView('board')}
                className={`px-3 py-1.5 ${view === 'board' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Pano
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-3 py-1.5 ${view === 'list' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Liste
              </button>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 bg-gray-900 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <Plus size={14} strokeWidth={2} /> Yeni Görev
            </button>
          </div>
        }
      />

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Bana atanan (açık)" value={stats.open} icon={ListTodo} />
          <StatCard label="Geciken" value={stats.overdue} icon={AlertTriangle} />
          <StatCard label="Bugün biten" value={stats.dueToday} icon={Clock} />
          <StatCard label="Bu hafta tamamlanan" value={stats.completedThisWeek} icon={CheckCircle2} />
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400 transition-colors"
        >
          <option value="">Tüm Durumlar</option>
          {STATUS_FILTER_OPTIONS.map((c) => <option key={c.status} value={c.status}>{c.label}</option>)}
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400 transition-colors"
        >
          <option value="">Tüm Öncelikler</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
        </select>
        {labels.length > 0 && (
          <select
            value={filterLabel}
            onChange={(e) => setFilterLabel(e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400 transition-colors"
          >
            <option value="">Tüm Etiketler</option>
            {labels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        view === 'board' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {COLUMNS.map((col) => (
              <div key={col.status}>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{col.label}</div>
                <SkeletonCard variant="card" />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} variant="row" />)}
          </div>
        )
      ) : tasks.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg">
          <EmptyState
            icon={CheckSquare}
            title="Görev bulunamadı"
            description="Yeni bir görev oluşturmak için yukarıdaki butonu kullan."
          />
        </div>
      ) : view === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const colTasks = byStatus(col.status)
            const limit = WIP_LIMITS[col.status]
            const overLimit = limit && colTasks.length > limit
            const isDragOver = dragOverCol === col.status
            return (
              <div
                key={col.status}
                onDragOver={(e) => { e.preventDefault(); if (dragOverCol !== col.status) setDragOverCol(col.status) }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverCol(null) }}
                onDrop={() => handleDrop(col.status)}
                className={`rounded-lg transition-colors ${isDragOver ? 'bg-gray-100 ring-2 ring-gray-300 ring-inset' : ''}`}
              >
                <div className="flex items-center gap-2 mb-3 px-1 pt-1">
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{col.label}</h2>
                  <span
                    className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${overLimit ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}
                    title={limit ? `WIP limiti: ${limit}` : undefined}
                  >
                    {colTasks.length}{limit ? `/${limit}` : ''}
                  </span>
                  {overLimit && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-600">
                      <AlertTriangle size={10} strokeWidth={2} /> limit aşıldı
                    </span>
                  )}
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
                <div className="space-y-3 min-h-24 px-1 pb-1">
                  {colTasks.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">
                      {isDragOver ? 'Buraya bırak' : 'Görev yok'}
                    </p>
                  ) : (
                    colTasks.map((task) => <TaskCard key={task.id} task={task} />)
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Görev</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Atanan</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Öncelik</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Durum</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bitiş</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <Link to={`/tasks/${task.id}`} className="font-medium text-gray-900 hover:underline decoration-gray-300">
                      {task.title}
                    </Link>
                    {task.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>}
                  </td>
                  <td className="px-5 py-3 text-gray-600 text-xs">
                    {task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill priority={task.priority} />
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill status={task.status} />
                  </td>
                  <td className={`px-5 py-3 text-xs tabular-nums ${isOverdue(task) ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                    {task.dueDate ? formatDate(task.dueDate) : '—'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {canEdit(task) && (
                      <div className="flex gap-1 justify-end">
                        {NEXT_STATUS[task.status] && (
                          <button
                            onClick={() => handleStatusChange(task, NEXT_STATUS[task.status])}
                            className="px-2.5 py-1 bg-gray-900 text-white text-xs font-medium rounded-md hover:bg-gray-800 transition-colors"
                          >
                            {NEXT_LABEL[task.status]}
                          </button>
                        )}
                        {['TODO', 'IN_PROGRESS', 'REVIEW'].includes(task.status) && (
                          <button
                            onClick={() => handleStatusChange(task, 'CANCELLED')}
                            className="px-2.5 py-1 border border-gray-200 text-gray-600 text-xs rounded-md hover:border-gray-300 hover:bg-gray-50 transition-colors"
                          >
                            İptal
                          </button>
                        )}
                        {task.status === 'CANCELLED' && (
                          <button
                            onClick={() => handleStatusChange(task, 'TODO')}
                            className="px-2.5 py-1 border border-gray-200 text-gray-600 text-xs rounded-md hover:border-gray-300 hover:bg-gray-50 transition-colors"
                          >
                            Geri Al
                          </button>
                        )}
                        {(isManager || task.creator?.id === user?.id) && (
                          <button
                            onClick={() => openEdit(task)}
                            className="px-2.5 py-1 border border-gray-200 text-gray-600 text-xs rounded-md hover:border-gray-300 hover:bg-gray-50 transition-colors"
                          >
                            Düzenle
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-screen overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">{editTask ? 'Görevi Düzenle' : 'Yeni Görev'}</h2>
            <form onSubmit={handleSubmit(onSubmitTask)} className="space-y-4" noValidate>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Başlık *</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  placeholder="Görev başlığı..."
                  {...register('title')}
                />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Açıklama</label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  placeholder="Detaylar..."
                  {...register('description')}
                />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
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
                <label className="text-sm text-gray-600 mb-1.5 flex items-center gap-1.5">
                  <Tag size={13} /> Etiketler
                </label>
                {labels.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {labels.map((l) => {
                      const active = selectedLabelIds.includes(l.id)
                      return (
                        <button
                          type="button"
                          key={l.id}
                          onClick={() => toggleLabel(l.id)}
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded border transition-colors ${active ? 'border-transparent' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                          style={active ? { backgroundColor: l.color + '22', color: l.color, borderColor: l.color + '55' } : undefined}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: l.color }} />
                          {l.name}
                          {active && <Check size={11} strokeWidth={2.5} />}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mb-2">Henüz etiket yok.</p>
                )}
                {isManager && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateLabel() } }}
                      placeholder="Yeni etiket adı..."
                      className="flex-1 border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400"
                    />
                    <button
                      type="button"
                      onClick={handleCreateLabel}
                      disabled={!newLabelName.trim()}
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40"
                    >
                      Ekle
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit" disabled={isSubmitting}
                  className="flex-1 bg-gray-900 text-white rounded-md py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Kaydediliyor...' : editTask ? 'Güncelle' : 'Oluştur'}
                </button>
                <button
                  type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-200 rounded-md py-2 text-sm hover:bg-gray-50 transition-colors"
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

export default TaskPage
