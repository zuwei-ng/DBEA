import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMockStore } from '../store/MockStore';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { 
  Building2, 
  Users, 
  FileText, 
  ShieldCheck, 
  ChevronRight, 
  ChevronLeft,
  Briefcase,
  Globe,
  Upload,
  Activity,
  File
} from 'lucide-react';
import { cn } from '../lib/utils';

const steps = [
  { id: 1, title: 'Business Identity', icon: Building2 },
  { id: 2, title: 'Personnel', icon: Users },
  { id: 3, title: 'Financials', icon: Briefcase },
  { id: 4, title: 'KYC Verification', icon: ShieldCheck }
];

export default function SignUp() {
  const { user, updateUser, logout } = useMockStore();
  const currentStep = user?.onboardingStep || 1;
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const nextStep = () => {
    if (currentStep < 4) {
      updateUser({ onboardingStep: currentStep + 1 });
    } else {
      // Finalize onboarding
      const finalPayload = { ...formData };
      Object.keys(finalPayload).forEach(key => {
        if (finalPayload[key] === "") finalPayload[key] = "-";
      });
      console.log("Submitting Corporate Customer Payload:", finalPayload);
      setIsProcessing(true);
      await submitData();
    }
  };

  const prevStep = () => {
    setShowErrors(false);
    if (currentStep > 1) {
      updateUser({ onboardingStep: currentStep - 1 });
    }
  };

  useEffect(() => {
    if (isProcessing) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 10 + 5;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setTimeout(() => {
            updateUser({ onboardingStep: 5, isNewUser: false });
          }, 1000);
        }
        setScanProgress(progress);
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isProcessing]);

  return (
    <div className="min-h-screen bg-background text-textPrimary p-6 md:p-12 overflow-y-auto transition-colors duration-500">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-bold text-black shadow-primary/20 shadow-lg">S</div>
             <span className="text-2xl font-bold tracking-tighter">SmooPay <span className="text-textSecondary font-medium text-lg ml-1">Business Registration</span></span>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="text-textSecondary hover:text-textPrimary">
            Cancel Registration
          </Button>
        </div>

        {/* Stepper */}
        <div className="flex justify-between mb-12 relative px-4">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-textSecondary/10 -translate-y-1/2 -z-0"></div>
          {steps.map((step) => (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-2",
                currentStep >= step.id 
                  ? "bg-primary border-primary text-white dark:text-background shadow-glow" 
                  : "bg-surface border-border text-textSecondary"
              )}>
                <step.icon className="w-6 h-6" />
              </div>
              <span className={cn(
                "mt-3 text-[10px] uppercase tracking-widest font-bold text-center w-20",
                currentStep >= step.id ? "text-primary" : "text-textSecondary"
              )}>
                {step.title}
              </span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {!isProcessing ? (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <GlassCard className="p-8 md:p-12">
                {currentStep === 1 && <BusinessStep />}
                {currentStep === 2 && <PersonnelStep />}
                {currentStep === 3 && <FinancialStep />}
                {currentStep === 4 && <VerificationStep />}

                <div className="mt-12 flex justify-between items-center">
                  <Button 
                    variant="secondary" 
                    onClick={prevStep} 
                    disabled={currentStep === 1}
                    className={cn(
                      "px-8 transition-opacity duration-300",
                      currentStep === 1 && "opacity-0 pointer-events-none"
                    )}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button 
                    onClick={nextStep} 
                    className="px-8 font-bold"
                  >
                    {currentStep === 4 ? 'Confirm & Register' : 'Continue'} <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          ) : (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <GlassCard className="p-12 flex flex-col items-center text-center max-w-md w-full">
                <div className="relative w-24 h-24 mb-8">
                  <div className="absolute inset-0 rounded-full border-4 border-border/50"></div>
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="44"
                      className="fill-none stroke-primary stroke-[4px] transition-all duration-300"
                      strokeDasharray={276}
                      strokeDashoffset={276 - (276 * scanProgress) / 100}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Activity className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-textPrimary">{processingStatus}</h3>
                <p className="text-textSecondary mb-8 text-sm">We are securely preparing your corporate account details and verifying credentials.</p>
                <div className="w-full bg-surface-hover/20 h-1.5 rounded-full overflow-hidden">
                   <div className="h-full bg-primary" style={{ width: `${scanProgress}%` }}></div>
                </div>
                <span className="mt-4 text-primary font-mono text-sm">{Math.round(scanProgress)}%</span>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function BusinessStep() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold mb-2 text-textPrimary">Account Setup</h2>
      <p className="text-textSecondary mb-8">Create your corporate login credentials.</p>
      
      {showErrors && (!data.preferredUserld || !data.emailAddress || !data.password) && (
        <div className="bg-red-500/10 text-red-500 px-4 py-3 rounded-xl text-sm mb-6 border border-red-500/20 flex items-center gap-2">
          <span>⚠️</span> Please fill in all compulsory fields to continue.
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">Trading Name</label>
          <input type="text" className="w-full bg-surface-hover/20 border border-border rounded-xl px-4 py-3 focus:border-primary outline-none transition-all text-textPrimary" placeholder="e.g. Acme FinTech Ltd" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">Registration Number</label>
          <input type="text" className="w-full bg-surface-hover/20 border border-border rounded-xl px-4 py-3 focus:border-primary outline-none transition-all text-textPrimary" placeholder="e.g. 202412345M" />
        </div>
        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">Registered Address</label>
          <input type="text" className="w-full bg-surface-hover/20 border border-border rounded-xl px-4 py-3 focus:border-primary outline-none transition-all text-textPrimary" placeholder="123 Financial District, Suite 500" />
        </div>
      </div>
    </div>
  );
}

function PersonnelStep() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold mb-2 text-textPrimary">Key Personnel</h2>
      <p className="text-textSecondary mb-8">Provide details for the Controlling Director or UBO.</p>
      
      <div className="space-y-6">
        <div className="bg-surface-hover/20 p-6 rounded-2xl border border-border hover:border-primary/30 transition-all group">
           <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform"><Users className="w-6 h-6" /></div>
              <div>
                 <div className="font-bold text-textPrimary">Director Information</div>
                 <div className="text-xs text-textSecondary">Authorized Signatory</div>
              </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" className="bg-background/40 border border-border rounded-lg px-4 py-2 text-sm outline-none focus:border-primary text-textPrimary" placeholder="Full Name" />
              <input type="text" className="bg-background/40 border border-border rounded-lg px-4 py-2 text-sm outline-none focus:border-primary text-textPrimary" placeholder="Nationality" />
           </div>
        </div>
        <Button variant="ghost" className="w-full border-2 border-dashed border-border text-textSecondary h-16 rounded-2xl hover:border-primary/50 hover:text-primary transition-all">
           + Add Another Beneficial Owner
        </Button>
      </div>
    </div>
  );
}

function FinancialStep() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold mb-2 text-textPrimary">Financial Profile</h2>
      <p className="text-textSecondary mb-8">Select your industry to help us determine available wallets.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {['E-Commerce', 'Professional Services', 'Tech / SaaS', 'Logistic', 'Retail', 'Education'].map(ind => (
           <button key={ind} className="p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all text-sm font-medium text-center text-textPrimary">
             {ind}
           </button>
        ))}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-textSecondary uppercase tracking-wider block mb-2">Estimated Monthly Revenue (USD)</label>
        <div className="relative">
           <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">$</div>
           <input type="number" className="w-full bg-surface-hover/20 border border-white/10 rounded-xl px-10 py-4 text-2xl font-bold focus:border-primary outline-none text-textPrimary" placeholder="100,000" />
        </div>
      </div>
    </div>
  );
}

