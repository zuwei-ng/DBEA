import React, { useState, useEffect } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { useMockStore } from '../store/MockStore';
import { InvoiceModal } from '../components/ui/InvoiceModal';
import { Check, ChevronDown, ChevronRight, Building2, User, Globe, AlertCircle, Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { getCurrencyFlag } from '../lib/currencyUtils';
import { transferService } from '../services/transferService';

const steps = [
  { id: 1, name: 'Recipient' },
  { id: 2, name: 'Details' },
  { id: 3, name: 'Success' },
];

export default function Transfer() {
  const { wallets, user } = useMockStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Recipient Search
  const [recipientUEN, setRecipientUEN] = useState('');
  const [recipientAccounts, setRecipientAccounts] = useState([]);
  const [selectedAccountTo, setSelectedAccountTo] = useState('');

  // Step 2: Amount & Description
  // Step 2: Amount & Description
  const [transferAmount, setTransferAmount] = useState('');
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [senderAccounts, setSenderAccounts] = useState([]);
  const [reference, setReference] = useState(`TXN-${Date.now().toString().slice(-6)}`);
  const [narrative, setNarrative] = useState('');

  // Step 3: Fee Preview
  const [feeDetails, setFeeDetails] = useState(null);
  const [error, setError] = useState(null);
  const [completedTxDetails, setCompletedTxDetails] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);

  const senderCustomerId = user?.customerId;

  // Load UEN from session and fetch sender accounts on mount
  useEffect(() => {
    const savedUEN = sessionStorage.getItem('last_recipient_uen');
    if (savedUEN) {
      setRecipientUEN(savedUEN);
    }

    const fetchSenderAccounts = async () => {
      if (!user?.uen && !user?.customerId) return;
      const identifier = user?.uen || user?.customerId;
      try {
        const url = `https://personal-urfnoedc.outsystemscloud.com/CreditTransfer/rest/CreditTransfer/GetAccountsByUENorCustId?UEN=${encodeURIComponent(identifier)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch accounts');
        const data = await res.json();
        setSenderAccounts(data || []);
        if (data && data.length > 0) {
          setSourceAccountId(data[0].accountId);
        }
      } catch (err) {
        console.error("Transfer sender account fetch error:", err);
      }
    };
    fetchSenderAccounts();
  }, [user]);

  const handleFetchAccounts = async () => {
    if (!recipientUEN) return;
    setIsLoading(true);
    setError(null);
    try {
      const accounts = await transferService.fetchRecipientAccounts(recipientUEN, senderCustomerId);
      setRecipientAccounts(accounts || []);
      
      // Store UEN in session on success
      sessionStorage.setItem('last_recipient_uen', recipientUEN);

      if (accounts && accounts.length > 0) {
        setSelectedAccountTo(accounts[0].accountId);
      } else {
        setError("No accounts found for this UEN.");
      }
    } catch (err) {
      setError("Failed to fetch recipient accounts. Please check the UEN.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) setCurrentStep(2);
  };

  const handleBack = () => setCurrentStep(prev => prev - 1);

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = `https://personal-urfnoedc.outsystemscloud.com/CreditTransfer/rest/CreditTransfer/ChargeFee?CustomerId=${encodeURIComponent(senderCustomerId)}&RecipientUEN=${encodeURIComponent(recipientUEN)}`;
      
      const payload = {
        accountFrom: sourceAccountId,
        accountTo: selectedAccountTo,
        transactionAmount: parseFloat(transferAmount),
        transactionReferenceNumber: reference,
        narrative: narrative || "Credit Transfer"
      };

      const res = await fetch(url, {
        method: 'POST', // Assuming POST for JSON body
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        throw new Error('Failed to complete transfer.');
      }
      
      let outData = null;
      try {
        outData = await res.json();
      } catch (e) {
        // Ignored if API returns empty body
      }
      setCompletedTxDetails(outData || payload);
      
      setCurrentStep(3);
    } catch (err) {
      console.error("Transfer error:", err);
      setError("Failed to execute transfer. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedSenderAccount = senderAccounts?.find?.(a => a.accountId === sourceAccountId);
  const displaySourceCurrency = selectedSenderAccount?.Currency || 'SGD';

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Send Funds</h1>

        {/* Stepper */}
        <div className="relative mb-12">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -z-10 -translate-y-1/2 rounded-full"></div>
          <div className="absolute top-1/2 left-0 h-0.5 bg-primary -z-10 -translate-y-1/2 transition-all duration-500 rounded-full" style={{ width: `${((currentStep - 1) / 2) * 100}%` }}></div>

          <div className="flex justify-between w-full">
            {steps.map(step => {
              const isActive = currentStep === step.id;
              const isPast = currentStep > step.id;
              return (
                <div key={step.id} className="flex flex-col items-center gap-2 relative z-10 w-24">
                  <motion.div
                    initial={false}
                    animate={{
                      backgroundColor: isActive || isPast ? 'var(--primary)' : 'var(--background)',
                      borderColor: isActive || isPast ? 'var(--primary)' : 'rgba(255,255,255,0.1)'
                    }}
                    className={cn(
                      "w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold transition-colors duration-300",
                      isActive ? "shadow-glow text-white dark:text-background" : isPast ? "text-white dark:text-background" : "text-textSecondary bg-background"
                    )}
                  >
                    {isPast ? <Check className="w-5 h-5" /> : step.id}
                  </motion.div>
                  <span className={cn(
                    "text-xs font-medium text-center transition-colors duration-300 leading-tight bg-transparent px-0 py-0 rounded-none",
                    isActive ? "text-primary text-sm font-bold" : "text-textSecondary"
                  )}>{step.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Contents */}
        <div className="mt-8">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <GlassCard>
                  <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" /> Recipient Search
                  </h2>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-textSecondary mb-2 block font-medium uppercase tracking-wider">Business UEN</label>
                        <div className="flex gap-3">
                          <div className="flex flex-1 items-center bg-black/5 dark:bg-white/5 border border-border rounded-xl px-4 py-3 focus-within:border-primary transition-colors">
                            <input
                              type="text"
                              value={recipientUEN}
                              onChange={e => setRecipientUEN(e.target.value)}
                              className="flex-1 bg-transparent focus:outline-none text-textPrimary placeholder-textSecondary/40"
                              placeholder="e.g. 202412345M"
                            />
                          </div>
                          <Button
                            variant="secondary"
                            onClick={handleFetchAccounts}
                            disabled={!recipientUEN || isLoading}
                            className="shrink-0"
                          >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            <span className="ml-2 hidden sm:inline">Search</span>
                          </Button>
                        </div>
                      </div>

                      {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                          <AlertCircle className="w-4 h-4" />
                          {error}
                        </div>
                      )}

                      {recipientAccounts.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4"
                        >
                          <div className="h-px bg-border/50 my-6"></div>
                          <label className="text-sm text-textSecondary mb-2 block font-medium uppercase tracking-wider">Select Recipient Account</label>
                          <div className="space-y-3">
                            {recipientAccounts.map((acc) => (
                              <label
                                key={acc.accountId}
                                className={cn(
                                  "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group",
                                  selectedAccountTo === acc.accountId
                                    ? "bg-primary/10 border-primary shadow-glow"
                                    : "bg-black/5 dark:bg-white/5 border-border hover:border-primary/40"
                                )}
                              >
                                <div className="flex items-center gap-4">
                                  <input
                                    type="radio"
                                    name="recipientAccount"
                                    checked={selectedAccountTo === acc.accountId}
                                    onChange={() => setSelectedAccountTo(acc.accountId)}
                                    className="sr-only"
                                  />
                                  <div className={cn(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                    selectedAccountTo === acc.accountId ? "border-primary bg-primary" : "border-border"
                                  )}>
                                    {selectedAccountTo === acc.accountId && <div className="w-2 h-2 bg-white dark:bg-background rounded-full" />}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-textPrimary group-hover:text-primary transition-colors">{acc.accountId}</span>
                                    <span className="text-xs text-textSecondary">{acc.BusinessName}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm font-bold text-primary">
                                    {acc.balance?.toLocaleString?.(undefined, { minimumFractionDigits: 2 }) || '0.00'} {acc.Currency}
                                  </span>
                                  <span className="block text-[10px] text-textSecondary">Available Balance</span>
                                </div>
                              </label>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                  <div className="mt-12 flex justify-end">
                    <Button onClick={handleNext} disabled={!selectedAccountTo}>Continue <ChevronRight className="w-4 h-4 ml-1" /></Button>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <GlassCard>
                  <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" /> Transfer Details
                  </h2>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-black/5 dark:bg-white/5 p-5 rounded-2xl border border-border">
                        <label className="text-sm text-textSecondary mb-2 block font-medium uppercase tracking-wider">Source Wallet</label>
                        <select
                          value={sourceAccountId}
                          onChange={e => setSourceAccountId(e.target.value)}
                          className="w-full bg-transparent text-xl font-semibold focus:outline-none border-b border-border pb-2 cursor-pointer appearance-none text-textPrimary"
                        >
                          {senderAccounts.map(acc => (
                            <option key={acc.accountId} value={acc.accountId} className="bg-background text-sm">
                              {getCurrencyFlag(acc.Currency)} {acc.Currency} (Bal: {acc.balance?.toLocaleString?.(undefined, { minimumFractionDigits: 2 }) || '0.00'})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="bg-black/5 dark:bg-white/5 p-5 rounded-2xl border border-border focus-within:border-primary/50 transition-colors">
                        <label className="text-sm text-textSecondary mb-2 block font-medium uppercase tracking-wider">Transfer Amount</label>
                        <div className="relative">
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-bold text-primary">$</span>
                          <input
                            type="number"
                            value={transferAmount}
                            onChange={e => setTransferAmount(e.target.value)}
                            className="w-full bg-transparent text-3xl font-bold focus:outline-none text-textPrimary placeholder-textSecondary/20 pl-6"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-textSecondary mb-1 block font-medium uppercase tracking-wider">Reference</label>
                        <input
                          type="text"
                          value={reference}
                          onChange={e => setReference(e.target.value)}
                          className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-textPrimary"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-textSecondary mb-1 block font-medium uppercase tracking-wider">Narrative (Optional)</label>
                        <textarea
                          rows={3}
                          value={narrative}
                          onChange={e => setNarrative(e.target.value)}
                          className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-textPrimary placeholder-textSecondary/30"
                          placeholder="What is this transfer for?"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 flex justify-between">
                    <Button variant="ghost" onClick={handleBack}>Back</Button>
                    <Button onClick={handleConfirm} disabled={!transferAmount || parseFloat(transferAmount) <= 0 || isLoading} pulse>
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                      Confirm & Send
                    </Button>
                  </div>
                </GlassCard>
                {error && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <GlassCard className="text-center py-20 flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(52,211,153,0.3)]">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}>
                      <Check className="w-12 h-12" />
                    </motion.div>
                  </div>
                  <h2 className="text-3xl font-bold mb-4 text-textPrimary">Transfer Successful</h2>
                  <div className="space-y-2 mb-10">
                    <p className="text-textSecondary max-w-sm">
                      Your transfer of <span className="text-textPrimary font-bold">{transferAmount} {displaySourceCurrency}</span> has been successfully dispatched.
                    </p>
                    <div className="bg-black/5 dark:bg-white/5 px-4 py-2 rounded-lg inline-block text-xs font-mono text-textSecondary border border-border">
                      REF: {reference}
                    </div>
                  </div>

                  <div className="flex justify-center w-full gap-4 mt-8">
                    <Button variant="secondary" onClick={() => window.location.href = '/'} className="px-8 shadow-glass bg-surface">Back to Dashboard</Button>
                    <Button onClick={() => setShowInvoice(true)} className="px-8 shadow-glow">View Invoice</Button>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Invoice Modal Integration */}
      <InvoiceModal 
        isOpen={showInvoice} 
        onClose={() => setShowInvoice(false)} 
        transaction={completedTxDetails ? {
          ...completedTxDetails,
          id: completedTxDetails.ReferenceNumber || completedTxDetails.transactionReferenceNumber || reference,
          date: new Date(completedTxDetails.TransferDateTime || completedTxDetails.transactionDate || Date.now()).toLocaleDateString(),
          description: `Transfer to ${completedTxDetails.RecipientName || completedTxDetails.accountTo ||  "Beneficiary"}`,
          amount: -(completedTxDetails.TransactionAmount || completedTxDetails.transactionAmount || parseFloat(transferAmount) || 0),
          currency: completedTxDetails.AccountFromCurrency || displaySourceCurrency,
          status: 'Completed'
        } : null} 
      />      
    </PageTransition>
  );
}
