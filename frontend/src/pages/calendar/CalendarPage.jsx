import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../../context/AuthContext'
import calendarService from '../../services/calendar.service'
import userService from '../../services/user.service'
import toast from 'react-hot-toast'
import { eventSchema } from '../../schemas/calendar.schema'

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

const TYPE_COLORS = {
  MEETING: { bg: 'bg-blue-500', light: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500', ring: 'ring-blue-500' },
  DEADLINE: { bg: 'bg-red-500', light: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500', ring: 'ring-red-500' },
  HOLIDAY: { bg: 'bg-green-500', light: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500', ring: 'ring-green-500' },
  REMINDER: { bg: 'bg-amber-500', light: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', ring: 'ring-amber-500' },
  OTHER: { bg: 'bg-purple-500', light: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500', ring: 'ring-purple-500' },
}

const TYPE_LABELS = {
  MEETING: 'Toplantı',
  DEADLINE: 'Son Tarih',
  HOLIDAY: 'Tatil',
  REMINDER: 'Hatırlatma',
  OTHER: 'Diğer',
}

const RSVP_STYLE = {
  GOING: { chip: 'bg-green-100 text-green-700 border-green-200', label: 'Katılıyor' },
  MAYBE: { chip: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Belki' },
  DECLINED: { chip: 'bg-red-50 text-red-600 border-red-200 line-through', label: 'Katılmıyor' },
  PENDING: { chip: 'bg-gray-100 text-gray-600 border-gray-200', label: 'Bekleniyor' },
}

const EMPTY_FORM = {
  title: '',
  description: '',
  type: 'OTHER',
  startDate: '',
  endDate: '',
  allDay: false,
  location: '',
  isPublic: true,
  attendees: [],
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  const d = new Date(year, month, 1).getDay()
  return d === 0 ? 6 : d - 1
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
}

export default function CalendarPage() {
  const { user } = useAuth()
  const [today] = useState(new Date())
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [events, setEvents] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editEvent, setEditEvent] = useState(null)
  const [users, setUsers] = useState([])
  const [fetching, setFetching] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: EMPTY_FORM,
  })
  const watchedAttendees = watch('attendees')
  const [detailEvent, setDetailEvent] = useState(null)
  const [viewMode, setViewMode] = useState('month') // 'month' | 'list'
  const [selectedDay, setSelectedDay] = useState(null)

  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  useEffect(() => {
    fetchEvents()
  }, [viewYear, viewMonth])

  useEffect(() => {
    if (canManage) {
      userService.getUsers().then((r) => setUsers(r.data || r)).catch(() => {})
    }
  }, [canManage])

  const fetchEvents = async () => {
    setFetching(true)
    const start = new Date(viewYear, viewMonth, 1).toISOString()
    const end = new Date(viewYear, viewMonth + 1, 0, 23, 59, 59).toISOString()
    try {
      const res = await calendarService.getEvents({ start, end })
      setEvents(res.data || res)
    } catch {
      toast.error('Etkinlikler yüklenemedi')
    } finally {
      setFetching(false)
    }
  }

  const eventsOnDay = useMemo(() => {
    const map = {}
    events.forEach((ev) => {
      const d = new Date(ev.startDate)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      if (!map[key]) map[key] = []
      map[key].push(ev)
    })
    return map
  }, [events])

  const getEventsForDay = (day) => {
    const key = `${viewYear}-${viewMonth}-${day}`
    return eventsOnDay[key] || []
  }

  const upcomingEvents = useMemo(() => {
    const now = new Date()
    return [...events]
      .filter((ev) => new Date(ev.startDate) >= now)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .slice(0, 8)
  }, [events])

  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return []
    return getEventsForDay(selectedDay)
  }, [selectedDay, eventsOnDay])

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11) }
    else setViewMonth((m) => m - 1)
    setSelectedDay(null)
  }

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0) }
    else setViewMonth((m) => m + 1)
    setSelectedDay(null)
  }

  const goToToday = () => {
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
    setSelectedDay(today.getDate())
  }

  const openCreate = (day) => {
    if (!canManage) return
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    reset({ ...EMPTY_FORM, startDate: `${dateStr}T09:00`, endDate: `${dateStr}T10:00` })
    setEditEvent(null)
    setShowModal(true)
  }

  const openEdit = (ev) => {
    reset({
      title: ev.title,
      description: ev.description || '',
      type: ev.type,
      startDate: ev.startDate.slice(0, 16),
      endDate: ev.endDate.slice(0, 16),
      allDay: ev.allDay,
      location: ev.location || '',
      isPublic: ev.isPublic,
      attendees: ev.attendees?.map((a) => a.user.id) || [],
    })
    setEditEvent(ev)
    setDetailEvent(null)
    setShowModal(true)
  }

  const onSubmitEvent = async (data) => {
    try {
      if (editEvent) {
        await calendarService.updateEvent(editEvent.id, data)
        toast.success('Etkinlik güncellendi')
      } else {
        await calendarService.createEvent(data)
        toast.success('Etkinlik oluşturuldu')
      }
      setShowModal(false)
      fetchEvents()
    } catch {
      toast.error('İşlem başarısız')
    }
  }

  const handleDelete = async (ev) => {
    if (!confirm('Bu etkinliği silmek istediğinizden emin misiniz?')) return
    try {
      await calendarService.deleteEvent(ev.id)
      toast.success('Etkinlik silindi')
      setDetailEvent(null)
      fetchEvents()
    } catch {
      toast.error('Silinemedi')
    }
  }

  const handleRsvp = async (status) => {
    if (!detailEvent) return
    try {
      await calendarService.respondToEvent(detailEvent.id, status)
      toast.success('Cevabınız kaydedildi')
      setDetailEvent((prev) => prev && {
        ...prev,
        attendees: prev.attendees.map((a) =>
          a.userId === user?.id ? { ...a, status, respondedAt: new Date().toISOString() } : a
        ),
      })
      fetchEvents()
    } catch {
      toast.error('Cevap kaydedilemedi')
    }
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7

  const isToday = (day) =>
    day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear()

  const isSelected = (day) => day === selectedDay

  const toggleAttendee = (id) => {
    const current = watchedAttendees || []
    const next = current.includes(id) ? current.filter((a) => a !== id) : [...current, id]
    setValue('attendees', next, { shouldDirty: true })
  }

  const handleDayClick = (day) => {
    setSelectedDay(selectedDay === day ? null : day)
  }

  const handleDayDoubleClick = (day) => {
    if (canManage) openCreate(day)
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Takvim</h1>
          <p className="text-sm text-gray-500 mt-0.5">Etkinlikleri görüntüle ve yönet</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Aylık
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Liste
            </button>
          </div>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Bugün
          </button>
          {canManage && (
            <button
              onClick={() => openCreate(today.getDate())}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Yeni Etkinlik
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-5">
        {/* Main Calendar / List */}
        <div className="flex-1 min-w-0">
          {viewMode === 'month' ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Month Nav */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex items-center gap-3">
                  {fetching && (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  )}
                  <h2 className="text-base font-semibold text-gray-900">
                    {MONTHS[viewMonth]} {viewYear}
                  </h2>
                </div>
                <button
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7">
                {DAYS.map((d, i) => (
                  <div key={d} className={`py-2 text-center text-xs font-semibold uppercase tracking-wide
                    ${i >= 5 ? 'text-red-400' : 'text-gray-400'}`}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div className="grid grid-cols-7 border-t border-gray-100">
                {Array.from({ length: totalCells }, (_, i) => {
                  const day = i - firstDay + 1
                  const isValid = day >= 1 && day <= daysInMonth
                  const dayEvents = isValid ? getEventsForDay(day) : []
                  const isWeekend = i % 7 >= 5

                  return (
                    <div
                      key={i}
                      onClick={() => isValid && handleDayClick(day)}
                      onDoubleClick={() => isValid && handleDayDoubleClick(day)}
                      className={`min-h-[88px] border-b border-r border-gray-100 p-1 transition-colors
                        ${!isValid ? 'bg-gray-50/50' : isWeekend ? 'bg-red-50/20 hover:bg-red-50/40' : 'hover:bg-blue-50/40'}
                        ${isValid ? 'cursor-pointer' : ''}
                        ${isSelected(day) && isValid ? 'ring-2 ring-inset ring-blue-500 bg-blue-50/60' : ''}
                        ${i % 7 === 6 ? 'border-r-0' : ''}
                      `}
                    >
                      {isValid && (
                        <>
                          <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-0.5
                            ${isToday(day) ? 'bg-blue-600 text-white font-bold' : isWeekend ? 'text-red-500' : 'text-gray-700'}
                          `}>
                            {day}
                          </div>
                          <div className="space-y-0.5">
                            {dayEvents.slice(0, 2).map((ev) => (
                              <div
                                key={ev.id}
                                onClick={(e) => { e.stopPropagation(); setDetailEvent(ev) }}
                                className={`text-[10px] text-white px-1.5 py-0.5 rounded-sm truncate cursor-pointer ${TYPE_COLORS[ev.type]?.bg} hover:opacity-85 leading-tight`}
                              >
                                {!ev.allDay && <span className="opacity-80 mr-0.5">{formatTime(ev.startDate)}</span>}
                                {ev.title}
                              </div>
                            ))}
                            {dayEvents.length > 2 && (
                              <div
                                onClick={(e) => { e.stopPropagation(); setSelectedDay(day) }}
                                className="text-[10px] text-blue-600 font-medium px-1 cursor-pointer hover:underline"
                              >
                                +{dayEvents.length - 2} daha
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            /* List View */
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex items-center gap-3">
                  {fetching && <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
                  <h2 className="text-base font-semibold text-gray-900">{MONTHS[viewMonth]} {viewYear}</h2>
                </div>
                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              {events.length === 0 && !fetching ? (
                <div className="py-16 text-center">
                  <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-400 text-sm">Bu ay etkinlik bulunmuyor</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {events.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => setDetailEvent(ev)}
                      className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className={`w-1 self-stretch rounded-full mt-1 ${TYPE_COLORS[ev.type]?.bg}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">{ev.title}</p>
                          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border ${TYPE_COLORS[ev.type]?.light}`}>
                            {TYPE_LABELS[ev.type]}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-gray-500">
                            {formatDateTime(ev.startDate)}
                          </span>
                          {ev.location && (
                            <span className="text-xs text-gray-400 truncate">📍 {ev.location}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Selected day events panel */}
          {selectedDay && selectedDayEvents.length > 0 && viewMode === 'month' && (
            <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">
                  {selectedDay} {MONTHS[viewMonth]} — {selectedDayEvents.length} etkinlik
                </h3>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {selectedDayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => setDetailEvent(ev)}
                    className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${TYPE_COLORS[ev.type]?.bg}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{ev.title}</p>
                      {!ev.allDay && (
                        <p className="text-xs text-gray-500">{formatTime(ev.startDate)} – {formatTime(ev.endDate)}</p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${TYPE_COLORS[ev.type]?.light}`}>
                      {TYPE_LABELS[ev.type]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-64 shrink-0 hidden lg:flex flex-col gap-4">
          {/* Legend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Etkinlik Türleri</h3>
            <div className="space-y-2">
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${TYPE_COLORS[k]?.bg}`} />
                  <span className="text-sm text-gray-600">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Yaklaşan Etkinlikler</h3>
            </div>
            {upcomingEvents.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">Yaklaşan etkinlik yok</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {upcomingEvents.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => setDetailEvent(ev)}
                    className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-1 self-stretch rounded-full mt-0.5 ${TYPE_COLORS[ev.type]?.bg}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{ev.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(ev.startDate)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {canManage && (
            <p className="text-xs text-gray-400 text-center">
              Bir güne çift tıklayarak hızlıca etkinlik ekleyebilirsiniz.
            </p>
          )}
        </div>
      </div>

      {/* Event Detail Modal */}
      {detailEvent && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={() => setDetailEvent(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`h-1.5 ${TYPE_COLORS[detailEvent.type]?.bg}`} />
            <div className="p-6">
              <div className="flex items-start justify-between mb-1">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${TYPE_COLORS[detailEvent.type]?.light}`}>
                  {TYPE_LABELS[detailEvent.type]}
                </span>
                <button
                  onClick={() => setDetailEvent(null)}
                  className="text-gray-300 hover:text-gray-500 transition-colors ml-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mt-3 mb-4">{detailEvent.title}</h3>

              {detailEvent.description && (
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">{detailEvent.description}</p>
              )}

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="text-sm text-gray-700">
                    <p>{formatDate(detailEvent.startDate)}</p>
                    {!detailEvent.allDay && (
                      <p className="text-gray-500 text-xs mt-0.5">
                        {formatTime(detailEvent.startDate)} – {formatTime(detailEvent.endDate)}
                      </p>
                    )}
                    {detailEvent.allDay && <p className="text-gray-500 text-xs mt-0.5">Tüm gün</p>}
                  </div>
                </div>

                {detailEvent.location && (
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm text-gray-700">{detailEvent.location}</span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm text-gray-700">
                    {detailEvent.creator?.firstName} {detailEvent.creator?.lastName}
                  </span>
                </div>

                {detailEvent.attendees?.length > 0 && (
                  <div className="flex items-start gap-3">
                    <svg className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="flex flex-wrap gap-1">
                      {detailEvent.attendees.map((a) => {
                        const style = RSVP_STYLE[a.status] || RSVP_STYLE.PENDING
                        return (
                          <span
                            key={a.user.id}
                            title={style.label}
                            className={`text-xs px-2 py-0.5 rounded-full border ${style.chip}`}
                          >
                            {a.user.firstName} {a.user.lastName}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {(() => {
                const myAttendance = detailEvent.attendees?.find((a) => a.userId === user?.id)
                const isCreator = detailEvent.creator?.id === user?.id || detailEvent.createdBy === user?.id
                if (!myAttendance || isCreator) return null
                return (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-2">Bu etkinliğe katılacak mısınız?</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: 'GOING', label: 'Katılıyorum', active: 'bg-green-600 text-white border-green-600', idle: 'bg-white text-green-700 border-green-200 hover:bg-green-50' },
                        { key: 'MAYBE', label: 'Belki', active: 'bg-yellow-500 text-white border-yellow-500', idle: 'bg-white text-yellow-700 border-yellow-200 hover:bg-yellow-50' },
                        { key: 'DECLINED', label: 'Katılmıyorum', active: 'bg-red-600 text-white border-red-600', idle: 'bg-white text-red-700 border-red-200 hover:bg-red-50' },
                      ].map((opt) => {
                        const isActive = myAttendance.status === opt.key
                        return (
                          <button
                            key={opt.key}
                            onClick={() => handleRsvp(opt.key)}
                            className={`py-2 rounded-lg border text-sm font-medium transition-colors ${isActive ? opt.active : opt.idle}`}
                          >
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}

              {(detailEvent.creator?.id === user?.id || canManage) && (
                <div className="flex gap-2 mt-6 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => openEdit(detailEvent)}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleDelete(detailEvent)}
                    className="flex-1 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                  >
                    Sil
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {editEvent ? 'Etkinliği Düzenle' : 'Yeni Etkinlik'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-300 hover:text-gray-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitEvent)} className="p-6 space-y-4" noValidate>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlık *</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Etkinlik başlığı"
                  {...register('title')}
                />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tür</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    {...register('type')}
                  >
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Konum</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Konum (isteğe bağlı)"
                    {...register('location')}
                  />
                  {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç *</label>
                  <input
                    type="datetime-local"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    {...register('startDate')}
                  />
                  {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş *</label>
                  <input
                    type="datetime-local"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    {...register('endDate')}
                  />
                  {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Açıklama (isteğe bağlı)"
                  {...register('description')}
                />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
              </div>

              <div className="flex items-center gap-5">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="rounded accent-blue-600"
                    {...register('allDay')}
                  />
                  Tüm gün
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="rounded accent-blue-600"
                    {...register('isPublic')}
                  />
                  Herkese açık
                </label>
              </div>

              {users.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Katılımcılar</label>
                  <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-50">
                    {users.filter((u) => u.id !== user?.id).map((u) => (
                      <label key={u.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(watchedAttendees || []).includes(u.id)}
                          onChange={() => toggleAttendee(u.id)}
                          className="rounded accent-blue-600"
                        />
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs text-white font-semibold shrink-0">
                          {u.firstName?.[0]}{u.lastName?.[0]}
                        </div>
                        <span className="text-sm text-gray-700">{u.firstName} {u.lastName}</span>
                        {u.department && <span className="text-xs text-gray-400 ml-auto">{u.department}</span>}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Kaydediliyor...' : editEvent ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
