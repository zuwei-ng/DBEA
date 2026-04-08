import React, { useState, useEffect } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { useMockStore } from '../store/MockStore';
import { Check, ChevronDown, ChevronRight, Building2, User, Globe, AlertCircle, Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { getCurrencyFlag } from '../lib/currencyUtils';
import { transferService } from '../services/transferService';

const steps = [
  { id: 1, name: 'Recipient' },
  { id: 2, name: 'Details' },
  { id: 3, name: 'Confirm' },
  { id: 4, name: 'Success' },
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
  const [transferAmount, setTransferAmount] = useState('');
  const [sourceWallet, setSourceWallet] = useState('SGD'); // Default to SGD for testing
  const [reference, setReference] = useState(`TXN-${Date.now().toString().slice(-6)}`);
  const [narrative, setNarrative] = useState('');

  // Step 3: Fee Preview
  const [feeDetails, setFeeDetails] = useState(null);
  const [error, setError] = useState(null);

  // Common IDs - these should ideally come from user store
  const senderCustomerId = "0000002892";
  const senderAccountId = "0000006181";

  // Load UEN from session on mount
  useEffect(() => {
    const savedUEN = sessionStorage.getItem('last_recipient_uen');
    if (savedUEN) {
      setRecipientUEN(savedUEN);
    }
  }, []);

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

  const handleRequestFee = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const details = await transferService.calculateChargeFee({
        CustomerId: senderCustomerId,
        RecipientUEN: recipientUEN,
        AccountFrom: senderAccountId,
        AccountTo: selectedAccountTo,
        TransactionAmount: parseFloat(transferAmount),
        TransactionReferenceNumber: reference,
        Narrative: narrative || "Credit Transfer"
      });
      setFeeDetails(details);
      setCurrentStep(3);
    } catch (err) {
      setError(err.message || "Failed to calculate fees. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) setCurrentStep(2);
    else if (currentStep === 2) handleRequestFee();
  };

  const handleBack = () => setCurrentStep(prev => prev - 1);

  const handleConfirm = () => {
    setIsLoading(true);
    // Simulate final dispatch
    setTimeout(() => {
      setIsLoading(false);
      setCurrentStep(4);
    }, 1500);
  };

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Send Funds</h1>

        {/* Stepper */}
        <div className="relative mb-12">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -z-10 -translate-y-1/2 rounded-full"></div>
          <div className="absolute top-1/2 left-0 h-0.5 bg-primary -z-10 -translate-y-1/2 transition-all duration-500 rounded-full" style={{ width: `${((currentStep - 1) / 3) * 100}%` }}></div>

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
                    "text-xs font-medium text-center transition-colors duration-300",
                    isActive ? "text-primary text-sm shadow-glow font-bold" : "text-textSecondary"
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
                          <input
                            type="text"
                            value={recipientUEN}
                            onChange={e => setRecipientUEN(e.target.value)}
                            className="flex-1 bg-surface-hover/20 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-textPrimary placeholder-textSecondary/30"
                            placeholder="e.g. T12LL1234A"
                          />
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
                                    : "bg-surface-hover/20 border-border hover:border-primary/40"
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
                                    {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} {acc.Currency}
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
                      <div className="bg-surface-hover/20 p-5 rounded-2xl border border-border">
                        <label className="text-sm text-textSecondary mb-2 block font-medium uppercase tracking-wider">Source Wallet</label>
                        <select
                          value={sourceWallet}
                          onChange={e => setSourceWallet(e.target.value)}
                          className="w-full bg-transparent text-xl font-semibold focus:outline-none border-b border-border pb-2 cursor-pointer appearance-none text-textPrimary"
                        >
                          {wallets.map(w => (
                            <option key={w.currency} value={w.currency} className="bg-background text-sm">
                              {getCurrencyFlag(w.currency)} {w.currency} (Bal: {w.balance.toLocaleString()})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="bg-surface-hover/20 p-5 rounded-2xl border border-border focus-within:border-primary/50 transition-colors">
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
                          className="w-full bg-surface-hover/20 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-textPrimary"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-textSecondary mb-1 block font-medium uppercase tracking-wider">Narrative (Optional)</label>
                        <textarea
                          rows={3}
                          value={narrative}
                          onChange={e => setNarrative(e.target.value)}
                          className="w-full bg-surface-hover/20 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-textPrimary placeholder-textSecondary/30"
                          placeholder="What is this transfer for?"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 flex justify-between">
                    <Button variant="ghost" onClick={handleBack}>Back</Button>
                    <Button onClick={handleNext} disabled={!transferAmount || parseFloat(transferAmount) <= 0 || isLoading}>
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Calculate Fees <ChevronRight className="w-4 h-4 ml-1" />
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

            {currentStep === 3 && feeDetails && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <GlassCard>
                  <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-primary" /> Review Details
                  </h2>

                  <div className="space-y-6">
                    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Building2 className="w-24 h-24" />
                      </div>
                      <div className="text-sm text-textSecondary text-center mb-1 font-bold uppercase tracking-widest">Amount to Transfer</div>
                      <div className="text-5xl font-bold text-center text-textPrimary flex justify-center items-center gap-3">
                        {parseFloat(transferAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        <span className="text-2xl text-primary">{sourceWallet}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-surface-hover/20 border border-border rounded-2xl p-5 space-y-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-textSecondary font-bold uppercase tracking-wider mb-1">Transferrer</span>
                          <span className="font-bold text-textPrimary">{feeDetails.TransferrerName || 'You'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-textSecondary font-bold uppercase tracking-wider mb-1">From Account</span>
                          <span className="font-mono text-sm text-textPrimary">{senderAccountId}</span>
                        </div>
                      </div>

                      <div className="bg-surface-hover/20 border border-border rounded-2xl p-5 space-y-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-textSecondary font-bold uppercase tracking-wider mb-1">Recipient</span>
                          <span className="font-bold text-textPrimary">{feeDetails.RecipientName || 'Recipient Business'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-textSecondary font-bold uppercase tracking-wider mb-1">To Account</span>
                          <span className="font-mono text-sm text-textPrimary">{selectedAccountTo}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-surface-hover/10 rounded-2xl border border-border/50 p-6">
                      <h4 className="text-xs font-bold text-textSecondary uppercase tracking-widest mb-4 border-b border-border pb-2">Fee Summary</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-textSecondary">Transaction Fee</span>
                          <span className="font-bold text-primary">{feeDetails.FeeDeducted?.toFixed(2) || '0.00'} {sourceWallet}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-textSecondary">Fee Type</span>
                          <span className="font-medium text-textPrimary">{feeDetails.FeeCode || 'Standard'}</span>
                        </div>
                        <div className="pt-3 border-t border-border mt-3 flex justify-between items-center">
                          <span className="text-textPrimary font-bold">Total Deduction</span>
                          <span className="text-xl font-bold bg-primary/10 px-3 py-1 rounded-lg text-primary">
                            {(parseFloat(transferAmount) + (feeDetails.FeeDeducted || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })} {sourceWallet}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                      <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-600/80 leading-relaxed font-medium">
                        Please verify the recipient details carefully. Once confirmed, funds will be immediately deducted from your account.
                        <strong> Reference: {reference}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="mt-12 flex justify-between">
                    <Button variant="ghost" onClick={handleBack}>Back</Button>
                    <Button onClick={handleConfirm} disabled={isLoading} pulse>
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                      Confirm & Send
                    </Button>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <GlassCard className="text-center py-20 flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(52,211,153,0.3)]">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}>
                      <Check className="w-12 h-12" />
                    </motion.div>
                  </div>
                  <h2 className="text-3xl font-bold mb-4 text-textPrimary">Transfer Successful</h2>
                  <div className="space-y-2 mb-10">
                    <p className="text-textSecondary max-w-sm">
                      Your transfer of <span className="text-textPrimary font-bold">{transferAmount} {sourceWallet}</span> has been successfully dispatched.
                    </p>
                    <div className="bg-surface-hover/20 px-4 py-2 rounded-lg inline-block text-xs font-mono text-textSecondary border border-border">
                      REF: {reference}
                    </div>
                  </div>

                  <div className="flex justify-center w-full">
                    <Button onClick={() => window.location.href = '/'} className="px-12 shadow-glow">Back to Dashboard</Button>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}
