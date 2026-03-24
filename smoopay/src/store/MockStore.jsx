import React, { createContext, useContext, useState } from 'react';

const mockTransactions = [
  { id: 'tx-1', date: '2026-03-21', description: 'Acme Corp API Services', amount: -2450.00, currency: 'USD', status: 'Completed' },
  { id: 'tx-2', date: '2026-03-20', description: 'TechStars Inc. Funding', amount: 150000.00, currency: 'USD', status: 'Completed' },
  { id: 'tx-3', date: '2026-03-19', description: 'Cloudways Servers', amount: -320.50, currency: 'EUR', status: 'Pending' },
];

const mockWallets = [
  { currency: 'USD', balance: 145000.00, symbol: '$' },
  { currency: 'SGD', balance: 25000.00, symbol: 'S$' },
  { currency: 'EUR', balance: 8400.00, symbol: '€' },
  { currency: 'GBP', balance: 4100.00, symbol: '£' }
];

const mockMilestones = [
  { id: 'm-1', title: 'Milestone 1: Wireframes', amount: 5000, status: 'Paid', proof: 'wireframes.pdf' },
  { id: 'm-2', title: 'Milestone 2: Frontend', amount: 15000, status: 'Approved', proof: 'frontend_build.zip' },
  { id: 'm-3', title: 'Milestone 3: Backend & Integration', amount: 15000, status: 'Pending', proof: null }
];

const MockStoreContext = createContext();

export function MockStoreProvider({ children }) {
  const [theme, setTheme] = useState(localStorage.getItem('theme_v3') || 'light');
  
  React.useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme_v3', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const [wallets, setWallets] = useState(mockWallets);
  const [transactions, setTransactions] = useState(mockTransactions);
  const [milestones, setMilestones] = useState(mockMilestones);
  
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('isAuth') === 'true');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);

  const login = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('isAuth', 'true');
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const signUp = (userData) => {
    const newUser = { ...userData, isNewUser: true, onboardingStep: 1 };
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem('isAuth', 'true');
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const updateUser = (updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isAuth');
    localStorage.removeItem('user');
  };

  const exchangeCurrency = (from, to, amount, rate) => {
    setWallets(prev => prev.map(w => {
      if (w.currency === from) return { ...w, balance: w.balance - amount };
      if (w.currency === to) return { ...w, balance: w.balance + (amount * rate) };
      return w;
    }));
  };

  const addTransaction = (tx) => {
    setTransactions(prev => [tx, ...prev]);
  };

  const updateMilestone = (id, updates) => {
    setMilestones(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  return (
    <MockStoreContext.Provider value={{
      theme, toggleTheme, wallets, transactions, milestones, 
      exchangeCurrency, addTransaction, updateMilestone,
      isAuthenticated, user, login, logout, signUp, updateUser
    }}>
      {children}
    </MockStoreContext.Provider>
  );
}

export const useMockStore = () => useContext(MockStoreContext);
