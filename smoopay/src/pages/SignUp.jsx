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
  { id: 1, title: 'Account Setup', icon: Users },
  { id: 2, title: 'Business Identity', icon: Building2 },
  { id: 3, title: 'Contact Details', icon: Globe },
  { id: 4, title: 'Office Details', icon: Briefcase }
];

export default function SignUp() {
  const { user, updateUser, logout } = useMockStore();
  const currentStep = user?.onboardingStep || 1;
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("Finalizing Registration...");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    // Compulsory
    preferredUserld: "",
    emailAddress: "",
    password: "",
    icNumber: "",
    givenName: "", // mapped to Business Name
    streetAddress: "",
    postalCode: "",
    phoneCountryCode: "",
    mobileNumber: "",
    annualSalary: "", // mapped to Annual Cashflow

    // Optional but should be filled with "-" if user does not fill up
    city: "",
    state: "",
    country: "",
    countryCode: "",
    phoneAreaCode: "",
    phoneLocalNumber: "",
    officeAddress1: "",
    officeAddress2: "",
    officeAddress3: "",
    officeContactNumber: "",
    officeContactNumberExt: "",

    // Backend only
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
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'number' && value !== '' ? parseInt(value, 10) : value 
    }));
    // Clear errors when the user types
    if (showErrors) setShowErrors(false);
  };

  const isStepValid = () => {
    if (currentStep === 1) {
      return formData.preferredUserld && formData.emailAddress && formData.password;
    }
    if (currentStep === 2) {
      return formData.givenName && formData.icNumber && formData.annualSalary !== "";
    }
    if (currentStep === 3) {
      return formData.streetAddress && formData.postalCode && formData.phoneCountryCode && formData.mobileNumber;
    }
    return true; // Step 4 has no compulsory fields
  };

  const nextStep = () => {
    if (!isStepValid()) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);

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
    }
  };

  const prevStep = () => {
    setShowErrors(false);
    if (currentStep > 1) {
      updateUser({ onboardingStep: currentStep - 1 });
    }
  };

  useEffect(() => {
    if (!isProcessing) return;

    let isMounted = true;
    
    const finalizeRegistration = async () => {
      try {
        setScanProgress(10);
        setProcessingStatus("Checking FICO Score...");

        const finalPayload = { ...formData };
        Object.keys(finalPayload).forEach(key => {
          if (finalPayload[key] === "") finalPayload[key] = "-";
        });

        const givenNameEnc = encodeURIComponent(finalPayload.givenName);
        const ficoReq = await fetch(`https://personal-ldjy5itc.outsystemscloud.com/FICOService/rest/FICOScore/GetFICOScoreByGivenName?givenName=${givenNameEnc}`);
        const ficoRes = await ficoReq.json();

        setScanProgress(40);
        
        let availableCurrencies = ["SGD"];
        
        if (Array.isArray(ficoRes) && ficoRes.length > 0) {
           const band = ficoRes[0].CreditBand;
           setProcessingStatus(`FICO Band ${band} found. Initializing currencies...`);
           
           const bandEnc = encodeURIComponent(band);
           await fetch(`https://personal-ldjy5itc.outsystemscloud.com/Currency/rest/CustCurrency/AddCustCurrency?givenName=${givenNameEnc}&CreditBand=${bandEnc}`, {
             method: 'POST'
           });
           
           setScanProgress(60);
           setProcessingStatus("Fetching approved currencies...");
           
           const currReq = await fetch(`https://personal-ldjy5itc.outsystemscloud.com/Currency/rest/CustCurrency/GetCurrencyByGivenName?givenName=${givenNameEnc}`);
           const currRes = await currReq.json();
           
           if (Array.isArray(currRes) && currRes.length > 0) {
              availableCurrencies = Array.from(new Set(currRes.map(c => c.Currency)));
           }
        } else {
           setProcessingStatus("No FICO match. Defaulting to SGD.");
        }

        setScanProgress(80);
        setProcessingStatus("Creating Corporate Account...");
        
        finalPayload.currency = availableCurrencies.join(",");

        // Maintain basic payload structure with SGD for the root backend to prevent single-string failure
        const onboardPayload = { ...finalPayload, currency: "SGD" };
        const token = btoa("12173e30ec556fe4a951:2fbbd75fd60a8389b82719d2dbc37f1eb9ed226f3eb43cfa7d9240c72fd5+bfc89ad4-c17f-4fe9-82c2-918d29d59fe0");
        
        const onboardReq = await fetch("https://smuedu-dev.outsystemsenterprise.com/Gateway/rest/Customer/", {
           method: "POST",
           headers: {
             "Content-Type": "application/json",
             "Authorization": `Basic ${token}`
           },
           body: JSON.stringify(onboardPayload)
        });
        
        if (!onboardReq.ok) {
           console.warn("Onboard API returned non-OK status.");
        }

        setScanProgress(100);
        setProcessingStatus("Registration Complete!");
        
        setTimeout(() => {
          if (isMounted) {
            // Save credentials locally so user can log back in
            localStorage.setItem('lastOnboardedUser', JSON.stringify(finalPayload));
            updateUser({ onboardingStep: 5, isNewUser: false, profileData: finalPayload, availableCurrencies });
            navigate('/dashboard');
          }
        }, 1000);

      } catch (error) {
        console.error("Registration error:", error);
        setProcessingStatus("Error configuring account. Continuing conditionally.");
        // If error, proceed with flow for demo completeness anyway
        setTimeout(() => {
           if (isMounted) {
             updateUser({ onboardingStep: 5, isNewUser: false, profileData: formData });
             navigate('/dashboard');
           }
        }, 2000);
      }
    };
    
    finalizeRegistration();

    return () => {
       isMounted = false;
    };
  }, [isProcessing, formData, updateUser]);

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
                {currentStep === 1 && <AccountStep data={formData} onChange={handleChange} showErrors={showErrors} />}
                {currentStep === 2 && <BusinessStep data={formData} onChange={handleChange} showErrors={showErrors} />}
                {currentStep === 3 && <ContactStep data={formData} onChange={handleChange} showErrors={showErrors} />}
                {currentStep === 4 && <OfficeStep data={formData} onChange={handleChange} />}

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

