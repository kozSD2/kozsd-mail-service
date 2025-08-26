import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Menu,
  Search,
  Bell,
  Settings,
  Sun,
  Moon,
  Monitor,
  ChevronDown,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showThemeMenu, setShowThemeMenu] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'auto', label: 'System', icon: Monitor },
  ] as const

  return (
    <header className="glass border-b border-white/20 dark:border-white/10 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-glass pl-10 pr-4 py-2 w-64 lg:w-80 text-sm"
              />
            </div>
          </form>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Mobile Search Button */}
          <button className="sm:hidden p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5">
            <Search className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>

          {/* Theme Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 flex items-center gap-1"
            >
              {theme === 'light' && <Sun className="w-5 h-5" />}
              {theme === 'dark' && <Moon className="w-5 h-5" />}
              {theme === 'auto' && <Monitor className="w-5 h-5" />}
              <ChevronDown className="w-3 h-3" />
            </button>

            {showThemeMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 top-full mt-2 w-40 glass rounded-lg border border-white/20 dark:border-white/10 shadow-lg z-10"
              >
                {themeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setTheme(option.value)
                      setShowThemeMenu(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10 dark:hover:bg-white/5 first:rounded-t-lg last:rounded-b-lg ${
                      theme === option.value ? 'text-primary-600 dark:text-primary-400' : ''
                    }`}
                  >
                    <option.icon className="w-4 h-4" />
                    {option.label}
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Settings */}
          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* User Avatar */}
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-3 p-1 rounded-lg hover:bg-white/10 dark:hover:bg-white/5"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.firstName?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.isEduDomain ? '.edu user' : 'Regular user'}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="sm:hidden mt-4">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-glass pl-10 pr-4 py-2 w-full text-sm"
            />
          </div>
        </form>
      </div>

      {/* Close theme menu when clicking outside */}
      {showThemeMenu && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowThemeMenu(false)}
        />
      )}
    </header>
  )
}