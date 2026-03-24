import React, { useState, useEffect } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { UploadCloud, File, Activity, ShieldCheck, Lock, Unlock, BadgeCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export default function ManageCurrencies() {
  const [status, setStatus] = useState('idle'); // idle, scanning, success
  const [scanProgress, setScanProgress] = useState(0);
  const [codeStrings, setCodeStrings] = useState([]);

  const mockCodeStrings = [
    "ANALYZING_MRZ_DATA...",
    "VERIFYING_HOLOGRAM_INTEGRITY...",
    "CROSS_REFERENCING_INTERPOL_DB...",
    "EXTRACTING_FACIAL_FEATURES...",
    "RUNNING_LIVENESS_CHECK...",
    "VALIDATING_ISSUANCE_DATE...",
    "MATCHING_AML_BLACKLIST...",
    "RISK_SCORE_COMPUTATION: LOW",
    "CLEARANCE_GRANTED."
  ];

  useEffect(() => {
    if (status === 'scanning') {
      let currentProgress = 0;
      let stringIndex = 0;
      
      const interval = setInterval(() => {
        currentProgress += Math.random() * 5 + 2;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);
          setTimeout(() => setStatus('success'), 800);
        }
        setScanProgress(currentProgress);
        
        // Add code string
        if (stringIndex < mockCodeStrings.length && currentProgress > (stringIndex * 11)) {
          setCodeStrings(prev => [...prev, mockCodeStrings[stringIndex]]);
          stringIndex++;
        }
      }, 150);

      return () => clearInterval(interval);
    }
  }, [status]);

  const handleDrop = (e) => {
    e.preventDefault();
    if (status === 'idle') setStatus('scanning');
  };

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Currencies & Limits</h1>
          <p className="text-textSecondary">Submit additional documentation to appeal for higher limits or unlock new regional wallets.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Upload / Scanner Zone */}
          <GlassCard className="min-h-[440px] flex flex-col justify-center relative overflow-hidden">
            <AnimatePresence mode="wait">
              {status === 'idle' && (
                <motion.div 
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center p-8 text-center"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  <div className="w-24 h-24 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center mb-6 text-textSecondary hover:border-primary/50 hover:text-primary transition-colors cursor-pointer group" onClick={() => setStatus('scanning')}>
                     <UploadCloud className="w-10 h-10 group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Upload Passport or ID</h3>
                  <p className="text-sm text-textSecondary max-w-xs mb-8">Drag and drop your secure documents here, or click to browse.</p>
                  <Button variant="secondary" onClick={() => setStatus('scanning')}>Browse Files</Button>
                </motion.div>
              )}

              {status === 'scanning' && (
                <motion.div 
                  key="scanning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full flex flex-col p-2"
                >
                   <div className="flex items-center gap-3 mb-6">
                     <Activity className="w-6 h-6 text-primary animate-pulse" />
                     <h3 className="font-semibold text-white">AI Engine Processing</h3>
                   </div>

                   {/* Scanning Visualizer */}
                   <div className="relative aspect-[3/2] w-full bg-black/40 rounded-xl border border-white/10 overflow-hidden mb-6 flex items-center justify-center isolate">
                     <File className="w-20 h-20 text-white/10" />
                     
                     {/* Laser Scanner */}
                     <motion.div 
                       className="absolute left-0 right-0 h-1 bg-primary shadow-[0_0_20px_rgba(0,229,255,1)] z-10"
                       initial={{ top: '-10%' }}
                       animate={{ top: ['-10%', '110%', '-10%'] }}
                       transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                     />
                     <div className="absolute inset-0 bg-primary/5"></div>
                   </div>

                   {/* Output terminal */}
                   <div className="bg-black/60 rounded-lg p-4 font-mono text-[10px] sm:text-xs text-primary h-32 overflow-hidden flex flex-col justify-end border border-white/5 shadow-inner">
                     {codeStrings.map((str, i) => (
                       <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                         {'>'} {str}
                       </motion.div>
                     ))}
                     {scanProgress < 100 && (
                       <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>
                         {'>'} _
                       </motion.div>
                     )}
                   </div>

                   {/* Progress Bar */}
                   <div className="mt-6">
                     <div className="flex justify-between text-xs font-medium text-textSecondary mb-2">
                       <span>Verification Progress</span>
                       <span className="text-primary tracking-wider">{Math.round(scanProgress)}%</span>
                     </div>
                     <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                       <div className="h-full bg-gradient-to-r from-primary/50 to-primary transition-all duration-200" style={{ width: `${scanProgress}%` }}></div>
                     </div>
                   </div>
                </motion.div>
              )}

              {status === 'success' && (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center text-center p-8 h-full"
                >
                  <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(52,211,153,0.2)]">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.2 }}>
                      <ShieldCheck className="w-12 h-12" />
                    </motion.div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Documentation Verified</h3>
                  <p className="text-textSecondary mb-8 max-w-[280px]">Your request for additional currency access is being processed. New limits will be reflected shortly.</p>
                  <Button variant="secondary" onClick={() => { setStatus('idle'); setScanProgress(0); setCodeStrings([]); }}>Submit Another Appeal</Button>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          {/* Results UI / Permissions Wallet */}
          <div className="space-y-6 flex flex-col h-full">
             <GlassCard className="flex-1 h-full">
               <h3 className="text-lg font-semibold flex items-center gap-2 mb-6 text-white border-b border-white/10 pb-4">
                  <BadgeCheck className="w-5 h-5 text-primary" /> Wallet Permissions
               </h3>
               
               <div className="space-y-4">
                 {[
                   { name: 'USD Essential Wallet', limit: '$50,000 / day', locked: false, id: 1 },
                   { name: 'EUR Global Wallet', limit: '€50,000 / day', locked: status !== 'success', id: 2 },
                   { name: 'GBP Global Wallet', limit: '£50,000 / day', locked: status !== 'success', id: 3 },
                   { name: 'SGD Asia Hub', limit: 'S$250,000 / day', locked: status !== 'success', id: 4 }
                 ].map((wallet, idx) => (
                   <motion.div 
                     key={wallet.id}
                     initial={false}
                     animate={{ 
                       opacity: wallet.locked ? 0.4 : 1, 
                       backgroundColor: wallet.locked ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)',
                       borderColor: wallet.locked ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'
                     }}
                     className="flex items-center justify-between p-4 rounded-xl border transition-colors duration-500"
                   >
                     <div className="flex items-center gap-4">
                       <div className={cn("p-2 rounded-xl transition-colors duration-500", wallet.locked ? "bg-white/5 text-textSecondary" : "bg-primary/10 text-primary shadow-glow")}>
                         {wallet.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                       </div>
                       <div>
                         <div className="font-medium text-sm text-white">{wallet.name}</div>
                         <div className="text-xs text-textSecondary mt-0.5 font-mono tracking-tight">Limit: {wallet.limit}</div>
                       </div>
                     </div>
                     {!wallet.locked && (
                       <motion.span 
                         initial={{ opacity: 0, scale: 0.8 }}
                         animate={{ opacity: 1, scale: 1 }}
                         className="text-[10px] font-bold tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20"
                       >
                         ACTIVE
                       </motion.span>
                     )}
                   </motion.div>
                 ))}
               </div>
             </GlassCard>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
