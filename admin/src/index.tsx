import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-frutiger aurora-container flex items-center justify-center">
      <div className="glass-card p-8 max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-white font-bold text-2xl">A</span>
        </div>
        <h1 className="text-2xl font-display font-bold text-white mb-2">
          KozSD Mail Admin
        </h1>
        <p className="text-white/80 mb-4">
          Admin panel functionality coming soon
        </p>
        <div className="space-y-2 text-sm text-white/60">
          <p>• User Management</p>
          <p>• Analytics Dashboard</p>
          <p>• Security Monitoring</p>
          <p>• System Configuration</p>
        </div>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);