function AccountStep({ data, onChange, showErrors }) {
  const getBorder = (field) => showErrors && !data[field] ? "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]" : "border-border";

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
          <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">
            User ID <span className="text-red-500">*</span>
          </label>
          <input name="preferredUserld" value={data.preferredUserld} onChange={onChange} type="text" className={cn("w-full bg-surface-hover/20 border rounded-xl px-4 py-3 focus:border-primary outline-none text-textPrimary transition-all", getBorder('preferredUserld'))} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input name="emailAddress" value={data.emailAddress} onChange={onChange} type="email" className={cn("w-full bg-surface-hover/20 border rounded-xl px-4 py-3 focus:border-primary outline-none text-textPrimary transition-all", getBorder('emailAddress'))} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">
            Password <span className="text-red-500">*</span>
          </label>
          <input name="password" value={data.password} onChange={onChange} type="password" className={cn("w-full bg-surface-hover/20 border rounded-xl px-4 py-3 focus:border-primary outline-none text-textPrimary transition-all", getBorder('password'))} />
        </div>
      </div>
    </div>
  );
}

function BusinessStep({ data, onChange, showErrors }) {
  const getBorder = (field) => showErrors && (data[field] === "" || data[field] === undefined) ? "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]" : "border-border";

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold mb-2 text-textPrimary">Business Identity</h2>
      <p className="text-textSecondary mb-8">Tell us about your company to get started.</p>
      
      {showErrors && (!data.givenName || !data.icNumber || data.annualSalary === "") && (
        <div className="bg-red-500/10 text-red-500 px-4 py-3 rounded-xl text-sm mb-6 border border-red-500/20 flex items-center gap-2">
          <span>⚠️</span> Please fill in all compulsory fields to continue.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">
            Business Name <span className="text-red-500">*</span>
          </label>
          <input name="givenName" value={data.givenName} onChange={onChange} type="text" className={cn("w-full bg-surface-hover/20 border rounded-xl px-4 py-3 focus:border-primary outline-none text-textPrimary transition-all", getBorder('givenName'))} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">
            UEN Number <span className="text-red-500">*</span>
          </label>
          <input name="icNumber" value={data.icNumber} onChange={onChange} type="text" className={cn("w-full bg-surface-hover/20 border rounded-xl px-4 py-3 focus:border-primary outline-none text-textPrimary transition-all", getBorder('icNumber'))} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">
            Annual Casflow (est.) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">$</div>
             <input name="annualSalary" value={data.annualSalary} onChange={onChange} type="number" className={cn("w-full bg-surface-hover/20 border rounded-xl px-10 py-3 font-bold focus:border-primary outline-none text-textPrimary transition-all", getBorder('annualSalary'))} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactStep({ data, onChange, showErrors }) {
  const getBorder = (field) => showErrors && !data[field] ? "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]" : "border-border";

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold mb-2 text-textPrimary">Contact & Address</h2>
      <p className="text-textSecondary mb-8">Where is your business located and how can we reach you?</p>
      
      {showErrors && (!data.streetAddress || !data.postalCode || !data.phoneCountryCode || !data.mobileNumber) && (
        <div className="bg-red-500/10 text-red-500 px-4 py-3 rounded-xl text-sm mb-6 border border-red-500/20 flex items-center gap-2">
          <span>⚠️</span> Please fill in all compulsory fields to continue.
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">
          Street Address <span className="text-red-500">*</span>
        </label>
        <input name="streetAddress" value={data.streetAddress} onChange={onChange} type="text" className={cn("w-full bg-surface-hover/20 border rounded-xl px-4 py-3 focus:border-primary outline-none text-textPrimary transition-all", getBorder('streetAddress'))} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="space-y-2 lg:col-span-2">
          <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">City</label>
          <input name="city" value={data.city} onChange={onChange} type="text" className="w-full bg-surface-hover/20 border border-border rounded-xl px-4 py-3 focus:border-primary outline-none text-textPrimary transition-all" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">State</label>
          <input name="state" value={data.state} onChange={onChange} type="text" className="w-full bg-surface-hover/20 border border-border rounded-xl px-4 py-3 focus:border-primary outline-none text-textPrimary transition-all" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">
            Postal Code <span className="text-red-500">*</span>
          </label>
          <input name="postalCode" value={data.postalCode} onChange={onChange} type="text" className={cn("w-full bg-surface-hover/20 border rounded-xl px-4 py-3 focus:border-primary outline-none text-textPrimary transition-all", getBorder('postalCode'))} />
        </div>
        <div className="space-y-2 lg:col-span-2">
          <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">Country</label>
          <input name="country" value={data.country} onChange={onChange} type="text" className="w-full bg-surface-hover/20 border border-border rounded-xl px-4 py-3 focus:border-primary outline-none text-textPrimary transition-all" />
        </div>
        
        {/* Phone Country Code separated from Mobile Number */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">
            Country Code <span className="text-red-500">*</span>
          </label>
          <input name="phoneCountryCode" value={data.phoneCountryCode} onChange={onChange} type="text" className={cn("w-full bg-surface-hover/20 border rounded-xl px-4 py-3 focus:border-primary outline-none text-textPrimary transition-all", getBorder('phoneCountryCode'))} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <input name="mobileNumber" value={data.mobileNumber} onChange={onChange} type="text" className={cn("w-full bg-surface-hover/20 border rounded-xl px-4 py-3 focus:border-primary outline-none text-textPrimary transition-all", getBorder('mobileNumber'))} />
        </div>
        
        <div className="space-y-2 lg:col-span-4">
          <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">Landline Number</label>
          <div className="flex gap-2">
            <input name="countryCode" value={data.countryCode} onChange={onChange} type="text" className="w-1/4 bg-surface-hover/20 border border-border rounded-xl px-4 py-3 focus:border-primary outline-none text-textPrimary transition-all" placeholder="Code" />
            <input name="phoneAreaCode" value={data.phoneAreaCode} onChange={onChange} type="text" className="w-1/4 bg-surface-hover/20 border border-border rounded-xl px-4 py-3 focus:border-primary outline-none text-textPrimary transition-all" placeholder="Area" />
            <input name="phoneLocalNumber" value={data.phoneLocalNumber} onChange={onChange} type="text" className="w-1/2 bg-surface-hover/20 border border-border rounded-xl px-4 py-3 focus:border-primary outline-none text-textPrimary transition-all" placeholder="Number" />
          </div>
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
