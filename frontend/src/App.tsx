import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { ThemeProvider } from '@/hooks/useTheme'

// Layouts
import AuthLayout from '@/components/layouts/AuthLayout'
import DashboardLayout from '@/components/layouts/DashboardLayout'

// Pages
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
// import InboxPage from '@/pages/email/InboxPage'
// import ComposePage from '@/pages/email/ComposePage'
// import EmailDetailPage from '@/pages/email/EmailDetailPage'
// import SettingsPage from '@/pages/settings/SettingsPage'
// import ProfilePage from '@/pages/profile/ProfilePage'

// Components
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

// Temporary placeholder component for unimplemented pages
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h2>
      <p className="text-gray-600 dark:text-gray-400">
        This page is coming soon...
      </p>
    </div>
  </div>
)

function AppContent() {
  const { user, isLoading } = useAuth()

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
              <Route path="/auth" element={<AuthLayout />}>
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
                <Route index element={<Navigate to="login" replace />} />
              </Route>
              <Route path="*" element={<Navigate to="/auth/login" replace />} />
            </>
          ) : (
            /* Protected Routes */
            <>
              <Route path="/" element={<DashboardLayout />}>
                <Route index element={<Navigate to="/inbox" replace />} />
                <Route path="inbox" element={<PlaceholderPage title="Inbox" />} />
                <Route path="sent" element={<PlaceholderPage title="Sent" />} />
                <Route path="drafts" element={<PlaceholderPage title="Drafts" />} />
                <Route path="spam" element={<PlaceholderPage title="Spam" />} />
                <Route path="trash" element={<PlaceholderPage title="Trash" />} />
                <Route path="compose" element={<PlaceholderPage title="Compose" />} />
                <Route path="email/:id" element={<PlaceholderPage title="Email Detail" />} />
                <Route path="settings" element={<PlaceholderPage title="Settings" />} />
                <Route path="profile" element={<PlaceholderPage title="Profile" />} />
                <Route path="starred" element={<PlaceholderPage title="Starred" />} />
                <Route path="archive" element={<PlaceholderPage title="Archive" />} />
              </Route>
              <Route path="/auth/*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </div>
    </ErrorBoundary>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App