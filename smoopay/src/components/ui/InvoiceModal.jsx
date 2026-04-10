import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Download, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from './Button';
import html2pdf from 'html2pdf.js';

export function InvoiceModal({ isOpen, onClose, transaction }) {
  if (!isOpen || !transaction) return null;

  const invoiceNumber = `INV-${Math.abs(transaction.amount * 100).toString().substring(0,6)}-${new Date().getFullYear()}`;
  const isPaid = transaction.status === 'Completed' || transaction.status === 'Paid';
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const element = document.getElementById('invoice-document');
      const opt = {
        margin: [0.5, 0.5],
        filename: `${invoiceNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const amountToDisplay = transaction.TransactionAmount ? parseFloat(transaction.TransactionAmount) : Math.abs(transaction.amount || 0);
  const feeDeducted = transaction.FeeDeducted ? parseFloat(transaction.FeeDeducted) : 0;
  const totalAmount = amountToDisplay + feeDeducted;
  
  const fromCurrency = transaction.AccountFromCurrency || transaction.currency;
  const toCurrency = transaction.AccountToCurrency;
  
  const transferrerName = transaction.TransferrerName || "Corporate Account";
  const recipientName = transaction.RecipientName || transaction.description?.replace?.('Transfer to ', '') || "Beneficiary";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 print:p-0">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/90 backdrop-blur-md print:hidden"
        />
        
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden print:w-full print:h-screen print:max-h-screen print:border-none print:shadow-none print:rounded-none"
        >
          {/* Header Controls */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40 pr-6 print:hidden">
            <div className="flex items-center gap-3">
               <h3 className="font-semibold text-white text-lg">Invoice {invoiceNumber}</h3>
               {isPaid && <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> PAID</span>}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" className="hidden sm:flex border border-white/20 hover:border-white/40" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-2" /> Print
              </Button>
              <Button variant="primary" size="sm" className="hidden sm:flex transition-all hover:scale-105 shadow-glow" onClick={handleDownloadPDF} disabled={isDownloading}>
                {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />} 
                {isDownloading ? 'Generating...' : 'PDF'}
              </Button>
              <div className="w-px h-6 bg-[#ffffff]/10 mx-2"></div>
              <button onClick={onClose} className="p-2 text-textSecondary hover:text-white hover:bg-[#ffffff]/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Invoice Paper Wrapper - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-black/60 print:bg-[#ffffff] print:p-0 print:overflow-visible">
             
             {/* The Invoice Document */}
             <div id="invoice-document" className="mx-auto bg-[#ffffff] w-full max-w-3xl min-h-[800px] h-max shadow-2xl rounded-sm p-10 sm:p-16 text-gray-800 relative isolate print:shadow-none print:m-0 print:w-full">
                {/* Watermark */}
                {isPaid && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-[0.03] z-0">
                    <span className="text-9xl font-black transform -rotate-45 tracking-widest text-emerald-600">PAID</span>
                  </div>
                )}
                
                {/* Header Section */}
                <div className="flex justify-between items-start mb-16 relative z-10 whitespace-nowrap">
                  <div>
                    <div className="flex items-center gap-2 text-primary font-bold text-3xl tracking-tight mb-6">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-lg print:border print:border-gray-200">
                        S
                      </div>
                      <span className="text-gray-900">SmooPay</span>
                    </div>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>100 FinTech Boulevard</p>
                      <p>Financial District, NY 10004</p>
                      <p>United States</p>
                      <p className="mt-2">VAT: US123456789</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <h1 className="text-4xl font-light text-gray-400 mb-6 tracking-wider">INVOICE</h1>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-left ml-auto w-[240px]">
                      <span className="text-gray-500 text-right">Invoice No:</span>
                      <span className="font-medium text-gray-900 text-right">{invoiceNumber}</span>
                      <span className="text-gray-500 text-right">Date Issued:</span>
                      <span className="font-medium text-gray-900 text-right">{transaction.date}</span>
                      <span className="text-gray-500 text-right">Due Date:</span>
                      <span className="font-medium text-gray-900 text-right">Paid on Receipt</span>
                    </div>
                  </div>
                </div>

                {/* Bill To */}
                <div className="mb-12 relative z-10 flex justify-between gap-8">
                  <div className="flex-1">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-100 pb-2">Billed To</h3>
                    <p className="font-bold text-lg text-gray-900">{transferrerName}</p>
                    <div className="text-sm text-gray-500 mt-1 space-y-1">
                      <p>Account: {transaction.AccountFrom || "Default Wallet"}</p>
                      <p>Currency Base: {fromCurrency}</p>
                    </div>
                  </div>
                  <div className="flex-1 text-right">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-100 pb-2">Transfer Recipient</h3>
                    <p className="font-bold text-lg text-gray-900">{recipientName}</p>
                    <div className="text-sm text-gray-500 mt-1 space-y-1">
                      <p>Account: {transaction.AccountTo || "Beneficiary Wallet"}</p>
                      {toCurrency && <p>Receiving Currency: {toCurrency}</p>}
                    </div>
                  </div>
                </div>

                {/* Line Items */}
                <div className="mb-12 relative z-10 w-full">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-800 text-gray-900">
                        <th className="py-3 font-semibold w-2/3">Description</th>
                        <th className="py-3 font-semibold text-center">Qty</th>
                        <th className="py-3 font-semibold text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-600 divide-y divide-gray-100">
                      <tr>
                        <td className="py-4">
                          <p className="font-medium text-gray-900">Principal Transfer Amount</p>
                          <p className="text-xs text-gray-400 mt-1">Narrative: {transaction.Narrative || transaction.narrative || "Funds Transfer"}</p>
                        </td>
                        <td className="py-4 text-center">1</td>
                        <td className="py-4 text-right font-medium">{amountToDisplay.toLocaleString(undefined, {minimumFractionDigits:2})} {fromCurrency}</td>
                      </tr>
                      {feeDeducted > 0 && (
                        <tr>
                          <td className="py-4">
                            <p className="font-medium text-gray-900">Operator / Network Fee</p>
                            <p className="text-xs text-gray-400 mt-1">Code: {transaction.FeeCode || "STANDARD_FEE"}</p>
                          </td>
                          <td className="py-4 text-center">1</td>
                          <td className="py-4 text-right font-medium">{feeDeducted.toLocaleString(undefined, {minimumFractionDigits:2})} {fromCurrency}</td>
                        </tr>
                      )}
                      {toCurrency && toCurrency !== fromCurrency && (
                        <tr>
                          <td className="py-4 border-b border-gray-100" colSpan={3}>
                            <p className="text-xs text-cyan-600 font-medium">Note: Destination account will be dynamically credited in <strong>{toCurrency}</strong> subject to prevailing exchange rates.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Totals Calculation */}
                <div className="flex justify-end relative z-10">
                  <div className="w-full sm:w-1/2">
                    <div className="space-y-3 text-sm text-gray-500">
                      <div className="flex justify-between">
                        <span>Transfer Base</span>
                        <span className="font-medium text-gray-900">{amountToDisplay.toLocaleString(undefined, {minimumFractionDigits:2})} {fromCurrency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Transaction Fees</span>
                        <span className="font-medium text-gray-900">{feeDeducted.toLocaleString(undefined, {minimumFractionDigits:2})} {fromCurrency}</span>
                      </div>
                      <div className="flex justify-between items-center border-t-2 border-gray-800 pt-3 mt-3">
                        <span className="font-bold text-gray-900 text-base">Total {isPaid ? 'Deducted' : 'Due'}</span>
                        <span className="font-bold text-cyan-600 text-xl">{totalAmount.toLocaleString(undefined, {minimumFractionDigits:2})} {fromCurrency}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Section */}
                <div className="mt-24 pt-8 border-t border-gray-100 text-xs text-gray-400 text-center relative z-10">
                  <p>This is a computer-generated transactional record. No signature is required.</p>
                  <p className="mt-1 font-medium">SmooPay Platform Services • support@smoopay.app • +1 (800) 123-4567</p>
                </div>

             </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
