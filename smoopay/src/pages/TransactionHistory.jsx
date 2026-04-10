import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMockStore } from '../store/MockStore';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Activity, Clock, Search, ArrowRightLeft, Building, Wallet, AlertCircle, FileText } from 'lucide-react';
import { cn } from '../lib/utils';

export default function TransactionHistory() {
  const { user } = useMockStore();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [transactions, setTransactions] = useState([]);
  
  // Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1); // 1 month ago default
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  // Pagination
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Fetch Accounts on Mount
  useEffect(() => {
    const fetchAccounts = async () => {
      if (!user?.uen && !user?.customerId) {
        setErrorMsg('User identity not found in session.');
        setIsLoadingAccounts(false);
        return;
      }
      
      const identifier = user?.uen || user?.customerId;
      
      setIsLoadingAccounts(true);
      setErrorMsg('');
      try {
        const url = `https://personal-urfnoedc.outsystemscloud.com/CreditTransfer/rest/CreditTransfer/GetAccountsByUENorCustId?UEN=${encodeURIComponent(identifier)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch accounts');
        const data = await res.json();
        
        setAccounts(data || []);
        if (data && data.length > 0) {
          setSelectedAccountId(data[0].accountId);
        }
      } catch (err) {
        console.error("Account fetch error:", err);
        setErrorMsg('Could not retrieve accounts for this user.');
      } finally {
        setIsLoadingAccounts(false);
      }
    };
    
    fetchAccounts();
  }, [user]);

  // 2. Fetch Transactions when Account or filters change
  const fetchTransactions = async () => {
    if (!selectedAccountId) return;
    
    setIsLoadingTransactions(true);
    try {
      const formatDateForApi = (dateStr) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${year}-${parseInt(month, 10)}-${parseInt(day, 10)}`;
      };
      
      const apiStartDate = formatDateForApi(startDate);
      const apiEndDate = formatDateForApi(endDate);

      const url = `https://smuedu-dev.outsystemsenterprise.com/gateway/rest/account/${encodeURIComponent(selectedAccountId)}/transactions?PageNo=${pageNo}&PageSize=${pageSize}&StartDate=${encodeURIComponent(apiStartDate)}&EndDate=${encodeURIComponent(apiEndDate)}`;
      
      const username = "12173e30ec556fe4a951";
      const password = "2fbbd75fd60a8389b82719d2dbc37f1eb9ed226f3eb43cfa7d9240c72fd5+bfc89ad4-c17f-4fe9-82c2-918d29d59fe0";
      const authHeader = 'Basic ' + window.btoa(username + ':' + password);
      
      const res = await fetch(url, {
        headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) throw new Error('Failed to fetch transactions');
      const data = await res.json();
      
      // The API could return { Data: [...] } or just an array. We handle both:
      if (data && data.Data) {
         setTransactions(data.Data || []);
      } else if (Array.isArray(data)) {
         setTransactions(data);
      } else {
         setTransactions([]);
      }
      
    } catch (err) {
      console.error("Transaction fetch error:", err);
      // Optional: Add a localized error message, right now silently empty or log
      setTransactions([]);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  useEffect(() => {
    if (selectedAccountId) {
      fetchTransactions();
    }
  }, [selectedAccountId, startDate, endDate, pageNo, pageSize]);

  const handleAccountChange = (e) => {
    setSelectedAccountId(e.target.value);
    setPageNo(1); // Reset page on account change
  };

  const selectedAccountInfo = accounts.find(a => a.accountId === selectedAccountId);

  return (
    <div className="space-y-6 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-textPrimary flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            Transaction History
          </h1>
          <p className="text-textSecondary mt-1">
            Track and monitor your account activities over time.
          </p>
        </div>
      </motion.div>

      {/* Main Content Area */}
      {isLoadingAccounts ? (
        <div className="flex justify-center items-center py-20">
          <Activity className="w-10 h-10 text-primary animate-spin" />
        </div>
      ) : errorMsg ? (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      ) : accounts.length === 0 ? (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center gap-3 text-yellow-500">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <p>No accounts found for your profile. Please contact support.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Filtering Sidebar */}
          <GlassCard className="p-6 h-fit space-y-6">
            <h3 className="font-semibold text-textPrimary flex items-center gap-2 border-b border-border pb-3">
              <Search className="w-5 h-5 text-primary" /> Configuration
            </h3>
            
            <div className="space-y-4">
              {/* Account Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider">
                  Select Account
                </label>
                <div className="relative">
                  <select 
                    value={selectedAccountId}
                    onChange={handleAccountChange}
                    className="w-full bg-surface-hover/20 border border-border rounded-xl pl-3 pr-8 py-3 text-sm focus:border-primary outline-none transition-all text-textPrimary appearance-none"
                  >
                    {accounts.map(acc => (
                      <option key={acc.accountId} value={acc.accountId} className="bg-surface text-textPrimary">
                        {acc.BusinessName} ({acc.Currency}) - {acc.accountId.slice(-4)}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-textSecondary">
                    <Wallet className="w-4 h-4"/>
                  </div>
                </div>
                {selectedAccountInfo && (
                  <p className="text-xs text-textSecondary mt-1">
                    Balance: <span className="font-bold text-textPrimary">{selectedAccountInfo.Currency} {selectedAccountInfo.balance?.toLocaleString()}</span>
                  </p>
                )}
              </div>

              {/* Date Filters */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider">Start Date</label>
                <input 
                  type="date"
                  value={startDate}
                  onChange={e => { setStartDate(e.target.value); setPageNo(1); }}
                  className="w-full bg-surface-hover/20 border border-border rounded-xl px-3 py-3 text-sm focus:border-primary outline-none transition-all text-textPrimary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider">End Date</label>
                <input 
                  type="date"
                  value={endDate}
                  onChange={e => { setEndDate(e.target.value); setPageNo(1); }}
                  className="w-full bg-surface-hover/20 border border-border rounded-xl px-3 py-3 text-sm focus:border-primary outline-none transition-all text-textPrimary"
                />
              </div>

            </div>
          </GlassCard>

          {/* Transactions List */}
          <div className="lg:col-span-3 space-y-4">
            <GlassCard className="p-0 overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-textPrimary flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-primary" /> Past Transactions
                </h3>
                {isLoadingTransactions && <Activity className="w-5 h-5 text-primary animate-spin" />}
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-surface-hover/20 border-b border-border text-xs font-semibold text-textSecondary uppercase tracking-wider">
                      <th className="p-4">Date</th>
                      <th className="p-4">Description</th>
                      <th className="p-4">Reference</th>
                      <th className="p-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {transactions.length === 0 && !isLoadingTransactions && (
                        <tr>
                          <td colSpan="4" className="p-8 text-center text-textSecondary">
                            <Clock className="w-8 h-8 mx-auto mb-3 opacity-50" />
                            <p>No transactions found for the selected period.</p>
                          </td>
                        </tr>
                      )}
                      {transactions.map((tx, idx) => {
                        const isPositive = tx.accountTo === selectedAccountId && tx.accountFrom !== selectedAccountId;
                        const displayAmount = tx.transactionAmount || tx.amount || tx.Amount || 0;
                        const displayDate = tx.transactionDate || tx.date || tx.Date || tx.ValueDate;
                        const displayDesc = tx.narrative || tx.description || tx.Narration || 'Transfer';
                        const displayRef = tx.transactionId || tx.reference || tx.Id || '-';

                        return (
                          <motion.tr 
                            key={displayRef + idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="border-b border-border/50 hover:bg-surface-hover/30 transition-colors"
                          >
                            <td className="p-4 text-sm text-textSecondary">
                              {new Date(displayDate).toLocaleDateString()}
                            </td>
                            <td className="p-4">
                              <p className="text-sm font-medium text-textPrimary">{displayDesc}</p>
                            </td>
                            <td className="p-4 text-sm text-textSecondary">
                              {displayRef}
                            </td>
                            <td className={cn(
                              "p-4 text-right font-bold",
                              isPositive ? "text-emerald-500" : "text-textPrimary"
                            )}>
                              {isPositive ? '+' : '-'}{parseFloat(Math.abs(displayAmount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {(transactions.length > 0 || pageNo > 1) && (
                <div className="p-4 border-t border-border flex items-center justify-between text-sm">
                  <p className="text-textSecondary">
                    Showing Page <span className="font-bold text-textPrimary">{pageNo}</span>
                    <span className="mx-2 text-textSecondary/50">|</span>
                    Limit: 
                    <select 
                      value={pageSize}
                      onChange={e => { setPageSize(Number(e.target.value)); setPageNo(1); }}
                      className="ml-2 bg-transparent border-none text-primary font-semibold outline-none cursor-pointer"
                    >
                      <option value="5" className="bg-surface">5</option>
                      <option value="10" className="bg-surface">10</option>
                      <option value="20" className="bg-surface">20</option>
                      <option value="50" className="bg-surface">50</option>
                    </select>
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setPageNo(p => Math.max(1, p - 1))}
                      disabled={pageNo === 1 || isLoadingTransactions}
                    >
                      Prev
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setPageNo(p => p + 1)}
                      disabled={transactions.length < pageSize || isLoadingTransactions}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
