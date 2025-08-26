import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  InboxIcon,
  PencilSquareIcon,
  PaperAirplaneIcon,
  ArchiveBoxIcon,
  TrashIcon,
  FolderIcon,
  StarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: ChartBarIcon },
    { name: 'Inbox', path: '/inbox', icon: InboxIcon },
    { name: 'Compose', path: '/compose', icon: PencilSquareIcon },
    { name: 'Sent', path: '/sent', icon: PaperAirplaneIcon },
    { name: 'Drafts', path: '/drafts', icon: ArchiveBoxIcon },
    { name: 'Starred', path: '/starred', icon: StarIcon },
    { name: 'Archive', path: '/archive', icon: FolderIcon },
    { name: 'Trash', path: '/trash', icon: TrashIcon },
  ];

  return (
    <aside className="w-64 glass border-r border-white/10 p-6">
      <div className="space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link key={item.name} to={item.path}>
              <motion.div
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-500/20 text-primary-300 shadow-neon'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* User info */}
      <div className="mt-8 pt-6 border-t border-white/10">
        <div className="flex items-center space-x-3 px-4 py-3">
          <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {user?.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-white text-sm font-medium">{user?.username}</p>
            {user?.isEduVerified && (
              <p className="text-primary-300 text-xs">✓ Edu Verified</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;