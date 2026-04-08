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
  const [showErrors, setShowErrors] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("Analyzing Application");
  const [verifiedData, setVerifiedData] = useState(null);

  const [formData, setFormData] = useState({
    givenName: '',
    icNumber: '',
    streetAddress: '',
    postalCode: '',
    country: 'Singapore',
    preferredUserld: '',
    emailAddress: '',
    phoneCountryCode: '+65',
    mobileNumber: '',
    password: '',
    monthlyRevenue: '',
    industry: '',
    officeAddress1: '',
    officeAddress2: '',
    officeAddress3: '',
    officeContactNumber: '',
    officeContactNumberExt: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const submitData = async () => {
    setProcessingStatus("Creating Corporate Profile...");
    try {
      const annualSalary = (Number(formData.monthlyRevenue) || 0) * 12;
      
      const payload = {
        preferredUserld: formData.preferredUserld || 'demo01',
        emailAddress: formData.emailAddress || 'demo@email.com',
        password: formData.password || 'Test1234!',
        icNumber: formData.icNumber || 'TESTUEN111',
        givenName: formData.givenName || 'Demo Company',
        streetAddress: formData.streetAddress || '1 Raffles Place',
        postalCode: formData.postalCode || '048616',
        phoneCountryCode: formData.phoneCountryCode || '+65',
        mobileNumber: formData.mobileNumber || '82345678',
        annualSalary: annualSalary > 0 ? annualSalary : 120000,
        country: formData.country || 'Singapore',

        city: "-",
        state: "-",
        countryCode: "-",
        phoneAreaCode: "-",
        phoneLocalNumber: "-",
        officeAddress1: formData.officeAddress1 || "-",
        officeAddress2: formData.officeAddress2 || "-",
        officeAddress3: formData.officeAddress3 || "-",
        officeContactNumber: formData.officeContactNumber || "-",
        officeContactNumberExt: formData.officeContactNumberExt || "-",

        tenantId: "600",
        familyName: "-",
        dateOfBirth: "2014-12-31",
        gender: "-",
        occupation: "-",
        positionTitle: "-",
        yearOfService: 0,
        employerName: "-",
        workingInSingapore: false,
        createDepositAccount: true,
        customerType: "200",
        currency: "SGD"
      };

      const firstResponse = await fetch("https://personal-urfnoedc.outsystemscloud.com/Authentication/rest/Authentication/StoreCustomerCredential", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload)
      });
      
      if (!firstResponse.ok) {
        console.error("StoreCustomerCredential failed:", await firstResponse.text());
      }

      setProcessingStatus("Verifying Gateway Link...");
      const username = "12173e30ec556fe4a951";
      const pw = "2fbbd75fd60a8389b82719d2dbc37f1eb9ed226f3eb43cfa7d9240c72fd5+bfc89ad4-c17f-4fe9-82c2-918d29d59fe0";
      const basicAuth = btoa(`${username}:${pw}`);

      const secondResponse = await fetch("https://smuedu-dev.outsystemsenterprise.com/gateway/rest/customer/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${basicAuth}`
        },
        body: JSON.stringify(payload)
      });

      if (!secondResponse.ok) {
         console.error("Gateway Customer API failed:", await secondResponse.text());
      }

      setProcessingStatus("Executing Final Validation...");
      const uenToUse = formData.icNumber || 'TESTUEN111';
      const pwToUse = formData.password || 'Test1234!';
      const verifyUrl = `https://personal-urfnoedc.outsystemscloud.com/Authentication/rest/Authentication/VerifyLogin?UEN=${encodeURIComponent(uenToUse)}&Password=${encodeURIComponent(pwToUse)}`;
      
      const verifyRes = await fetch(verifyUrl);
      const verifyJson = await verifyRes.json();
      
      if (verifyJson.IsSuccess) {
         setVerifiedData(verifyJson);
      }
    } catch (error) {
       console.error("Submission error:", error);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      updateUser({ onboardingStep: currentStep + 1 });
    } else {
      // Validate compulsory
      if (!formData.givenName || !formData.icNumber || !formData.emailAddress) {
        setShowErrors(true);
        return;
      }
      const finalPayload = { ...formData };
      Object.keys(finalPayload).forEach(key => {
        if (finalPayload[key] === "") finalPayload[key] = "-";
      });
      console.log("Submitting Corporate Customer Payload:", finalPayload);
      setIsProcessing(true);
      submitData(); // Fire submit data synchronously mapped to interval progress
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
            const finalGivenName = verifiedData?.GivenName || formData.givenName || 'Demo Company';
            updateUser({ 
              onboardingStep: 5, 
              isNewUser: false,
              name: finalGivenName,
              profileData: {
                givenName: finalGivenName
              },
              customerId: verifiedData?.CustomerId || '-',
              uen: verifiedData?.UEN || formData.icNumber || 'TESTUEN111'
            });
          }, 1000);
        }
        setScanProgress(progress);
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isProcessing, verifiedData, formData, updateUser]);

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
                {currentStep === 1 && <BusinessStep formData={formData} handleChange={handleChange} showErrors={showErrors} />}
                {currentStep === 2 && <PersonnelStep formData={formData} handleChange={handleChange} />}
                {currentStep === 3 && <FinancialStep formData={formData} handleChange={handleChange} />}
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

function BusinessStep({ formData, handleChange, showErrors }) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold mb-2 text-textPrimary">Account Setup</h2>
      <p className="text-textSecondary mb-8">Create your corporate login credentials.</p>
      
      {showErrors && (!formData.givenName || !formData.icNumber || !formData.emailAddress) && (
        <div className="bg-red-500/10 text-red-500 px-4 py-3 rounded-xl text-sm mb-6 border border-red-500/20 flex items-center gap-2">
          <span>⚠️</span> Please fill in all compulsory fields to continue.
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">Trading Name</label>
          <input name="givenName" value={formData.givenName} onChange={handleChange} type="text" className="w-full bg-surface-hover/20 border border-border rounded-xl px-4 py-3 focus:border-primary outline-none transition-all text-textPrimary" placeholder="e.g. Acme FinTech Ltd" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">Registration Number</label>
          <input name="icNumber" value={formData.icNumber} onChange={handleChange} type="text" className="w-full bg-surface-hover/20 border border-border rounded-xl px-4 py-3 focus:border-primary outline-none transition-all text-textPrimary" placeholder="e.g. 202412345M" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">Email Address</label>
          <input name="emailAddress" value={formData.emailAddress} onChange={handleChange} type="email" className="w-full bg-surface-hover/20 border border-border rounded-xl px-4 py-3 focus:border-primary outline-none transition-all text-textPrimary" placeholder="e.g. hello@acme.com" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">Password</label>
          <input name="password" value={formData.password} onChange={handleChange} type="password" className="w-full bg-surface-hover/20 border border-border rounded-xl px-4 py-3 focus:border-primary outline-none transition-all text-textPrimary" placeholder="••••••••" />
        </div>
        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">Registered Address</label>
          <input name="streetAddress" value={formData.streetAddress} onChange={handleChange} type="text" className="w-full bg-surface-hover/20 border border-border rounded-xl px-4 py-3 focus:border-primary outline-none transition-all text-textPrimary" placeholder="123 Financial District, Suite 500" />
        </div>
      </div>
    </div>
  );
}

function PersonnelStep({ formData, handleChange }) {
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
              <input name="preferredUserld" value={formData.preferredUserld} onChange={handleChange} type="text" className="bg-background/40 border border-border rounded-lg px-4 py-2 text-sm outline-none focus:border-primary text-textPrimary" placeholder="Full Name (Username)" />
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

function FinancialStep({ formData, handleChange }) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold mb-2 text-textPrimary">Financial Profile</h2>
      <p className="text-textSecondary mb-8">Select your industry to help us determine available wallets.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {['E-Commerce', 'Professional Services', 'Tech / SaaS', 'Logistic', 'Retail', 'Education'].map(ind => (
           <button 
             key={ind} 
             onClick={() => handleChange({ target: { name: 'industry', value: ind } })} 
             className={cn("p-4 rounded-xl border transition-all text-sm font-medium text-center text-textPrimary", formData.industry === ind ? 'border-primary text-primary bg-primary/10' : 'border-border hover:border-primary hover:bg-primary/5')}
           >
             {ind}
           </button>
        ))}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-textSecondary uppercase tracking-wider block mb-2">Estimated Monthly Revenue (USD)</label>
        <div className="relative">
           <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">$</div>
           <input name="monthlyRevenue" value={formData.monthlyRevenue} onChange={handleChange} type="number" className="w-full bg-surface-hover/20 border border-white/10 rounded-xl px-10 py-4 text-2xl font-bold focus:border-primary outline-none text-textPrimary" placeholder="100000" />
        </div>
      </div>
    </div>
  );
}

function VerificationStep() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold mb-2 text-textPrimary">Security Verification</h2>
      <p className="text-textSecondary mb-8">Scan your business documents and directors identification.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary/50 transition-all">
           <div className="w-16 h-16 rounded-2xl bg-surface-hover/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><FileText className="w-8 h-8 text-textSecondary group-hover:text-primary" /></div>
           <span className="font-bold text-textPrimary mb-1">Company Documents</span>
           <span className="text-xs text-textSecondary uppercase tracking-widest">Incorporation & Financials</span>
        </div>
        <div className="p-8 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary/50 transition-all">
           <div className="w-16 h-16 rounded-2xl bg-surface-hover/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><UserCheck className="w-8 h-8 text-textSecondary group-hover:text-primary" /></div>
           <span className="font-bold text-textPrimary mb-1">Director Identification</span>
           <span className="text-xs text-textSecondary uppercase tracking-widest">Passport or National ID</span>
        </div>
      </div>
      
      <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex items-center gap-4 text-xs">
         <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
         <p className="text-textSecondary">Final verification step uses end-to-end encrypted biometric checks. Your funds remain protected by bank-grade security protocols.</p>
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

function UserCheck(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  );
}
