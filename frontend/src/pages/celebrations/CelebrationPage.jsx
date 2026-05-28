import { useState, useEffect } from 'react'
import { Cake, Award, PartyPopper } from 'lucide-react'
import toast from 'react-hot-toast'
import celebrationService from '../../services/celebration.service'
import PageHeader from '../../components/common/PageHeader'
import SectionLabel from '../../components/common/SectionLabel'
import SkeletonCard from '../../components/common/SkeletonCard'
import EmptyState from '../../components/common/EmptyState'
import StatusPill from '../../components/common/StatusPill'

const Avatar = ({ firstName, lastName }) => (
  <div className="w-9 h-9 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-xs font-semibold shrink-0">
    {firstName?.[0]}{lastName?.[0]}
  </div>
)

const CelebrationPage = () => {
  const [todayData, setTodayData] = useState({ birthdays: [], anniversaries: [] })
  const [upcoming, setUpcoming] = useState([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [todayRes, upcomingRes] = await Promise.all([
          celebrationService.getToday(),
          celebrationService.getUpcoming(days),
        ])
        setTodayData(todayRes.data.data)
        setUpcoming(upcomingRes.data.data)
      } catch {
        toast.error('Kutlamalar yüklenemedi')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [days])

  const todayCount = todayData.birthdays.length + todayData.anniversaries.length
  const upcomingFiltered = upcoming.filter((u) => u.daysUntil > 0)

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="Kutlamalar"
        description="Doğum günleri ve çalışma yıldönümleri"
        actions={
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400 transition-colors"
          >
            <option value={7}>7 gün</option>
            <option value={14}>14 gün</option>
            <option value={30}>30 gün</option>
          </select>
        }
      />

      {/* Bugün */}
      <div>
        <SectionLabel count={todayCount}>Bugün</SectionLabel>
        {loading ? (
          <SkeletonCard variant="card" />
        ) : todayCount === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg">
            <EmptyState
              icon={PartyPopper}
              title="Bugün kutlanacak özel gün yok"
            />
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
            {todayData.birthdays.map((u) => (
              <div key={`b-${u.id}`} className="flex items-center gap-3 px-5 py-3.5">
                <Avatar firstName={u.firstName} lastName={u.lastName} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                  {u.department && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {u.department}{u.position ? ` · ${u.position}` : ''}
                    </p>
                  )}
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-pink-700 bg-pink-50 border border-pink-200 px-2 py-1 rounded shrink-0">
                  <Cake size={12} strokeWidth={1.75} /> Doğum Günü
                </span>
              </div>
            ))}
            {todayData.anniversaries.map((u) => (
              <div key={`a-${u.id}`} className="flex items-center gap-3 px-5 py-3.5">
                <Avatar firstName={u.firstName} lastName={u.lastName} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                  {u.department && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {u.department}{u.position ? ` · ${u.position}` : ''}
                    </p>
                  )}
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded shrink-0">
                  <Award size={12} strokeWidth={1.75} /> {u.years}. Yıl
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Yaklaşanlar */}
      <div>
        <SectionLabel count={upcomingFiltered.length}>Yaklaşan Kutlamalar ({days} gün)</SectionLabel>
        {loading ? (
          <SkeletonCard variant="card" />
        ) : upcomingFiltered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg">
            <EmptyState
              icon={PartyPopper}
              title={`Önümüzdeki ${days} gün içinde kutlama yok`}
            />
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
            {upcomingFiltered.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                <Avatar firstName={item.user.firstName} lastName={item.user.lastName} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{item.user.firstName} {item.user.lastName}</p>
                  {item.user.department && (
                    <p className="text-xs text-gray-500 mt-0.5">{item.user.department}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium text-gray-700 inline-flex items-center gap-1">
                    {item.type === 'BIRTHDAY' ? (
                      <><Cake size={11} strokeWidth={1.75} className="text-pink-500" /> Doğum Günü</>
                    ) : (
                      <><Award size={11} strokeWidth={1.75} className="text-blue-500" /> {item.years}. Yıl</>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {item.daysUntil === 1 ? 'Yarın' : `${item.daysUntil} gün sonra`}
                    {' · '}
                    {new Date(item.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CelebrationPage
