import React from 'react';
import { motion } from 'framer-motion';
import {
  EnvelopeIcon,
  InboxIcon,
  PaperAirplaneIcon,
  ChartBarIcon,
  ClockIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    {
      name: 'Total Emails',
      value: '142',
      change: '+12%',
      icon: EnvelopeIcon,
      color: 'text-primary-400',
    },
    {
      name: 'Unread',
      value: '23',
      change: '+3',
      icon: InboxIcon,
      color: 'text-secondary-400',
    },
    {
      name: 'Sent Today',
      value: '8',
      change: '+2',
      icon: PaperAirplaneIcon,
      color: 'text-accent-400',
    },
    {
      name: 'Starred',
      value: '15',
      change: '+1',
      icon: StarIcon,
      color: 'text-yellow-400',
    },
  ];

  const recentEmails = [
    {
      id: 1,
      from: 'Alice Johnson',
      subject: 'Project Update - Q3 Progress',
      preview: 'Here\'s the latest update on our Q3 progress...',
      time: '2 hours ago',
      isRead: false,
    },
    {
      id: 2,
      from: 'Bob Smith',
      subject: 'Meeting Reminder: Team Standup',
      preview: 'Don\'t forget about our team standup meeting...',
      time: '4 hours ago',
      isRead: true,
    },
    {
      id: 3,
      from: 'Carol Davis',
      subject: 'Document Review Request',
      preview: 'Could you please review the attached document...',
      time: '1 day ago',
      isRead: false,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-white mb-2">
              Welcome back, {user?.username}! 👋
            </h1>
            <p className="text-white/80">
              You have 23 unread emails waiting for you.
              {user?.isEduVerified && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-500/20 text-primary-300">
                  ✓ Edu Verified
                </span>
              )}
            </p>
          </div>
          <motion.div
            className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <EnvelopeIcon className="w-8 h-8 text-white" />
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-6 card-hover"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">{stat.name}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-primary-300 text-sm">{stat.change}</p>
              </div>
              <div className={`${stat.color}`}>
                <stat.icon className="w-8 h-8" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Emails */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Recent Emails</h2>
            <button className="text-primary-300 hover:text-primary-200 text-sm">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentEmails.map((email, index) => (
              <motion.div
                key={email.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                  email.isRead
                    ? 'border-white/10 hover:border-white/20'
                    : 'border-primary-500/30 bg-primary-500/5 hover:border-primary-500/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className={`font-medium ${
                        email.isRead ? 'text-white/80' : 'text-white'
                      }`}>
                        {email.from}
                      </p>
                      {!email.isRead && (
                        <div className="w-2 h-2 bg-primary-500 rounded-full" />
                      )}
                    </div>
                    <p className={`${
                      email.isRead ? 'text-white/60' : 'text-white/80'
                    } mb-1`}>
                      {email.subject}
                    </p>
                    <p className="text-white/50 text-sm line-clamp-1">
                      {email.preview}
                    </p>
                  </div>
                  <div className="flex items-center text-white/50 text-xs">
                    <ClockIcon className="w-4 h-4 mr-1" />
                    {email.time}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-6">Quick Actions</h2>
          <div className="space-y-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary w-full"
            >
              Compose Email
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-glass w-full text-white"
            >
              Check Inbox
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-glass w-full text-white"
            >
              View Sent
            </motion.button>
          </div>

          {/* Storage Info */}
          <div className="mt-8 p-4 bg-white/5 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm">Storage Used</span>
              <span className="text-white text-sm">2.3 GB / 15 GB</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full w-[15%]" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Activity Chart Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Email Activity</h2>
          <div className="flex items-center space-x-2">
            <ChartBarIcon className="w-5 h-5 text-white/60" />
            <span className="text-white/60 text-sm">Last 7 days</span>
          </div>
        </div>
        <div className="h-64 bg-white/5 rounded-lg flex items-center justify-center">
          <p className="text-white/60">Activity chart coming soon...</p>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardPage;