import React, { useContext, useEffect, useState } from 'react';
import { Web3Context } from '../../context/Web3Context';
import { useToast } from '../../components/shared/ToastProvider';

export const RepaymentPage = () => {
  const { contract, account, trustScore, refreshTrustScore } = useContext(Web3Context);
  const showToast = useToast();
  const [myLoans, setMyLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [repaying, setRepaying] = useState(null); // loanId being repaid

  const fetchMyLoans = async () => {
    if (!contract || !account) return;
    try {
      const count = await contract.getLoanCount();
      const result = [];
      for (let i = 0; i < Number(count); i++) {
        const l = await contract.loans(i);
        // Only show this borrower's Funded (active) loans
        if (l.borrower.toLowerCase() === account.toLowerCase() && Number(l.status) === 1) {
          result.push({
            id: Number(l.id),
            principal:    Number(l.principal),
            interestRate: Number(l.interestRate),
            totalOwed:    Number(l.totalOwed),
            funder:       l.funder,
            purpose:      l.purpose,
          });
        }
      }
      setMyLoans(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyLoans(); }, [contract, account]);

  const handleRepay = async (loan) => {
    if (!contract) return;
    setRepaying(loan.id);
    try {
      showToast(`Confirm repayment of ₹${loan.totalOwed.toLocaleString('en-IN')} in MetaMask…`, 'info');
      const tx = await contract.repayLoan(loan.id, { value: BigInt(loan.totalOwed) });
      showToast('Repayment submitted — waiting for blockchain confirmation…', 'info');
      await tx.wait();
      showToast('🎉 Loan fully repaid! Your TrustScore increased by +10!', 'success');
      await refreshTrustScore(account, contract);
      await fetchMyLoans();
    } catch (err) {
      console.error(err);
      showToast('Repayment failed: ' + (err.reason || err.message), 'error');
    } finally {
      setRepaying(null);
    }
  };

  return (
    <section className="screen active" aria-label="Repayment Tracker">
      <div className="page-header-row">
        <div>
          <h2 className="page-title-lg">Repayment Tracker</h2>
          <div className="card-subtitle">Repay your active funded loans directly on-chain</div>
        </div>
        {trustScore !== null && (
          <div className="pill pill-success" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
            ⛓️ Trust Score: <strong style={{ marginLeft: 4 }}>{trustScore}</strong>
          </div>
        )}
      </div>

      {loading ? (
        <div className="card text-center text-muted" style={{ padding: 'var(--sp-10)' }}>
          Loading your active loans from blockchain…
        </div>
      ) : myLoans.length === 0 ? (
        <div className="card animate-fade-in-up" style={{ padding: 'var(--sp-10)' }}>
          <div className="text-center">
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>✅</div>
            <div className="card-title mb-2">No active loans</div>
            <div className="card-subtitle">You have no funded loans awaiting repayment. Get a loan to see repayments here.</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          {myLoans.map(loan => {
            const interest = loan.totalOwed - loan.principal;
            return (
              <div key={loan.id} className="card animate-fade-in-up">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <div className="card-title" style={{ marginBottom: 2 }}>Loan #{loan.id}</div>
                    <div className="card-subtitle">{loan.purpose}</div>
                  </div>
                  <span className="pill pill-warning">Active</span>
                </div>

                <div className="risk-factors-list mb-4">
                  <div className="factor-row">
                    <span className="text-sm text-muted">Principal Borrowed</span>
                    <span className="font-semibold">₹{loan.principal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="factor-row">
                    <span className="text-sm text-muted">Interest ({loan.interestRate}% flat)</span>
                    <span className="font-semibold" style={{ color: 'var(--color-warning)' }}>+ ₹{interest.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="factor-row" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '8px', marginTop: '4px' }}>
                    <span className="text-sm font-semibold">Total to Repay</span>
                    <span className="font-semibold text-lg" style={{ color: 'var(--color-primary)' }}>₹{loan.totalOwed.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="factor-row">
                    <span className="text-sm text-muted">Funded by</span>
                    <span className="text-sm" style={{ fontFamily: 'monospace' }}>
                      {loan.funder.substring(0, 8)}…{loan.funder.substring(36)}
                    </span>
                  </div>
                </div>

                <button
                  className="btn btn-primary w-full"
                  disabled={repaying === loan.id}
                  onClick={() => handleRepay(loan)}
                  id={`repay-btn-${loan.id}`}
                >
                  {repaying === loan.id
                    ? '⏳ Confirming repayment…'
                    : `💸 Repay ₹${loan.totalOwed.toLocaleString('en-IN')} → Earn +10 Trust Score`}
                </button>
                <div className="text-center text-xs text-muted mt-2">
                  🔒 Funds are routed directly to lender via Smart Contract
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
