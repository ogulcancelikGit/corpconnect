import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import dashboardService from '../services/dashboard.service'
import leaveService from '../services/leave.service'
import expenseService from '../services/expense.service'
import taskService from '../services/task.service'
import { formatTimeAgo } from '../utils/dateFormat'
import {
  Newspaper, BarChart2, MessageSquare, GraduationCap, Pin,
} from 'lucide-react'
import QuickActions from '../components/dashboard/QuickActions'
import CelebrationsWidget from '../components/dashboard/CelebrationsWidget'
import UpcomingEventsWidget from '../components/dashboard/UpcomingEventsWidget'
import ActivePollsWidget from '../components/dashboard/ActivePollsWidget'
import ActivityFeedWidget from '../components/dashboard/ActivityFeedWidget'
import PageHeader from '../components/common/PageHeader'
import SectionLabel from '../components/common/SectionLabel'
import StatCard from '../components/common/StatCard'
import SkeletonCard from '../components/common/SkeletonCard'
import ListCard from '../components/common/ListCard'

const greeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Günaydın'
  if (h < 18) return 'İyi günler'
  return 'İyi akşamlar'
}

const formatToday = () => {
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
  const d = new Date()
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

const PendingCard = ({ label, value, to }) => (
  <Link
    to={to}
    className="group flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
  >
    <div className="flex items-center gap-3 min-w-0">
      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">Görüntüle →</p>
      </div>
    </div>
    <span className="text-2xl font-semibold text-gray-900 tabular-nums tracking-tight">{value}</span>
  </Link>
)

const DashboardPage = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentNews, setRecentNews] = useState([])
  const [feed, setFeed] = useState(null)
  const [pendingLeaves, setPendingLeaves] = useState(0)
  const [pendingExpenses, setPendingExpenses] = useState(0)
  const [activeTasks, setActiveTasks] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, newsRes, feedRes, leaveRes, expRes, taskRes] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getRecentNews(),
          dashboardService.getFeed(),
          leaveService.getMyLeaves({ status: 'PENDING', limit: 1 }),
          expenseService.getMyExpenses({ status: 'PENDING', limit: 1 }),
          taskService.getTasks({ status: 'IN_PROGRESS', limit: 1 }),
        ])
        setStats(statsRes.data)
        setRecentNews(newsRes.data)
        setFeed(feedRes.data)
        setPendingLeaves(leaveRes.meta?.total ?? leaveRes.data?.length ?? 0)
        setPendingExpenses(expRes.meta?.total ?? expRes.data?.length ?? 0)
        setActiveTasks(taskRes.meta?.total ?? taskRes.data?.length ?? 0)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const topStats = [
    { label: 'Haberler',       value: stats?.newsCount ?? 0,     to: '/news',     icon: Newspaper },
    { label: 'Aktif Anketler', value: stats?.pollCount ?? 0,     to: '/polls',    icon: BarChart2 },
    { label: 'Mesajlar',       value: stats?.messageCount ?? 0,  to: '/messages', icon: MessageSquare },
    { label: 'Eğitimler',      value: stats?.trainingCount ?? 0, to: '/training', icon: GraduationCap },
  ]

  const totalPending = pendingLeaves + pendingExpenses + activeTasks
  const hasPending = totalPending > 0

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title={`${greeting()}, ${user?.firstName ?? ''}.`}
        description={
          <>
            {formatToday()}
            {hasPending && <span> · {totalPending} bekleyen işlemin var</span>}
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} variant="stat" />)
          : topStats.map((s) => <StatCard key={s.label} {...s} />)
        }
      </div>

      {!loading && hasPending && (
        <div>
          <SectionLabel count={totalPending}>Bekleyen İşlemler</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {pendingLeaves > 0 && (
              <PendingCard label="Bekleyen İzin" value={pendingLeaves} to="/leaves" />
            )}
            {pendingExpenses > 0 && (
              <PendingCard label="Bekleyen Masraf" value={pendingExpenses} to="/expenses" />
            )}
            {activeTasks > 0 && (
              <PendingCard label="Devam Eden Görev" value={activeTasks} to="/tasks" />
            )}
          </div>
        </div>
      )}

      {!loading && (
        <div>
          <SectionLabel>Hızlı Eylemler</SectionLabel>
          <QuickActions />
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {feed?.todayCelebrations?.length > 0 && (
            <CelebrationsWidget items={feed.todayCelebrations} />
          )}
          <UpcomingEventsWidget events={feed?.upcomingEvents || []} />
        </div>
      )}

      {!loading && <ActivePollsWidget polls={feed?.pendingPolls || []} />}

      <ListCard
        title="Son Duyurular"
        action={{ to: '/news', label: 'Haberlere git' }}
        empty={!loading && recentNews.length === 0 ? 'Henüz duyuru yok.' : undefined}
      >
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} variant="row" />)
          : recentNews.map((news) => (
              <Link
                key={news.id}
                to={`/news/${news.id}`}
                className="group flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <span
                  className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                    news.isPinned ? 'bg-orange-500' : 'bg-gray-300 group-hover:bg-gray-400'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 leading-snug">
                    {news.isPinned && (
                      <Pin size={11} strokeWidth={2} className="inline -mt-0.5 mr-1.5 text-orange-500" />
                    )}
                    {news.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {news.author?.firstName} {news.author?.lastName}
                    {news.category && <span> · {news.category}</span>}
                    <span> · {formatTimeAgo(news.createdAt)}</span>
                  </p>
                </div>
              </Link>
            ))
        }
      </ListCard>

      {!loading && <ActivityFeedWidget items={feed?.recentActivity || []} />}
    </div>
  )
}

export default DashboardPage
