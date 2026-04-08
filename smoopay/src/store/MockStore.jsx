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

const currencySymbolMap = {
  'DZD': 'د.ج', 'ARS': 'AR$', 'AWG': 'Afl', 'AUD': 'A$',
  'BSD': 'B$', 'BHD': 'BD', 'BDT': '৳', 'BBD': 'Bds$',
  'BZD': 'BZ$', 'BMD': 'BD$', 'BTN': 'Nu', 'BOB': 'Bs',
  'BWP': 'P', 'BND': 'B$', 'BIF': 'FBu', 'CVE': 'Esc',
  'KHR': '៛', 'CAD': 'C$', 'KYD': 'CI$', 'CLP': 'CL$',
  'CNY': '¥', 'COP': 'CO$', 'KMF': 'CF', 'CRC': '₡',
  'HRK': 'kn', 'CUP': '₱', 'DKK': 'kr', 'DJF': 'Fdj',
  'DOP': 'RD$', 'EGP': 'E£', 'SVC': '₡', 'SZL': 'E',
  'ETB': 'Br', 'EUR': '€', 'FKP': 'FK£', 'GMD': 'D',
  'GIP': '£', 'GBP': '£', 'GTQ': 'Q', 'GNF': 'FG',
  'GYD': 'G$', 'HTG': 'G', 'HNL': 'L', 'HKD': 'HK$',
  'HUF': 'Ft', 'ISK': 'kr', 'INR': '₹', 'IDR': 'Rp',
  'IQD': 'ع.د', 'ILS': '₪', 'JMD': 'J$', 'JPY': '¥',
  'JOD': 'JD', 'KZT': '₸', 'KES': 'KSh', 'KPW': '₩',
  'KWD': 'KD', 'LAK': '₭', 'LVL': 'Ls', 'LBP': 'L£',
  'LSL': 'M', 'LRD': 'L$', 'LYD': 'LD', 'LTL': 'Lt',
  'MOP': 'MOP$', 'MWK': 'MK', 'MYR': 'RM', 'MVR': 'Rf',
  'MRO': 'UM', 'MUR': '₨', 'MNT': '₮', 'MAD': 'MAD',
  'MMK': 'K', 'NZD': 'NZ$', 'NIO': 'C$', 'NGN': '₦',
  'NOK': 'kr', 'OMR': 'ر.ع', 'PKR': '₨', 'XPD': 'XPD',
  'PAB': 'B/', 'PGK': 'K', 'PYG': '₲', 'PEN': 'S/',
  'PHP': '₱', 'QAR': 'QR', 'RUB': '₽', 'WST': 'WS$',
  'SAR': 'SR', 'SCR': '₨', 'SLL': 'Le', 'SGD': 'S$',
  'SBD': 'SI$', 'SOS': 'Sh', 'ZAR': 'R', 'LKR': '₨',
  'SEK': 'kr', 'CHF': 'CHF', 'SYP': 'S£', 'TWD': 'NT$',
  'TZS': 'TSh', 'THB': '฿', 'TTD': 'TT$', 'TND': 'DT',
  'AED': 'د.إ', 'USD': '$', 'VUV': 'VT', 'VND': '₫',
  'ZMK': 'ZK'
};

function buildWalletsFromCurrencies(currencies) {
  return currencies.map(code => ({
    currency: code,
    balance: 0.00,
    symbol: currencySymbolMap[code] || code
  }));
}

const mockMilestones = [
  { id: 'm-1', title: 'Milestone 1: Wireframes', amount: 5000, status: 'Paid', proof: 'wireframes.pdf' },
  { id: 'm-2', title: 'Milestone 2: Frontend', amount: 15000, status: 'Approved', proof: 'frontend_build.zip' },
  { id: 'm-3', title: 'Milestone 3: Backend & Integration', amount: 15000, status: 'Pending', proof: null }
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
  const persistedUser = JSON.parse(localStorage.getItem('user')) || null;
  
  // If the persisted user has availableCurrencies (from onboarding), use those for wallets
  const initialWallets = (persistedUser?.availableCurrencies && Array.isArray(persistedUser.availableCurrencies))
    ? buildWalletsFromCurrencies(persistedUser.availableCurrencies)
    : mockWallets;

  const [wallets, setWallets] = useState(initialWallets);
  const [transactions, setTransactions] = useState(mockTransactions);
  const [escrows, setEscrows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('isAuth') === 'true');
  const [user, setUser] = useState(persistedUser);

  const fetchAgreements = async () => {
    try {
      console.log("MockStore: Starting fetchAgreements...");
      setIsLoading(true);
      const response = await fetch(`${API_ENDPOINTS.GET_AGREEMENTS}?CreatedBy=0000002892`);
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
        valuePaid: agreement.ValuePaid || 0,
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
    // If availableCurrencies was passed, rebuild the wallets dynamically
    if (updates.availableCurrencies && Array.isArray(updates.availableCurrencies)) {
      const dynamicWallets = buildWalletsFromCurrencies(updates.availableCurrencies);
      setWallets(dynamicWallets);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setWallets(mockWallets);
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
