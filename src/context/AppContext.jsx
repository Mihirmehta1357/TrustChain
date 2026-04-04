import React, { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Global State
  const [streak, setStreak] = useState(3);
  const [podStrength, setPodStrength] = useState('average');
  const [verification, setVerification] = useState('phone');
  
  const [trustScore, setTrustScore] = useState(72);
  const [loanAmount, setLoanAmount] = useState(10000);
  const [loanWeeks, setLoanWeeks] = useState(8);

  // Derive score directly so it reacts immediately
  useEffect(() => {
    let base = 40;
    base += streak * 4;
    base += { weak: 0, average: 8, strong: 18 }[podStrength] || 0;
    base += { none: 0, phone: 5, ngo: 12 }[verification] || 0;
    setTrustScore(Math.min(100, base));
  }, [streak, podStrength, verification]);

  const value = {
    streak, setStreak,
    podStrength, setPodStrength,
    verification, setVerification,
    trustScore,
    loanAmount, setLoanAmount,
    loanWeeks, setLoanWeeks
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
