import React from 'react';
import { motion } from 'framer-motion';

const InboxPage: React.FC = () => {
  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 text-center"
      >
        <h1 className="text-2xl font-bold text-white mb-4">Inbox</h1>
        <p className="text-white/80">Inbox functionality coming soon...</p>
      </motion.div>
    </div>
  );
};

export default InboxPage;