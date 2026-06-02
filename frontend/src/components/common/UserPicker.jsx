import { useState, useEffect, useRef } from 'react'
import { Search, X, Check, UserPlus } from 'lucide-react'
import useDebounce from '../../hooks/useDebounce'
import userService from '../../services/user.service'
import taskService from '../../services/task.service'

const initials = (u) => `${u?.firstName?.[0] || ''}${u?.lastName?.[0] || ''}`.toUpperCase() || '?'

const UserPicker = ({ value, onChange, placeholder = 'Kişi ata...', clearable = true, excludeIds = [] }) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const ref = useRef(null)
  const inputRef = useRef(null)

  // Click-outside
  useEffect(() => {
    if (!open) return
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Open olunca arama input'una odaklan
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0)
  }, [open])

  // Liste yükle: boş query → getAssignableUsers; doluysa searchUsers
  useEffect(() => {
    if (!open) return
    let active = true
    const run = async () => {
      setLoading(true)
      try {
        const r = await (debouncedQuery.trim()
          ? userService.searchUsers(debouncedQuery.trim())
          : taskService.getAssignableUsers())
        if (active) setUsers(r.data || [])
      } catch {
        if (active) setUsers([])
      } finally {
        if (active) setLoading(false)
      }
    }
    run()
    return () => { active = false }
  }, [open, debouncedQuery])

  const select = (user) => {
    onChange(user)
    setOpen(false)
    setQuery('')
  }

  const clear = (e) => {
    e.stopPropagation()
    onChange(null)
  }

  const filtered = users.filter((u) => !excludeIds.includes(u.id))

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-2 border border-gray-200 rounded-md px-3 py-2 text-sm bg-white hover:border-gray-300 focus:outline-none focus:border-gray-400 transition-colors ${open ? 'border-gray-400' : ''}`}
      >
        {value ? (
          <>
            <span className="w-6 h-6 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0">
              {initials(value)}
            </span>
            <span className="flex-1 text-left text-gray-800 truncate">
              {value.firstName} {value.lastName}
            </span>
            {clearable && (
              <span
                role="button"
                tabIndex={0}
                onClick={clear}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') clear(e) }}
                className="text-gray-400 hover:text-gray-600 shrink-0 p-0.5 rounded hover:bg-gray-100"
                title="Temizle"
              >
                <X size={13} />
              </span>
            )}
          </>
        ) : (
          <>
            <UserPlus size={14} className="text-gray-400 shrink-0" />
            <span className="flex-1 text-left text-gray-400">{placeholder}</span>
          </>
        )}
      </button>

      {open && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="İsim ile ara..."
                className="w-full border border-gray-200 rounded-md pl-7 pr-2 py-1.5 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {clearable && (
              <button
                type="button"
                onClick={() => select(null)}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-left text-sm text-gray-600 border-b border-gray-100"
              >
                <span className="w-6 h-6 bg-gray-50 border border-dashed border-gray-300 rounded-full flex items-center justify-center text-gray-400 shrink-0">
                  <X size={11} />
                </span>
                <span className="flex-1 italic">Atanmamış</span>
                {!value && <Check size={13} className="text-gray-400 shrink-0" />}
              </button>
            )}

            {loading ? (
              <div className="px-3 py-6 text-center text-xs text-gray-400">Yükleniyor...</div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-gray-400">
                {debouncedQuery ? 'Eşleşen kullanıcı yok' : 'Kullanıcı yok'}
              </div>
            ) : (
              filtered.map((u) => {
                const selected = value?.id === u.id
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => select(u)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-left transition-colors ${selected ? 'bg-gray-50' : ''}`}
                  >
                    <span className="w-7 h-7 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0">
                      {initials(u)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {[u.profile?.department, u.profile?.position].filter(Boolean).join(' · ') || u.email || ''}
                      </p>
                    </div>
                    {selected && <Check size={13} className="text-gray-700 shrink-0" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default UserPicker
