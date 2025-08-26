import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'

// Layouts
import AuthLayout from '@/components/layouts/AuthLayout'
import DashboardLayout from '@/components/layouts/DashboardLayout'

// Pages
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import InboxPage from '@/pages/email/InboxPage'
import ComposePage from '@/pages/email/ComposePage'
import EmailDetailPage from '@/pages/email/EmailDetailPage'
import SettingsPage from '@/pages/settings/SettingsPage'
import ProfilePage from '@/pages/profile/ProfilePage'

// Components
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

function App() {
  const { user, isLoading } = useAuth()
  const { theme } = useTheme()

  // Apply theme to document
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
        <Routes>
          {/* Public Routes */}
          {!user ? (
            <>
              <Route path="/auth/*" element={<AuthLayout />}>
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/auth/login" replace />} />
            </>
          ) : (
            /* Protected Routes */
            <>
              <Route path="/" element={<DashboardLayout />}>
                <Route index element={<Navigate to="/inbox" replace />} />
                <Route path="inbox" element={<InboxPage />} />
                <Route path="sent" element={<InboxPage folder="sent" />} />
                <Route path="drafts" element={<InboxPage folder="drafts" />} />
                <Route path="spam" element={<InboxPage folder="spam" />} />
                <Route path="trash" element={<InboxPage folder="trash" />} />
                <Route path="compose" element={<ComposePage />} />
                <Route path="email/:id" element={<EmailDetailPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>
              <Route path="/auth/*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </div>
    </ErrorBoundary>
  )
}

export default App