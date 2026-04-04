import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { Web3Context } from '../../context/Web3Context';
import { useToast } from '../../components/shared/ToastProvider';
import { calcLoan } from '../../utils/formatters';

export const RequestLoanPage = () => {
  const { podStrength, verification, kycCompleted } = useContext(AppContext);
  const [amount, setAmount]     = useState(10000);
  const [period, setPeriod]     = useState(3);
  const [purpose, setPurpose]   = useState('');
  const [story, setStory]       = useState('');
  const [riskTier, setRiskTier] = useState('Low');
  const [weeklyPayment, setWeeklyPayment] = useState(0);
  const [onChainRate, setOnChainRate]     = useState(null); // live from contract
  const { contract, account, trustScore } = useContext(Web3Context);
  const showToast  = useToast();
  const navigate   = useNavigate();

  // KYC Gate
  if (!kycCompleted) {
    return (
      <section className="screen active" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', gap: '16px' }}>
        <div style={{ fontSize: '48px' }}>🔒</div>
        <h2 style={{ fontSize: '20px', fontWeight: 700 }}>KYC Required</h2>
        <p style={{ color: 'var(--color-text-muted)', maxWidth: '280px' }}>Complete your identity verification before requesting a loan.</p>
        <button className="btn btn-primary" onClick={() => navigate('/kyc')} id="kyc-gate-loan-btn">Complete KYC →</button>
      </section>
    );
  }

  useEffect(() => {
    const data = calcLoan(amount, period * 4, podStrength, verification);
    setWeeklyPayment(data.weekly);
    setRiskTier(amount > 30000 ? 'High' : amount > 15000 ? 'Medium' : 'Low');
  }, [amount, period, podStrength, verification]);

  // Fetch live on-chain interest rate for connected wallet
  useEffect(() => {
    if (!contract || !account) return;
    contract.computeInterestRate(account)
      .then(r => setOnChainRate(Number(r)))
      .catch(() => {});
  }, [contract, account]);

  const riskColor = { Low: 'var(--color-success)', Medium: 'var(--color-warning)', High: 'var(--color-danger)' };
  const riskPill  = { Low: 'pill-success', Medium: 'pill-warning', High: 'pill-danger' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contract || !account) {
      showToast('Please connect your MetaMask wallet first!', 'error');
      return;
    }
    try {
      showToast('Please confirm the transaction in MetaMask...', 'info');
      // Contract expects uint256 amount — pass as BigInt (wei equivalent for demo)
      const tx = await contract.requestLoan(BigInt(amount), purpose);
      showToast('Waiting for blockchain confirmation...', 'info');
      await tx.wait();
      showToast('Loan request written to blockchain! 🎉', 'success');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      showToast('Transaction rejected or failed: ' + (err.reason || err.message), 'error');
    }
  };

  return (
    <section className="screen active" aria-label="Request a Loan">
      <div className="loan-grid">
        <form className="card animate-fade-in-up" onSubmit={handleSubmit}>
          <div className="card-title mb-1">New Loan Application</div>
          <div className="card-subtitle mb-6">Tell us what you need and why</div>

          {/* Amount slider */}
          <div className="form-group">
            <label className="form-label" htmlFor="loan-amount-slider">
              Loan Amount (₹)
              <span className="form-label-value">₹{amount.toLocaleString('en-IN')}</span>
            </label>
            <input
              type="range"
              id="loan-amount-slider"
              className="amount-slider"
              min="1000" max="50000" step="1000"
              value={amount}
              onChange={e => setAmount(parseInt(e.target.value))}
            />
            <div className="slider-labels">
              <span>₹1,000</span>
              <span>₹50,000</span>
            </div>
          </div>

          {/* Term slider */}
          <div className="form-group mt-5">
            <label className="form-label" htmlFor="loan-period-slider">
              Repayment Term
              <span className="form-label-value">{period} Months</span>
            </label>
            <input
              type="range"
              id="loan-period-slider"
              className="amount-slider"
              min="1" max="12" step="1"
              value={period}
              onChange={e => setPeriod(parseInt(e.target.value))}
            />
            <div className="slider-labels">
              <span>1 Month</span>
              <span>12 Months</span>
            </div>
          </div>

          <div className="form-group mt-5">
            <label className="form-label" htmlFor="loan-purpose-input">Loan Purpose</label>
            <input
              type="text"
              id="loan-purpose-input"
              className="form-input"
              placeholder="e.g. Starting a small food stall"
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="loan-story-input">Your Story (Optional)</label>
            <textarea
              id="loan-story-input"
              className="form-input"
              rows="3"
              placeholder="Tell lenders a bit more about how this loan helps you..."
              value={story}
              onChange={e => setStory(e.target.value)}
            />
          </div>

          <div className="security-hint mt-6" role="note">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 1L1.5 3.5v4.5C1.5 10.8 4 13 7 13.5c3-.5 5.5-2.7 5.5-5.5V3.5L7 1z"/>
            </svg>
            This loan is completely uncollateralized and relies on your on-chain TrustScore
          </div>

          <button type="submit" className="btn btn-primary w-full mt-6" id="submit-loan-request-btn">
            Sign &amp; Submit on Blockchain ⛓️
          </button>
        </form>

        <div className="loan-sidebar d-none-mobile animate-fade-in-up stagger-2">
          {/* Real-time blockchain preview */}
          <div className="card">
            <div className="card-title">Live Blockchain Preview</div>
            <div className="card-subtitle mb-4">Calculated by TrustChain Smart Contract</div>

            <div className="summary-row">
              <span className="summary-label">Principal</span>
              <span className="summary-value" id="preview-principal">₹{amount.toLocaleString('en-IN')}</span>
            </div>
            
            <div className="summary-row">
              <span className="summary-label text-warning">Dynamic Interest Rate</span>
              <span className="summary-value text-warning" id="preview-interest">
                {onChainRate ? `${onChainRate}%` : 'Calculating…'}
              </span>
            </div>

            <div className="summary-row">
              <span className="summary-label">Your Initial Trust Score</span>
              <span className="summary-value" style={{ color: trustScore >= 70 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                {trustScore ?? '50'}
              </span>
            </div>

            <div className="summary-total mt-4">
              <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>Estimated Weekly</span>
              <span id="preview-weekly">₹{weeklyPayment.toLocaleString('en-IN')}</span>
            </div>

            <div className="security-hint" style={{ marginTop: 'var(--sp-4)', background: 'rgba(0,0,0,0.02)' }}>
              A higher TrustScore unlocks lower interest rates. Earning endorsements (+5) or repaying loans (+10) permanently improves your rates.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
