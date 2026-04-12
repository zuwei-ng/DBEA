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
  { id: 1, title: 'Business Identity', icon: Building2 }
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
    setIsProcessing(true);
    setProcessingStatus("Creating Corporate Profile...");
    try {
      const payload = {
        icNumber: formData.icNumber || 'UEN929292',
        familyName: "-",
        givenName: formData.givenName || 'Smoopay TESTER',
        dateOfBirth: "2014-12-31",
        gender: "-",
        occupation: "-",
        streetAddress: "1 Raffles Place",
        city: "-",
        state: "-",
        country: "-",
        postalCode: "048616",
        emailAddress: formData.emailAddress || "paysmooth@email.com",
        countryCode: "-",
        mobileNumber: "82345678",
        phoneCountryCode: "+65",
        phoneAreaCode: "-",
        phoneLocalNumber: "-",
        preferredUserld: formData.preferredUserld || "smoopay123",
        currency: "SGD",
        positionTitle: "-",
        yearOfService: 0,
        employerName: "-",
        officeAddress1: "-",
        officeAddress2: "-",
        officeAddress3: "-",
        officeContactNumber: "-",
        officeContactNumberExt: "-",
        workingInSingapore: false,
        createDepositAccount: true,
        password: formData.password || "password114",
        tenantId: "600",
        customerType: "200",
        annualSalary: 120000
      };

      const firstResponse = await fetch("https://personal-urfnoedc.outsystemscloud.com/Authentication/rest/Authentication/StoreCustomerCredential", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      setProcessingStatus("Verifying User Credit Score...");
      let ficoScoreData = null;
      try {
         const ficoGivenName = formData.givenName || 'Smoopay TESTER';
         const ficoUEN = formData.icNumber || 'UEN929292';
         const customerId = 'DEMO-CUST';
         const ficoUrl = `/api-proxy-3/VerifyUserCompositeService/rest/VerifyUser/VerifyUser?CustomerId=${encodeURIComponent(customerId)}&UEN=${encodeURIComponent(ficoUEN)}&GivenName=${encodeURIComponent(ficoGivenName)}`;
         const ficoRes = await fetch(ficoUrl);
         if (ficoRes.ok) {
            ficoScoreData = await ficoRes.json();
         }
      } catch (e) {
         console.error("FICO fetch error:", e);
      }

      setProcessingStatus("Executing Final Validation...");
      const uenToUse = formData.icNumber || 'UEN929292';
      const pwToUse = formData.password || 'password114';
      const verifyUrl = `https://personal-urfnoedc.outsystemscloud.com/Authentication/rest/Authentication/VerifyLogin?UEN=${encodeURIComponent(uenToUse)}&Password=${encodeURIComponent(pwToUse)}`;
      
      const verifyRes = await fetch(verifyUrl);
      const verifyJson = await verifyRes.json();
      
      if (verifyJson.IsSuccess) {
         setVerifiedData({
           ...verifyJson,
           ficoScore: ficoScoreData
         });
      }
    } catch (error) {
       console.error("Submission error:", error);
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
            updateUser({ 
              onboardingStep: 5, 
              isNewUser: false,
              name: formData.givenName,
              profileData: { givenName: formData.givenName },
              customerId: verifiedData?.CustomerId || '-',
              uen: verifiedData?.UEN || formData.icNumber || 'TESTUEN111',
              ficoScore: verifiedData?.ficoScore || null
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

        <div className="flex justify-center mb-12 relative px-4">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-textSecondary/10 -translate-y-1/2 -z-0"></div>
          {steps.map((step) => (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 bg-primary border-primary text-white dark:text-background shadow-glow">
                <step.icon className="w-6 h-6" />
              </div>
              <span className="mt-3 text-[10px] uppercase tracking-widest font-bold text-center w-20 text-primary">
                {step.title}
              </span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {!isProcessing ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <GlassCard className="p-8 md:p-12">
                <BusinessStep formData={formData} handleChange={handleChange} showErrors={showErrors} />
                
                <div className="flex justify-between items-center mt-12 pt-8 border-t border-border">
                 <div></div>
                 
                 <Button 
                   onClick={() => {
                     if (!formData.givenName || !formData.icNumber || !formData.emailAddress || !formData.preferredUserld || !formData.password) {
                       setShowErrors(true);
                       return;
                     }
                     submitData();
                   }}
                   className="group px-8"
                 >
                   Submit Application
                   <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
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
                <div className="w-full bg-black/5 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
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
      <p className="text-textSecondary mb-8">Create your corporate profile.</p>
      
      {showErrors && (!formData.givenName || !formData.icNumber || !formData.emailAddress || !formData.preferredUserld || !formData.password) && (
        <div className="bg-red-500/10 text-red-500 px-4 py-3 rounded-xl text-sm mb-6 border border-red-500/20 flex items-center gap-2">
          <span>⚠️</span> Please fill in all compulsory fields to continue.
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">Company Name</label>
          <input name="givenName" value={formData.givenName} onChange={handleChange} type="text" className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl px-4 py-3 focus:border-primary outline-none transition-all text-textPrimary" placeholder="e.g. Acme FinTech Ltd" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">UEN Number</label>
          <input name="icNumber" value={formData.icNumber} onChange={handleChange} type="text" className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl px-4 py-3 focus:border-primary outline-none transition-all text-textPrimary" placeholder="e.g. UEN929292" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">Email Address</label>
          <input name="emailAddress" value={formData.emailAddress} onChange={handleChange} type="email" className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl px-4 py-3 focus:border-primary outline-none transition-all text-textPrimary" placeholder="e.g. hello@acme.com" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">Username</label>
          <input name="preferredUserld" value={formData.preferredUserld} onChange={handleChange} type="text" className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl px-4 py-3 focus:border-primary outline-none transition-all text-textPrimary" placeholder="e.g. smoopay123" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">Password</label>
          <input name="password" value={formData.password} onChange={handleChange} type="password" className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl px-4 py-3 focus:border-primary outline-none transition-all text-textPrimary" placeholder="••••••••" />
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
          <input name="officeAddress1" value={data.officeAddress1} onChange={onChange} type="text" className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl px-4 py-3 focus:border-primary outline-none text-textPrimary transition-all" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">Office Address 2</label>
          <input name="officeAddress2" value={data.officeAddress2} onChange={onChange} type="text" className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl px-4 py-3 focus:border-primary outline-none text-textPrimary transition-all" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">Office Address 3</label>
          <input name="officeAddress3" value={data.officeAddress3} onChange={onChange} type="text" className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl px-4 py-3 focus:border-primary outline-none text-textPrimary transition-all" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">Office Contact Number</label>
            <input name="officeContactNumber" value={data.officeContactNumber} onChange={onChange} type="text" className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl px-4 py-3 focus:border-primary outline-none text-textPrimary transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-textSecondary uppercase tracking-wider">Extension</label>
            <input name="officeContactNumberExt" value={data.officeContactNumberExt} onChange={onChange} type="text" className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl px-4 py-3 focus:border-primary outline-none text-textPrimary transition-all" />
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
