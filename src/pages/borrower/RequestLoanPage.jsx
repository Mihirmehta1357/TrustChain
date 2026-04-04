import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { Web3Context } from '../../context/Web3Context';
import { useToast } from '../../components/shared/ToastProvider';
import { calcLoan } from '../../utils/formatters';
import { ethers } from 'ethers';

export const RequestLoanPage = () => {
  const { podStrength, verification, kycCompleted } = useContext(AppContext);
  const [amount, setAmount] = useState(10000);
  const [period, setPeriod] = useState(3);
  const [purpose, setPurpose] = useState('');
  const [story, setStory] = useState('');
  const [riskTier, setRiskTier] = useState('Low');
  const [weeklyPayment, setWeeklyPayment] = useState(0);
  const { contract, account, isRegistered } = useContext(Web3Context);
  const showToast = useToast();
  const navigate = useNavigate();

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

  const riskColor = { Low: 'var(--color-success)', Medium: 'var(--color-warning)', High: 'var(--color-danger)' };
  const riskPill = { Low: 'pill-success', Medium: 'pill-warning', High: 'pill-danger' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contract || !account) {
      showToast('Please connect your MetaMask wallet first!', 'error');
      return;
    }
    if (!isRegistered) {
      showToast('Please activate your on-chain identity first! Click the banner in the left sidebar.', 'error');
      return;
    }

    try {
      showToast('Please confirm the transaction in MetaMask...', 'info');
      // Execute the requestLoan function from TrustChain.sol using proper ETH scaling
      const tx = await contract.requestLoan(ethers.parseEther(amount.toString()), purpose);
      
      showToast('Waiting for blockchain confirmation...', 'info');
      await tx.wait(); // Wait for the block to be mined
      
      showToast('Loan request successfully written to the blockchain! 🎉', 'success');
      navigate('/app/dashboard');
    } catch (err) {
      console.error(err);
      showToast('Transaction was rejected or failed.', 'error');
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
              <span>₹25,000</span>
              <span>₹50,000</span>
            </div>
          </div>

          {/* Purpose */}
          <div className="form-group">
            <label className="form-label" htmlFor="loan-purpose">Purpose (plain language)</label>
            <input
              className="form-control"
              id="loan-purpose"
              type="text"
              placeholder="e.g. Buying a sewing machine for my tailoring business"
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              required
            />
          </div>

          {/* Repayment period */}
          <div className="form-group">
            <label className="form-label">Repayment Period</label>
            <div className="duration-grid">
              {[1, 3, 6].map(m => (
                <button
                  type="button"
                  key={m}
                  className={`btn-duration ${period === m ? 'active' : ''}`}
                  onClick={() => setPeriod(m)}
                  id={`period-${m}m`}
                >
                  <div className="font-semibold">{m} Month{m > 1 ? 's' : ''}</div>
                  <div className="text-xs text-muted">{m * 4} weeks</div>
                </button>
              ))}
            </div>
          </div>

          {/* Optional story */}
          <div className="form-group">
            <label className="form-label" htmlFor="loan-story">
              Your Story <span className="text-muted">(optional — increases funding chance)</span>
            </label>
            <textarea
              className="form-control"
              id="loan-story"
              rows="3"
              placeholder="Tell lenders why this loan matters to you..."
              value={story}
              onChange={e => setStory(e.target.value)}
              style={{ resize: 'vertical', minHeight: '80px' }}
            />
          </div>

          {/* Photo upload hint */}
          <div className="form-group">
            <div className="upload-zone-sm">
              <span>📷</span>
              <span className="text-sm text-muted">Add a photo to your loan story (optional)</span>
            </div>
          </div>

          {/* Live estimate */}
          <div className="live-estimate-panel">
            <div className="flex justify-between items-center">
              <span className="text-muted text-sm">Weekly repayment</span>
              <span className="font-semibold text-lg">₹{weeklyPayment.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full mt-6" id="submit-loan-btn">
             <svg viewBox="0 0 32 32" fill="none" width="16" height="16" aria-hidden="true" style={{marginRight: '8px', verticalAlign: 'middle'}}>
                <path d="M29.5 12L20 4.5l-4-3-4 3-9.5 7.5L5 21l3 7.5L16 29l8-1.5 3-7.5 2.5-9z" fill="#F6851B" stroke="#F6851B" strokeWidth="1" strokeLinejoin="round"/>
             </svg>
            Sign & Submit with Web3 →
          </button>
          <div className="text-center text-xs text-muted mt-3">
            🔒 Fully decentralized blockchain architecture
          </div>
        </form>

        {/* Risk panel */}
        <div className="card animate-fade-in-up stagger-2">
          <div className="card-title mb-4">Auto Risk Assessment</div>

          <div className="risk-tier-display text-center mb-6">
            <div style={{ fontSize: '3rem', fontWeight: '800', color: riskColor[riskTier] }}>{riskTier}</div>
            <span className={`pill ${riskPill[riskTier]}`}>Risk Tier</span>
          </div>

          <div className="risk-factors-list">
            <div className="factor-row">
              <span className="text-sm">Loan Amount</span>
              <span className={`pill text-xs ${amount <= 15000 ? 'pill-success' : amount <= 30000 ? 'pill-warning' : 'pill-danger'}`}>
                ₹{amount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="factor-row">
              <span className="text-sm">Repayment Period</span>
              <span className="pill pill-success text-xs">{period} month{period > 1 ? 's' : ''}</span>
            </div>
            <div className="factor-row">
              <span className="text-sm">Community Pod</span>
              <span className={`pill text-xs ${podStrength === 'strong' ? 'pill-success' : 'pill-warning'}`}>
                {podStrength.charAt(0).toUpperCase() + podStrength.slice(1)}
              </span>
            </div>
            <div className="factor-row">
              <span className="text-sm">Verification</span>
              <span className={`pill text-xs ${verification === 'ngo' ? 'pill-success' : 'pill-warning'}`}>
                {verification === 'ngo' ? 'NGO + Phone' : verification === 'phone' ? 'Phone only' : 'None'}
              </span>
            </div>
          </div>

          <div className="trust-hint mt-4">
            {riskTier === 'Low' && '✅ Low risk — your loan will likely be funded quickly.'}
            {riskTier === 'Medium' && '⚠️ Medium risk — consider adding more vouchers to improve funding chances.'}
            {riskTier === 'High' && '🔴 High risk — the amount is large. Consider splitting across two requests.'}
          </div>
        </div>
      </div>
    </section>
  );
};