import React, { createContext, useState, useEffect } from 'react';
import { MOCK_USER, MOCK_ACTIVE_LOAN, MOCK_LENDER } from '../data/mockData';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Auth state
  const [user, setUser] = useState(MOCK_USER);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);

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
  const [hasVotedGov, setHasVotedGov]     = useState(null);

  // Community / Pod system (off-chain simulated store)
  const [communities, setCommunities]             = useState([]);
  const [userCommunityId, setUserCommunityId]     = useState(null);
  // endorsementRequests: [{id, requester, communityId, message, status:'pending'|'approved'|'rejected', createdAt}]
  const [endorsementRequests, setEndorsementRequests] = useState([]);
  // communityLoanRequests: [{id, requester, communityId, amount, purpose, createdAt, funders:[]}]
  const [communityLoanRequests, setCommunityLoanRequests] = useState([]);

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

    // Community
    communities, setCommunities,
    userCommunityId, setUserCommunityId,
    endorsementRequests, setEndorsementRequests,
    communityLoanRequests, setCommunityLoanRequests,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
