import React from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { useMockStore } from '../store/MockStore';
import { Lock, Unlock, User, MoreVertical, Terminal, ChevronRight, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { getCurrencyFlag } from '../lib/currencyUtils';

export default function EscrowList({ onSelect, onCreateNew }) {
  const { escrows, isLoading } = useMockStore();
  const [filterStatus, setFilterStatus] = React.useState('All');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-12 h-12 text-primary" />
        </motion.div>
        <p className="text-textSecondary animate-pulse">Retrieving agreements...</p>
      </div>
    );
  }

  const filteredEscrows = filterStatus === 'All' 
    ? escrows 
    : escrows.filter(e => e.status.toLowerCase() === filterStatus.toLowerCase());

  const filterOptions = ['All', 'Draft', 'Active', 'Completed'];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Escrow Agreements</h1>
          <p className="text-textSecondary">Oversee and manage your secure milestone-based contracts</p>
        </div>
        <div className="flex flex-wrap gap-2">
           {filterOptions.map(status => (
             <button
               key={status}
               onClick={() => setFilterStatus(status)}
               className={cn(
                 "px-4 py-1.5 rounded-full text-xs font-bold transition-all border",
                 filterStatus === status 
                   ? "bg-primary text-white border-primary shadow-glow" 
                   : "bg-surface-hover/20 text-textSecondary border-white/5 hover:border-primary/40"
               )}
             >
               {status}
             </button>
           ))}
           <div className="h-8 w-px bg-white/5 mx-2 hidden sm:block"></div>
           <Button variant="primary" size="sm" onClick={onCreateNew}>
             Create New Agreement
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredEscrows.map((escrow, idx) => {
            return (
              <motion.div
                key={escrow.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -4 }}
                onClick={() => onSelect(escrow.id)}
                className="cursor-pointer"
              >
                <GlassCard className="h-full group relative overflow-hidden flex flex-col" hoverEffect>
                  {/* Background Glow */}
                  <div className="absolute -right-20 -top-20 w-40 h-40 bg-primary/5 blur-[60px] rounded-full group-hover:bg-primary/10 transition-colors" />
                  
                  <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className={cn(
                      "p-3 rounded-2xl border transition-all duration-300 shrink-0",
                      escrow.status === 'Active' ? "bg-primary border-primary shadow-glow" : "bg-primary/10 border-primary/20"
                    )}>
                      {escrow.status === 'Draft' && <Unlock className="w-6 h-6 text-primary" />}
                      {escrow.status === 'Active' && <Lock className="w-6 h-6 text-white" />}
                      {(escrow.status === 'Completed' || escrow.status === 'Finished') && <CheckCircle2 className="w-6 h-6 text-primary" />}
                      {(!['Draft', 'Active', 'Completed', 'Finished'].includes(escrow.status)) && <Lock className="w-6 h-6 text-primary" />}
                    </div>
                    <h3 className="text-xl font-bold text-textPrimary group-hover:text-primary transition-colors line-clamp-1">
                      {escrow.title}
                    </h3>
                  </div>

                  <div className="space-y-1 relative z-10">
                    <div className="flex items-center gap-2 text-sm text-textSecondary mb-2">
                       <User className="w-4 h-4" />
                       <span>{escrow.contractor}</span>
                    </div>
                    <p className="text-sm text-textSecondary line-clamp-2 min-h-[40px]">
                      {escrow.description || 'No description provided for this agreement.'}
                    </p>
                  </div>

                  <div className="relative z-10">
                    <div className="bg-surface-hover/30 rounded-2xl p-4 border border-white/5">
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <span className="text-xs text-textSecondary uppercase tracking-wider font-bold">Value</span>
                          <div className="text-xl font-bold flex items-center gap-1.5">
                            <span className="text-primary">{getCurrencyFlag(escrow.currency)}</span>
                            {escrow.currency === 'EUR' ? '€' : '$'}{escrow.amount.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                           <span className="text-xs text-textSecondary block mb-1">Status</span>
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight",
                              escrow.status === 'Draft' ? "bg-amber-500/10 text-amber-500" :
                              escrow.status === 'Active' ? "bg-primary/10 text-primary" :
                              (escrow.status === 'Completed' || escrow.status === 'Finished') ? "bg-emerald-500/10 text-emerald-500" :
                              "bg-primary/10 text-primary"
                            )}>
                              {escrow.status}
                            </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}

          {/* Empty State / Add New Placeholder */}
          <motion.div
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ delay: escrows.length * 0.05 }}
             key="new-escrow"
             className="h-full min-h-[280px]"
          >
            <button 
              onClick={onCreateNew}
              className="w-full h-full rounded-[2rem] border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all group flex flex-col items-center justify-center gap-4 p-8"
            >
               <div className="w-16 h-16 rounded-2xl bg-surface-hover/50 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-300">
                  <Terminal className="w-8 h-8 text-textSecondary group-hover:text-primary transition-colors" />
               </div>
               <div className="text-center">
                  <h4 className="font-bold text-textPrimary mb-1">New Agreement</h4>
                  <p className="text-sm text-textSecondary">Standardize your next contract</p>
               </div>
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
