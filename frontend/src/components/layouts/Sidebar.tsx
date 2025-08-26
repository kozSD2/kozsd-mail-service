import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import {
  Inbox,
  Send,
  FileText,
  Shield,
  Trash2,
  Edit3,
  Settings,
  User,
  LogOut,
  Mail,
  Star,
  Archive,
  X,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navigationItems = [
  { name: 'Inbox', href: '/inbox', icon: Inbox, count: 12 },
  { name: 'Sent', href: '/sent', icon: Send },
  { name: 'Drafts', href: '/drafts', icon: FileText, count: 3 },
  { name: 'Spam', href: '/spam', icon: Shield },
  { name: 'Trash', href: '/trash', icon: Trash2 },
]

const quickActions = [
  { name: 'Compose', href: '/compose', icon: Edit3 },
  { name: 'Starred', href: '/starred', icon: Star },
  { name: 'Archive', href: '/archive', icon: Archive },
]

const bottomItems = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Profile', href: '/profile', icon: User },
]

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const location = useLocation()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="glass border-r border-white/20 dark:border-white/10">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-6">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold aurora-text">KozSD Mail</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1">
              {/* Main Navigation */}
              <div className="space-y-1">
                {navigationItems.map((item) => {
                  const isActive = location.pathname === item.href
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={clsx(
                        'sidebar-item group',
                        isActive && 'active'
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                      {item.count && (
                        <span className="ml-auto bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
                          {item.count}
                        </span>
                      )}
                    </NavLink>
                  )
                })}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 dark:border-gray-700 my-4" />

              {/* Quick Actions */}
              <div className="space-y-1">
                <h3 className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quick Actions
                </h3>
                {quickActions.map((item) => {
                  const isActive = location.pathname === item.href
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={clsx(
                        'sidebar-item group',
                        isActive && 'active'
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </NavLink>
                  )
                })}
              </div>
            </nav>

            {/* Bottom Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-1">
              {bottomItems.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={clsx(
                      'sidebar-item group',
                      isActive && 'active'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </NavLink>
                )
              })}

              {/* User Info & Logout */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 px-4 py-2 text-sm">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {user?.firstName?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="sidebar-item group w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden"
          >
            <div className="glass border-r border-white/20 dark:border-white/10 h-full">
              <div className="flex flex-col h-full">
                {/* Mobile Header */}
                <div className="flex items-center justify-between px-6 py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-lg font-semibold aurora-text">KozSD Mail</span>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Same navigation content as desktop */}
                <nav className="flex-1 px-4 space-y-1">
                  <div className="space-y-1">
                    {navigationItems.map((item) => {
                      const isActive = location.pathname === item.href
                      return (
                        <NavLink
                          key={item.name}
                          to={item.href}
                          onClick={onClose}
                          className={clsx(
                            'sidebar-item group',
                            isActive && 'active'
                          )}
                        >
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.name}</span>
                          {item.count && (
                            <span className="ml-auto bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
                              {item.count}
                            </span>
                          )}
                        </NavLink>
                      )
                    })}
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 my-4" />

                  <div className="space-y-1">
                    <h3 className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Quick Actions
                    </h3>
                    {quickActions.map((item) => {
                      const isActive = location.pathname === item.href
                      return (
                        <NavLink
                          key={item.name}
                          to={item.href}
                          onClick={onClose}
                          className={clsx(
                            'sidebar-item group',
                            isActive && 'active'
                          )}
                        >
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.name}</span>
                        </NavLink>
                      )
                    })}
                  </div>
                </nav>

                <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-1">
                  {bottomItems.map((item) => {
                    const isActive = location.pathname === item.href
                    return (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        onClick={onClose}
                        className={clsx(
                          'sidebar-item group',
                          isActive && 'active'
                        )}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.name}</span>
                      </NavLink>
                    )
                  })}

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 px-4 py-2 text-sm">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {user?.firstName?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="sidebar-item group w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}