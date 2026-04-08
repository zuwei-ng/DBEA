import React, { useState } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Send, Calendar, DollarSign, User, FileText, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

import { API_ENDPOINTS } from '../lib/api';

export default function CreateAgreement({ onBack, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    CreatedBy: "0000002892", // Hardcoded per user example
    Title: "",
    Description: "",
    ContractorAccountId: "",
    ContractorUen: "",
    TransactionValue: "",
    Currency: "USD",
    Status: "Draft",
    EffectiveDate: new Date().toISOString().split('T')[0],
    ExpiryDate: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    console.log("Submitting agreement creation...", formData);
    
    try {
      const response = await fetch(API_ENDPOINTS.CREATE_AGREEMENT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          TransactionValue: parseFloat(formData.TransactionValue)
        }),
      });

      if (response.ok) {
        let data;
        const text = await response.text();
        try {
          data = JSON.parse(text);
          console.log("Agreement created successfully (JSON):", data);
        } catch (e) {
          data = text;
          console.log("Agreement created successfully (Text):", data);
        }
        
        // Navigate based on returned ID
        const newId = data.Id || data.id || (typeof data === 'string' ? data : data.toString());
        if (onSuccess) {
          console.log("Calling onSuccess with ID:", newId);
          onSuccess(newId);
        }
      } else {
        const errorText = await response.text();
        console.error("Failed to create agreement:", response.status, errorText);
        alert(`Failed to create agreement: ${response.statusText}\n${errorText}`);
      }
    } catch (error) {
      console.error("Error creating agreement:", error);
      alert(`Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full bg-surface-hover/60 border border-border/80 rounded-xl px-4 py-3 text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-textSecondary/50 h-[50px]";
  const textareaClasses = "w-full bg-surface-hover/60 border border-border/80 rounded-xl px-4 py-3 text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-textSecondary/50";

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 bg-surface-hover/50 hover:bg-surface-hover rounded-xl border border-white/5 transition-all text-textSecondary group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Agreement</h1>
          <p className="text-textSecondary">Initialize a new secure escrow agreement</p>
        </div>
      </div>

      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
      >
        <GlassCard className="px-8 pb-8 pt-0 space-y-8" hoverEffect>
          {/* Section: Project Branding */}
          <div className="space-y-4">
            <label className="text-sm font-bold text-textSecondary uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Project Title
            </label>
            <input 
              required
              type="text"
              placeholder="e.g. Frontend Development Phase 1"
              className={inputClasses}
              value={formData.Title}
              onChange={e => setFormData({...formData, Title: e.target.value})}
            />
          </div>

          <div className="space-y-4 pt-4">
            <label className="text-sm font-bold text-textSecondary uppercase tracking-wider flex items-center gap-2">
              Description
            </label>
            <textarea 
              required
              rows={3}
              placeholder="Briefly describe the scope of work..."
              className={textareaClasses}
              value={formData.Description}
              onChange={e => setFormData({...formData, Description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            <div className="space-y-4">
              <label className="text-sm font-bold text-textSecondary uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Contractor UEN
              </label>
              <input 
                required
                type="text"
                placeholder="e.g. 111111111"
                className={inputClasses}
                value={formData.ContractorUen}
                onChange={e => setFormData({...formData, ContractorUen: e.target.value})}
              />
            </div>
            <div className="space-y-4">
              <label className="text-sm font-bold text-textSecondary uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Contractor Account ID
              </label>
              <input 
                required
                type="text"
                placeholder="e.g. 12345678B"
                className={inputClasses}
                value={formData.ContractorAccountId}
                onChange={e => setFormData({...formData, ContractorAccountId: e.target.value})}
              />
            </div>
          </div>

          {/* Section: Financials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/5">
            <div className="space-y-4">
              <label className="text-sm font-bold text-textSecondary uppercase tracking-wider flex items-center gap-2">
                Value
              </label>
              <div className="relative">
                <input 
                  required
                  type="number"
                  placeholder="0.00"
                  className={`${inputClasses} pl-10`}
                  value={formData.TransactionValue}
                  onChange={e => setFormData({...formData, TransactionValue: e.target.value})}
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-textSecondary">$</span>
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-sm font-bold text-textSecondary uppercase tracking-wider flex items-center gap-2">
                Currency
              </label>
              <select 
                className={inputClasses}
                value={formData.Currency}
                onChange={e => setFormData({...formData, Currency: e.target.value})}
              >
                <option value="USD">USD - US Dollar</option>
                <option value="SGD">SGD - Singapore Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
            </div>
          </div>

          {/* Section: Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            <div className="space-y-4">
              <label className="text-sm font-bold text-textSecondary uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Effective Date
              </label>
              <input 
                required
                type="date"
                className={inputClasses}
                value={formData.EffectiveDate}
                onChange={e => setFormData({...formData, EffectiveDate: e.target.value})}
              />
            </div>
            <div className="space-y-4">
              <label className="text-sm font-bold text-textSecondary uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Expiry Date
              </label>
              <input 
                required
                type="date"
                className={inputClasses}
                value={formData.ExpiryDate}
                onChange={e => setFormData({...formData, ExpiryDate: e.target.value})}
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-start gap-3 bg-primary/5 p-4 rounded-xl border border-primary/10 max-w-sm">
                <div className="p-1.5 bg-primary/20 rounded-lg text-primary shrink-0">
                  <Send className="w-4 h-4" />
                </div>
                <span className="text-xs text-textSecondary leading-relaxed">
                  Agreements are stored in a draft state and can be modified before locking the smart contract wallet.
                </span>
            </div>
            <div className="flex gap-10 w-full sm:w-auto mt-4 sm:mt-0">
              <Button type="button" variant="ghost" onClick={onBack} disabled={loading}>Cancel</Button>
              <Button type="submit" className="flex-1 sm:flex-initial min-w-[140px]" disabled={loading} pulse>
                {loading ? 'Creating...' : 'Create'}
                {!loading && <ChevronRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </div>
        </GlassCard>
      </motion.form>
    </div>
  );
}
