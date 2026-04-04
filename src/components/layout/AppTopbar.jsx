import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '../shared/ToastProvider';

const SCREEN_TITLES = {
  '/app/dashboard': 'Dashboard',
  '/app/pod': 'Community Pod',
  '/app/loan': 'Request a Loan',
  '/app/simulation': 'Trust Simulator',
};

export const AppTopbar = ({ toggleSidebar }) => {
  const location = useLocation();
  const [title, setTitle] = useState('Dashboard');
  const showToast = useToast();

  useEffect(() => {
    setTitle(SCREEN_TITLES[location.pathname] || '');
  }, [location]);

  return (
    <header className="app-topbar" role="banner">
      <button 
        className="btn btn-icon btn-ghost" 
        id="sidebar-toggle" 
        aria-label="Toggle navigation menu" 
        onClick={toggleSidebar}
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M2 5h16M2 10h16M2 15h16"/></svg>
      </button>
      
      <div className="topbar-title" id="topbar-title">{title}</div>
      
      <div className="topbar-actions">
        <button 
          className="btn btn-icon btn-ghost" 
          id="topbar-notify-btn" 
          aria-label="Notifications"
          onClick={() => showToast('No new notifications right now.')}
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 2a6 6 0 00-6 6v4l-1.5 2h15L16 12V8a6 6 0 00-6-6z"/><path d="M8 17a2 2 0 004 0"/></svg>
        </button>
        <div className="topbar-avatar" role="button" tabIndex="0" aria-label="User menu">
          <div className="avatar avatar-sm">RK</div>
        </div>
      </div>
    </header>
  );
};
