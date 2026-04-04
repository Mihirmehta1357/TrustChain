import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Web3Context } from '../../context/Web3Context';
import { AppContext } from '../../context/AppContext';
import { MOCK_LOANS } from '../../data/mockData';
import { useToast } from '../../components/shared/ToastProvider';
import { fundPct, riskBadge } from '../../components/shared/SharedComponents';

export const FundLoanPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const showToast = useToast();
  const { contract, account } = useContext(Web3Context);
  const { kycCompleted } = useContext(AppContext);

  // Fall back to first loan if no state passed
  const loan = location.state?.loan || MOCK_LOANS[0];
  const isBlockchainLoan = typeof loan.id === 'number';
  const remainingAmount = loan.amount - loan.funded;
  const [fundAmount, setFundAmount] = useState(isBlockchainLoan ? loan.amount : Math.min(remainingAmount, 2000));

  // KYC Gate
  if (!kycCompleted) {
    return (
      <section className="screen active" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', gap: '16px' }}>
        <div style={{ fontSize: '48px' }}>🔒</div>
        <h2 style={{ fontSize: '20px', fontWeight: 700 }}>KYC Required</h2>
        <p style={{ color: 'var(--color-text-muted)', maxWidth: '280px' }}>Complete your KYC verification before funding any loans.</p>
        <button className="btn btn-primary" onClick={() => navigate('/kyc')} id="kyc-gate-fund-btn">Complete KYC →</button>
      </section>
    );
  }

  const pct = fundPct(loan.funded, loan.amount);
  const interestRate = loan.riskTier === 'Low' ? 12 : loan.riskTier === 'Medium' ? 16 : 20;
  const expectedReturn = Math.round(fundAmount * (1 + (interestRate / 100) * (parseInt(loan.repaymentPeriod) / 12)));
  const { cls, label } = riskBadge(loan.riskTier);

  const handleConfirm = async () => {
    if (!contract || !account) {
      showToast('Please connect your MetaMask wallet first!', 'error');
      return;
    }

    try {
      showToast('Please confirm the funding transaction in MetaMask...', 'info');
      
      // We check if it's a real blockchain loan vs a mockup
      const loanIdToFund = isBlockchainLoan ? loan.id : 0; // fallback to 0 for mock
      
      // Execute fundLoan on TrustChain contract, attaching native token value
      const tx = await contract.fundLoan(loanIdToFund, { value: isBlockchainLoan ? loan.amount : fundAmount });
      
      showToast('Waiting for blockchain confirmation...', 'info');
      await tx.wait(); // Wait for the block to be mined
      
      showToast(`✅ ₹${fundAmount.toLocaleString('en-IN')} funded successfully via Blockchain!`, 'success');
      navigate('/app/lender');
    } catch (err) {
      console.error(err);
      showToast('Transaction was rejected or failed.', 'error');
    }
  };

  return (
    <section className="screen active" aria-label="Fund a Loan">
      <div className="loan-grid">

        {/* Left — Details */}
        <div className="card animate-fade-in-up">
          <div className="card-title mb-1">Fund This Loan</div>
          <div className="card-subtitle mb-5">Review borrower details before committing</div>

          {/* Borrower summary card */}
          <div className="borrower-summary-card">
            <div className="avatar avatar-lg" style={{ background: loan.avatarColor }}>{loan.initials}</div>
            <div className="borrower-summary-info">
              <div className="font-semibold">{loan.borrower}</div>
              <div className="text-xs text-muted">{loan.location} · Trust Score: {loan.trustScore}</div>
              <span className={`pill ${cls} text-xs mt-1`} style={{ display: 'inline-block' }}>{label}</span>
            </div>
          </div>

          <div className="loan-purpose-text mt-4">"{loan.story}"</div>

          {/* Funding progress */}
          <div className="mt-5">
            <div className="loan-progress-label">
              <span>₹{loan.funded.toLocaleString('en-IN')} funded</span>
              <span>of ₹{loan.amount.toLocaleString('en-IN')} · {pct}%</span>
            </div>
            <div className="progress-bar" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="text-xs text-muted mt-1">{loan.daysLeft} days left · {loan.repaymentPeriod} term</div>
          </div>

          {/* Amount to fund */}
          <div className="form-group mt-6">
            <label className="form-label" htmlFor="fund-amount">
              Amount to Fund (₹)
              <span className="form-label-value">₹{fundAmount.toLocaleString('en-IN')}</span>
            </label>
            <input
              type="range"
              id="fund-amount"
              className="amount-slider"
              min="500"
              max={loan.amount - loan.funded}
              step="500"
              value={fundAmount}
              onChange={e => setFundAmount(parseInt(e.target.value))}
              disabled={isBlockchainLoan}
            />
            <div className="slider-labels">
              <span>₹500</span>
              <span>₹{Math.round((loan.amount - loan.funded) / 2).toLocaleString('en-IN')}</span>
              <span>₹{(loan.amount - loan.funded).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Expected return */}
          <div className="live-estimate-panel mt-4" style={{ background: '#FDE8C0', border: '1px solid #FAC775' }}>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium" style={{ color: 'var(--color-warning)' }}>Expected Return</span>
              <span className="font-bold text-lg" style={{ color: 'var(--color-warning)' }}>
                ₹{expectedReturn.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-xs text-muted mt-1">
              {interestRate}% p.a. · +₹{(expectedReturn - fundAmount).toLocaleString('en-IN')} interest over {loan.repaymentPeriod}
            </div>
          </div>

          {/* Smart contract summary */}
          <div className="card mt-4" style={{ background: '#EEEDFE', border: '1px solid #AFA9EC' }}>
            <div className="font-semibold text-sm mb-2" style={{ color: '#534AB7' }}>Smart Contract Summary</div>
            <div className="contract-terms text-xs" style={{ color: '#534AB7', lineHeight: 1.8 }}>
              <div>• Loan: ₹{loan.amount.toLocaleString('en-IN')} total · ₹{fundAmount.toLocaleString('en-IN')} your share</div>
              <div>• Repayment: Weekly instalments over {loan.repaymentPeriod}</div>
              <div>• Risk: {loan.riskTier} · Trust Score: {loan.trustScore}/100</div>
              <div>• Community vouchers: verified</div>
              <div>• Simulated — no real funds transferred</div>
            </div>
          </div>

          <button
            className="btn btn-primary w-full mt-5"
            id="confirm-fund-btn"
            onClick={handleConfirm}
          >
             <svg viewBox="0 0 32 32" fill="none" width="16" height="16" aria-hidden="true" style={{marginRight: '8px', verticalAlign: 'middle'}}>
                <path d="M29.5 12L20 4.5l-4-3-4 3-9.5 7.5L5 21l3 7.5L16 29l8-1.5 3-7.5 2.5-9z" fill="#F6851B" stroke="#F6851B" strokeWidth="1" strokeLinejoin="round"/>
             </svg>
            Fund ₹{fundAmount.toLocaleString('en-IN')} with Web3 →
          </button>
        </div>

        {/* Right — Risk panel */}
        <div className="card animate-fade-in-up stagger-2">
          <div className="card-title mb-4">Risk &amp; Return Analysis</div>

          <div className="risk-tier-display text-center mb-5">
            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: loan.riskTier === 'Low' ? 'var(--color-success)' : loan.riskTier === 'Medium' ? 'var(--color-warning)' : 'var(--color-danger)' }}>
              {loan.riskTier}
            </div>
            <div className="text-muted text-sm">Risk Tier</div>
          </div>

          <div className="factor-row">
            <span className="text-sm">Borrower Trust Score</span>
            <span className="font-semibold">{loan.trustScore}/100</span>
          </div>
          <div className="factor-row">
            <span className="text-sm">Interest Rate</span>
            <span className="font-semibold">{interestRate}% p.a.</span>
          </div>
          <div className="factor-row">
            <span className="text-sm">Repayment Period</span>
            <span className="font-semibold">{loan.repaymentPeriod}</span>
          </div>
          <div className="factor-row">
            <span className="text-sm">Already Funded</span>
            <span className="font-semibold">{pct}%</span>
          </div>

          <div className="trust-hint mt-5">
            {loan.riskTier === 'Low' && '✅ Low-risk loan — strong trust score and community backing.'}
            {loan.riskTier === 'Medium' && '⚠️ Medium risk — borrower has good history but limited vouchers.'}
            {loan.riskTier === 'High' && '🔴 High risk — diversify your portfolio if funding this loan.'}
          </div>

          <button className="btn btn-outline w-full mt-5" onClick={() => navigate('/loans')} id="back-to-loans-btn">
            ← Browse Other Loans
          </button>
        </div>
      </div>
    </section>
  );
};
