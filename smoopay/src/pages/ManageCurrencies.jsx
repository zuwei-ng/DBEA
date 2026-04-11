import React, { useState } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { UploadCloud, File, Activity, ShieldCheck, Lock, Unlock, BadgeCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useMockStore } from '../store/MockStore';

export default function ManageCurrencies() {
  const { user } = useMockStore();

  const [status, setStatus] = useState('idle'); // idle, scanning, success
  const [scanProgress, setScanProgress] = useState(0);
  const [codeStrings, setCodeStrings] = useState([]);
  
  // Each file entry: { file: File, isBalanceSheet: bool, isIncomeStatement: bool, isCashflow: bool }
  const [fileEntries, setFileEntries] = useState([]);
  const [apiOutput, setApiOutput] = useState(null);

  const mockCodeStrings = [
    "UPLOADING_DOCUMENTS...",
    "EXTRACTING_FINANCIAL_DATA...",
    "ANALYZING_CASH_FLOW...",
    "VERIFYING_BALANCE_SHEET...",
    "CALCULATING_CREDIT_SCORE...",
    ...(user?.ficoScore ? [`CACHED_FICO_SCORE_RETRIEVED: ${JSON.stringify(user.ficoScore)}`] : ["CONTACTING_CREDIT_BUREAU..."]),
    "EVALUATING_RISK_PROFILE...",
    "CREDIT_EVALUATION_COMPLETE: APPROVED",
    "CLEARANCE_GRANTED."
  ];

  const handleDrop = (e) => {
    e.preventDefault();
    if (status !== 'idle') return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newEntries = Array.from(e.dataTransfer.files).map(file => ({
        file,
        isBalanceSheet: false,
        isIncomeStatement: false,
        isCashflow: false
      }));
      setFileEntries(prev => [...prev, ...newEntries]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newEntries = Array.from(e.target.files).map(file => ({
        file,
        isBalanceSheet: false,
        isIncomeStatement: false,
        isCashflow: false
      }));
      setFileEntries(prev => [...prev, ...newEntries]);
      // Reset input so same file can be re-added
      e.target.value = '';
    }
  };

  const removeFile = (index) => {
    setFileEntries(prev => prev.filter((_, i) => i !== index));
  };

  const updateFileEntry = (index, field, value) => {
    setFileEntries(prev => prev.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    ));
  };

  const getBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
  });

  const handleSubmit = async () => {
    if (fileEntries.length === 0) return;
    
    setStatus('scanning');
    setScanProgress(0);
    setCodeStrings([`UPLOADING_${fileEntries.length}_DOCUMENT(S)...`]);
    
    let currentProgress = 0;
    let logIndex = 1;

    const interval = setInterval(() => {
      currentProgress += Math.random() * 8 + 2;
      if (currentProgress < 90) {
        setScanProgress(currentProgress);
        if (logIndex < mockCodeStrings.length && currentProgress > (logIndex * 10)) {
          setCodeStrings(prev => [...prev, mockCodeStrings[logIndex]]);
          logIndex++;
        }
      }
    }, 250);

    try {
      const customerId = user?.customerId || 'DEMO-CUST';
      const businessName = user?.profileData?.givenName || user?.name || user?.uen || 'DemoBusiness';
      
      // Build payload array from all file entries
      const payload = await Promise.all(
        fileEntries.map(async (entry) => {
          const base64File = await getBase64(entry.file);
          return {
            FolderName: "IS444Group2",
            SubfolderName: businessName,
            FileName: entry.file.name,
            File: base64File,
            isBalanceSheet: entry.isBalanceSheet,
            isIncomeStatement: entry.isIncomeStatement,
            isCashflow: entry.isCashflow
          };
        })
      );

      console.log('=== DEBUG: CalcCreditScore ===');
      console.log('CustomerId:', customerId);
      console.log('BusinessName:', businessName);
      console.log('Files:', fileEntries.map(e => e.file.name));
      console.log('Payload entries:', payload.length);

      const url = `https://smuedu-dev.outsystemsenterprise.com/CreditScoring/rest/CreditEvaluationAPI/CalcCreditScore?CustomerId=${encodeURIComponent(customerId)}&RuleVersion=0&ForceRefresh=true`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Contacts-Key': '79a7f4cc-3ddc-4f8c-b1f3-557c7ff73af7'
        },
        body: JSON.stringify(payload)
      });

      console.log('Response Status:', response.status, response.statusText);

      let data;
      try {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch (e) {
          data = text;
        }
      } catch (e) {
        data = "Unable to read response body";
      }

      if (!response.ok) {
        console.error('API Error Response:', data);
        setApiOutput({ error: 'Upload failed', details: data });
        clearInterval(interval);
        setScanProgress(100);
        setCodeStrings(prev => [...prev, "ERROR_DURING_EVALUATION"]);
        setTimeout(() => setStatus('success'), 1000);
        return;
      }
      
      console.log('CalcCreditScore Process ID:', data);
      let processId = typeof data === 'object' ? (data.ProcessId || data.processId || data.Id || JSON.stringify(data)) : data;
      setCodeStrings(prev => [...prev, `PROCESS_ID: ${processId}`, "CHECKING_CALCULATION_PROGRESS..."]);
      
      let calculationComplete = false;
      let isError = false;
      let polls = 0;
      let maxPolls = 60; // Up to 3 minutes
      
      while (!calculationComplete && !isError && polls < maxPolls) {
        polls++;
        await new Promise(resolve => setTimeout(resolve, 3000)); // Poll every 3 seconds
        
        try {
          const progressUrl = `https://smuedu-dev.outsystemsenterprise.com/CreditScoring/rest/CreditEvaluationAPI/CheckCalcProgress?ProcessId=${encodeURIComponent(processId)}`;
          const progressResponse = await fetch(progressUrl, {
            method: 'GET',
            headers: { 'X-Contacts-Key': '79a7f4cc-3ddc-4f8c-b1f3-557c7ff73af7' }
          });
          
          const progressText = await progressResponse.text();
          let statusCode = progressResponse.status;
          let message = progressText;

          let progressData = null;
          try {
            progressData = JSON.parse(progressText);
            if (progressData && typeof progressData === 'object') {
              if (progressData.StatusCode !== undefined) statusCode = parseInt(progressData.StatusCode);
              else if (progressData.statusCode !== undefined) statusCode = parseInt(progressData.statusCode);
              else if (progressData.Status !== undefined) statusCode = parseInt(progressData.Status);
              else if (progressData.code !== undefined) statusCode = parseInt(progressData.code);
              
              if (progressData.Message !== undefined) message = progressData.Message;
              else if (progressData.message !== undefined) message = progressData.message;
            }
          } catch(e) {}
          
          console.log(`Progress check ${polls} - Raw HTTP Status: ${progressResponse.status}, Parsed Code: ${statusCode}, Message: ${message}`);
          
          const textLower = progressText.toLowerCase();
          const isErrorCalc = statusCode === 206 || textLower.includes('206') || textLower.includes('error calculation');
          const isComplete = (statusCode === 200 || textLower.includes('200')) && (textLower.includes('calculation completed') || textLower.includes('complete') || textLower.includes('closed')) && !textLower.includes('ongoing');
          const isOngoingMsg = statusCode === 102 || textLower.includes('102') || textLower.includes('ongoing calculation') || textLower.includes('ongoing');
          
          // If we can't strongly identify complete or error, we assume it's still ongoing!
          const isActuallyOngoing = isOngoingMsg || (!isComplete && !isErrorCalc);

          if (isErrorCalc) {
            isError = true;
            console.error('Calculation Error:', message);
            setApiOutput({ error: 'Calculation Error', message: message });
            clearInterval(interval);
            setScanProgress(100);
            setCodeStrings(prev => [...prev, `ERROR_CALCULATING_CREDIT_SCORE: ${message}`]);
            setTimeout(() => setStatus('success'), 1000);
            return;
          } else if (isComplete) {
            calculationComplete = true;
            setCodeStrings(prev => [...prev, "CALCULATION_COMPLETE", "FINALIZING_DATA...", "FETCHING_CREDIT_SCORE..."]);
            // Short delay to allow backend to finish transactions
            await new Promise(resolve => setTimeout(resolve, 2000));
            break;
          } else if (isActuallyOngoing) {
            setCodeStrings(prev => {
              const lastMsg = prev[prev.length - 1];
              if (lastMsg && lastMsg.startsWith("CALCULATION_ONGOING")) {
                return [...prev.slice(0, -1), lastMsg + "."];
              }
              // Print an explicit status log to show checking is happening 
              return [...prev, `API STATUS: ${message}`, "CALCULATION_ONGOING..."];
            });
          }
        } catch (err) {
          console.error("Error checking progress:", err);
        }
      }
      
      if (!calculationComplete && !isError) {
         setApiOutput({ error: 'Timeout', message: 'Calculation timed out after 3 minutes.' });
         clearInterval(interval);
         setScanProgress(100);
         setCodeStrings(prev => [...prev, "TIMEOUT_ERROR_CALCULATING_CREDIT_SCORE"]);
         setTimeout(() => setStatus('success'), 1000);
         return;
      }
      
      const getCreditScoreUrl = `https://smuedu-dev.outsystemsenterprise.com/CreditScoring/rest/CreditEvaluationAPI/GetCreditScore?CustomerID=${encodeURIComponent(customerId)}`;
      
      console.log('Fetching GetCreditScore:', getCreditScoreUrl);
      
      const scoreResponse = await fetch(getCreditScoreUrl, {
        method: 'GET',
        headers: {
          'X-Contacts-Key': '79a7f4cc-3ddc-4f8c-b1f3-557c7ff73af7'
        }
      });
      
      let scoreData;
      try {
        scoreData = await scoreResponse.json();
      } catch (e) {
        const text = await scoreResponse.text();
        scoreData = { raw: text };
      }
      
      console.log('GetCreditScore Result:', scoreData);
      
      // Now perfectly pull the verified master score from VerifyUser Composite
      let verifiedData = null;
      try {
        const uen = user?.uen || "UEN999";
        const name = user?.profileData?.givenName || user?.name || "SMU TRADING";
        const verifiedUrl = `/api-proxy-3/VerifyUserCompositeService/rest/VerifyUser/VerifyUser?CustomerId=${encodeURIComponent(customerId)}&UEN=${encodeURIComponent(uen)}&GivenName=${encodeURIComponent(name)}`;
        const verifyResponse = await fetch(verifiedUrl);
        if (verifyResponse.ok) {
           const vData = await verifyResponse.json();
           verifiedData = Array.isArray(vData) ? vData[0] : vData;
           console.log('VerifyUser After Upload Result:', verifiedData);
        }
      } catch (err) {
        console.error("Error fetching VerifyUser API during finalize:", err);
      }
      
      setApiOutput({ ...scoreData, VerifiedScoreData: verifiedData });
      
      clearInterval(interval);
      setScanProgress(100);
      setCodeStrings(prev => [...prev, "CREDIT_SCORE_RETRIEVED", "EVALUATION_COMPLETE"]);
      setTimeout(() => setStatus('success'), 1000);
    } catch (err) {
      console.error(err);
      setApiOutput({ 
        error: "Network or Request Error", 
        message: err.message || JSON.stringify(err) 
      });
      clearInterval(interval);
      setScanProgress(100);
      setCodeStrings(prev => [...prev, "NETWORK_ERROR"]);
      setTimeout(() => setStatus('success'), 1000);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Currencies & Limits</h1>
          <p className="text-textSecondary">Submit financial statements to evaluate credit and unlock higher limits or new wallets.</p>
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
                  className="flex flex-col items-center justify-center p-6 text-center w-full"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  <input type="file" id="fileUpload" className="hidden" accept=".pdf,.csv" multiple onChange={handleFileChange} />
                  
                  <div 
                    className={cn(
                      "w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center mb-4 transition-colors cursor-pointer group shrink-0",
                      fileEntries.length > 0 ? "bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(0,184,217,0.2)]" : "bg-white/5 border-white/20 text-textSecondary hover:border-primary/50 hover:text-primary"
                    )} 
                    onClick={() => document.getElementById('fileUpload').click()}
                  >
                     {fileEntries.length > 0 ? <File className="w-8 h-8" /> : <UploadCloud className="w-8 h-8 group-hover:scale-110 transition-transform" />}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-textPrimary mb-1">
                    {fileEntries.length > 0 ? `${fileEntries.length} file(s) selected` : "Upload Financials"}
                  </h3>
                  <p className="text-xs text-textSecondary max-w-xs mb-4">
                    {fileEntries.length > 0 ? "Set document types for each file, then submit." : "Drag and drop your PDF/CSV files here, or click to browse. You can upload multiple files."}
                  </p>

                  {/* File list with per-file document type checkboxes */}
                  {fileEntries.length > 0 && (
                    <div className="w-full max-w-sm space-y-3 mb-4 max-h-[280px] overflow-y-auto pr-1">
                      {fileEntries.map((entry, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-surface-hover/20 border border-border rounded-xl p-3 text-left"
                        >
                          {/* File name + remove button */}
                          <div className="flex items-center gap-2 mb-2">
                            <File className="w-4 h-4 text-primary shrink-0" />
                            <span className="text-xs font-medium text-textPrimary truncate flex-1">{entry.file.name}</span>
                            <button 
                              onClick={() => removeFile(idx)} 
                              className="text-textSecondary hover:text-red-400 transition-colors p-0.5 shrink-0"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          {/* Document type checkboxes */}
                          <div className="flex flex-wrap gap-2">
                            <label className={cn(
                              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-colors text-[11px] font-mono",
                              entry.isBalanceSheet ? "bg-primary/10 border-primary/50 text-primary" : "bg-black/10 border-border text-textSecondary hover:bg-black/20"
                            )}>
                              <input 
                                type="checkbox" 
                                checked={entry.isBalanceSheet} 
                                onChange={(e) => updateFileEntry(idx, 'isBalanceSheet', e.target.checked)}
                                className="w-3.5 h-3.5 rounded text-primary bg-background border-border focus:ring-primary" 
                              />
                              BS: <span className={entry.isBalanceSheet ? "text-emerald-500" : ""}>{entry.isBalanceSheet ? 'true' : 'false'}</span>
                            </label>
                            <label className={cn(
                              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-colors text-[11px] font-mono",
                              entry.isIncomeStatement ? "bg-primary/10 border-primary/50 text-primary" : "bg-black/10 border-border text-textSecondary hover:bg-black/20"
                            )}>
                              <input 
                                type="checkbox" 
                                checked={entry.isIncomeStatement} 
                                onChange={(e) => updateFileEntry(idx, 'isIncomeStatement', e.target.checked)}
                                className="w-3.5 h-3.5 rounded text-primary bg-background border-border focus:ring-primary" 
                              />
                              IS: <span className={entry.isIncomeStatement ? "text-emerald-500" : ""}>{entry.isIncomeStatement ? 'true' : 'false'}</span>
                            </label>
                            <label className={cn(
                              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-colors text-[11px] font-mono",
                              entry.isCashflow ? "bg-primary/10 border-primary/50 text-primary" : "bg-black/10 border-border text-textSecondary hover:bg-black/20"
                            )}>
                              <input 
                                type="checkbox" 
                                checked={entry.isCashflow} 
                                onChange={(e) => updateFileEntry(idx, 'isCashflow', e.target.checked)}
                                className="w-3.5 h-3.5 rounded text-primary bg-background border-border focus:ring-primary" 
                              />
                              CF: <span className={entry.isCashflow ? "text-emerald-500" : ""}>{entry.isCashflow ? 'true' : 'false'}</span>
                            </label>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3">
                    {fileEntries.length > 0 && (
                      <Button 
                        variant="secondary" 
                        onClick={() => document.getElementById('fileUpload').click()}
                      >
                        Add More
                      </Button>
                    )}
                    <Button 
                      variant={fileEntries.length > 0 ? "primary" : "secondary"} 
                      onClick={fileEntries.length > 0 ? handleSubmit : () => document.getElementById('fileUpload').click()}
                    >
                      {fileEntries.length > 0 ? "Evaluate & Upgrade Limits" : "Browse Files"}
                    </Button>
                  </div>
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
                     <h3 className="font-semibold text-textPrimary">AI Credit Engine Processing</h3>
                   </div>

                   {/* Scanning Visualizer */}
                   <div className="relative aspect-[3/2] w-full bg-black/40 rounded-xl border border-white/10 overflow-hidden mb-6 flex items-center justify-center isolate shrink-0">
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
                   <div className="bg-black/60 rounded-lg p-4 font-mono text-[10px] sm:text-xs text-primary h-32 overflow-y-auto flex flex-col justify-end border border-white/5 shadow-inner">
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
                   <div className="mt-6 shrink-0">
                     <div className="flex justify-between text-xs font-medium text-textSecondary mb-2">
                       <span>Evaluation Progress</span>
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
                  className="flex flex-col items-center justify-center text-center p-6 h-full w-full overflow-y-auto"
                >
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 shadow-[0_0_40px_rgba(52,211,153,0.2)]">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.2 }}>
                      <ShieldCheck className="w-7 h-7" />
                    </motion.div>
                  </div>
                  <h3 className="text-lg font-bold text-textPrimary mb-1">Credit Evaluation Complete</h3>
                  
                  {/* Credit Score Display */}
                  {apiOutput && typeof apiOutput === 'object' && apiOutput.CreditScore !== undefined ? (
                    <div className="w-full space-y-4 mt-4">
                      {/* Score & Grade */}
                      <div className="flex items-center justify-center gap-6">
                        {apiOutput.VerifiedScoreData ? (
                          <>
                            <div className="text-center">
                              <p className="text-xs text-textSecondary uppercase tracking-wider mb-1">Verified Score</p>
                              <motion.p 
                                initial={{ opacity: 0, y: 10 }} 
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-4xl font-black text-blue-400"
                              >
                                {(() => {
                                  const data = apiOutput.VerifiedScoreData;
                                  const score = data.CreditScore !== undefined ? data.CreditScore : data.Id;
                                  if (!score || score === "") return "N/A";
                                  const rounded = Math.round(Number(score));
                                  return !isNaN(rounded) ? rounded : score;
                                })()}
                              </motion.p>
                            </div>
                            {(() => {
                                  const data = apiOutput.VerifiedScoreData;
                                  const grade = data.CreditGrade || data.CreditBand;
                                  if (grade && grade !== "") {
                                    return (
                                      <>
                                        <div className="w-px h-12 bg-border"></div>
                                        <div className="text-center">
                                          <p className="text-xs text-textSecondary uppercase tracking-wider mb-1">Credit Grade</p>
                                          <motion.p 
                                            initial={{ opacity: 0, y: 10 }} 
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="text-3xl font-black text-emerald-400"
                                          >
                                            {grade}
                                          </motion.p>
                                        </div>
                                      </>
                                    );
                                  }
                                  return null;
                            })()}
                          </>
                        ) : (
                          <>
                            <div className="text-center">
                              <p className="text-xs text-textSecondary uppercase tracking-wider mb-1">Verified Score</p>
                              <motion.p 
                                initial={{ opacity: 0, y: 10 }} 
                                animate={{ opacity: 1, y: 0 }}
                                className="text-4xl font-black text-primary"
                              >
                                {apiOutput.CreditScore ? Math.round(apiOutput.CreditScore) : "N/A"}
                              </motion.p>
                            </div>
                            <div className="w-px h-12 bg-border"></div>
                            <div className="text-center">
                              <p className="text-xs text-textSecondary uppercase tracking-wider mb-1">Credit Grade</p>
                              <motion.p 
                                initial={{ opacity: 0, y: 10 }} 
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className={cn(
                                  "text-3xl font-black",
                                  apiOutput.CreditScore >= 700 ? "text-emerald-400" :
                                  apiOutput.CreditScore >= 500 ? "text-amber-400" : "text-red-400"
                                )}
                              >
                                {apiOutput.RiskGrade || "N/A"}
                              </motion.p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Details */}
                      <div className="bg-black/30 rounded-xl p-3 border border-white/10 text-left space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-textSecondary">Customer ID</span>
                          <span className="text-textPrimary font-mono">{apiOutput.CustomerID}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-textSecondary">Evaluated On</span>
                          <span className="text-textPrimary font-mono">{apiOutput.CreatedDate}</span>
                        </div>
                        {apiOutput.CSDocumentList && apiOutput.CSDocumentList.length > 0 && (
                          <div className="pt-2 border-t border-white/5">
                            <p className="text-[10px] text-textSecondary uppercase tracking-wider mb-1">Documents Processed ({apiOutput.CSDocumentList.length})</p>
                            {apiOutput.CSDocumentList.map((doc, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs text-textPrimary py-1">
                                <File className="w-3 h-3 text-primary shrink-0" />
                                <span className="truncate font-mono text-[10px]">{doc.FileName}</span>
                                <span className="ml-auto text-[10px] text-emerald-400 shrink-0">
                                  {doc.isBalanceSheet ? 'BS' : doc.isIncomeStatement ? 'IS' : doc.isCashflow ? 'CF' : '—'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Fallback: raw output */
                    <div className="w-full bg-black/50 rounded-xl p-4 border border-white/10 mt-4 text-left max-h-40 overflow-y-auto">
                      <p className="text-xs text-textSecondary uppercase tracking-wider font-semibold mb-2">API Output</p>
                      <pre className="text-emerald-400 font-mono text-[10px] sm:text-xs whitespace-pre-wrap">
                        {apiOutput === null 
                          ? "Waiting..."
                          : typeof apiOutput === 'object'
                            ? JSON.stringify(apiOutput, null, 2)
                            : String(apiOutput)}
                      </pre>
                    </div>
                  )}

                  <Button className="mt-4" variant="secondary" onClick={() => { 
                    setStatus('idle'); 
                    setScanProgress(0); 
                    setCodeStrings([]); 
                    setFileEntries([]);
                    setApiOutput(null);
                  }}>Compute Credit Score Again</Button>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          {/* Results UI / Permissions Wallet */}
          <div className="space-y-6 flex flex-col h-full">
             <GlassCard className="flex-1 h-full">
               <h3 className="text-lg font-semibold flex items-center gap-2 mb-6 text-textPrimary border-b border-border pb-4">
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
                         <div className="font-medium text-sm text-textPrimary">{wallet.name}</div>
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
