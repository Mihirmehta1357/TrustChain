import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Web3Context } from '../context/Web3Context';
import { MOCK_ACTIVITY } from '../data/mockData';
import { TrustGaugeLarge } from '../components/shared/SharedComponents';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { LoanAgreementModal } from '../components/shared/LoanAgreementModal';
import { useToast } from '../components/shared/ToastProvider';
import { ethers } from 'ethers';

const activityTypeLabel = (type) => {
  if (type === 'repaid')    return { label: 'Repaid',     color: 'var(--color-success)', bg: '#EAF3DE' };
  if (type === 'funded')    return { label: 'Funded',     color: '#185FA5',              bg: '#E6F1FB' };
  if (type === 'requested') return { label: 'Requested',  color: 'var(--color-warning)', bg: '#FDE8C0' };
  if (type === 'endorsed')  return { label: 'Endorsed',   color: '#3B9B9B',              bg: '#E0F4F4' };
  return { label: 'Activity', color: 'var(--color-text-muted)', bg: 'var(--color-bg)' };
};

export const DashboardPage = () => {
  const { trustScore: appScore, activeLoan } = useContext(AppContext);
  const { contract, account, trustScore: onChainScore } = useContext(Web3Context);
  const navigate  = useNavigate();
  const showToast = useToast();
  useScrollAnimation('.animate-fade-in-up');

  // Live on-chain borrower data
  const [myLoans, setMyLoans]             = useState([]);
  const [liveLoading, setLiveLoading]     = useState(true);
  const [agreementStatuses, setAgreementStatuses] = useState({}); // loanId → {lenderSigned, borrowerSigned, proposedFunder}

  // Agreement modal state for borrower countersign
  const [agreementModalOpen, setAgreementModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan]             = useState(null);
  const [signingAgreement, setSigningAgreement]     = useState(false);

  useEffect(() => {
    const fetchMyLoans = async () => {
      if (!contract || !account) { setLiveLoading(false); return; }
      try {
        const count = await contract.getLoanCount();
        const result = [];
        const statuses = {};
        for (let i = 0; i < Number(count); i++) {
          const l = await contract.loans(i);
          if (l.borrower.toLowerCase() === account.toLowerCase()) {
            const loanObj = {
              id:           Number(l.id),
              principal:    Number(ethers.formatEther(l.principal)),
              interestRate: Number(l.interestRate),
              totalOwed:    Number(ethers.formatEther(l.totalOwed)),
              status:       Number(l.status),
              purpose:      l.purpose,
              funder:       l.funder,
              borrower:     l.borrower,
            };
            result.push(loanObj);
            // Fetch agreement status for pending/funded loans
            try {
              const agrStatus = await contract.getAgreementStatus(i);
              statuses[i] = {
                lenderSigned:   agrStatus.lenderSigned,
                borrowerSigned: agrStatus.borrowerSigned,
                proposedFunder: agrStatus.proposedFunder,
                bothSigned:     agrStatus.bothSigned,
              };
            } catch (_) { /* contract not redeployed yet */ }
          }
        }
        setMyLoans(result.reverse());
        setAgreementStatuses(statuses);
      } catch (e) { console.error(e); }
      finally { setLiveLoading(false); }
    };
    fetchMyLoans();
    const interval = setInterval(fetchMyLoans, 5000);
    return () => clearInterval(interval);
  }, [contract, account]);

  // Borrower countersigns the agreement
  const handleBorrowerSign = async ({ esignName }) => {
    if (!contract || !selectedLoan) return;
    setSigningAgreement(true);
    try {
      showToast && showToast('Confirm your countersignature in MetaMask…', 'info');
      const tx = await contract.signAgreementAsBorrower(selectedLoan.id);
      await tx.wait();
      setAgreementStatuses(prev => ({
        ...prev,
        [selectedLoan.id]: { ...prev[selectedLoan.id], borrowerSigned: true, bothSigned: true },
      }));
      setAgreementModalOpen(false);
      showToast && showToast(`✅ Agreement countersigned as "${esignName}"! Lender can now release funds.`, 'success');
    } catch (err) {
      console.error(err);
      const msg = err.reason || err.message || '';
      showToast && showToast('Countersign failed: ' + msg, 'error');
    } finally {
      setSigningAgreement(false);
    }
  };


  const liveScore     = onChainScore ?? appScore;
  const activeLoans   = myLoans.filter(l => l.status === 1);
  const repaidLoans   = myLoans.filter(l => l.status === 2);
  const totalBorrowed = myLoans.reduce((s, l) => s + l.principal, 0);
  const totalOwedNow  = activeLoans.reduce((s, l) => s + l.totalOwed, 0);

  const scoreLabel = liveScore >= 80 ? 'High Trust 🌟' : liveScore >= 60 ? 'Medium-High' : liveScore >= 40 ? 'Building Trust' : 'New Member';
  const scoreColor = liveScore >= 80 ? 'var(--color-success)' : liveScore >= 60 ? 'var(--color-warning)' : 'var(--color-danger)';
  const pct        = activeLoan ? Math.round((activeLoan.paidInstallments / activeLoan.totalInstallments) * 100) : 0;

  return (
    <>
    <section className="screen active" id="screen-dashboard" aria-label="Dashboard">

      {/* Greeting */}
      <div className="dashboard-greeting animate-fade-in-up">
        <h1>
          {account ? `Hi, ${account.slice(0, 6)}… 👋` : 'Hi there 👋'}
        </h1>
        <p>Here's your live blockchain financial snapshot.</p>
        <div className="verification-pills" role="list">
          <span className="pill pill-success" role="listitem">⛓️ Wallet Connected</span>
          {onChainScore !== null && (
            <span className="pill pill-success" role="listitem">✓ Registered On-Chain</span>
          )}
          {repaidLoans.length > 0 && (
            <span className="pill pill-success" role="listitem">✓ {repaidLoans.length} Loan{repaidLoans.length > 1 ? 's' : ''} Repaid</span>
          )}
        </div>
      </div>

      {/* Live KPI Stat Cards */}
      <div className="stat-cards-grid animate-fade-in-up stagger-1">
        <div className="stat-card" style={{ borderLeft: '3px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="5" width="18" height="12" rx="2"/><path d="M1 9h18M4 14h3"/></svg>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Borrowed</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
            {liveLoading ? '…' : `₹${totalBorrowed.toLocaleString('en-IN')}`}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: 4 }}>
            {myLoans.length} total loans ⛓️
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '3px solid var(--color-warning)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--color-warning)" strokeWidth="1.5" strokeLinecap="round"><circle cx="10" cy="10" r="8"/><path d="M10 6v4l2.5 2.5"/></svg>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount Due</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-warning)' }}>
            {liveLoading ? '…' : `₹${totalOwedNow.toLocaleString('en-IN')}`}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: 4 }}>
            {activeLoans.length} active loan{activeLoans.length !== 1 ? 's' : ''} ⛓️
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '3px solid var(--color-success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--color-success)" strokeWidth="1.5" strokeLinecap="round"><path d="M10 2L3 6v6c0 4 3 6.5 7 8 4-1.5 7-4 7-8V6l-7-4z"/></svg>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trust Score</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: scoreColor }}>
            {liveScore ?? '…'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: 4 }}>{scoreLabel}</div>
        </div>

        <div className="stat-card" style={{ borderLeft: '3px solid var(--color-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--color-secondary)" strokeWidth="1.5" strokeLinecap="round"><path d="M1 17L6 9l5 4 5-6 3 2"/></svg>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Repaid</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
            {liveLoading ? '…' : repaidLoans.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: 4 }}>loans closed on-chain ⛓️</div>
        </div>
      </div>

      {/* Main grid */}
      <div className="dashboard-grid">
        {/* Left — Trust Gauge */}
        <div className="trust-card animate-fade-in-up stagger-2" role="region" aria-label="Trust Score">
          <div className="gauge-wrapper-center">
            <TrustGaugeLarge score={liveScore ?? 50} size={200} />
          </div>
          <div className="trust-tier text-center mt-4">
            <div className="trust-tier-name">{scoreLabel}</div>
            <span className="pill pill-success" style={{ fontSize: '11px', marginTop: '6px', display: 'inline-block' }}>
              {liveScore >= 80 ? 'Low Risk ✅' : liveScore >= 60 ? 'Medium Risk ⚠️' : 'High Risk 🔴'}
            </span>
          </div>
          <div className="trust-hint" role="note" style={{ marginTop: 'var(--sp-5)' }}>
            {liveScore >= 80
              ? '🎉 You qualify for the lowest interest rate (12%) on new loans!'
              : liveScore >= 60
              ? '💡 Repay one more loan or get 4 community endorsements to reach Low Risk!'
              : '💡 Get endorsed by community members to boost your score and unlock better rates.'}
          </div>

          {/* Score increase breakdown */}
          <div style={{ marginTop: 'var(--sp-4)', fontSize: '0.8rem', color: 'var(--color-muted)' }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>How to increase your score ⛓️</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div>✅ Successful repayment <strong style={{ color: 'var(--color-success)' }}>+10 pts</strong></div>
              <div>🌟 Community endorsement <strong style={{ color: 'var(--color-success)' }}>+5 pts</strong></div>
              <div>💸 Fund a loan <strong style={{ color: 'var(--color-success)' }}>+2 pts</strong></div>
            </div>
          </div>

          <button className="btn btn-outline w-full mt-4" onClick={() => navigate('/trust')} id="view-trust-detail-btn">
            View Trust Score breakdown →
          </button>
        </div>

        {/* Right — Live Loans + Activity + Quick Actions */}
        <div className="dashboard-right">

          {/* Live On-Chain Active Loans */}
          {!liveLoading && activeLoans.length > 0 && (
            <div className="card animate-fade-in-up stagger-3">
              <div className="loan-panel-header">
                <div>
                  <div className="card-title">Active Loans ⛓️</div>
                  <div className="card-subtitle">{activeLoans.length} loan{activeLoans.length > 1 ? 's' : ''} awaiting repayment</div>
                </div>
                <span className="pill pill-warning">Live</span>
              </div>
              {activeLoans.map(loan => (
                <div key={loan.id} style={{ padding: 'var(--sp-3) 0', borderBottom: '1px solid var(--color-border)' }}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div style={{ fontWeight: 600 }}>Loan #{loan.id} — {loan.purpose.slice(0, 40)}{loan.purpose.length > 40 ? '…' : ''}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginTop: 2 }}>
                        Principal: ₹{loan.principal.toLocaleString('en-IN')} · Interest: {loan.interestRate}% flat
                      </div>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--color-warning)', fontSize: '1.1rem' }}>
                      ₹{loan.totalOwed.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
              <div className="loan-actions" style={{ marginTop: 'var(--sp-4)' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} id="repay-btn" onClick={() => navigate('/loan/repayment')}>
                  💳 Go to Repayment
                </button>
              </div>
            </div>
          )}

          {/* Pending loans with agreement status chips */}
          {!liveLoading && myLoans.filter(l => l.status === 0).length > 0 && (
            <div className="card animate-fade-in-up stagger-3">
              <div className="loan-panel-header">
                <div>
                  <div className="card-title">Pending Loans</div>
                  <div className="card-subtitle">Waiting for lender agreement or funding</div>
                </div>
              </div>
              {myLoans.filter(l => l.status === 0).map(loan => {
                const agr = agreementStatuses[loan.id];
                const lenderDone   = agr?.lenderSigned;
                const borrowerDone = agr?.borrowerSigned;
                const bothDone     = agr?.bothSigned;
                return (
                  <div key={loan.id} style={{ padding: 'var(--sp-3) 0', borderBottom: '1px solid var(--color-border)' }}>
                    <div className="flex justify-between items-start">
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>Loan #{loan.id}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                          ₹{loan.principal.toLocaleString('en-IN')} · {loan.interestRate}% interest
                        </div>
                        {/* Agreement status chip */}
                        <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                          {bothDone ? (
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: 'rgba(34,197,94,0.1)', color: 'var(--color-success)', border: '1px solid rgba(34,197,94,0.25)' }}>
                              ✅ Agreement signed — awaiting funding
                            </span>
                          ) : lenderDone && !borrowerDone ? (
                            <>
                              <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: 'rgba(234,179,8,0.1)', color: '#B45309', border: '1px solid rgba(234,179,8,0.3)' }}>
                                ✍️ Your counter-signature needed
                              </span>
                              <button
                                style={{ fontSize: '0.7rem', padding: '3px 10px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 20, cursor: 'pointer', fontWeight: 600 }}
                                onClick={() => { setSelectedLoan(loan); setAgreementModalOpen(true); }}
                                id={`countersign-btn-${loan.id}`}
                              >
                                Review & Sign
                              </button>
                            </>
                          ) : (
                            <span style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: 20, background: 'rgba(148,163,184,0.15)', color: 'var(--color-muted)', border: '1px solid var(--color-border)' }}>
                              ⏳ Waiting for lender to propose agreement
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Fallback if no on-chain loans */}
          {!liveLoading && activeLoans.length === 0 && (
            <div className="card animate-fade-in-up stagger-3" style={{ textAlign: 'center', padding: 'var(--sp-6)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>💡</div>
              <div className="card-title mb-2">No active loans</div>
              <div className="card-subtitle mb-4">Request a loan to get started. Your TrustScore is <strong>{liveScore ?? 50}</strong>.</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginBottom: 16 }}>
                Your rate: <strong style={{ color: liveScore >= 80 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                  {liveScore >= 80 ? '12%' : liveScore >= 60 ? '16%' : '20%'} flat interest
                </strong>
              </div>
              <button className="btn btn-primary" onClick={() => navigate('/loan/request')} id="get-loan-btn">Request a Loan →</button>
            </div>
          )}

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
                      {item.type === 'repaid'    && <span> repaid <strong>₹{item.amount.toLocaleString('en-IN')}</strong></span>}
                      {item.type === 'funded'    && <span> funded <strong>₹{item.amount.toLocaleString('en-IN')}</strong></span>}
                      {item.type === 'requested' && <span> requested <strong>₹{item.amount.toLocaleString('en-IN')}</strong> loan</span>}
                      {item.type === 'vouched'   && <span> vouched for a member</span>}
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
            <button className="quick-action-card" id="quick-community" onClick={() => navigate('/community')}>
              <span className="qa-icon" aria-hidden="true">🤝</span>
              <span className="qa-label">My Community</span>
              <span className="qa-sub text-xs text-muted">Pods &amp; endorsements</span>
            </button>
            <button className="quick-action-card" id="quick-repay" onClick={() => navigate('/loan/repayment')}>
              <span className="qa-icon" aria-hidden="true">💳</span>
              <span className="qa-label">Repay Loan</span>
              <span className="qa-sub text-xs text-muted">Clear debt on-chain</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    {/* Borrower countersign modal */}
    {selectedLoan && (
      <LoanAgreementModal
        isOpen={agreementModalOpen}
        onClose={() => setAgreementModalOpen(false)}
        onSign={handleBorrowerSign}
        loan={{
          ...selectedLoan,
          borrower: selectedLoan.borrower,
          totalOwed: selectedLoan.totalOwed,
        }}
        role="borrower"
        lenderAddress={agreementStatuses[selectedLoan.id]?.proposedFunder || ''}
        trustScore={liveScore ?? 50}
        loading={signingAgreement}
      />
    )}
    </>
  );
};
