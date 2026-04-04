import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Web3Context } from '../context/Web3Context';
import { MOCK_ACTIVITY } from '../data/mockData';
import { StatCard, TrustGaugeLarge } from '../components/shared/SharedComponents';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const activityTypeLabel = (type) => {
  if (type === 'repaid') return { label: 'Repaid', color: 'var(--color-success)', bg: '#EAF3DE' };
  if (type === 'funded') return { label: 'Funded', color: '#185FA5', bg: '#E6F1FB' };
  if (type === 'requested') return { label: 'Requested', color: 'var(--color-warning)', bg: '#FDE8C0' };
  return { label: 'Activity', color: 'var(--color-text-muted)', bg: 'var(--color-bg)' };
};

export const DashboardPage = () => {
  const { trustScore, activeLoan: mockActiveLoan } = useContext(AppContext);
  const { contract, account } = useContext(Web3Context);
  const navigate = useNavigate();
  useScrollAnimation('.animate-fade-in-up');

  const [liveBorrowerLoan, setLiveBorrowerLoan] = useState(null);

  useEffect(() => {
    const fetchMyActiveLoan = async () => {
      if (!contract || !account) return;
      try {
        const count = await contract.getLoanCount();
        let foundLoan = null;
        for (let i = Number(count) - 1; i >= 0; i--) {
          const lData = await contract.loans(i);
          if (lData.borrower.toLowerCase() === account.toLowerCase()) {
            foundLoan = {
              id: Number(lData.id),
              amount: Number(lData.amount),
              statusValue: Number(lData.status),
              disbursed: Number(lData.status) === 1 ? 'Just Now' : 'Pending',
              dueDate: Number(lData.status) === 1 ? 'In 30 Days' : 'TBD',
              remaining: Number(lData.amount),
              totalInstallments: 4,
              paidInstallments: 0,
              isBlockchain: true
            };
            break;
          }
        }
        setLiveBorrowerLoan(foundLoan);
      } catch (err) {
        console.error('Failed to fetch borrower loan:', err);
      }
    };
    
    fetchMyActiveLoan();
    const interval = setInterval(fetchMyActiveLoan, 5000);
    return () => clearInterval(interval);
  }, [contract, account]);

  const activeLoan = liveBorrowerLoan || mockActiveLoan;
  const pct = Math.round((activeLoan.paidInstallments / activeLoan.totalInstallments) * 100) || 0;

  return (
    <section className="screen active" id="screen-dashboard" aria-label="Dashboard">

      {/* Greeting */}
      <div className="dashboard-greeting animate-fade-in-up">
        <h1>Hi, Riya 👋</h1>
        <p>Here's your financial snapshot for today.</p>
        <div className="verification-pills" role="list">
          <span className="pill pill-success" role="listitem">✓ Gig Worker Verified</span>
          <span className="pill pill-success" role="listitem">✓ Phone Verified</span>
          <span className="pill pill-warning" role="listitem">⚠ NGO Pending</span>
        </div>
      </div>

      {/* Stat cards row */}
      <div className="stat-cards-grid animate-fade-in-up stagger-1">
        <StatCard
          label="Total Borrowed"
          value="₹24,000"
          sub="Lifetime"
          color="var(--color-primary)"
          icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="5" width="18" height="12" rx="2"/><path d="M1 9h18M4 14h3"/></svg>}
        />
        <StatCard
          label="Repayment Due"
          value="₹1,500"
          sub="Apr 9, 2026"
          color="var(--color-warning)"
          icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="10" cy="10" r="8"/><path d="M10 6v4l2.5 2.5"/></svg>}
        />
        <StatCard
          label="Trust Score"
          value={trustScore}
          sub="Medium-High"
          color="var(--color-success)"
          icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 2L3 6v6c0 4 3 6.5 7 8 4-1.5 7-4 7-8V6l-7-4z"/></svg>}
        />
        <StatCard
          label="Active Loans"
          value="1"
          sub="₹12,000 outstanding"
          color="var(--color-secondary)"
          icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 17L6 9l5 4 5-6 3 2"/></svg>}
        />
      </div>

      {/* Main 2-col grid */}
      <div className="dashboard-grid">
        {/* Left — Trust Gauge */}
        <div className="trust-card animate-fade-in-up stagger-2" role="region" aria-label="Trust Score">
          <div className="gauge-wrapper-center">
            <TrustGaugeLarge score={trustScore} size={200} />
          </div>
          <div className="trust-tier text-center mt-4">
            <div className="trust-tier-name">Medium-High — Getting Stronger</div>
            <span className="pill pill-success" style={{ fontSize: '11px', marginTop: '6px', display: 'inline-block' }}>Level 3 of 4</span>
          </div>
          <div className="trust-hint" role="note" style={{ marginTop: 'var(--sp-5)' }}>
            💡 Repay on time and get one more community voucher to reach <strong>High Trust</strong>.
          </div>
          <button className="btn btn-outline w-full mt-4" onClick={() => navigate('/trust')} id="view-trust-detail-btn">
            View Trust Score breakdown →
          </button>
        </div>

        {/* Right — Activity + Loan + Quick Actions */}
        <div className="dashboard-right">

          {/* Active Loan */}
          <div className="card animate-fade-in-up stagger-3">
            <div className="loan-panel-header">
              <div>
                <div className="card-title flex items-center gap-2">
                  Current Loan 
                  {activeLoan.isBlockchain && <span className="pill" style={{background: '#FDE8C0', color: '#F6851B', fontSize: '9px', padding: '2px 6px'}}>Real On-Chain</span>}
                </div>
                <div className="card-subtitle">
                  {activeLoan.statusValue === 0 ? 'Waiting for a Lender...' : `Active · Disbursed ${activeLoan.disbursed}`}
                </div>
              </div>
              <span className={`pill ${activeLoan.statusValue === 0 ? 'pill-warning' : 'pill-success'}`}>
                {activeLoan.statusValue === 0 ? 'Pending' : 'On Track'}
              </span>
            </div>
            <div className="loan-amount-row">
              <span className="loan-currency">₹</span>
              <span className="loan-amount">{activeLoan.amount.toLocaleString('en-IN')}</span>
            </div>
            <div className="loan-meta-grid">
              <div className="loan-meta-item"><label>Remaining</label><span>₹{activeLoan.remaining.toLocaleString('en-IN')}</span></div>
              <div className="loan-meta-item"><label>Due Date</label><span>{activeLoan.dueDate}</span></div>
              <div className="loan-meta-item"><label>Installments</label><span>{activeLoan.paidInstallments} of {activeLoan.totalInstallments} done</span></div>
            </div>
            <div className="loan-progress-label">
              <span>Repayment Progress</span>
              <span>{activeLoan.paidInstallments}/{activeLoan.totalInstallments} · {pct}%</span>
            </div>
            <div className="progress-bar" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
              <div className="progress-fill" style={{ width: `${pct}%` }}></div>
            </div>
            <div className="loan-actions" style={{ marginTop: 'var(--sp-5)' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} id="repay-btn" onClick={() => navigate('/loan/repayment')}>💳 Repay Instalment</button>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => navigate('/loan/repayment')} id="view-loan-btn">View Details</button>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="card animate-fade-in-up stagger-4">
            <div className="card-title">Recent Activity</div>
            <div className="activity-feed" role="list" aria-label="Recent activity">
              {MOCK_ACTIVITY.map(item => {
                const { label, color, bg } = activityTypeLabel(item.type);
                return (
                  <div key={item.id} className="activity-row" role="listitem">
                    <div className="activity-icon" style={{ background: bg, color }} aria-hidden="true">{item.icon}</div>
                    <div className="activity-text">
                      <span className="font-medium">{item.actor}</span>
                      {item.type === 'repaid' && <span> repaid <strong>₹{item.amount.toLocaleString('en-IN')}</strong></span>}
                      {item.type === 'funded' && <span> funded <strong>₹{item.amount.toLocaleString('en-IN')}</strong></span>}
                      {item.type === 'requested' && <span> requested <strong>₹{item.amount.toLocaleString('en-IN')}</strong> loan</span>}
                      {item.type === 'vouched' && <span> vouched for a member</span>}
                    </div>
                    <div className="activity-time text-xs text-muted">{item.time}</div>
                    <span className="pill text-xs" style={{ background: bg, color, border: 'none', padding: '2px 8px' }}>{label}</span>
                  </div>
                );
              })}
            </div>
            <button className="btn btn-ghost w-full mt-3 text-sm" onClick={() => navigate('/transactions')} id="view-all-activity-btn">
              View full activity log →
            </button>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions-grid animate-fade-in-up stagger-5">
            <button className="quick-action-card" id="quick-request-loan" onClick={() => navigate('/loan/request')}>
              <span className="qa-icon" aria-hidden="true">💰</span>
              <span className="qa-label">Request Loan</span>
              <span className="qa-sub text-xs text-muted">Up to ₹50,000</span>
            </button>
            <button className="quick-action-card" id="quick-browse-loans" onClick={() => navigate('/loans')}>
              <span className="qa-icon" aria-hidden="true">🔍</span>
              <span className="qa-label">Browse Loans</span>
              <span className="qa-sub text-xs text-muted">Lend &amp; earn</span>
            </button>
            <button className="quick-action-card" id="quick-vouch" onClick={() => navigate('/vouch')}>
              <span className="qa-icon" aria-hidden="true">🤝</span>
              <span className="qa-label">Community Vouch</span>
              <span className="qa-sub text-xs text-muted">Help others</span>
            </button>
            <button className="quick-action-card" id="quick-transactions" onClick={() => navigate('/transactions')}>
              <span className="qa-icon" aria-hidden="true">📊</span>
              <span className="qa-label">Transaction Log</span>
              <span className="qa-sub text-xs text-muted">Full history</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
