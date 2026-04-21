import { useState, useEffect } from 'react'
import pollService from '../../services/poll.service'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../utils/dateFormat'
import toast from 'react-hot-toast'

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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-800">Active Polls</h1>
        {hasRole('ADMIN', 'MANAGER') && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            + Create Poll
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {['active', 'ended'].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
              status === s
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s === 'active' ? 'Aktif' : 'Biten'}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-screen overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Yeni Anket</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Soru</label>
                <textarea
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder={`Seçenek ${index + 1}`}
                    />
                    {form.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        className="text-red-500 hover:text-red-700 text-sm px-2"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-blue-600 text-sm hover:underline"
                >
                  + Seçenek ekle
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Başlangıç</label>
                  <input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Bitiş</label>
                  <input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {formLoading ? 'Oluşturuluyor...' : 'Oluştur'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : polls.length === 0 ? (
        <div className="text-center text-gray-400 py-12">Anket bulunamadı</div>
      ) : (
        <div className="space-y-4">
          {polls.map((poll) => (
            <div key={poll.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-gray-800 flex-1 pr-4">{poll.question}</h3>
                {hasRole('ADMIN', 'MANAGER') && (
                  <button
                    onClick={() => handleDelete(poll.id)}
                    className="text-gray-400 hover:text-red-500 text-xs flex-shrink-0"
                  >
                    Sil
                  </button>
                )}
              </div>

              <div className="space-y-2 mb-4">
                {poll.options.map((option) => {
                  const percentage = poll.totalVotes > 0
                    ? Math.round((option.voteCount / poll.totalVotes) * 100)
                    : 0
                  const isMyVote = poll.myVote === option.id

                  return (
                    <div key={option.id} className="relative">
                      <div className="flex items-center gap-3">
                        {!poll.hasVoted && !poll.isExpired && (
                          <input
                            type="radio"
                            name={`poll-${poll.id}`}
                            id={`option-${option.id}`}
                            className="flex-shrink-0"
                            onChange={() => handleVote(poll.id, option.id)}
                            disabled={votingId === poll.id}
                          />
                        )}
                        <div className="flex-1 relative">
                          <div
                            className={`absolute inset-0 rounded-lg ${isMyVote ? 'bg-blue-100' : 'bg-gray-100'}`}
                            style={{ width: `${percentage}%` }}
                          />
                          <div className="relative flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200">
                            <label htmlFor={`option-${option.id}`} className="text-sm text-gray-700 cursor-pointer">
                              {option.optionText}
                              {isMyVote && <span className="ml-2 text-blue-600 text-xs">✓</span>}
                            </label>
                            <span className="text-sm font-medium text-gray-500">{percentage}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{poll.totalVotes} oy • Bitiş: {formatDate(poll.endDate)}</span>
                {poll.hasVoted && <span className="text-blue-600">Oy verdiniz ✓</span>}
                {poll.isExpired && <span className="text-red-400">Sona erdi</span>}
              </div>

              {!poll.hasVoted && !poll.isExpired && (
                <button
                  onClick={() => {
                    const selected = document.querySelector(`input[name="poll-${poll.id}"]:checked`)
                    if (!selected) { toast.error('Bir seçenek seçin'); return }
                    handleVote(poll.id, parseInt(selected.id.replace('option-', '')))
                  }}
                  disabled={votingId === poll.id}
                  className="mt-3 bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {votingId === poll.id ? 'Kaydediliyor...' : 'Vote'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PollPage