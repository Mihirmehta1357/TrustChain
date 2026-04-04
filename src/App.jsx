import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Web3Provider } from './context/Web3Context';
import { ToastProvider } from './components/shared/ToastProvider';

// Auth
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignUpPage } from './pages/auth/SignUpPage';

// App Layout
import { AppLayout } from './components/layout/AppLayout';

// Core
import { DashboardPage } from './pages/DashboardPage';
import { TransactionLogPage } from './pages/TransactionLogPage';

// Borrower
import { BorrowerProfilePage } from './pages/borrower/BorrowerProfilePage';
import { RequestLoanPage } from './pages/borrower/RequestLoanPage';
import { RepaymentPage } from './pages/borrower/RepaymentPage';
import { CommunityVouchingPage } from './pages/borrower/CommunityVouchingPage';
import { CommunityPage } from './pages/borrower/CommunityPage';

// Lender
import { BrowseLoansPage } from './pages/lender/BrowseLoansPage';
import { LenderDashboardPage } from './pages/lender/LenderDashboardPage';
import { FundLoanPage } from './pages/lender/FundLoanPage';

// Trust
import { TrustScoreDetailPage } from './pages/trust/TrustScoreDetailPage';
import { IdentityVerificationPage } from './pages/trust/IdentityVerificationPage';

// KYC
import { KYCPage } from './pages/kyc/KYCPage';

// Governance
import { FraudVotingPage } from './pages/governance/FraudVotingPage';
import { LoanApprovalVotingPage } from './pages/governance/LoanApprovalVotingPage';

// Existing pages (simulation / pod from old prototype)
import { SimulationPage } from './pages/SimulationPage';
import { PodPage } from './pages/PodPage';

export default function App() {
  return (
    <BrowserRouter>
      <Web3Provider>
        <AppProvider>
          <ToastProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />

            {/* App shell */}
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              {/* Legacy routes from old prototype */}
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="pod" element={<PodPage />} />
              <Route path="loan" element={<RequestLoanPage />} />
              <Route path="simulation" element={<SimulationPage />} />
            </Route>

            {/* Core */}
            <Route path="/dashboard" element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
            </Route>
            <Route path="/transactions" element={<AppLayout />}>
              <Route index element={<TransactionLogPage />} />
            </Route>

            {/* Borrower */}
            <Route path="/profile" element={<AppLayout />}>
              <Route index element={<BorrowerProfilePage />} />
            </Route>
            <Route path="/loan" element={<AppLayout />}>
              <Route index element={<Navigate to="request" replace />} />
              <Route path="request" element={<RequestLoanPage />} />
              <Route path="repayment" element={<RepaymentPage />} />
              <Route path="fund" element={<FundLoanPage />} />
            </Route>
            <Route path="/vouch" element={<AppLayout />}>
              <Route index element={<CommunityVouchingPage />} />
            </Route>
            <Route path="/community" element={<AppLayout />}>
              <Route index element={<CommunityPage />} />
            </Route>

            {/* Lender */}
            <Route path="/loans" element={<AppLayout />}>
              <Route index element={<BrowseLoansPage />} />
            </Route>
            <Route path="/lender" element={<AppLayout />}>
              <Route index element={<LenderDashboardPage />} />
            </Route>

            {/* Trust */}
            <Route path="/trust" element={<AppLayout />}>
              <Route index element={<TrustScoreDetailPage />} />
            </Route>
            <Route path="/verify" element={<AppLayout />}>
              <Route index element={<IdentityVerificationPage />} />
            </Route>

            {/* Governance */}
            <Route path="/fraud" element={<AppLayout />}>
              <Route index element={<FraudVotingPage />} />
            </Route>
            <Route path="/governance" element={<AppLayout />}>
              <Route index element={<LoanApprovalVotingPage />} />
            </Route>

            {/* KYC */}
            <Route path="/kyc" element={<AppLayout />}>
              <Route index element={<KYCPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AppProvider>
      </Web3Provider>
    </BrowserRouter>
  );
}
