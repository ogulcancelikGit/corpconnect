import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Component } from 'react'
import { Toaster } from 'react-hot-toast'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(err, info) {
    console.error('Uygulama hatası:', err, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen gap-4 text-center px-4">
          <div className="text-5xl">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-800">Beklenmeyen bir hata oluştu</h1>
          <p className="text-gray-500 text-sm">Sayfayı yenileyerek tekrar deneyin.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
          >
            Sayfayı Yenile
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { SocketProvider } from './context/SocketContext'
import { NotificationProvider } from './context/NotificationContext'

import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'

import Layout from './components/layout/Layout'
import DashboardPage from './pages/DashboardPage'
import NewsPage from './pages/news/NewsPage'
import NewsDetailPage from './pages/news/NewsDetailPage'
import PollPage from './pages/poll/PollPage'
import TrainingPage from './pages/training/TrainingPage'
import TrainingDetailPage from './pages/training/TrainingDetailPage'
import MessagingPage from './pages/messaging/MessagingPage'
import ProfilePage from './pages/profile/ProfilePage'
import LeavePage from './pages/leave/LeavePage'
import TaskPage from './pages/tasks/TaskPage'
import ExpensePage from './pages/expenses/ExpensePage'
import CalendarPage from './pages/calendar/CalendarPage'

import SuperAdminLayout from './components/layout/SuperAdminLayout'
import OverviewPage from './pages/admin/superadmin/OverviewPage'
import LeavesAdminPage from './pages/admin/superadmin/LeavesAdminPage'
import UsersAdminPage from './pages/admin/superadmin/UsersAdminPage'
import LogsAdminPage from './pages/admin/superadmin/LogsAdminPage'
import ReportsAdminPage from './pages/admin/superadmin/ReportsAdminPage'
import BroadcastAdminPage from './pages/admin/superadmin/BroadcastAdminPage'
import SettingsAdminPage from './pages/admin/superadmin/SettingsAdminPage'
import ExpensesAdminPage from './pages/admin/superadmin/ExpensesAdminPage'

import NotificationsPage from './pages/notifications/NotificationsPage'
import SuggestionsPage from './pages/suggestions/SuggestionsPage'
import CelebrationPage from './pages/celebrations/CelebrationPage'
import SuggestionsAdminPage from './pages/admin/superadmin/SuggestionsAdminPage'
import NotFoundPage from './pages/NotFoundPage'

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />

  return children
}

const AppRoutes = () => {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={
        !isAuthenticated
          ? <LoginPage />
          : user?.role === 'ADMIN'
            ? <Navigate to="/superadmin" replace />
            : <Navigate to="/" replace />
      } />
      <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" replace />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* SuperAdmin — kendi layout'u, sadece ADMIN */}
      <Route path="/superadmin" element={
        <ProtectedRoute roles={['ADMIN']}>
          <SuperAdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<OverviewPage />} />
        <Route path="leaves" element={<LeavesAdminPage />} />
        <Route path="users" element={<UsersAdminPage />} />
        <Route path="logs" element={<LogsAdminPage />} />
        <Route path="reports" element={<ReportsAdminPage />} />
        <Route path="broadcast" element={<BroadcastAdminPage />} />
        <Route path="expenses" element={<ExpensesAdminPage />} />
        <Route path="suggestions" element={<SuggestionsAdminPage />} />
        <Route path="settings" element={<SettingsAdminPage />} />
      </Route>

      {/* Normal kullanıcı layout — MANAGER ve EMPLOYEE */}
      <Route path="/" element={
        <ProtectedRoute roles={['MANAGER', 'EMPLOYEE']}>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<DashboardPage />} />
        <Route path="news" element={<NewsPage />} />
        <Route path="news/:id" element={<NewsDetailPage />} />
        <Route path="polls" element={<PollPage />} />
        <Route path="training" element={<TrainingPage />} />
        <Route path="training/:id" element={<TrainingDetailPage />} />
        <Route path="messages" element={<MessagingPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="leaves" element={<LeavePage />} />
        <Route path="tasks" element={<TaskPage />} />
        <Route path="expenses" element={<ExpensePage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="suggestions" element={<SuggestionsPage />} />
        <Route path="celebrations" element={<CelebrationPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

const App = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              <NotificationProvider>
                <AppRoutes />
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 3000,
                    style: { borderRadius: '8px', fontSize: '14px' },
                  }}
                />
              </NotificationProvider>
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
