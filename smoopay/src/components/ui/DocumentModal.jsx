import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Download } from 'lucide-react';
import { Button } from './Button';
import { GlassCard } from './GlassCard';

export function DocumentModal({ isOpen, onClose, document }) {
  if (!isOpen || !document) return null;

  return (
    <AnimatePresence>
      <div className="fixed top-16 left-0 md:left-64 bottom-0 right-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl"
        >
          <GlassCard className="modal-panel p-0 overflow-hidden flex flex-col max-h-[90vh] w-full shadow-none border-none">
            {/* Header - EXACTLY like Edit Milestone */}
            <div className="flex items-center justify-between p-8 pb-6 bg-surface-hover/20">
              <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
                   <FileText className="w-6 h-6" />
                 </div>
                  <div className="min-w-0">
                     <h2 className="text-2xl font-bold text-textPrimary tracking-tight truncate">{document.name}</h2>
                     <p className="text-[10px] font-mono text-textSecondary/60 uppercase tracking-tight mt-1">
                       ID: {document.id}
                     </p>
                  </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="!p-2 text-textSecondary hover:text-primary transition-all rounded-full"
                  onClick={() => {
                    const link = window.document.createElement('a');
                    link.href = document.url;
                    link.download = document.name;
                    link.click();
                  }}
                >
                  <Download className="w-5 h-5" />
                </Button>
                <button 
                  onClick={onClose} 
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-all group"
                >
                  <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" />
                </button>
              </div>
            </div>

            {/* Preview Area container - Full Bleed below header */}
            <div className="flex-1 bg-black/20 relative min-h-[600px]">
               {document.url ? (
                 <iframe 
                   src={`${document.url}#toolbar=0&view=FitH`} 
                   className="absolute inset-0 w-full h-full border-none"
                   title={document.name}
                 />
               ) : (
                 <div className="h-full p-12 overflow-y-auto flex justify-center items-start">
                   {/* Simulated PDF / Doc Preview fallback */}
                   <div className="bg-[#ffffff] w-full max-w-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-sm p-12 text-black/80 relative">
                      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-secondary"></div>
                      <div className="border-b-2 border-primary/30 pb-6 mb-10 flex justify-between items-end mt-4">
                        <div>
                          <h1 className="text-3xl font-bold tracking-tight text-gray-900 uppercase">Deliverable proof</h1>
                          <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-[0.2em]">Ref: {document.id || 'SPY-VAULT-2026'}</p>
                        </div>
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center border-2 border-primary text-primary font-bold">
                          S
                        </div>
                      </div>
                      
                      <div className="space-y-6 opacity-30 grayscale pointer-events-none">
                         <div className="h-4 bg-gray-100 rounded w-full"></div>
                         <div className="h-4 bg-gray-100 rounded w-[95%]"></div>
                         <div className="h-4 bg-gray-100 rounded w-full"></div>
                         <div className="h-4 bg-gray-100 rounded w-[80%]"></div>
                      </div>
                   </div>
                 </div>
               )}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
