import React from 'react';
import { NavLink } from 'react-router-dom';

export const AppSidebar = ({ isOpen, setSidebarOpen }) => {
  const closeSidebar = () => {
    if (window.innerWidth <= 768) setSidebarOpen(false);
  };

  return (
    <aside className={`app-sidebar ${isOpen ? 'open' : ''}`} id="app-sidebar" role="navigation" aria-label="App navigation">
      <div className="sidebar-header">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <circle cx="16" cy="16" r="14" stroke="#3B9B9B" strokeWidth="2"/>
          <path d="M10 16.5C10 13.46 12.46 11 15.5 11H22l-3 3h-3.5C12.91 14 12 14.91 12 16.5S12.91 19 14.5 19H18l3 3H14.5C12.46 22 10 19.54 10 16.5Z" fill="#3B9B9B"/>
          <circle cx="22" cy="11" r="2" fill="#F4845F"/>
          <circle cx="22" cy="22" r="2" fill="#E8A838"/>
        </svg>
        <div className="sidebar-logo"><span>TrustChain</span></div>
      </div>

      <div className="sidebar-user">
        <div className="avatar avatar-lg">RK</div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">Riya Kulkarni</div>
          <div className="sidebar-user-pod">☀️ Sunrise Riders Pod</div>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="App sections">
        <div className="nav-section-label">Main</div>
        
        <NavLink to="/app/dashboard" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="1" y="1" width="7" height="7" rx="1.5"/><rect x="10" y="1" width="7" height="7" rx="1.5"/><rect x="1" y="10" width="7" height="7" rx="1.5"/><rect x="10" y="10" width="7" height="7" rx="1.5"/></svg>
          Dashboard
        </NavLink>
        
        <NavLink to="/app/pod" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="6" cy="7" r="2.5"/><circle cx="12" cy="7" r="2.5"/><path d="M1 15c0-3 2.2-5 5-5h2M10 15c0-3 2.2-5 5-5H9"/></svg>
          Community Pod
        </NavLink>
        
        <NavLink to="/app/loan" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="1" y="4" width="16" height="12" rx="2"/><path d="M1 8h16M5 12h2M9 12h4"/></svg>
          Request Loan
          <span className="nav-badge">New</span>
        </NavLink>
        
        <NavLink to="/app/simulation" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 14L6 8l4 3 4-5 3 2"/><circle cx="6" cy="8" r="1.5" fill="currentColor"/><circle cx="10" cy="11" r="1.5" fill="currentColor"/><circle cx="14" cy="6" r="1.5" fill="currentColor"/></svg>
          Trust Simulator
        </NavLink>

        <div className="nav-section-label" style={{marginTop:'var(--sp-5)'}}>Account</div>
        <button className="nav-item">
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="6" r="3"/><path d="M2 16c0-3.5 3-6 7-6s7 2.5 7 6"/></svg>
          Profile
        </button>
        <button className="nav-item">
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="9" r="2.5"/><path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.2 3.2l1.4 1.4M13.4 13.4l1.4 1.4M3.2 14.8l1.4-1.4M13.4 4.6l1.4-1.4"/></svg>
          Settings
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="security-hint" role="note">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 1L1.5 3.5v4.5C1.5 10.8 4 13 7 13.5c3-.5 5.5-2.7 5.5-5.5V3.5L7 1z"/></svg>
          Your data is encrypted &amp; protected
        </div>
      </div>
    </aside>
  );
};
