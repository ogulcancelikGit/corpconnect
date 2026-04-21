import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import dashboardService from '../services/dashboard.service'
import { formatDate } from '../utils/dateFormat'

const DashboardPage = () => {
  const [stats, setStats] = useState(null)
  const [recentNews, setRecentNews] = useState([])
  const [activePolls, setActivePolls] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, newsRes, pollsRes] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getRecentNews(),
          dashboardService.getActivePolls(),
        ])
        setStats(statsRes.data)
        setRecentNews(newsRes.data)
        setActivePolls(pollsRes.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <div className="text-3xl font-semibold text-gray-800">{stats?.newsCount || 0}</div>
          <div className="text-sm text-gray-500 mt-1">News Posts</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <div className="text-3xl font-semibold text-gray-800">{stats?.pollCount || 0}</div>
          <div className="text-sm text-gray-500 mt-1">Active Polls</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <div className="text-3xl font-semibold text-gray-800">{stats?.messageCount || 0}</div>
          <div className="text-sm text-gray-500 mt-1">Messages</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <div className="text-3xl font-semibold text-gray-800">{stats?.trainingCount || 0}</div>
          <div className="text-sm text-gray-500 mt-1">Resources</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Latest Announcements</h2>
        {recentNews.length === 0 ? (
          <p className="text-gray-400 text-sm">Henüz haber yok</p>
        ) : (
          <div className="space-y-3">
            {recentNews.map((news) => (
              <Link
                key={news.id}
                to={`/news/${news.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {news.isPinned && (
                      <span className="text-xs">📌</span>
                    )}
                    <span className="text-sm font-medium text-gray-800 truncate">{news.title}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{formatDate(news.createdAt)}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardPage