import React, { useState, useEffect } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { InvoiceModal } from '../components/ui/InvoiceModal';
import { useMockStore } from '../store/MockStore';
import { ArrowRightLeft, TrendingUp, ArrowUpRight, ArrowDownRight, FileText, Receipt } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { getCurrencyFlag } from '../lib/currencyUtils';

export default function Dashboard() {
  const { wallets, transactions, exchangeCurrency, user, updateUser } = useMockStore();
  
  const [exchangeFrom, setExchangeFrom] = useState(wallets[0]?.currency || 'SGD');
  const [exchangeTo, setExchangeTo] = useState(wallets.length > 1 ? wallets[1].currency : wallets[0]?.currency || 'SGD');
  const [exchangeAmount, setExchangeAmount] = useState('');
  
  const [selectedTx, setSelectedTx] = useState(null); // Used to display invoice modal
  const [accounts, setAccounts] = useState([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

  // Fetch true accounts from API
  useEffect(() => {
    const fetchAccounts = async () => {
      if (!user?.uen && !user?.customerId) {
        setIsLoadingAccounts(false);
        return;
      }
      const identifier = user?.uen || user?.customerId;
      
      try {
        const url = `https://personal-urfnoedc.outsystemscloud.com/CreditTransfer/rest/CreditTransfer/GetAccountsByUENorCustId?UEN=${encodeURIComponent(identifier)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch accounts');
        const data = await res.json();
        setAccounts(data || []);
      } catch (err) {
        console.error("Dashboard account fetch error:", err);
      } finally {
        setIsLoadingAccounts(false);
      }
    };
    fetchAccounts();
  }, [user]);

  // Fetch latest currencies from backend on dashboard load
  useEffect(() => {
    const givenName = user?.profileData?.givenName;
    if (!givenName || givenName === '-') return;

    const fetchCurrencies = async () => {
      try {
        const nameEnc = encodeURIComponent(givenName);
        const res = await fetch(`https://personal-ldjy5itc.outsystemscloud.com/Currency/rest/CustCurrency/GetCurrencyByGivenName?givenName=${nameEnc}`);
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          const currencies = Array.from(new Set(data.map(c => c.Currency)));
          // Only update if the currencies actually changed
          const current = user?.availableCurrencies || [];
          if (JSON.stringify(currencies.sort()) !== JSON.stringify([...current].sort())) {
            updateUser({ availableCurrencies: currencies });
          }
        }
      } catch (err) {
        console.warn('Failed to refresh currencies from backend:', err);
      }
    };

    fetchCurrencies();
  }, [user?.profileData?.givenName]);
  
  const mockFxRates = {
    'USD-EUR': 0.92, 'EUR-USD': 1.09, 'USD-SGD': 1.34, 'SGD-USD': 0.75,
    'USD-GBP': 0.79, 'GBP-USD': 1.27, 'EUR-SGD': 1.45, 'SGD-EUR': 0.69,
    'GBP-EUR': 1.17, 'EUR-GBP': 0.85, 'GBP-SGD': 1.70, 'SGD-GBP': 0.59,
    'MYR-SGD': 0.29, 'SGD-MYR': 3.41, 'IDR-SGD': 0.000085, 'SGD-IDR': 11765,
    'THB-SGD': 0.038, 'SGD-THB': 26.3, 'VND-SGD': 0.000054, 'SGD-VND': 18500,
    'PHP-SGD': 0.024, 'SGD-PHP': 41.7, 'CHF-SGD': 1.50, 'SGD-CHF': 0.67,
    'CAD-SGD': 0.99, 'SGD-CAD': 1.01, 'USD-MYR': 4.56, 'MYR-USD': 0.22
  };
  
  const currentRate = mockFxRates[`${exchangeFrom}-${exchangeTo}`] || 1;
  const convertedAmount = exchangeAmount ? (parseFloat(exchangeAmount) * currentRate).toFixed(2) : '0.00';

  const handleExchange = () => {
    if (exchangeAmount && !isNaN(exchangeAmount)) {
      exchangeCurrency(exchangeFrom, exchangeTo, parseFloat(exchangeAmount), currentRate);
      setExchangeAmount('');
    }
  };

  const displayName = user?.profileData?.givenName || user?.name || 'User';

  const totalBalanceUSD = accounts.reduce((total, acc) => {
    const rateToUSD = mockFxRates[`${acc.Currency}-USD`] || (acc.Currency === 'USD' ? 1 : 0.75);
    return total + ((acc.Currency === 'USD' ? acc.balance : acc.balance * rateToUSD) || 0);
  }, 0);

  return (
    <PageTransition>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
            <p className="text-textSecondary mt-1">Welcome back, your multi-currency portfolio is performing well.</p>
          </div>
          <Button variant="secondary" className="hidden sm:inline-flex shrink-0">
            <FileText className="w-4 h-4 mr-2" />
            Download Statement
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GlassCard className="lg:col-span-2 flex flex-col justify-between" hoverEffect>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-textSecondary font-medium">Total Balance (USD Eq.)</p>
                <div className="text-5xl font-bold mt-2 tracking-tight text-textPrimary drop-shadow-[0_0_15px_rgba(0,184,217,0.1)] transition-colors">
                  ${totalBalanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="flex items-center gap-1 text-primary bg-primary/10 px-3 py-1 rounded-full text-sm font-medium border border-primary/20">
                <TrendingUp className="w-4 h-4" />
                +2.4%
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
              {isLoadingAccounts ? (
                <div className="col-span-full py-4 text-center text-textSecondary text-sm">Loading accounts...</div>
              ) : accounts.length === 0 ? (
                <div className="col-span-full py-4 text-center text-textSecondary text-sm">No accounts found.</div>
              ) : accounts.map((acc, idx) => (
                 <motion.div 
                   key={acc.accountId}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.2 + (idx * 0.1) }}
                   className="bg-surface-hover/20 rounded-xl p-4 border border-border hover:bg-surface-hover/40 transition-all duration-300 relative overflow-hidden"
                 >
                   <div className="flex items-center justify-between mb-1 relative z-10">
                     <div className="text-textSecondary text-sm font-semibold">{acc.BusinessName || 'Account'}</div>
                     <span className="text-xl drop-shadow-md">{getCurrencyFlag(acc.Currency)}</span>
                   </div>
                   <div className="text-2xl font-bold tracking-tight text-textPrimary relative z-10 mt-1">
                     {acc.Currency} {acc.balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                   </div>
                   <div className="text-xs text-textSecondary mt-3 font-mono opacity-70 relative z-10">
                     ID: {acc.accountId}
                   </div>
                   
                   {/* Decorative background pulse */}
                   <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
                 </motion.div>
              ))}
            </div>
          </GlassCard>

          <GlassCard hoverEffect delay={0.2} className="flex flex-col">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <ArrowRightLeft className="w-5 h-5 text-primary" />
              Quick Exchange
            </h3>
            
            <div className="flex-1 space-y-4">
              <div className="bg-surface-hover/20 rounded-xl p-3 border border-border">
                <div className="flex justify-between text-sm text-textSecondary mb-2">
                  <span>From</span>
                  <span>Balance: {wallets.find(w=>w.currency===exchangeFrom)?.balance.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getCurrencyFlag(exchangeFrom)}</span>
                    <select 
                      value={exchangeFrom}
                      onChange={(e) => setExchangeFrom(e.target.value)}
                      className="bg-transparent text-xl font-bold focus:outline-none w-20 appearance-none cursor-pointer"
                    >
                      {wallets.map(w => <option key={w.currency} value={w.currency} className="bg-background text-sm text-textPrimary">{w.currency}</option>)}
                    </select>
                  </div>
                  <input 
                    type="number"
                    value={exchangeAmount}
                    onChange={(e) => setExchangeAmount(e.target.value)}
                    placeholder="0.00"
                    className="bg-transparent text-right text-3xl font-semibold w-full focus:outline-none placeholder-textSecondary/30 text-textPrimary"
                  />
                </div>
              </div>

              <div className="flex justify-center -my-2 relative z-10">
                <button 
                  onClick={() => { setExchangeFrom(exchangeTo); setExchangeTo(exchangeFrom); }}
                  className="bg-surface border border-border p-2 rounded-full hover:bg-surface-hover hover:rotate-180 hover:scale-110 shadow-glass transition-all duration-300 group"
                >
                  <ArrowRightLeft className="w-4 h-4 text-textSecondary group-hover:text-primary transition-colors" />
                </button>
              </div>

              <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                <div className="flex justify-between text-sm text-textSecondary mb-2">
                  <span>To (Rate: {currentRate})</span>
                </div>
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getCurrencyFlag(exchangeTo)}</span>
                    <select 
                      value={exchangeTo}
                      onChange={(e) => setExchangeTo(e.target.value)}
                      className="bg-transparent text-xl font-bold focus:outline-none w-20 appearance-none cursor-pointer"
                    >
                      {wallets.filter(w=>w.currency!==exchangeFrom).map(w => <option key={w.currency} value={w.currency} className="bg-background text-sm text-textPrimary">{w.currency}</option>)}
                    </select>
                  </div>
                  <div className="text-right text-3xl font-semibold w-full text-primary flex justify-end">
                    <AnimatePresence mode="popLayout">
                      {convertedAmount.split('').map((char, index) => (
                        <motion.span
                          key={`${char}-${index}-${convertedAmount}`}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -20, opacity: 0, position: 'absolute' }}
                          transition={{ type: "spring", stiffness: 300, damping: 25, delay: index * 0.03 }}
                          className="inline-block"
                        >
                          {char}
                        </motion.span>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>

            <Button className="w-full mt-6" onClick={handleExchange} disabled={!exchangeAmount || exchangeAmount <= 0} pulse={exchangeAmount > 0}>
              Convert Now
            </Button>
          </GlassCard>
        </div>

        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {transactions.slice(0, 5).map((tx, idx) => (
              <GlassCard key={tx.id} className="!p-0 overflow-hidden" delay={0.3 + (idx * 0.1)}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 hover:bg-white/[0.04] transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4 w-full sm:w-auto mb-3 sm:mb-0">
                    <div className={cn(
                      "p-3 rounded-xl transition-all duration-300", 
                      tx.amount > 0 ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 group-hover:bg-emerald-500/20' : 'bg-surface-hover/20 text-textSecondary group-hover:bg-surface-hover/40 group-hover:text-textPrimary'
                    )}>
                      {tx.amount > 0 ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-medium group-hover:text-primary transition-colors">{tx.description}</div>
                      <div className="text-sm text-textSecondary">{tx.date} • {tx.status}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6 ml-14 sm:ml-0">
                    <div className={cn("text-lg font-semibold", tx.amount > 0 ? 'text-emerald-400' : '')}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} {tx.currency}
                    </div>
                    
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={(e) => { e.stopPropagation(); setSelectedTx(tx); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-surface border-border hover:border-primary/50 text-textPrimary"
                    >
                      <Receipt className="w-4 h-4 mr-2" />
                      View Invoice
                    </Button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
      
      {/* Invoice Modal Integration */}
      <InvoiceModal 
        isOpen={!!selectedTx} 
        onClose={() => setSelectedTx(null)} 
        transaction={selectedTx} 
      />
    </PageTransition>
  );
}
