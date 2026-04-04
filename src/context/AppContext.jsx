import React, { createContext, useState, useEffect } from 'react';
import { MOCK_USER, MOCK_ACTIVE_LOAN, MOCK_LENDER } from '../data/mockData';
import { supabase } from '../utils/supabaseClient';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Auth state - Fetched from Supabase DB
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [authLoading, setAuthLoading] = useState(true);

  // Fetch full profile using the authenticated user id
  const loadProfile = async (authUser) => {
    if (!authUser) return;
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();
    
    if (profile) {
      const dbName = authUser.user_metadata?.full_name || profile.name || '';
      setUser({
        ...authUser,
        ...profile,
        name: dbName,
        phone: authUser.phone || profile.phone_number || '',
        initials: dbName ? dbName.substring(0, 2).toUpperCase() : '??',
        kycStatus: profile.kyc_status, // map DB snake_case to app camelCase
      });
      setIsLoggedIn(true);
    }
  };

  useEffect(() => {
    // 1. Check active session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user).finally(() => setAuthLoading(false));
      } else {
        setAuthLoading(false);
      }
    });

    // 2. Listen for login/logout events globally
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user);
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // KYC status - derived from Supabase user.kycStatus
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

    // Community
    communities, setCommunities,
    userCommunityId, setUserCommunityId,
    endorsementRequests, setEndorsementRequests,
    communityLoanRequests, setCommunityLoanRequests,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
