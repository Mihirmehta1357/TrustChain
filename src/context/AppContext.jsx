import React, { createContext, useState, useEffect } from 'react';
import { MOCK_USER, MOCK_ACTIVE_LOAN, MOCK_LENDER } from '../data/mockData';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Auth state - Defaults to empty, populated from Supabase via LoginPage/SignUpPage
  const [user, setUser] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);

  // KYC status - derived from user.kycStatus
  const kycCompleted = user?.kycStatus === 'completed';

  // Trust score (derived from verification, streak, vouchers)
  const [streak, setStreak] = useState(3);
  const [podStrength, setPodStrength] = useState('average');
  const [verification, setVerification] = useState('phone');
  const [trustScore, setTrustScore] = useState(72);

  // Loan request state
  const [loanAmount, setLoanAmount] = useState(10000);
  const [loanWeeks, setLoanWeeks] = useState(8);
  const [loanPeriod, setLoanPeriod] = useState(3); // months

  // Active loans & lender data
  const [activeLoan] = useState(MOCK_ACTIVE_LOAN);
  const [lenderData] = useState(MOCK_LENDER);

  // ID Verification steps
  const [verifyStep, setVerifyStep] = useState(1);
  const [verifyDocType, setVerifyDocType] = useState(null);

  // Governance votes
  const [hasVotedFraud, setHasVotedFraud] = useState(null);
  const [hasVotedGov, setHasVotedGov] = useState(null);

  // Recalculate trust score reactively
  useEffect(() => {
    let base = 40;
    base += streak * 4;
    base += { weak: 0, average: 8, strong: 18 }[podStrength] || 0;
    base += { none: 0, phone: 5, ngo: 12 }[verification] || 0;
    setTrustScore(Math.min(100, base));
  }, [streak, podStrength, verification]);

  const value = {
    // Auth
    user, setUser,
    isLoggedIn, setIsLoggedIn,
    onboardingStep, setOnboardingStep,
    kycCompleted,

    // Trust
    streak, setStreak,
    podStrength, setPodStrength,
    verification, setVerification,
    trustScore, setTrustScore,

    // Loans
    loanAmount, setLoanAmount,
    loanWeeks, setLoanWeeks,
    loanPeriod, setLoanPeriod,
    activeLoan,
    lenderData,

    // ID Verify
    verifyStep, setVerifyStep,
    verifyDocType, setVerifyDocType,

    // Governance
    hasVotedFraud, setHasVotedFraud,
    hasVotedGov, setHasVotedGov,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
