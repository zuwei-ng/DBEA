import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { DocumentModal } from '../components/ui/DocumentModal';
import { useMockStore } from '../store/MockStore';
import { Check, Clock, Eye, Lock, Unlock, FileCheck, ArrowLeft, Loader2, Trash2, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { getCurrencyFlag } from '../lib/currencyUtils';
import confetti from 'canvas-confetti';

import { API_ENDPOINTS } from '../lib/api';

export default function EscrowDetail({ escrowId, onBack }) {
  const { updateMilestone, fetchAgreements } = useMockStore();
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [escrow, setEscrow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    Description: '',
    TransactionValue: '',
    Date: new Date().toISOString().split('T')[0]
  });

  const [showEditMilestone, setShowEditMilestone] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [savingMilestone, setSavingMilestone] = useState(false);
  const [deletingMilestone, setDeletingMilestone] = useState(false);

  const [showEditAgreement, setShowEditAgreement] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState(null);
  const [savingAgreement, setSavingAgreement] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [approvingMilestoneId, setApprovingMilestoneId] = useState(null);
  const [isFetchingFile, setIsFetchingFile] = useState(false);
  const [fetchingFileId, setFetchingFileId] = useState(null);
  const fetchEscrowDetails = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_ENDPOINTS.GET_ALL_INFO}?AgreementId=${escrowId}`);
      const data = await response.json();

      console.log("Raw API Response for", escrowId, ":", data);

      // Map API response with defensive checks
      if (!data || (!data.Agreement && !data.Id)) {
        setEscrow(null);
        return;
      }

      const mappedEscrow = {
        id: data.Agreement?.Id || data.Id || escrowId,
        title: data.Agreement?.Title || data.Title || 'Agreement Detail',
        description: data.Agreement?.Description || data.Description || '',
        contractor: data.Agreement?.ContractorAccountId || data.ContractorAccountId || 'Unknown Contractor',
        contractorUen: data.Agreement?.ContractorUen || data.ContractorUen || '',
        role: 'External Contractor',
        currency: data.Agreement?.Currency || data.Currency || 'USD',
        amount: data.Agreement?.TransactionValue || data.TransactionValue || 0,
        valuePaid: data.Agreement?.ValuePaid || data.ValuePaid || 0,
        status: data.Agreement?.Status || data.Status || 'Active',
        createdBy: "0000002892",
        effectiveDate: (data.Agreement?.EffectiveDate || data.EffectiveDate || '').split('T')[0],
        expiryDate: (data.Agreement?.ExpiryDate || data.ExpiryDate || '').split('T')[0],
        createdAt: data.Agreement?.CreatedAt || data.CreatedAt || '',
        milestones: (data.Milestones || [])
          .map(m => ({
            id: m.Id,
            title: m.Description,
            amount: m.TransactionValue,
            date: m.Date.split('T')[0],
            status: m.Status,
            originalStatus: m.Status
          }))
          .sort((a, b) => new Date(a.date) - new Date(b.date)),
        submissions: data.Submissions || []
      };

      setEscrow(mappedEscrow);
    } catch (error) {
      console.error("Failed to fetch escrow details:", error);
    } finally {
      setLoading(false);
    }
  }, [escrowId]);

  useEffect(() => {
    fetchEscrowDetails();
  }, [fetchEscrowDetails]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-12 h-12 text-primary" />
        </motion.div>
        <p className="text-textSecondary animate-pulse">Loading agreement information...</p>
      </div>
    );
  }

  if (!escrow) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-textSecondary">
        <p>Escrow agreement not found.</p>
        <Button variant="ghost" onClick={onBack} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
        </Button>
      </div>
    );
  }

  const milestones = escrow.milestones;
  const agreementTotal = milestones.reduce((sum, m) => sum + m.amount, 0);
  const paidTotal = escrow.valuePaid;


  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.DELETE_AGREEMENT}?AgreementId=${escrowId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchAgreements(); // Refresh global list
        onBack(); // Go back to list
      } else {
        console.error("Failed to delete agreement");
        alert("Found an issue deleting the agreement. Please try again.");
      }
    } catch (error) {
      console.error("Error during deletion:", error);
      alert("Network error. Please check your connection.");
    } finally {
      setIsDeleting(false);
    }
  };

  const submitMilestone = async () => {
    if (!newMilestone.Description || !newMilestone.TransactionValue || !newMilestone.Date) return;
    setAddingMilestone(true);
    try {
      const response = await fetch(API_ENDPOINTS.CREATE_MILESTONE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          AgreementId: escrowId,
          Milestone: {
            ...newMilestone,
            TransactionValue: parseFloat(newMilestone.TransactionValue),
            Status: ""
          }
        }),
      });

      if (response.ok) {
        setShowAddMilestone(false);
        setNewMilestone({ Description: '', TransactionValue: '', Date: new Date().toISOString().split('T')[0] });
        fetchEscrowDetails();
      } else {
        console.error("Failed to add milestone");
        alert("Found an issue adding the milestone. Please try again.");
      }
    } catch (error) {
      console.error("Error adding milestone:", error);
      alert("Network error. Please check your connection.");
    } finally {
      setAddingMilestone(false);
    }
  };

  const handleOpenEdit = (milestone) => {
    setEditingMilestone({
      Id: milestone.id,
      Description: milestone.title,
      TransactionValue: milestone.amount,
      Date: milestone.date,
      Status: milestone.originalStatus
    });
    setShowEditMilestone(true);
  };

  const submitEditMilestone = async () => {
    if (!editingMilestone.Description || !editingMilestone.TransactionValue || !editingMilestone.Date) return;
    setSavingMilestone(true);
    try {
      const response = await fetch(API_ENDPOINTS.UPDATE_MILESTONE, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          AgreementId: escrowId,
          ...editingMilestone,
          TransactionValue: parseFloat(editingMilestone.TransactionValue)
        }),
      });

      if (response.ok) {
        setShowEditMilestone(false);
        fetchEscrowDetails();
      } else {
        alert("Failed to update milestone.");
      }
    } catch (error) {
      console.error("Update error:", error);
    } finally {
      setSavingMilestone(false);
    }
  };

  const deleteMilestone = async () => {
    if (!confirm("Are you sure you want to delete this milestone?")) return;
    setDeletingMilestone(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.DELETE_MILESTONE}?MilestoneId=${editingMilestone.Id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setShowEditMilestone(false);
        fetchEscrowDetails();
      } else {
        alert("Failed to delete milestone.");
      }
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setDeletingMilestone(false);
    }
  };

  const handleOpenEditAgreement = () => {
    if (escrow.status === 'Active') return;
    setEditingAgreement({
      CreatedBy: "0000002892",
      Id: escrow.id,
      Title: escrow.title,
      Description: escrow.description,
      ContractorAccountId: escrow.contractor,
      ContractorUen: escrow.contractorUen,
      TransactionValue: escrow.amount,
      Currency: escrow.currency,
      Status: escrow.status,
      EffectiveDate: escrow.effectiveDate,
      ExpiryDate: escrow.expiryDate,
      CreatedAt: escrow.createdAt,
      ValuePaid: escrow.valuePaid
    });
    setShowEditAgreement(true);
  };

  const submitEditAgreement = async () => {
    if (escrow.status === 'Active') return;
    setSavingAgreement(true);
    try {
      const response = await fetch(API_ENDPOINTS.UPDATE_AGREEMENT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingAgreement,
          CreatedBy: "0000002892",
          TransactionValue: parseFloat(editingAgreement.TransactionValue),
          ValuePaid: editingAgreement.ValuePaid
        }),
      });

      if (response.ok) {
        setShowEditAgreement(false);
        fetchEscrowDetails();
      } else {
        alert("Failed to update agreement.");
      }
    } catch (error) {
      console.error("Update agreement error:", error);
    } finally {
      setSavingAgreement(false);
    }
  };

  const handleActivateAgreement = async () => {
    if (agreementTotal !== escrow.amount) return;
    setIsActivating(true);
    try {
      const response = await fetch(API_ENDPOINTS.ACTIVATE_AGREEMENT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          UpdateAgreementData: {
            Id: escrow.id,
            Title: escrow.title,
            Description: escrow.description,
            ContractorAccountId: escrow.contractor,
            ContractorUen: escrow.contractorUen,
            TransactionValue: parseFloat(escrow.amount),
            Currency: escrow.currency,
            Status: 'Active',
            EffectiveDate: escrow.effectiveDate,
            ExpiryDate: escrow.expiryDate,
            CreatedBy: "0000002892",
            CreatedAt: escrow.createdAt,
            ValuePaid: escrow.valuePaid
          },
          accountFrom: "0000006181"
        }),
      });

      if (response.ok) {
        console.log("Activation successful!");
        await fetchAgreements();
        fetchEscrowDetails();
      } else {
        const errorText = await response.text();
        console.error("Activation failed with status:", response.status, "Body:", errorText);
        alert(`Failed to activate agreement (Status: ${response.status}). The operation may have completed, but the server returned an error: ${errorText}`);
      }
    } catch (error) {
      console.error("Detailed Activation error:", error);
      alert(`Network error during activation: ${error.message}`);
    } finally {
      setIsActivating(false);
    }
  };

  const handleApprove = async (milestone) => {
    setApprovingMilestoneId(milestone.id);
    try {
      const payload = {
        AgreementData: {
          CreatedBy: escrow.createdBy,
          Id: escrow.id,
          Title: escrow.title,
          Description: escrow.description,
          ContractorAccountId: escrow.contractor,
          ContractorUen: escrow.contractorUen,
          TransactionValue: parseFloat(escrow.amount),
          Currency: escrow.currency,
          Status: escrow.status,
          EffectiveDate: escrow.effectiveDate,
          ExpiryDate: escrow.expiryDate,
          CreatedAt: escrow.createdAt,
          ValuePaid: parseFloat(escrow.valuePaid)
        },
        MilestoneData: {
          AgreementId: escrow.id,
          Id: milestone.id,
          Description: milestone.title,
          TransactionValue: parseFloat(milestone.amount),
          Date: milestone.date,
          Status: milestone.status
        }
      };

      const response = await fetch(API_ENDPOINTS.APPROVE_MILESTONE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await fetchEscrowDetails();
      } else {
        const errorText = await response.text();
        console.error('Failed to approve milestone:', response.status, errorText);
        alert(`Failed to approve milestone. Server returned: ${errorText}`);
      }
    } catch (error) {
      console.error('Error approving milestone:', error);
      alert('Network error while approving milestone.');
    } finally {
      setApprovingMilestoneId(null);
    }
  };


  const handlePreviewSubmission = async (submission) => {
    setIsFetchingFile(true);
    setFetchingFileId(submission.Id);
    try {
      const response = await fetch(API_ENDPOINTS.FETCH_FILE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Contacts-Key': API_ENDPOINTS.S3_API_KEY
        },
        body: JSON.stringify({
          folderName: "IS444Group2",
          subFolderName: "EscrowSubmissions",
          key: submission.Id
        })
      });

      const data = await response.json();
      const fileContent = data.file || data.File;

      if (fileContent) {
        // Convert base64 to Blob URL
        const byteCharacters = atob(fileContent);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const fileUrl = URL.createObjectURL(blob);

        setSelectedDoc({
          name: submission.FileName,
          url: fileUrl,
          id: submission.Id
        });
      } else {
        console.error("Vault Error: Received data but no file content", data);
        alert(`Could not retrieve file content. (Reference: ${submission.Id})`);
      }
    } catch (error) {
      console.error("Error fetching file:", error);
      alert("Failed to fetch file from vault.");
    } finally {
      setIsFetchingFile(false);
      setFetchingFileId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Grid - Aligns Title/Desc with Timeline Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-end mb-2">
        <div className="lg:col-span-1 flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 hover:bg-surface-hover rounded-2xl transition-all duration-300 text-textSecondary group shrink-0 border border-white/5 hover:border-white/10"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="space-y-0.5 min-w-0">
            <h1 className="text-3xl font-bold text-textPrimary tracking-tight truncate">{escrow.title}</h1>
            <p className="text-xs text-textSecondary truncate">Manage your escrow agreement</p>
          </div>
        </div>

        <div className="lg:col-span-2 flex justify-between items-center">
          <h2 className="text-xl font-bold">Milestone Timeline</h2>
          {escrow.status !== 'Active' && (
            <Button size="sm" onClick={() => setShowAddMilestone(!showAddMilestone)} variant={showAddMilestone ? 'ghost' : 'primary'}>
              {showAddMilestone ? 'Cancel' : <><Plus className="w-4 h-4 mr-2" /> Add Milestone</>}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-stretch relative">
        {/* Left Sidebar: Detailed Information */}
        <div className="lg:col-span-1 pb-8 lg:pb-0">

          <div className="sticky top-8 flex flex-col space-y-6">
            <div
              className={cn("transition-all duration-300 group/card relative", escrow.status !== 'Active' ? "cursor-pointer" : "cursor-default")}
              onClick={handleOpenEditAgreement}
            >
              {/* Vertical Divider Line - Attached to Card with padding */}
              <div className="hidden lg:block absolute -right-6 top-8 bottom-8 w-[1.5px] bg-slate-300/70 z-10" />

              <div className={cn(
                "p-6 rounded-2xl border transition-all duration-500 relative overflow-hidden bg-white shadow-sm flex flex-col",
                escrow.status !== 'Active' ? "hover:border-primary/40 hover:shadow-xl border-border/60" : "border-border/40"
              )}>
                <div className="absolute -right-20 -top-20 w-40 h-40 bg-primary/5 blur-[60px] rounded-full group-hover/card:bg-primary/10 transition-colors pointer-events-none" />
                <div className="flex items-start gap-4 mb-6 relative z-10">
                  <div className={cn(
                    "p-3 rounded-2xl border transition-all duration-300 shrink-0",
                    escrow.status === 'Active' ? "bg-primary border-primary shadow-glow" : "bg-primary/10 border-primary/20"
                  )}>
                    {escrow.status === 'Draft' && <Unlock className="w-6 h-6 text-primary" />}
                    {escrow.status === 'Active' && <Lock className="w-6 h-6 text-white" />}
                    {(escrow.status === 'Completed' || escrow.status === 'Finished') && <Check className="w-6 h-6 text-primary" />}
                    {(!['Draft', 'Active', 'Completed', 'Finished'].includes(escrow.status)) && <Lock className="w-6 h-6 text-primary" />}
                  </div>
                  <div className="flex flex-col pt-1">
                    <h3 className={cn(
                      "text-lg font-semibold transition-colors leading-tight",
                      escrow.status !== 'Active' && "group-hover/card:text-primary"
                    )}>
                      Agreement Details
                    </h3>
                    <p className="text-[10px] font-mono text-textSecondary/60 uppercase tracking-tight mt-1">
                      ID: {escrow.id}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="border-b border-white/5 pb-5">
                    <p className="text-sm text-textPrimary leading-relaxed italic">{escrow.description || 'No description provided for this agreement.'}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider w-30">Contractor Account ID</span>
                      <span className="font-medium text-textPrimary">{escrow.contractor}</span>
                    </div>
                    {escrow.contractorUen && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider w-30">Contractor UEN</span>
                        <span className="font-medium text-textPrimary">{escrow.contractorUen}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider w-30">Currency</span>
                      <span className="font-medium text-primary flex items-center gap-1">
                        {getCurrencyFlag(escrow.currency)} {escrow.currency}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider w-30">Effective Date</span>
                      <span className="font-medium text-textPrimary">{escrow.effectiveDate || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider w-30">Expiration Date</span>
                      <span className="font-medium text-textPrimary">{escrow.expiryDate || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm pb-3">
                      <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider w-30">Status</span>
                      <span className={cn(
                        "px-2 rounded-full text-[9px] font-bold uppercase tracking-tight",
                        escrow.status === 'Active' ? "bg-emerald-500/10 text-emerald-600" :
                          escrow.status === 'Draft' ? "bg-amber-500/10 text-amber-600" :
                            "bg-slate-100 text-slate-500"
                      )}>
                        {escrow.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 p-5 rounded-2xl border border-primary/20 space-y-2 relative overflow-hidden mt-4">
                  <span className="text-sm text-textSecondary relative z-10">Agreement Value</span>
                  <div className="text-3xl font-bold text-textPrimary relative z-10">${escrow.amount.toLocaleString()}</div>

                  <div className="w-full bg-surface-hover/20 rounded-full h-2 mt-5 relative z-10 overflow-hidden border border-border transition-colors">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(paidTotal / escrow.amount) * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="bg-primary h-full shadow-[0_0_10px_var(--glow-color)]"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-textSecondary mt-2 font-medium relative z-10">
                    <span className="text-primary">${paidTotal.toLocaleString()} Released</span>
                    <span>${(escrow.amount - paidTotal).toLocaleString()} Remaining</span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-white/5 mt-2">
                  <div className="flex items-start text-textSecondary text-[13px] bg-surface-hover/15 px-2.5 py-0.5 rounded-xl border border-white/5 mb-4">
                    <p className="leading-tight">Funds are secured in an insulated smart wallet and cannot be accessed by the contractor until you manually release payment.</p>
                  </div>

                  {escrow.status === 'Draft' && (
                    <div className="space-y-3">
                      <Button
                        className="w-full"
                        pulse={agreementTotal === escrow.amount}
                        disabled={agreementTotal !== escrow.amount || isActivating}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActivateAgreement();
                        }}
                      >
                        {isActivating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                        {isActivating ? 'Activating...' : 'Activate Agreement'}
                      </Button>

                      {agreementTotal !== escrow.amount && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex gap-2 items-start animate-in fade-in slide-in-from-top-2">
                          <Clock className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-red-600 font-medium leading-relaxed">
                            Allocation mismatch: Milestones sum to <strong>${agreementTotal.toLocaleString()}</strong>, but agreement value is <strong>${escrow.amount.toLocaleString()}</strong>.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col h-[calc(100vh-210px)] max-h-[800px]">
          <div className="flex-1 overflow-y-auto scrollbar-hide pr-2 pt-4 -mt-4">
            <div className="space-y-6 pb-12">

              {milestones.length > 0 ? (
                milestones.map((milestone, idx) => {
                  const isPaid = milestone.status === 'Paid';
                  const isApproved = milestone.status === 'Approved';
                  const isPending = milestone.status === 'Pending';

                  return (
                    <motion.div
                      key={milestone.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + (idx * 0.05) }}
                      className="relative group/row"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative items-center">
                        {/* Horizontal Connector Line (Desktop) */}
                        <div className="hidden lg:block absolute left-1/2 -translate-x-1/2 w-3 h-[1.5px] bg-slate-300/70 group-hover/row:bg-primary/50 transition-colors z-20" />

                        {/* Milestone Detail Card */}
                        <div
                          className={cn("transition-all duration-300 h-full group/card", escrow.status !== 'Active' ? "cursor-pointer" : "cursor-default")}
                          onClick={() => escrow.status !== 'Active' && handleOpenEdit(milestone)}
                        >
                          <div className={cn(
                            "p-6 h-[240px] rounded-2xl border transition-all duration-500 relative overflow-hidden bg-white shadow-sm flex flex-col",
                            escrow.status !== 'Active' ? "hover:border-primary/40 hover:shadow-xl border-border/60" : "border-border/40"
                          )}>
                            <div className="absolute -right-20 -top-20 w-40 h-40 bg-primary/5 blur-[60px] rounded-full group-hover/card:bg-primary/10 transition-colors pointer-events-none" />
                            <div className="flex justify-between items-start mb-6 relative z-10">
                              <div className="space-y-1.5 min-w-0">
                                <h4 className={cn(
                                  "text-lg font-semibold transition-colors leading-tight",
                                  escrow.status !== 'Active' && "group-hover/card:text-primary"
                                )}>
                                  {milestone.title}
                                </h4>
                                <p className="text-[10px] font-mono text-textSecondary/60 uppercase tracking-tight mt-1">ID: {milestone.id}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Value</p>
                                <p className="text-lg font-bold text-slate-900 tracking-tight">
                                  ${milestone.amount.toLocaleString()}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-2.5 flex-1 mb-6">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider w-30">Status</span>
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight",
                                  isApproved || isPaid ? "bg-emerald-500/10 text-emerald-600" :
                                    "bg-slate-100 text-slate-500"
                                )}>
                                  {milestone.status}
                                </span>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider w-30">Due</span>
                                <span className="text-[11px] font-medium text-textPrimary uppercase">
                                  {new Date(milestone.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </div>
                            </div>

                            <div>
                              {isPending && escrow.status === 'Active' && (
                                <Button
                                  size="sm"
                                  className="w-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 shadow-none font-bold py-2 rounded-lg"
                                  disabled={approvingMilestoneId !== null}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApprove(milestone);
                                  }}
                                >
                                  {approvingMilestoneId === milestone.id ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-2" />}
                                  {approvingMilestoneId === milestone.id ? 'Approving...' : 'Approve Work'}
                                </Button>
                              )}

                              {(isApproved || isPaid) && (
                                <div className="text-center py-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                                  <span className="text-[10px] font-bold text-emerald-600 uppercase">Payment Released</span>
                                </div>
                              )}

                              {isPending && escrow.status !== 'Active' && (
                                <div className="text-center py-2 bg-slate-50 rounded-lg border border-slate-100">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase italic">Awaiting Activation</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Horizontal Connector Line (Mobile) */}
                        <div className="lg:hidden flex justify-center -my-4 relative z-10">
                          <div className="w-6 h-[1.5px] bg-slate-300/70 group-hover/row:bg-primary/50 transition-colors" />
                        </div>

                        {/* Submissions registry list */}
                        <SubmissionTracker
                          key={`sub-${milestone.id}`}
                          submissions={escrow.submissions.filter(s => s.MilestoneId?.toLowerCase() === milestone.id?.toLowerCase())}
                          onPreview={handlePreviewSubmission}
                          fetchingFileId={fetchingFileId}
                        />
                      </div>
                    </motion.div>
                  )
                })
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="p-4 bg-surface-hover/20 rounded-full mb-4 border border-white/5">
                    <Clock className="w-8 h-8 text-textSecondary" />
                  </div>
                  <h3 className="text-lg font-bold text-textPrimary mb-1">No Milestones Defined</h3>
                  <p className="text-sm text-textSecondary max-w-xs">
                    This agreement currently has no milestones setup. Contact the contractor to define your agreement phases.
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {createPortal(
        <DocumentModal
          isOpen={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          document={selectedDoc}
        />,
        document.body
      )}

      {/* Add Milestone Modal */}
      {createPortal(
        <AnimatePresence>
          {showAddMilestone && (
            <div className="fixed top-16 left-0 md:left-64 bottom-0 right-0 z-50 flex items-center justify-center p-4 overflow-hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-md"
                onClick={() => setShowAddMilestone(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg"
              >
                <GlassCard className="modal-panel p-8 shadow-none border-none">
                  <h3 className="text-2xl font-bold mb-6">Add New Milestone</h3>
                  <div className="space-y-5">
                    <div>
                      <label className="text-sm font-bold text-textSecondary uppercase tracking-wider mb-2 flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-primary" /> Description
                      </label>
                      <textarea
                        rows={3}
                        className="w-full bg-surface-hover/60 border border-border/80 rounded-xl px-4 py-3 text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-textSecondary/50"
                        placeholder="e.g. Agreement signature and repository access granted..."
                        value={newMilestone.Description}
                        onChange={e => setNewMilestone({ ...newMilestone, Description: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-bold text-textSecondary uppercase tracking-wider mb-2 block">Value</label>
                        <div className="relative">
                          <input
                            type="number"
                            placeholder="0.00"
                            className="w-full bg-surface-hover/60 border border-border/80 rounded-xl pl-10 pr-4 py-3 text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-textSecondary/50"
                            value={newMilestone.TransactionValue}
                            onChange={e => setNewMilestone({ ...newMilestone, TransactionValue: e.target.value })}
                          />
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-textSecondary">$</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-bold text-textSecondary uppercase tracking-wider mb-2 block">Expected Date</label>
                        <input
                          type="date"
                          className="w-full bg-surface-hover/60 border border-border/80 rounded-xl px-4 py-3 text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                          value={newMilestone.Date}
                          onChange={e => setNewMilestone({ ...newMilestone, Date: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="pt-6 mt-2 border-t border-white/5 flex gap-4">
                      <Button variant="ghost" onClick={() => setShowAddMilestone(false)}>Cancel</Button>
                      <Button className="flex-1" onClick={submitMilestone} disabled={addingMilestone} pulse>
                        {addingMilestone ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        {addingMilestone ? 'Creating Phase...' : 'Create Milestone'}
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Edit/Delete Milestone Modal */}
      {createPortal(
        <AnimatePresence>
          {showEditMilestone && editingMilestone && (
            <div className="fixed top-16 left-0 md:left-64 bottom-0 right-0 z-50 flex items-center justify-center p-4 overflow-hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-md"
                onClick={() => setShowEditMilestone(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg"
              >
                <GlassCard className="modal-panel p-8 shadow-none border-none">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold">{escrow.status === 'Active' ? 'Milestone Details' : 'Edit Milestone'}</h3>
                    {escrow.status !== 'Active' && (
                      <button
                        onClick={deleteMilestone}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                      >
                        {deletingMilestone ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Delete
                      </button>
                    )}
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="text-sm font-bold text-textSecondary uppercase tracking-wider mb-2 flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-primary" /> Description
                      </label>
                      <textarea
                        rows={3}
                        className="w-full bg-surface-hover/60 border border-border/80 rounded-xl px-4 py-3 text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-textSecondary/50 disabled:opacity-70 disabled:grayscale-[0.5]"
                        value={editingMilestone.Description}
                        disabled={escrow.status === 'Active'}
                        onChange={e => setEditingMilestone({ ...editingMilestone, Description: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-bold text-textSecondary uppercase tracking-wider mb-2 block">Value</label>
                        <div className="relative">
                          <input
                            type="number"
                            className="w-full bg-surface-hover/60 border border-border/80 rounded-xl pl-10 pr-4 py-3 text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-70"
                            value={editingMilestone.TransactionValue}
                            disabled={escrow.status === 'Active'}
                            onChange={e => setEditingMilestone({ ...editingMilestone, TransactionValue: e.target.value })}
                          />
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-textSecondary">$</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-bold text-textSecondary uppercase tracking-wider mb-2 block">Expected Date</label>
                        <input
                          type="date"
                          className="w-full bg-surface-hover/60 border border-border/80 rounded-xl px-4 py-3 text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-70"
                          value={editingMilestone.Date}
                          disabled={escrow.status === 'Active'}
                          onChange={e => setEditingMilestone({ ...editingMilestone, Date: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="pt-6 mt-2 border-t border-white/5 flex gap-4">
                      <Button variant="ghost" className="flex-1" onClick={() => setShowEditMilestone(false)}>{escrow.status === 'Active' ? 'Close' : 'Cancel'}</Button>
                      {escrow.status !== 'Active' && (
                        <Button className="flex-1" onClick={submitEditMilestone} disabled={savingMilestone} pulse>
                          {savingMilestone ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          {savingMilestone ? 'Saving Changes...' : 'Update Milestone'}
                        </Button>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
      {/* Edit Agreement Modal */}
      {createPortal(
        <AnimatePresence>
          {showEditAgreement && editingAgreement && (
            <div className="fixed top-16 left-0 md:left-64 bottom-0 right-0 z-50 flex items-center justify-center p-4 overflow-hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-md"
                onClick={() => setShowEditAgreement(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide"
              >
                <GlassCard className="modal-panel p-8 shadow-none border-none">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-2xl font-bold">Manage Agreement</h3>
                      <p className="text-xs text-textSecondary uppercase font-mono mt-1">ID: {editingAgreement.Id}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting || escrow.status === 'Active'}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:grayscale"
                      >
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Delete Agreement
                      </button>
                      <p className="text-[9px] text-textSecondary text-right max-w-[190px]">
                        Only draft or completed agreements can be edited or deleted.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="col-span-2">
                        <label className="text-[11px] font-bold text-textSecondary uppercase tracking-wider mb-2 block">Agreement Title</label>
                        <input
                          className="w-full bg-surface-hover/60 border border-border/80 rounded-xl px-4 py-3 text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium disabled:opacity-50 disabled:grayscale"
                          value={editingAgreement.Title}
                          disabled={escrow.status === 'Active'}
                          onChange={e => setEditingAgreement({ ...editingAgreement, Title: e.target.value })}
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-[11px] font-bold text-textSecondary uppercase tracking-wider mb-2 block">Description</label>
                        <textarea
                          rows={2}
                          className="w-full bg-surface-hover/60 border border-border/80 rounded-xl px-4 py-3 text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-sans text-sm disabled:opacity-50 disabled:grayscale"
                          value={editingAgreement.Description}
                          disabled={escrow.status === 'Active'}
                          onChange={e => setEditingAgreement({ ...editingAgreement, Description: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="text-[11px] font-bold text-textSecondary uppercase tracking-wider mb-2 block">Contractor Account ID</label>
                          <input
                            className="w-full bg-surface-hover/60 border border-border/80 rounded-xl px-4 py-3 text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all uppercase font-mono disabled:opacity-50 disabled:grayscale"
                            value={editingAgreement.ContractorAccountId}
                            disabled={escrow.status === 'Active'}
                            onChange={e => setEditingAgreement({ ...editingAgreement, ContractorAccountId: e.target.value })}
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-textSecondary uppercase tracking-wider mb-2 block">Contractor UEN</label>
                          <input
                            className="w-full bg-surface-hover/60 border border-border/80 rounded-xl px-4 py-3 text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono disabled:opacity-50 disabled:grayscale"
                            value={editingAgreement.ContractorUen || ''}
                            disabled={escrow.status === 'Active'}
                            onChange={e => setEditingAgreement({ ...editingAgreement, ContractorUen: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-textSecondary uppercase tracking-wider mb-2 block">Currency</label>
                        <select
                          className="w-full bg-surface-hover/60 border border-border/80 rounded-xl px-4 py-3 text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:grayscale"
                          value={editingAgreement.Currency}
                          disabled={escrow.status === 'Active'}
                          onChange={e => setEditingAgreement({ ...editingAgreement, Currency: e.target.value })}
                        >
                          {['USD', 'EUR', 'GBP', 'SGD', 'JPY'].map(cur => (
                            <option key={cur} value={cur} className="bg-background">{cur}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-2">
                      <div>
                        <label className="text-[11px] font-bold text-textSecondary uppercase tracking-wider mb-2 block">Total Value</label>
                        <div className="relative">
                          <input
                            type="number"
                            className="w-full bg-surface-hover/60 border border-border/80 rounded-xl pl-10 pr-4 py-3 text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium disabled:opacity-50 disabled:grayscale"
                            value={editingAgreement.TransactionValue}
                            disabled={escrow.status === 'Active'}
                            onChange={e => setEditingAgreement({ ...editingAgreement, TransactionValue: e.target.value })}
                          />
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-textSecondary">$</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-textSecondary uppercase tracking-wider mb-2 block">Effective</label>
                        <input
                          type="date"
                          className="w-full bg-surface-hover/60 border border-border/80 rounded-xl px-3 py-3 text-sm text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50 disabled:grayscale"
                          value={editingAgreement.EffectiveDate}
                          disabled={escrow.status === 'Active'}
                          onChange={e => setEditingAgreement({ ...editingAgreement, EffectiveDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-textSecondary uppercase tracking-wider mb-2 block">Expiry</label>
                        <input
                          type="date"
                          className="w-full bg-surface-hover/60 border border-border/80 rounded-xl px-3 py-3 text-sm text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50 disabled:grayscale"
                          value={editingAgreement.ExpiryDate}
                          disabled={escrow.status === 'Active'}
                          onChange={e => setEditingAgreement({ ...editingAgreement, ExpiryDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="pt-6 mt-4 border-t border-white/5 flex gap-4">
                      <Button variant="ghost" onClick={() => setShowEditAgreement(false)}>Cancel</Button>
                      <Button
                        className="flex-1"
                        onClick={submitEditAgreement}
                        disabled={savingAgreement || escrow.status === 'Active'}
                        pulse={escrow.status !== 'Active'}
                      >
                        {savingAgreement ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        {savingAgreement ? 'Updating Details...' : 'Update Agreement'}
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

// Sub-component for displaying submissions for a specific milestone
function SubmissionTracker({ submissions = [], onPreview, fetchingFileId }) {
  return (
    <div className="bg-white border border-border/40 rounded-2xl p-6 shadow-sm flex flex-col h-[240px]">
      <div className="flex justify-between items-center mb-4">
        <h5 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest">Submissions</h5>
        <div className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-500">
          {submissions.length} FILES
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide pr-1 max-h-[160px]">
        {submissions.length > 0 ? (
          submissions.map((sub) => {
            const isLoading = fetchingFileId === sub.Id;
            return (
              <div
                key={sub.Id || `sub-${Math.random()}`}
                className={cn(
                  "group flex items-center justify-between p-3 bg-white border border-border/50 rounded-xl transition-all shadow-sm",
                  isLoading ? "opacity-70 pointer-events-none" : "hover:border-primary/30 cursor-pointer"
                )}
                onClick={() => onPreview(sub)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    "p-2 rounded-lg transition-colors",
                    isLoading ? "bg-primary/10" : "bg-slate-50 group-hover:bg-primary/5"
                  )}>
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                    ) : (
                      <FileCheck className="w-3.5 h-3.5 text-textSecondary group-hover:text-primary transition-colors" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-textPrimary truncate">{sub.FileName}</p>
                    <p className="text-[9px] text-textSecondary mt-0.5">
                      {new Date(sub.CreatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                {!isLoading && <Eye className="w-3.5 h-3.5 text-textSecondary opacity-0 group-hover:opacity-100 transition-opacity" />}
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-8 opacity-40 grayscale">
            <div className="p-2 bg-slate-100 rounded-full mb-2">
              <Plus className="w-4 h-4 text-slate-400 rotate-45" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">No files uploaded</p>
          </div>
        )}
      </div>
    </div>
  );
}
