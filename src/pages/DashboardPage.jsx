import React from 'react';
import { TrustGaugeCard } from '../components/dashboard/TrustGaugeCard';
import { LoanPanel } from '../components/dashboard/LoanPanel';
import { PodSummaryCard } from '../components/dashboard/PodSummaryCard';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

export const DashboardPage = () => {
  useScrollAnimation('.animate-fade-in-up');

  return (
    <section className="screen active" id="screen-dashboard" aria-label="Dashboard">
      {/* Greeting */}
      <div className="dashboard-greeting animate-fade-in-up">
        <h1>Hi, Riya 👋</h1>
        <p>You are part of Community Pod <strong>Sunrise Riders</strong>.</p>
        <div className="verification-pills" role="list" aria-label="Verified credentials">
          <span className="pill pill-success" role="listitem">
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="6" cy="6" r="5"/><path d="M3.5 6.5l2 2 3-4"/></svg>
            Gig Worker Verified
          </span>
          <span className="pill pill-success" role="listitem">
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="6" cy="6" r="5"/><path d="M3.5 6.5l2 2 3-4"/></svg>
            Phone Verified
          </span>
          <span className="pill pill-warning" role="listitem">
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="6" cy="6" r="5"/><path d="M6 4v3M6 8.5v.5"/></svg>
            NGO Verification Pending
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="dashboard-grid">
        <TrustGaugeCard />
        <div className="dashboard-right">
          <LoanPanel />
          <PodSummaryCard />
        </div>
      </div>
    </section>
  );
};
