import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { Web3Context } from '../../context/Web3Context';
import { StatCard } from '../../components/shared/SharedComponents';

const statusPill = (status) => status === 'completed'
  ? <span className="pill pill-success text-xs">Completed ✓</span>
  : <span className="pill pill-warning text-xs">Active</span>;

export const LenderDashboardPage = () => {
  const { lenderData } = useContext(AppContext);
  const { contract, account } = useContext(Web3Context);
  const navigate = useNavigate();

  const [liveFundedLoans, setLiveFundedLoans] = useState([]);
  const [blockchainTotalLent, setBlockchainTotalLent] = useState(0);

  useEffect(() => {
    const fetchMyFundedLoans = async () => {
      if (!contract || !account) return;
      try {
        const count = await contract.getLoanCount();
        const loansArray = [];
        let total = 0;
        for (let i = 0; i < Number(count); i++) {
          const lData = await contract.loans(i);
          // Status 1 = Funded. Strictly match the funder address.
          if (Number(lData.status) === 1 && lData.funder.toLowerCase() === account.toLowerCase()) {
            const amt = Number(lData.amount);
            total += amt;
            loansArray.push({
              id: `bc-${lData.id}`,
              borrower: lData.borrower.substring(0, 6) + "..." + lData.borrower.substring(38),
              amount: amt,
              repaid: 0,
              status: 'active',
              riskTier: amt > 15000 ? 'High' : 'Low',
              isBlockchain: true
            });
          }
        }
        setLiveFundedLoans(loansArray.reverse());
        setBlockchainTotalLent(total);
      } catch (err) {
        console.error("Failed to fetch funded loans from blockchain:", err);
      }
    };
    
    fetchMyFundedLoans();
    const interval = setInterval(fetchMyFundedLoans, 5000);
    return () => clearInterval(interval);
  }, [contract, account]);

  const combinedLoans = [...liveFundedLoans, ...lenderData.myLoans];
  const displayTotalLent = lenderData.totalLent + blockchainTotalLent;
  const displayActiveLoans = lenderData.activeLoans + liveFundedLoans.length;

  const healthPct = lenderData.portfolioHealth;

  return (
    <section className="screen active" aria-label="Lender Dashboard">
      <div className="dashboard-greeting animate-fade-in-up">
        <h1>Lender Portfolio 💼</h1>
        <p>Your lending impact and portfolio health at a glance.</p>
      </div>

      {/* Stat cards */}
      <div className="stat-cards-grid animate-fade-in-up stagger-1">
        <StatCard label="Total Lent" value={`₹${displayTotalLent.toLocaleString('en-IN')}`}
          sub="Across all loans" color="var(--color-warning)"
          icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="5" width="18" height="12" rx="2"/><path d="M1 9h18"/></svg>} />
        <StatCard label="Interest Earned" value={`₹${lenderData.interestEarned.toLocaleString('en-IN')}`}
          sub="Net returns" color="var(--color-success)"
          icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 15l5-7 4 3 4-6 5 3"/></svg>} />
        <StatCard label="Active Loans" value={displayActiveLoans}
          sub="Currently funded" color="var(--color-primary)"
          icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 2L3 6v6c0 4 3 6.5 7 8 4-1.5 7-4 7-8V6l-7-4z"/></svg>} />
        <StatCard label="Repayments Received" value={`₹${lenderData.repaymentsReceived.toLocaleString('en-IN')}`}
          sub="Returned to you" color="#185FA5"
          icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M18 10H2M8 4l-6 6 6 6"/></svg>} />
      </div>

      {/* Portfolio Health */}
      <div className="card animate-fade-in-up stagger-2 mb-5">
        <div className="loan-panel-header">
          <div>
            <div className="card-title">Portfolio Health</div>
            <div className="card-subtitle">Based on repayment performance of your funded loans</div>
          </div>
          <span className={`pill ${healthPct >= 80 ? 'pill-success' : healthPct >= 60 ? 'pill-warning' : 'pill-danger'}`}>
            {healthPct >= 80 ? 'Healthy' : healthPct >= 60 ? 'Fair' : 'At Risk'}
          </span>
        </div>
        <div className="loan-progress-label mt-4">
          <span>Portfolio Health Score</span>
          <span>{healthPct}%</span>
        </div>
        <div className="progress-bar" role="progressbar" aria-valuenow={healthPct} aria-valuemin="0" aria-valuemax="100" style={{ height: '12px' }}>
          <div className="progress-fill" style={{
            width: `${healthPct}%`,
            background: healthPct >= 80 ? 'var(--color-success)' : healthPct >= 60 ? 'var(--color-warning)' : 'var(--color-danger)'
          }} />
        </div>
        <div className="text-xs text-muted mt-2">{healthPct}% of funded loans are on track or completed.</div>
      </div>

      {/* My Loans list */}
      <div className="card animate-fade-in-up stagger-3 mb-5">
        <div className="card-title mb-4">My Funded Loans</div>
        <div role="list" aria-label="Your funded loans">
          {combinedLoans.map(loan => {
            const pct = Math.round((loan.repaid / loan.amount) * 100) || 0;
            return (
              <div key={loan.id} className="my-loan-row" role="listitem">
                <div className="my-loan-info">
                  <div className="font-medium text-sm flex items-center gap-2">
                    {loan.borrower}
                    {loan.isBlockchain && <span className="pill pill-success" style={{fontSize: '9px'}}>Real On-Chain</span>}
                  </div>
                  <div className="text-xs text-muted">₹{loan.repaid.toLocaleString('en-IN')} of ₹{loan.amount.toLocaleString('en-IN')} repaid</div>
                </div>
                <div className="my-loan-progress" style={{ flex: 1, margin: '0 var(--sp-5)' }}>
                  <div className="progress-bar" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-xs text-muted mt-1">{pct}%</div>
                </div>
                <div className="flex items-center gap-3">
                  {statusPill(loan.status)}
                  <span className={`pill text-xs ${loan.riskTier === 'Low' ? 'pill-success' : 'pill-warning'}`} style={{ fontSize: '9px' }}>
                    {loan.riskTier}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button className="btn btn-primary w-full animate-fade-in-up stagger-4"
        id="browse-more-loans-btn" onClick={() => navigate('/loans')}>
        Browse More Loans to Fund →
      </button>
    </section>
  );
};
