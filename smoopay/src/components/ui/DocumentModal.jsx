import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Download, ShieldCheck } from 'lucide-react';
import { Button } from './Button';

export function DocumentModal({ isOpen, onClose, document }) {
  if (!isOpen || !document) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl bg-surface border border-white/10 rounded-2xl shadow-glass overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-primary/10 rounded-lg text-primary">
                 <FileText className="w-5 h-5" />
               </div>
               <div>
                 <h3 className="font-semibold text-white">{document.name}</h3>
                 <p className="text-xs text-textSecondary flex items-center gap-1">
                   <ShieldCheck className="w-3 h-3 text-emerald-400" />
                   Verified via s3://smoopay-vault-euw1/{document.name}
                 </p>
               </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="!p-2">
                <Download className="w-5 h-5 text-textSecondary hover:text-white" />
              </Button>
              <button onClick={onClose} className="p-2 text-textSecondary hover:text-white hover:bg-[#ffffff]/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* S3 Preview Area */}
          <div className="flex-1 bg-black/60 p-8 overflow-y-auto flex justify-center items-start min-h-[400px]">
             {/* Simulated PDF / Doc Preview */}
             <div className="bg-[#ffffff] w-full max-w-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-sm p-10 text-black/80 relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-secondary"></div>
                <div className="border-b-2 border-primary/30 pb-4 mb-8 flex justify-between items-end mt-4">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">DELIVERABLE PROOF</h1>
                    <p className="text-sm text-gray-500 mt-2 font-medium">DOCUMENT REF: SPY-{Math.floor(Math.random() * 9000) + 1000}-A</p>
                  </div>
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center border-2 border-primary text-primary font-bold">
                    S
                  </div>
                </div>
                
                <div className="space-y-5 font-mono text-sm leading-relaxed">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-11/12"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mt-8"></div>
                  <div className="h-3 bg-gray-200 rounded w-9/12"></div>
                  <div className="grid grid-cols-2 gap-4 mt-12">
                     <div className="h-32 bg-gray-100 border border-gray-300 rounded-xl flex items-center justify-center text-gray-400">Figure Context 1</div>
                     <div className="h-32 bg-gray-100 border border-gray-300 rounded-xl flex items-center justify-center text-gray-400">Figure Context 2</div>
                  </div>
                </div>
                
                <div className="mt-16 pt-8 border-t border-gray-200 flex justify-between items-end">
                  <div>
                    <div className="text-xs font-bold text-gray-400 mb-2">SIGNED & AUTHORIZED</div>
                    <div className="w-32 h-12 border-b-2 border-blue-900/50 border-dotted"></div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-400 mb-2">DATE COMPLETED</div>
                    <div className="w-32 h-12 border-b-2 border-blue-900/50 border-dotted flex items-end pb-1 text-blue-900/80 font-mono text-sm">
                      2026-03-21
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
