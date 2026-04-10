import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMockStore } from '../store/MockStore';
import { GlassCard } from '../components/ui/GlassCard';
import { InvoiceModal } from '../components/ui/InvoiceModal';
import { Receipt, FileText, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { PageTransition } from '../components/layout/PageTransition';

export default function InvoicesList() {
  const { user } = useMockStore();
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  useEffect(() => {
    const fetchInvoices = async () => {
      const businessName = user?.profileData?.givenName || user?.name;
      if (!businessName) {
        setErrorMsg('Business name not found in user profile.');
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setErrorMsg('');
      try {
        const url = `https://personal-v8ce42l9.outsystemscloud.com/InvoiceService/rest/InvoiceAPI/GetInvoicesByBusinessName?BusinessName=${encodeURIComponent(businessName)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch invoices');
        const data = await res.json();
        
        let invoiceData = data.Data || data || [];
        if (!Array.isArray(invoiceData)) invoiceData = [invoiceData]; 
        
        invoiceData.sort((a,b) => new Date(b.TransferDateTime || 0) - new Date(a.TransferDateTime || 0));
        
        setInvoices(invoiceData);
      } catch (err) {
        console.error("Invoice fetch error:", err);
        setErrorMsg('Could not retrieve invoices for this business.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInvoices();
  }, [user]);

  const handleViewInvoice = (inv) => {
    setSelectedInvoice({
      id: inv.ReferenceNumber || inv.TransactionReferenceNumber || 'N/A',
      date: new Date(inv.TransferDateTime || Date.now()).toLocaleDateString(),
      description: `Transfer to ${inv.RecipientName || 'Recipient'}`,
      amount: -(inv.TransactionAmount || inv.Amount || 0),
      currency: inv.AccountFromCurrency || inv.Currency || 'SGD',
      status: 'Completed',
      ...inv
    });
  };

  return (
    <PageTransition>
      <div className="space-y-6 relative z-10 max-w-7xl mx-auto pb-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-textPrimary flex items-center gap-3">
              <Receipt className="w-8 h-8 text-primary" />
              Invoices
            </h1>
            <p className="text-textSecondary mt-1">
              View and download your generated transfer invoices.
            </p>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : errorMsg ? (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        ) : invoices.length === 0 ? (
          <GlassCard className="flex flex-col items-center justify-center py-20">
            <FileText className="w-16 h-16 text-textSecondary/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Invoices Found</h3>
            <p className="text-textSecondary text-center max-w-sm">There are no generated invoices for your business profile yet. Complete a transfer to generate one.</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {invoices.map((inv, idx) => (
              <motion.div
                 key={inv.Id || inv.ReferenceNumber || idx}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: idx * 0.05 }}
                 onClick={() => handleViewInvoice(inv)}
                 className="bg-surface border border-border rounded-2xl p-6 hover:bg-surface-hover/50 hover:border-primary/50 transition-all cursor-pointer group flex flex-col justify-between h-48 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform">
                  <Receipt className="w-24 h-24" />
                </div>
                
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-textSecondary">
                      {new Date(inv.TransferDateTime).toLocaleDateString()}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Paid</span>
                  </div>
                  <h3 className="text-lg font-semibold text-textPrimary truncate pr-4">To: {inv.RecipientName}</h3>
                  <div className="text-sm font-mono text-textSecondary mt-1">Ref: {inv.ReferenceNumber}</div>
                </div>
                
                <div className="flex items-end justify-between mt-4">
                  <div>
                    <span className="text-xs text-textSecondary">Total Amount</span>
                    <div className="text-2xl font-bold text-textPrimary">
                      {parseFloat(inv.TransactionAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-sm text-primary">{inv.AccountFromCurrency || 'SGD'}</span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-background text-primary transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      <InvoiceModal 
        isOpen={!!selectedInvoice} 
        onClose={() => setSelectedInvoice(null)} 
        transaction={selectedInvoice} 
      />
    </PageTransition>
  );
}
