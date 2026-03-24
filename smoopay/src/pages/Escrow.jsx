import React, { useState } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { DocumentModal } from '../components/ui/DocumentModal';
import { useMockStore } from '../store/MockStore';
import { Check, Clock, Eye, Lock, Unlock, FileCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { getCurrencyFlag } from '../lib/currencyUtils';
import confetti from 'canvas-confetti';

export default function Escrow() {
  const { milestones, updateMilestone } = useMockStore();
  const [selectedDoc, setSelectedDoc] = useState(null);

  const contractTotal = milestones.reduce((sum, m) => sum + m.amount, 0);
  const paidTotal = milestones.filter(m => m.status === 'Paid').reduce((sum, m) => sum + m.amount, 0);
  
  const handleRelease = (milestone) => {
    // Fire Confetti
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 7,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: ['#00E5FF', '#6D28D9', '#FFFFFF']
      });
      confetti({
        particleCount: 7,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: ['#00E5FF', '#6D28D9', '#FFFFFF']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    setTimeout(() => {
      updateMilestone(milestone.id, { status: 'Paid' });
    }, 400);
  };

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        <div className="flex justify-between items-end">
           <div>
             <h1 className="text-3xl font-bold tracking-tight mb-2">Escrow Agreement</h1>
             <p className="text-textSecondary">Manage secure milestone payouts for "Project Aurora"</p>
           </div>
           <Button variant="secondary" className="hidden sm:flex">
             <FileCheck className="w-4 h-4 mr-2" />
             View Full Contract
           </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Agreement Summary UI */}
          <div className="lg:col-span-1 border-b border-border lg:border-none pb-8 lg:pb-0">
             <div className="sticky top-8 space-y-6">
                <GlassCard hoverEffect>
                   <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                     <Lock className="w-5 h-5 text-primary" /> Contract Details
                   </h3>
                   
                   <div className="space-y-4">
                     <div className="bg-surface-hover/20 p-4 rounded-xl border border-white/5 space-y-3">
                       <div className="flex justify-between text-sm">
                         <span className="text-textSecondary">Contractor</span>
                         <span className="font-medium text-textPrimary">Elena Rostova</span>
                       </div>
                       <div className="flex justify-between text-sm">
                         <span className="text-textSecondary">Role</span>
                         <span className="font-medium text-textPrimary">Lead Engineer</span>
                       </div>
                       <div className="flex justify-between text-sm">
                         <span className="text-textSecondary">Currency</span>
                         <span className="font-medium text-primary flex items-center gap-1">
                           {getCurrencyFlag('USD')} USD
                         </span>
                       </div>
                     </div>

                     <div className="bg-primary/5 p-5 rounded-2xl border border-primary/20 space-y-2 mt-4 relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary blur-[50px] opacity-20 rounded-full"></div>
                        <span className="text-sm text-textSecondary relative z-10">Total Contract Value</span>
                        <div className="text-3xl font-bold text-textPrimary relative z-10">${contractTotal.toLocaleString()}</div>
                        
                        <div className="w-full bg-surface-hover/20 rounded-full h-2 mt-5 overflow-hidden border border-border relative z-10 transition-colors">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${(paidTotal / contractTotal) * 100}%` }} 
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="bg-primary h-full shadow-[0_0_10px_var(--glow-color)]"
                          />
                        </div>
                        <div className="flex justify-between text-xs text-textSecondary mt-2 font-medium relative z-10">
                          <span className="text-primary">${paidTotal.toLocaleString()} Released</span>
                          <span>${(contractTotal - paidTotal).toLocaleString()} Held</span>
                        </div>
                     </div>
                   </div>
                </GlassCard>
                
                <GlassCard delay={0.1}>
                   <div className="flex items-start gap-4 text-textSecondary text-sm">
                     <div className="p-2.5 bg-primary/10 rounded-xl shrink-0 mt-0.5 border border-primary/20">
                       <Lock className="w-5 h-5 text-primary" />
                     </div>
                     <p>Funds are secured in an insulated smart wallet and cannot be accessed by the contractor until you manually release payment.</p>
                   </div>
                </GlassCard>
             </div>
          </div>

          {/* Vertical Milestone Tracker */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-8">Milestone Timeline</h2>
            
            <div className="relative pl-8 space-y-10 before:absolute before:inset-0 before:ml-[1.45rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary before:via-primary/20 before:to-transparent before:left-0 md:before:left-auto pt-2">
              
              {milestones.map((milestone, idx) => {
                const isPaid = milestone.status === 'Paid';
                const isApproved = milestone.status === 'Approved';
                const isPending = milestone.status === 'Pending';
                
                return (
                  <motion.div 
                    key={milestone.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + (idx * 0.15) }}
                    className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
                  >
                     {/* Timeline Dot */}
                     <div className={cn(
                       "absolute left-[-2.25rem] md:left-1/2 md:-translate-x-1/2 w-6 h-6 rounded-full border-[3px] flex items-center justify-center z-10 transition-all duration-500",
                       isPaid ? "bg-primary border-primary shadow-glow scale-110" : 
                       isApproved ? "bg-background border-primary scale-100" : "bg-background border-border scale-90"
                     )}>
                       {isPaid && <Check className="w-3 h-3 text-white dark:text-background" />}
                     </div>

                     {/* Card */}
                     <div className="w-[calc(100%-2rem)] md:w-[calc(50%-2.5rem)]">
                       <div className={cn(
                         "p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden",
                         isPaid ? "bg-surface-hover/20 border-border opacity-70" :
                         isApproved ? "bg-surface border-primary/40 shadow-glow transform group-hover:-translate-y-1" :
                         "bg-surface/50 border-border"
                       )}>
                         {isApproved && (
                           <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                         )}
                         <div className="flex justify-between items-start mb-3 relative z-10">
                           <h4 className="font-bold text-lg text-textPrimary">{milestone.title}</h4>
                           <div className={cn(
                             "px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 shrink-0",
                             isPaid ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 font-bold" :
                             isApproved ? "bg-primary/10 text-primary border border-primary/20" :
                             "bg-surface-hover/40 text-textSecondary"
                           )}>
                             {isPaid && <Check className="w-3 h-3" />}
                             {isApproved && <Check className="w-3 h-3" />}
                             {isPending && <Clock className="w-3 h-3" />}
                             {milestone.status}
                           </div>
                         </div>
                         
                         <div className="text-2xl font-bold mb-5 font-mono text-textPrimary relative z-10">
                           ${milestone.amount.toLocaleString()}
                         </div>

                         <div className="flex gap-3 relative z-10">
                           {milestone.proof && (
                             <Button 
                               variant="secondary" 
                               size="sm" 
                               disabled={isPending}
                               onClick={() => setSelectedDoc({ name: milestone.proof })}
                               className="flex-1 bg-surface-hover/20 border border-border hover:bg-surface-hover/40"
                             >
                               <Eye className="w-4 h-4 mr-2" /> Proof
                             </Button>
                           )}
                           
                           {isApproved && (
                             <Button 
                               size="sm" 
                               onClick={() => handleRelease(milestone)} 
                               className="flex-[2]"
                               pulse
                             >
                               <Unlock className="w-4 h-4 mr-2" /> Release
                             </Button>
                           )}
                           
                           {isPending && (
                             <Button variant="ghost" size="sm" className="flex-1 border border-white/5 bg-surface-hover/20" disabled>
                               Awaiting Work
                             </Button>
                           )}
                         </div>
                       </div>
                     </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      
      <DocumentModal 
        isOpen={!!selectedDoc} 
        onClose={() => setSelectedDoc(null)} 
        document={selectedDoc} 
      />
    </PageTransition>
  );
}
