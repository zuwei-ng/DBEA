import React, { useState, useEffect } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { InvoiceModal } from '../components/ui/InvoiceModal';
import { useMockStore } from '../store/MockStore';
import { ArrowRightLeft, ArrowUpRight, ArrowDownRight, Receipt, Loader2, Landmark, Plus, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { getCurrencyFlag, getCurrencySymbol } from '../lib/currencyUtils';
import { transferService } from '../services/transferService';

export default function Dashboard() {
  const { wallets, user, updateUser, addTransaction } = useMockStore();
  
  const [reportingCurrency, setReportingCurrency] = useState('SGD');
  const [exchangeFrom, setExchangeFrom] = useState(wallets[0]?.currency || 'SGD');
  const [exchangeTo, setExchangeTo] = useState(wallets.length > 1 ? wallets[1].currency : wallets[0]?.currency || 'SGD');
  const [exchangeAmountInput, setExchangeAmountInput] = useState('');
  const [exchangeError, setExchangeError] = useState('');
  const [exchangeSuccess, setExchangeSuccess] = useState('');
  const [isExchangeSubmitting, setIsExchangeSubmitting] = useState(false);
  const [manualWallets, setManualWallets] = useState([]);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [selectedWalletCurrency, setSelectedWalletCurrency] = useState('');
  
  const [selectedTx, setSelectedTx] = useState(null); // Used to display invoice modal
  const [accounts, setAccounts] = useState([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

  const userWalletStorageKey = `dashboard_manual_wallets_${user?.customerId || user?.uen || 'default'}`;
  const senderCustomerId = user?.customerId || '0000002892';
  const backendRecipientUEN = user?.uen || user?.customerId || '';

  const fetchAccountsData = async () => {
    if (!user?.uen && !user?.customerId) {
      setIsLoadingAccounts(false);
      return;
    }

    const identifier = user?.uen || user?.customerId;

    try {
      const res = await fetch(`https://personal-urfnoedc.outsystemscloud.com/CreditTransfer/rest/CreditTransfer/GetAccountsByUENorCustId?UEN=${encodeURIComponent(identifier)}`);
      if (!res.ok) throw new Error('Failed to fetch accounts');
      const data = await res.json();
      setAccounts(data || []);
    } catch (err) {
      console.error("Dashboard account fetch error:", err);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  // Fetch true accounts from API
  useEffect(() => {
    fetchAccountsData();
  }, [user]);

  useEffect(() => {
    try {
      const storedWallets = localStorage.getItem(userWalletStorageKey);
      setManualWallets(storedWallets ? JSON.parse(storedWallets) : []);
    } catch (error) {
      console.warn('Failed to restore manual wallets:', error);
      setManualWallets([]);
    }
  }, [userWalletStorageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(userWalletStorageKey, JSON.stringify(manualWallets));
    } catch (error) {
      console.warn('Failed to persist manual wallets:', error);
    }
  }, [manualWallets, userWalletStorageKey]);

  const [dashboardTransactions, setDashboardTransactions] = useState([]);
  const [isLoadingTx, setIsLoadingTx] = useState(false);

  useEffect(() => {
    const fetchAllTransactions = async () => {
      if (!accounts || accounts.length === 0) return;
      setIsLoadingTx(true);
      
      try {
        const username = "12173e30ec556fe4a951";
        const password = "2fbbd75fd60a8389b82719d2dbc37f1eb9ed226f3eb43cfa7d9240c72fd5+bfc89ad4-c17f-4fe9-82c2-918d29d59fe0";
        const authHeader = 'Basic ' + window.btoa(username + ':' + password);
        
        const d = new Date();
        const apiEndDate = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        d.setMonth(d.getMonth() - 1);
        const apiStartDate = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

        const promises = accounts.map(async (acc) => {
          const url = `https://smuedu-dev.outsystemsenterprise.com/gateway/rest/account/${encodeURIComponent(acc.accountId)}/transactions?PageNo=1&PageSize=3&StartDate=${apiStartDate}&EndDate=${apiEndDate}`;
          const res = await fetch(url, {
            headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
          });
          if (!res.ok) return [];
          const data = await res.json();
          const txs = data.Data || data || [];
          
          return txs.map(tx => {
            const isPositive = tx.accountTo === acc.accountId && tx.accountFrom !== acc.accountId;
            const amt = parseFloat(tx.transactionAmount || tx.amount || tx.Amount || 0);
            return {
              ...tx,
              id: tx.transactionId || tx.Id || tx.reference || Math.random().toString(),
              date: new Date(tx.transactionDate || tx.date || tx.Date || new Date()).toLocaleDateString(),
              description: tx.narrative || tx.description || tx.Narration || 'Transfer',
              amount: isPositive ? amt : -amt,
              currency: tx.currency || acc.Currency || 'SGD',
              status: tx.status || 'Completed',
              rawDate: new Date(tx.transactionDate || tx.date || tx.Date || new Date())
            };
          });
        });

        const results = await Promise.all(promises);
        const aggregated = results.flat();
        aggregated.sort((a, b) => b.rawDate - a.rawDate);
        
        setDashboardTransactions(aggregated.slice(0, 3));
      } catch (err) {
        console.error("Failed to fetch recent transactions:", err);
      } finally {
        setIsLoadingTx(false);
      }
    };
    fetchAllTransactions();
  }, [accounts]);

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

  const accountCurrencyBalances = accounts.reduce((map, account) => {
    const currency = account.Currency;
    const numericBalance = Number(account.balance) || 0;

    if (!currency) {
      return map;
    }

    map[currency] = (map[currency] || 0) + numericBalance;
    return map;
  }, {});

  const displayedAccounts = [...accounts, ...manualWallets];
  const exchangeAccounts = accounts.filter((account) => Boolean(account?.accountId && account?.Currency));

  const liveAccountCurrencies = Array.from(
    new Set(displayedAccounts.map((account) => account.Currency).filter(Boolean))
  );

  const reportingCurrencies = Array.from(
    new Set(
      (
        liveAccountCurrencies.length > 0
          ? liveAccountCurrencies
          : wallets.map((wallet) => wallet.currency)
      ).filter(Boolean)
    )
  );

  const addableWalletCurrencies = (Array.isArray(user?.availableCurrencies) ? user.availableCurrencies : [])
    .filter((currency) => !liveAccountCurrencies.includes(currency));

  const quickExchangeCurrencies = (
    exchangeAccounts.length > 0
      ? exchangeAccounts.map((account) => account.Currency)
      : wallets.map((wallet) => wallet.currency)
  ).filter((currency) => {
    const otherCurrencies = (
      exchangeAccounts.length > 0
        ? exchangeAccounts.map((account) => account.Currency)
        : wallets.map((wallet) => wallet.currency)
    ).filter((otherCurrency) => otherCurrency !== currency);

    return otherCurrencies.some(
      (otherCurrency) => mockFxRates[`${currency}-${otherCurrency}`] || mockFxRates[`${otherCurrency}-${currency}`]
    );
  });

  const exchangeWallets = quickExchangeCurrencies.map((currency) => {
    const walletMatch = wallets.find((wallet) => wallet.currency === currency);
    const accountMatch = exchangeAccounts.find((account) => account.Currency === currency);
    return {
      currency,
      accountId: accountMatch?.accountId,
      balance: accountCurrencyBalances[currency] ?? walletMatch?.balance ?? 0,
      symbol: walletMatch?.symbol ?? currency,
    };
  });

  const getFxRate = (fromCurrency, toCurrency) => {
    const directRate = mockFxRates[`${fromCurrency}-${toCurrency}`];
    if (directRate) {
      return directRate;
    }

    const reverseRate = mockFxRates[`${toCurrency}-${fromCurrency}`];
    return reverseRate ? 1 / reverseRate : 1;
  };

  const convertAmount = (amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const directRate = mockFxRates[`${fromCurrency}-${toCurrency}`];
    if (directRate) {
      return amount * directRate;
    }

    const reverseRate = mockFxRates[`${toCurrency}-${fromCurrency}`];
    if (reverseRate) {
      return amount / reverseRate;
    }

    if (fromCurrency !== 'SGD' && toCurrency !== 'SGD') {
      const toSGD = convertAmount(amount, fromCurrency, 'SGD');
      if (toSGD !== null) {
        return convertAmount(toSGD, 'SGD', toCurrency);
      }
    }

    return null;
  };

  const hasFxPair = (fromCurrency, toCurrency) =>
    Boolean(mockFxRates[`${fromCurrency}-${toCurrency}`] || mockFxRates[`${toCurrency}-${fromCurrency}`]);

  const exchangeAmountValue = Number.parseFloat(exchangeAmountInput);
  const currentRate = getFxRate(exchangeFrom, exchangeTo);
  const convertedAmount = Number.isFinite(exchangeAmountValue) ? (exchangeAmountValue * currentRate).toFixed(2) : '0.00';

  useEffect(() => {
    if (reportingCurrencies.length === 0) {
      return;
    }

    if (!reportingCurrencies.includes(reportingCurrency)) {
      setReportingCurrency(reportingCurrencies.includes('SGD') ? 'SGD' : reportingCurrencies[0]);
    }
  }, [reportingCurrencies, reportingCurrency]);

  useEffect(() => {
    if (exchangeWallets.length === 0) {
      return;
    }

    if (!exchangeWallets.some((wallet) => wallet.currency === exchangeFrom)) {
      setExchangeFrom(exchangeWallets[0].currency);
    }
  }, [exchangeWallets, exchangeFrom]);

  useEffect(() => {
    const availableTargets = exchangeWallets
      .map((wallet) => wallet.currency)
      .filter((currency) => currency !== exchangeFrom && hasFxPair(exchangeFrom, currency));

    if (availableTargets.length === 0) {
      return;
    }

    if (!availableTargets.includes(exchangeTo)) {
      setExchangeTo(availableTargets[0]);
    }
  }, [exchangeWallets, exchangeFrom, exchangeTo]);

  const totalBalance = displayedAccounts.reduce((total, acc) => {
    const numericBalance = Number(acc.balance) || 0;
    if (acc.Currency === reportingCurrency) {
      return total + numericBalance;
    }

    const converted = convertAmount(numericBalance, acc.Currency, reportingCurrency);
    return total + (converted ?? 0);
  }, 0);

  const supportedTargets = exchangeWallets.filter(
    (wallet) => wallet.currency !== exchangeFrom && hasFxPair(exchangeFrom, wallet.currency)
  );

  useEffect(() => {
    if (!selectedWalletCurrency && addableWalletCurrencies.length > 0) {
      setSelectedWalletCurrency(addableWalletCurrencies[0]);
    }

    if (selectedWalletCurrency && !addableWalletCurrencies.includes(selectedWalletCurrency)) {
      setSelectedWalletCurrency(addableWalletCurrencies[0] || '');
    }
  }, [addableWalletCurrencies, selectedWalletCurrency]);

  const handleAddWallet = () => {
    if (!selectedWalletCurrency) {
      return;
    }

    const walletRecord = {
      accountId: `LOCAL-${selectedWalletCurrency}`,
      BusinessName: `${selectedWalletCurrency} Wallet`,
      Currency: selectedWalletCurrency,
      balance: 0,
      isLocalWallet: true,
    };

    setManualWallets((prev) => [...prev, walletRecord]);
    setIsWalletModalOpen(false);
  };

  const handleExchangeAmountChange = (value) => {
    if (value === '') {
      setExchangeAmountInput('');
      return;
    }

    if (!/^\d*\.?\d*$/.test(value)) {
      return;
    }

    setExchangeAmountInput(value);
  };

  const handleExchangeAmountBlur = () => {
    if (exchangeAmountInput === '') {
      return;
    }

    const numericValue = Number.parseFloat(exchangeAmountInput);
    if (!Number.isFinite(numericValue)) {
      setExchangeAmountInput('');
      return;
    }

    setExchangeAmountInput(numericValue.toFixed(2));
  };

  const handleExecuteExchange = async () => {
    setExchangeError('');
    setExchangeSuccess('');

    const fromAccount = exchangeAccounts.find((account) => account.Currency === exchangeFrom);
    const toAccount = exchangeAccounts.find((account) => account.Currency === exchangeTo);
    const amount = Number.parseFloat(exchangeAmountInput);

    if (!fromAccount || !toAccount) {
      setExchangeError('Exchange is available only for wallets linked to active backend accounts.');
      return;
    }

    if (!backendRecipientUEN) {
      setExchangeError('Missing account identity required for exchange.');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setExchangeError('Enter a valid amount to exchange.');
      return;
    }

    setIsExchangeSubmitting(true);
    try {
      const payload = {
        accountFrom: fromAccount.accountId,
        accountTo: toAccount.accountId,
        transactionAmount: amount,
        transactionReferenceNumber: `FX-${Date.now().toString().slice(-8)}`,
        narrative: `Wallet exchange ${exchangeFrom} to ${exchangeTo}`,
      };

      const response = await transferService.calculateChargeFee(
        { CustomerId: senderCustomerId, RecipientUEN: backendRecipientUEN },
        payload
      );

      addTransaction({
        id: response?.ReferenceNumber || payload.transactionReferenceNumber,
        date: new Date().toLocaleDateString(),
        description: `Wallet exchange ${exchangeFrom} to ${exchangeTo}`,
        amount: -amount,
        currency: exchangeFrom,
        status: 'Completed',
      });

      await fetchAccountsData();
      setExchangeAmountInput('');
      setExchangeSuccess(`Exchanged ${exchangeFrom} ${amount.toFixed(2)} to ${exchangeTo}.`);
    } catch (error) {
      console.error('Wallet exchange failed:', error);
      setExchangeError(error?.message || 'Failed to process wallet exchange.');
    } finally {
      setIsExchangeSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Portfolio Overview</h1>
            <p className="text-textSecondary mt-1">Consolidated balances and treasury activity across your approved currency accounts.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GlassCard className="lg:col-span-2 flex flex-col justify-between" hoverEffect>
            <div className="flex justify-between items-start">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-hover/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-textSecondary">
                  <Landmark className="w-3.5 h-3.5" />
                  <span>Reporting Currency</span>
                  <select
                    value={reportingCurrency}
                    onChange={(e) => setReportingCurrency(e.target.value)}
                    className="bg-transparent text-textPrimary font-semibold uppercase tracking-[0.18em] focus:outline-none cursor-pointer"
                  >
                    {reportingCurrencies.map((currency) => (
                      <option key={currency} value={currency} className="bg-background text-sm text-textPrimary">
                        {currency}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-textSecondary font-medium mt-4">Total Balance</p>
                <div className="flex items-baseline gap-4 mt-2 text-textPrimary transition-colors">
                  <span className="text-4xl font-bold tracking-tight">{reportingCurrency}</span>
                  <span className="text-5xl font-bold tracking-tight">
                    {totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-4xl leading-none">{getCurrencyFlag(reportingCurrency)}</span>
                </div>
              </div>
              <Button
                variant="secondary"
                className="shrink-0"
                onClick={() => setIsWalletModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Wallet
              </Button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
              {isLoadingAccounts ? (
                <div className="col-span-full py-4 text-center text-textSecondary text-sm">Loading accounts...</div>
              ) : displayedAccounts.length === 0 ? (
                <div className="col-span-full py-4 text-center text-textSecondary text-sm">No accounts found.</div>
              ) : displayedAccounts.map((acc, idx) => (
                 <motion.div 
                   key={acc.accountId}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.2 + (idx * 0.1) }}
                   className="bg-surface-hover/20 rounded-xl p-4 border border-border hover:bg-surface-hover/30 transition-all duration-300 relative overflow-hidden"
                 >
                   <div className="flex items-center justify-between mb-3 relative z-10">
                     <div className="text-textSecondary text-xs font-semibold uppercase tracking-[0.16em]">{acc.BusinessName || 'Account'}</div>
                     <span className="text-xl drop-shadow-md">{getCurrencyFlag(acc.Currency)}</span>
                   </div>
                   <div className="text-sm text-textSecondary relative z-10">Available Balance</div>
                   <div className="text-2xl font-bold tracking-tight text-textPrimary relative z-10 mt-1">
                     {acc.Currency} {(Number(acc.balance) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                   </div>
                   <div className="text-xs text-textSecondary mt-4 font-mono opacity-70 relative z-10">
                     {acc.isLocalWallet ? 'Wallet ID' : 'Account ID'}: {acc.accountId}
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
                  <span>Balance: {(exchangeWallets.find(w=>w.currency===exchangeFrom)?.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getCurrencyFlag(exchangeFrom)}</span>
                    <select 
                      value={exchangeFrom}
                      onChange={(e) => setExchangeFrom(e.target.value)}
                      className="bg-transparent text-xl font-bold focus:outline-none w-20 appearance-none cursor-pointer"
                    >
                      {exchangeWallets.map(w => <option key={w.currency} value={w.currency} className="bg-background text-sm text-textPrimary">{w.currency}</option>)}
                    </select>
                  </div>
                  <input 
                    type="text"
                    inputMode="decimal"
                    value={exchangeAmountInput}
                    onChange={(e) => handleExchangeAmountChange(e.target.value)}
                    onBlur={handleExchangeAmountBlur}
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

              <div className="bg-surface-hover/20 rounded-xl p-3 border border-border">
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
                      {supportedTargets.map(w => <option key={w.currency} value={w.currency} className="bg-background text-sm text-textPrimary">{w.currency}</option>)}
                    </select>
                  </div>
                  <div className="text-right text-3xl font-semibold w-full text-primary flex justify-end">
                    <motion.span
                      key={convertedAmount}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                    >
                      {convertedAmount}
                    </motion.span>
                  </div>
                </div>
              </div>

              {(exchangeError || exchangeSuccess) && (
                <div className={cn(
                  "rounded-xl border px-3 py-2 text-sm",
                  exchangeError ? "border-red-500/20 bg-red-500/10 text-red-500" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                )}>
                  {exchangeError || exchangeSuccess}
                </div>
              )}
            </div>

            <Button
              className="w-full mt-4"
              onClick={handleExecuteExchange}
              disabled={isExchangeSubmitting || !Number.isFinite(exchangeAmountValue) || exchangeAmountValue <= 0 || !exchangeFrom || !exchangeTo}
            >
              {isExchangeSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing Conversion
                </>
              ) : (
                'Convert Currency'
              )}
            </Button>
          </GlassCard>
        </div>

        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            Recent Transactions
            {isLoadingTx && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
          </h3>
          <div className="space-y-3">
            {dashboardTransactions.length === 0 && !isLoadingTx && (
              <div className="text-sm text-textSecondary px-2">No recent transactions found.</div>
            )}
            {dashboardTransactions.map((tx, idx) => (
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
                      {tx.currency} {tx.amount > 0 ? '+' : '-'}{Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {getCurrencyFlag(tx.currency)}
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

      <AnimatePresence>
        {isWalletModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/55 p-4 flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-3xl border border-border bg-background shadow-2xl p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-textPrimary">Add Wallet</h3>
                  <p className="text-sm text-textSecondary mt-1">Create a wallet from your approved currencies list.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsWalletModalOpen(false)}
                  className="rounded-full p-2 text-textSecondary hover:text-textPrimary hover:bg-surface-hover/30 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-6 space-y-3">
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-textSecondary">Approved Currency</label>
                {addableWalletCurrencies.length > 0 ? (
                  <div className="rounded-2xl border border-border bg-surface-hover/20 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{selectedWalletCurrency ? getCurrencyFlag(selectedWalletCurrency) : '🏳️'}</span>
                      <select
                        value={selectedWalletCurrency}
                        onChange={(e) => setSelectedWalletCurrency(e.target.value)}
                        className="w-full bg-transparent text-lg font-semibold text-textPrimary focus:outline-none cursor-pointer"
                      >
                        {addableWalletCurrencies.map((currency) => (
                          <option key={currency} value={currency} className="bg-background text-textPrimary">
                            {currency} {getCurrencySymbol(currency) ? `(${getCurrencySymbol(currency)})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border bg-surface-hover/20 px-4 py-4 text-sm text-textSecondary">
                    All approved currencies already have wallets on your dashboard.
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setIsWalletModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddWallet} disabled={!selectedWalletCurrency || addableWalletCurrencies.length === 0}>
                  Add Wallet
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
