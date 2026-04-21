import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { SocketProvider } from './context/SocketContext'
import { NotificationProvider } from './context/NotificationContext'

import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import NewsPage from './pages/news/NewsPage'
import NewsDetailPage from './pages/news/NewsDetailPage'
import PollPage from './pages/poll/PollPage'
import TrainingPage from './pages/training/TrainingPage'
import TrainingDetailPage from './pages/training/TrainingDetailPage'
import MessagingPage from './pages/messaging/MessagingPage'
import ProfilePage from './pages/profile/ProfilePage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'
import NotFoundPage from './pages/NotFoundPage'
import Layout from './components/layout/Layout'

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />} />
      <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" replace />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route path="/" element={
        <ProtectedRoute>
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
        <Route path="profile" element={<ProfilePage />} />
        <Route path="admin" element={
          <ProtectedRoute roles={['ADMIN']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        } />
        <Route path="admin/users" element={
          <ProtectedRoute roles={['ADMIN']}>
            <AdminUsersPage />
          </ProtectedRoute>
        } />
        <Route path="admin/settings" element={
          <ProtectedRoute roles={['ADMIN']}>
            <AdminSettingsPage />
          </ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

const App = () => {
  return (
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
                  style: {
                    borderRadius: '8px',
                    fontSize: '14px',
                  },
                }}
              />
            </NotificationProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App