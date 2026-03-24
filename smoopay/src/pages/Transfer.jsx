import React, { useState } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { useMockStore } from '../store/MockStore';
import { Check, ChevronDown, ChevronRight, Building2, User, Globe, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { getCurrencyFlag } from '../lib/currencyUtils';

const steps = [
  { id: 1, name: 'Recipient Details' },
  { id: 2, name: 'Amount & Currency' },
  { id: 3, name: 'Review & Confirm' },
  { id: 4, name: 'Success' },
];

export default function Transfer() {
  const { wallets, addTransaction } = useMockStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [showFees, setShowFees] = useState(false);
  
  // Form State
  const [recipientType, setRecipientType] = useState('business');
  const [recipientName, setRecipientName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  
  const [transferAmount, setTransferAmount] = useState('');
  const [transferCurrency, setTransferCurrency] = useState('USD');
  const [sourceWallet, setSourceWallet] = useState('USD');

  // Computed fees based on mock service logic
  const isOverseas = swiftCode.length >= 8;
  const baseFee = isOverseas ? 15.00 : 0.00;
  const fxMarkupPercentage = sourceWallet !== transferCurrency ? 0.005 : 0;
  const fxMarkupFee = transferAmount ? parseFloat(transferAmount) * fxMarkupPercentage : 0;
  const totalFees = baseFee + fxMarkupFee;
  const totalCharge = transferAmount ? parseFloat(transferAmount) + totalFees : 0;

  const handleNext = () => setCurrentStep(prev => prev + 1);
  const handleBack = () => setCurrentStep(prev => prev - 1);

  const handleConfirm = () => {
    // Simulate API delay
    setTimeout(() => {
      addTransaction({
        id: `tx-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        description: `Transfer to ${recipientName}`,
        amount: -totalCharge,
        currency: sourceWallet,
        status: 'Completed'
      });
      setCurrentStep(4);
    }, 1500);
  };

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Send Funds</h1>

        {/* Stepper */}
        <div className="relative">
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
                    isActive ? "text-primary text-sm shadow-glow" : "text-textSecondary"
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
                    <User className="w-5 h-5 text-primary" /> Recipient Details
                  </h2>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setRecipientType('business')}
                        className={cn("p-4 rounded-xl border flex flex-col items-center gap-2 transition-all", recipientType === 'business' ? "border-primary bg-primary/10 text-primary" : "border-border text-textSecondary hover:bg-surface-hover/20")}
                      >
                        <Building2 className="w-6 h-6" /> Business
                      </button>
                      <button 
                        onClick={() => setRecipientType('individual')}
                        className={cn("p-4 rounded-xl border flex flex-col items-center gap-2 transition-all", recipientType === 'individual' ? "border-primary bg-primary/10 text-primary" : "border-border text-textSecondary hover:bg-surface-hover/20")}
                      >
                        <User className="w-6 h-6" /> Individual
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-textSecondary mb-1 block">Recipient Name</label>
                        <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} className="w-full bg-surface-hover/20 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-textPrimary placeholder-textSecondary/50" placeholder="e.g. Acme Corp" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-textSecondary mb-1 block">Account Number / IBAN</label>
                          <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="w-full bg-surface-hover/20 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-textPrimary" />
                        </div>
                        <div>
                          <label className="text-sm text-textSecondary mb-1 block">SWIFT / BIC Code</label>
                          <input type="text" value={swiftCode} onChange={e => setSwiftCode(e.target.value)} className="w-full bg-surface-hover/20 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-textPrimary placeholder-textSecondary/50" placeholder="For overseas" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 flex justify-end">
                    <Button onClick={handleNext} disabled={!recipientName || !accountNumber}>Continue <ChevronRight className="w-4 h-4 ml-1" /></Button>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <GlassCard>
                  <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" /> Transfer Amount
                  </h2>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-surface-hover/20 p-5 rounded-2xl border border-border">
                        <label className="text-sm text-textSecondary mb-2 block">Source Wallet</label>
                        <select value={sourceWallet} onChange={e => setSourceWallet(e.target.value)} className="w-full bg-transparent text-xl font-semibold focus:outline-none border-b border-border pb-2 cursor-pointer appearance-none text-textPrimary">
                          {wallets.map(w => <option key={w.currency} value={w.currency} className="bg-background text-sm text-textPrimary">{getCurrencyFlag(w.currency)} {w.currency} (Bal: {w.symbol}{w.balance.toLocaleString()})</option>)}
                        </select>
                      </div>

                      <div className="bg-surface-hover/20 p-5 rounded-2xl border border-border focus-within:border-primary/50 transition-colors">
                        <label className="text-sm text-textSecondary mb-2 flex justify-between">
                          <span>Recipient Receives</span>
                          <div className="flex items-center gap-1">
                            <span className="text-sm">{getCurrencyFlag(transferCurrency)}</span>
                            <select value={transferCurrency} onChange={e => setTransferCurrency(e.target.value)} className="bg-transparent text-textPrimary focus:outline-none text-right appearance-none font-bold cursor-pointer">
                              {['USD', 'EUR', 'GBP', 'SGD'].map(c => <option key={c} value={c} className="bg-background text-sm text-textPrimary">{c}</option>)}
                            </select>
                          </div>
                        </label>
                        <input 
                          type="number" 
                          value={transferAmount} 
                          onChange={e => setTransferAmount(e.target.value)} 
                          className="w-full bg-transparent text-3xl font-bold focus:outline-none text-textPrimary placeholder-textSecondary/30 mt-1" 
                          placeholder="0.00" 
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 flex justify-between">
                    <Button variant="ghost" onClick={handleBack}>Back</Button>
                    <Button onClick={handleNext} disabled={!transferAmount || parseFloat(transferAmount) <= 0}>Continue <ChevronRight className="w-4 h-4 ml-1" /></Button>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <GlassCard>
                  <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-primary" /> Review Details
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-6">
                      <div className="text-sm text-textSecondary text-center mb-1">Total Amount to Deduct</div>
                      <div className="text-4xl font-bold text-center text-textPrimary flex justify-center items-center gap-2">
                        {totalCharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xl text-primary">{sourceWallet}</span>
                      </div>
                    </div>

                    {/* Expandable Fee Breakdown */}
                    <div className="border border-border rounded-xl overflow-hidden bg-surface-hover/20 transition-colors">
                      <button 
                        onClick={() => setShowFees(!showFees)}
                        className="w-full flex justify-between items-center p-4 hover:bg-surface-hover/40 transition-colors focus:outline-none"
                      >
                        <span className="font-medium text-textSecondary text-sm">Transfer Fees Breakdown</span>
                        <motion.div animate={{ rotate: showFees ? 180 : 0 }} className="text-textSecondary">
                          <ChevronDown className="w-4 h-4" />
                        </motion.div>
                      </button>
                      <AnimatePresence>
                        {showFees && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }} 
                            animate={{ height: 'auto', opacity: 1 }} 
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-black/30 border-t border-white/5 overflow-hidden"
                          >
                            <div className="p-4 space-y-3 text-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-textSecondary">Transfer Amount</span>
                                <span className="font-medium">{parseFloat(transferAmount).toLocaleString(undefined, {minimumFractionDigits:2})} {transferCurrency}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-textSecondary">Base Network Fee (Tier 1)</span>
                                <span className="font-medium text-primary">{baseFee.toFixed(2)} {sourceWallet}</span>
                              </div>
                              {fxMarkupFee > 0 && (
                                <div className="flex justify-between items-center">
                                  <span className="text-textSecondary">FX Provider Margin (0.5%)</span>
                                  <span className="font-medium text-primary">{fxMarkupFee.toFixed(2)} {sourceWallet}</span>
                                </div>
                              )}
                              <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                                <span className="text-white font-medium">Total Fees</span>
                                <span className="font-bold text-primary">{totalFees.toFixed(2)} {sourceWallet}</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="bg-surface-hover/20 border border-border rounded-xl p-4 text-sm space-y-2 mt-4 transition-colors">
                       <div className="flex justify-between"><span className="text-textSecondary">Recipient</span><span className="font-medium text-textPrimary">{recipientName}</span></div>
                       <div className="flex justify-between"><span className="text-textSecondary">Account</span><span className="font-medium text-textPrimary">{accountNumber}</span></div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-between">
                    <Button variant="ghost" onClick={handleBack}>Back</Button>
                    <Button onClick={handleConfirm} pulse>Confirm Transfer</Button>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <GlassCard className="text-center py-16 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(52,211,153,0.3)]">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}>
                      <Check className="w-10 h-10" />
                    </motion.div>
                  </div>
                  <h2 className="text-3xl font-bold mb-2 text-textPrimary">Transfer Initiated</h2>
                  <p className="text-textSecondary max-w-sm mb-8">
                    Your transfer of <span className="text-textPrimary font-bold">{transferAmount} {transferCurrency}</span> has been successfully dispatched to <span className="text-textPrimary font-bold">{recipientName}</span>.
                  </p>
                  
                  <div className="flex gap-4">
                    <Button variant="secondary">Download Receipt</Button>
                    <Button onClick={() => window.location.href = '/'}>Back to Dashboard</Button>
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
