import { useState, useEffect } from 'react'
import { BarChart2, Plus, Trash2, Check } from 'lucide-react'
import pollService from '../../services/poll.service'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../utils/dateFormat'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import SkeletonCard from '../../components/common/SkeletonCard'
import EmptyState from '../../components/common/EmptyState'
import StatusPill from '../../components/common/StatusPill'

const PollPage = () => {
  const [polls, setPolls] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('active')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    question: '',
    options: ['', ''],
    startDate: '',
    endDate: '',
  })
  const [formLoading, setFormLoading] = useState(false)
  const [votingId, setVotingId] = useState(null)
  const { hasRole } = useAuth()

  useEffect(() => {
    fetchPolls()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const fetchPolls = async () => {
    try {
      setLoading(true)
      const res = await pollService.getPolls({ status, limit: 20 })
      setPolls(res.data)
    } catch {
      toast.error('Anketler getirilemedi')
    } finally {
      setLoading(false)
    }
  }

  const handleAddOption = () => {
    if (form.options.length >= 10) return
    setForm({ ...form, options: [...form.options, ''] })
  }

  const handleRemoveOption = (index) => {
    if (form.options.length <= 2) return
    setForm({ ...form, options: form.options.filter((_, i) => i !== index) })
  }

  const handleOptionChange = (index, value) => {
    const newOptions = [...form.options]
    newOptions[index] = value
    setForm({ ...form, options: newOptions })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    const validOptions = form.options.filter((o) => o.trim())
    if (validOptions.length < 2) {
      toast.error('En az 2 seçenek gerekli')
      return
    }
    if (!form.startDate || !form.endDate) {
      toast.error('Başlangıç ve bitiş tarihi gerekli')
      return
    }
    setFormLoading(true)
    try {
      await pollService.createPoll({
        question: form.question,
        options: validOptions,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      })
      toast.success('Anket oluşturuldu')
      setShowForm(false)
      setForm({ question: '', options: ['', ''], startDate: '', endDate: '' })
      fetchPolls()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Anket oluşturulamadı')
    } finally {
      setFormLoading(false)
    }
  }

  const handleVote = async (pollId, optionId) => {
    setVotingId(pollId)
    try {
      await pollService.vote(pollId, optionId)
      toast.success('Oyunuz kaydedildi')
      fetchPolls()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Oy verilemedi')
    } finally {
      setVotingId(null)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Anketi silmek istediğinize emin misiniz?')) return
    try {
      await pollService.deletePoll(id)
      toast.success('Anket silindi')
      fetchPolls()
    } catch {
      toast.error('Anket silinemedi')
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Anketler"
        description="Aktif anketleri görüntüle ve oyunu kullan"
        actions={hasRole('ADMIN', 'MANAGER') && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 bg-gray-900 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus size={14} strokeWidth={2} /> Yeni Anket
          </button>
        )}
      />

      <div className="flex gap-2">
        {[
          { value: 'active', label: 'Aktif' },
          { value: 'ended',  label: 'Biten' },
        ].map((s) => (
          <button
            key={s.value}
            onClick={() => setStatus(s.value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              status === s.value
                ? 'bg-gray-900 text-white'
                : 'border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-screen overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Yeni Anket</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Soru</label>
                <textarea
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  placeholder="Anket sorusu..."
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Seçenekler</label>
                {form.options.map((opt, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                      placeholder={`Seçenek ${index + 1}`}
                    />
                    {form.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        className="text-gray-400 hover:text-red-500 px-2"
                      >
                        <Trash2 size={14} strokeWidth={1.75} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 mt-1"
                >
                  <Plus size={12} strokeWidth={2} /> Seçenek ekle
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Başlangıç</label>
                  <input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Bitiş</label>
                  <input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-gray-900 text-white rounded-md py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {formLoading ? 'Oluşturuluyor...' : 'Oluştur'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-200 rounded-md py-2 text-sm hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} variant="card" />)}
        </div>
      ) : polls.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg">
          <EmptyState
            icon={BarChart2}
            title={status === 'active' ? 'Aktif anket yok' : 'Biten anket yok'}
            description={status === 'active' ? 'Yeni anketler burada görünecek.' : undefined}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {polls.map((poll) => (
            <div key={poll.id} className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-start justify-between mb-4 gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 leading-snug">{poll.question}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    {!poll.hasVoted && !poll.isExpired && (
                      <StatusPill label="Oyunu kullan" tone="orange" />
                    )}
                    {poll.hasVoted && (
                      <StatusPill label="Oy verildi" tone="green" />
                    )}
                    {poll.isExpired && (
                      <StatusPill label="Sona erdi" />
                    )}
                  </div>
                </div>
                {hasRole('ADMIN', 'MANAGER') && (
                  <button
                    onClick={() => handleDelete(poll.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                    title="Sil"
                  >
                    <Trash2 size={14} strokeWidth={1.75} />
                  </button>
                )}
              </div>

              <div className="space-y-2 mb-4">
                {poll.options.map((option) => {
                  const percentage = poll.totalVotes > 0
                    ? Math.round((option.voteCount / poll.totalVotes) * 100)
                    : 0
                  const isMyVote = poll.myVote === option.id
                  const canVote = !poll.hasVoted && !poll.isExpired

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => canVote && handleVote(poll.id, option.id)}
                      disabled={!canVote || votingId === poll.id}
                      className={`w-full relative overflow-hidden rounded-md border transition-colors text-left ${
                        canVote
                          ? 'border-gray-200 hover:border-gray-300 cursor-pointer'
                          : 'border-gray-200 cursor-default'
                      }`}
                    >
                      <div
                        className={`absolute inset-0 ${isMyVote ? 'bg-blue-50' : 'bg-gray-50'} transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                      <div className="relative flex items-center justify-between px-3 py-2">
                        <span className="text-sm text-gray-900 inline-flex items-center gap-1.5">
                          {option.optionText}
                          {isMyVote && <Check size={12} strokeWidth={2.5} className="text-blue-600" />}
                        </span>
                        <span className="text-xs font-medium text-gray-600 tabular-nums">{percentage}%</span>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                <span className="tabular-nums">{poll.totalVotes} oy</span>
                <span>Bitiş: {formatDate(poll.endDate)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PollPage