function OfficeStep({ data, onChange }) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold mb-2 text-textPrimary">Office Details</h2>
      <p className="text-textSecondary mb-8">Provide supplemental office contact information.</p>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">Office Address 1</label>
          <input name="officeAddress1" value={data.officeAddress1} onChange={onChange} type="text" className="w-full bg-surface-hover/20 border border-border rounded-xl px-4 py-3 focus:border-primary outline-none text-textPrimary transition-all" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">Office Address 2</label>
          <input name="officeAddress2" value={data.officeAddress2} onChange={onChange} type="text" className="w-full bg-surface-hover/20 border border-border rounded-xl px-4 py-3 focus:border-primary outline-none text-textPrimary transition-all" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">Office Address 3</label>
          <input name="officeAddress3" value={data.officeAddress3} onChange={onChange} type="text" className="w-full bg-surface-hover/20 border border-border rounded-xl px-4 py-3 focus:border-primary outline-none text-textPrimary transition-all" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">Office Contact Number</label>
            <input name="officeContactNumber" value={data.officeContactNumber} onChange={onChange} type="text" className="w-full bg-surface-hover/20 border border-border rounded-xl px-4 py-3 focus:border-primary outline-none text-textPrimary transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">Extension</label>
            <input name="officeContactNumberExt" value={data.officeContactNumberExt} onChange={onChange} type="text" className="w-full bg-surface-hover/20 border border-border rounded-xl px-4 py-3 focus:border-primary outline-none text-textPrimary transition-all" />
          </div>
        </div>
        
        <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex items-start gap-4 text-xs mt-6">
           <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
           <p className="text-textSecondary">All field data mapped to the corporate customer payload is securely transmitted over TLS. This includes background logic initialization for corporate accounts.</p>
        </div>
      </div>
    </div>
  );
}
