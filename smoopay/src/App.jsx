import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MockStoreProvider, useMockStore } from './store/MockStore';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import Dashboard from './pages/Dashboard';
import Transfer from './pages/Transfer';
import Escrow from './pages/Escrow';
import EscrowList from './pages/EscrowList';
import CreateAgreement from './pages/CreateAgreement';
import ManageCurrencies from './pages/ManageCurrencies';
import TransactionHistory from './pages/TransactionHistory';
import InvoicesList from './pages/InvoicesList';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import { cn } from './lib/utils';

function AppContent() {
  const { isAuthenticated, user } = useMockStore();

  if (!isAuthenticated) {
    return <Login />;
  }

  // If new user and hasn't finished onboarding, force to signup
  const needsOnboarding = user?.isNewUser && user?.onboardingStep < 5;

  return (
    <BrowserRouter>
      <div className="flex bg-background min-h-screen text-textPrimary">
        {!needsOnboarding && <Sidebar />}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {!needsOnboarding && <Topbar />}
          <main className={cn(
            "flex-1 overflow-x-hidden overflow-y-auto w-full",
            !needsOnboarding ? "p-4 sm:p-6 lg:p-8" : ""
          )}>
            <Routes>
              <Route path="/signup" element={<SignUp />} />
              <Route path="/" element={needsOnboarding ? <Navigate to="/signup" replace /> : <Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/escrow" element={<Escrow />} />
              <Route path="/escrow/new" element={<CreateAgreement />} />
              <Route path="/transfer" element={<Transfer />} />
              <Route path="/transactions" element={<TransactionHistory />} />
              <Route path="/invoices" element={<InvoicesList />} />
              <Route path="/manage-currencies" element={<ManageCurrencies />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

function App() {
  return (
    <MockStoreProvider>
      <AppContent />
    </MockStoreProvider>
  );
}

export default App;
