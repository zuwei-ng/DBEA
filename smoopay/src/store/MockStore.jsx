import React, { createContext, useContext, useState, useEffect } from 'react';

import { API_ENDPOINTS } from '../lib/api';

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


const MockStoreContext = createContext();

export function MockStoreProvider({ children }) {
  const [theme, setTheme] = useState(localStorage.getItem('theme_v3') || 'light');
  
  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme_v3', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const [wallets, setWallets] = useState(mockWallets);
  const [transactions, setTransactions] = useState(mockTransactions);
  const [escrows, setEscrows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('isAuth') === 'true');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);

  const fetchAgreements = async () => {
    try {
      console.log("MockStore: Starting fetchAgreements...");
      setIsLoading(true);
      const response = await fetch(`${API_ENDPOINTS.GET_AGREEMENTS}?CreatedBy=12345678A`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      console.log("MockStore: Data received from API:", data);
      
      const mappedEscrows = data.map(agreement => ({
        id: agreement.Id,
        title: agreement.Title,
        description: agreement.Description,
        contractor: agreement.ContractorId || 'Unknown Contractor',
        role: 'External Contractor',
        currency: agreement.Currency,
        amount: agreement.TransactionValue,
        status: agreement.Status === 'Ongoing' ? 'Active' : agreement.Status
      }));
      
      console.log("MockStore: Mapped escrows:", mappedEscrows);
      setEscrows(mappedEscrows);
    } catch (error) {
      console.error("MockStore: Failed to fetch agreements:", error);
    } finally {
      setIsLoading(false);
      console.log("MockStore: fetchAgreements complete.");
    }
  };

  useEffect(() => {
    fetchAgreements();
  }, []);

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

  const updateMilestone = (escrowId, milestoneId, updates) => {
    setEscrows(prev => prev.map(e => {
      if (e.id === escrowId) {
        return {
          ...e,
          milestones: e.milestones.map(m => m.id === milestoneId ? { ...m, ...updates } : m)
        };
      }
      return e;
    }));
  };

  return (
    <MockStoreContext.Provider value={{
      theme, toggleTheme, wallets, transactions, escrows, isLoading, fetchAgreements,
      exchangeCurrency, addTransaction, updateMilestone,
      isAuthenticated, user, login, logout, signUp, updateUser
    }}>
      {children}
    </MockStoreContext.Provider>
  );
}

export const useMockStore = () => useContext(MockStoreContext);
