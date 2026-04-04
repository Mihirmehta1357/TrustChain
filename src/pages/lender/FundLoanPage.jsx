import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Web3Context } from '../../context/Web3Context';
import { AppContext } from '../../context/AppContext';
import { MOCK_LOANS } from '../../data/mockData';
import { useToast } from '../../components/shared/ToastProvider';
import { fundPct, riskBadge } from '../../components/shared/SharedComponents';

export const FundLoanPage = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const showToast = useToast();
  const { contract, account, refreshTrustScore } = useContext(Web3Context);
  const { kycCompleted } = useContext(AppContext);

  const loan = location.state?.loan || MOCK_LOANS[0];

  // For blockchain loans principal is stored; for mocks fallback to amount
  const principal = loan.principal ?? loan.amount;
  const isBlockchainLoan = typeof loan.id === 'number' && loan.borrowerAddress;
  
  const remainingAmount = loan.amount ? loan.amount - (loan.funded || 0) : principal; // Fallback if no funded val
  const [fundAmount, setFundAmount] = useState(isBlockchainLoan ? principal : Math.min(remainingAmount, 2000));

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

  const [funding, setFunding]     = useState(false);
  const [endorsing, setEndorsing] = useState(false);

  const pct            = fundPct(loan.funded ?? 0, principal);
  // On-chain interestRate stored on loan; fallback to tier mapping for mocks
  const interestRate   = loan.interestRate ?? (loan.riskTier === 'Low' ? 12 : loan.riskTier === 'Medium' ? 16 : 20);
  const expectedReturn = loan.totalOwed ?? Math.round(principal * (1 + interestRate / 100));
  const { cls, label } = riskBadge(loan.riskTier);

  const handleConfirm = async () => {
    if (!contract || !account) {
      showToast('Please connect your MetaMask wallet first!', 'error');
      return;
    }
    setFunding(true);
    try {
      showToast('Please confirm the funding transaction in MetaMask…', 'info');
      // Send exact principal as BigInt wei for real loans, else simulated fundAmount
      const loanId = isBlockchainLoan ? loan.id : 0;
      const valToSend = isBlockchainLoan ? principal : fundAmount;
      const tx     = await contract.fundLoan(loanId, { value: BigInt(valToSend) });
      showToast('Waiting for blockchain confirmation…', 'info');
      await tx.wait();
      showToast(`✅ ₹${valToSend.toLocaleString('en-IN')} funded! Lend again to diversify.`, 'success');
      navigate('/lender'); // Fixed route from /app/lender
    } catch (err) {
      console.error(err);
      showToast('Transaction failed: ' + (err.reason || err.message), 'error');
    } finally {
      setFunding(false);
    }
  };

  const handleEndorse = async () => {
    if (!contract || !account || !isBlockchainLoan) {
      showToast('Can only endorse blockchain borrowers.', 'error');
      return;
    }
    setEndorsing(true);
    try {
      showToast('Confirm endorsement in MetaMask…', 'info');
      const tx = await contract.endorseUser(loan.borrowerAddress);
      await tx.wait();
      showToast('🌟 Endorsement committed on-chain. Borrower Trust Score +5.', 'success');
      refreshTrustScore?.(account, contract);
    } catch (err) {
      console.error(err);
      if (err.reason?.includes('Already endorsed')) showToast('You have already endorsed this user.', 'error');
      else showToast('Endorsement failed: ' + (err.reason || err.message), 'error');
    } finally {
      setEndorsing(false);
    }
  };

  return (
    <section className="screen active" aria-label="Fund Loan">
      <div className="loan-grid">
        {/* Left Col: Loan Details */}
        <div className="loan-scroll animate-fade-in-up">
          <div className="card-title text-2xl flex items-center gap-3">
            {loan.borrower}
            {isBlockchainLoan && <span className="pill pill-warning" style={{ fontSize: '10px' }}>⛓️ Web3 Identity</span>}
          </div>
          <div className="card-subtitle text-lg font-medium" style={{ color: 'var(--color-primary)' }}>
            {loan.purpose}
          </div>

          <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-4)' }}>
            <span className={`pill ${cls}`}>{label} risk</span>
            <span className="pill" style={{ background: '#F1F5F9' }}>{interestRate}% Return</span>
            <span className="pill" style={{ background: '#F1F5F9' }}>{loan.term}</span>
          </div>

          {!isBlockchainLoan && pct < 100 && (
            <div className="funding-progress-section" style={{ marginTop: 'var(--sp-6)' }}>
              <div className="progress-bar lg" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between items-end mt-2">
                <div>
                  <div className="progress-value">₹{(loan.funded ?? 0).toLocaleString('en-IN')}</div>
                  <div className="text-sm text-muted">funded of ₹{principal.toLocaleString('en-IN')}</div>
                </div>
                <div className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>{pct}%</div>
              </div>
            </div>
          )}

          <div className="divider" style={{ margin: 'var(--sp-6) 0' }} />

          <div className="card-title text-lg mb-4">Borrower Profile</div>
          <div className="stats-row">
            <div className="stat-col text-center">
              <div className="text-muted text-xs uppercase tracking-wider mb-1">Trust Score</div>
              <div className="text-2xl font-bold" style={{ color: "var(--color-success)" }}>
                {isBlockchainLoan ? loan.trustScore : (loan.score || 'A+')}
              </div>
            </div>
            <div className="divider-v" />
            <div className="stat-col text-center">
              <div className="text-muted text-xs uppercase tracking-wider mb-1">Repayments</div>
              <div className="text-2xl font-bold">{isBlockchainLoan ? loan.repaidCount : '12'}</div>
            </div>
            <div className="divider-v" />
            <div className="stat-col text-center">
              <div className="text-muted text-xs uppercase tracking-wider mb-1">Endorsements</div>
              <div className="text-2xl font-bold">{isBlockchainLoan ? loan.endorsements : '8'}</div>
            </div>
          </div>

          {isBlockchainLoan && (
            <div style={{ marginTop: 'var(--sp-6)' }}>
              <button
                className="btn btn-outline w-full"
                onClick={handleEndorse}
                disabled={endorsing}
                id="endorse-fund-btn"
                style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
              >
                {endorsing ? '⏳ Endorsing on blockchain...' : '🌟 Endorse this Borrower'}
              </button>
              <div className="text-xs text-center text-muted mt-2">
                Stakes your reputation to boost their trust score.
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Funding Actions */}
        <div className="loan-sidebar animate-fade-in-up stagger-2">
          <div className="card" style={{ position: 'sticky', top: 'var(--sp-4)' }}>
            <div className="card-title mb-4">Commit Funds</div>

            {!isBlockchainLoan ? (
              <div className="form-group mb-5">
                <label className="form-label" htmlFor="fund-amount-slider">
                  Amount to Fund (₹)
                  <span className="form-label-value">₹{fundAmount.toLocaleString('en-IN')}</span>
                </label>
                <input
                  type="range"
                  id="fund-amount-slider"
                  className="amount-slider"
                  min="500"
                  max={remainingAmount}
                  step="500"
                  value={fundAmount}
                  onChange={e => setFundAmount(parseInt(e.target.value))}
                />
              </div>
            ) : (
              <div className="form-group mb-5">
                <div className="security-hint">
                  This on-chain loan requires a single flat funding of the exact principal: <strong>₹{principal.toLocaleString('en-IN')}</strong>.
                </div>
              </div>
            )}

            <div className="summary-card" style={{ background: '#F8FAFC', padding: 'var(--sp-4)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--sp-6)' }}>
              <div className="summary-row mb-3">
                <span className="text-muted text-sm">Principal</span>
                <span className="font-medium text-sm">₹{isBlockchainLoan ? principal.toLocaleString('en-IN') : fundAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="summary-row mb-3">
                <span className="text-muted text-sm">Expected Return</span>
                <span className="font-bold text-sm" style={{ color: 'var(--color-success)' }}>
                  +₹{isBlockchainLoan ? (expectedReturn - principal).toLocaleString('en-IN') : Math.round(fundAmount * (interestRate / 100)).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="divider mb-3" style={{ opacity: 0.5 }} />
              <div className="summary-row">
                <span className="font-medium">Total Received</span>
                <span className="text-xl font-extrabold" style={{ color: 'var(--color-primary)' }}>
                  ₹{isBlockchainLoan ? expectedReturn.toLocaleString('en-IN') : Math.round(fundAmount * (1 + interestRate / 100)).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              className="btn btn-primary w-full"
              style={{ padding: 'var(--sp-3) var(--sp-4)', fontSize: '1rem' }}
              onClick={handleConfirm}
              disabled={funding}
              id="confirm-fund-btn"
            >
              {funding ? 'Confirming on Blockchain...' : 'Sign & Transfer Funds 💸'}
            </button>
            <div className="text-center font-monospace mt-3" style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
              Protected by TrustChain Smart Contract
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
