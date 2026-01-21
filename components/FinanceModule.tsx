
import React, { useState, useMemo, useEffect } from 'react';
import { 
  AlertCircle, 
  Loader2, 
  Printer, 
  Download, 
  LayoutGrid, 
  Target, 
  Banknote, 
  Forward, 
  CreditCard, 
  Settings2, 
  Save, 
  ShieldAlert, 
  Zap, 
  X, 
  CheckCircle2, 
  FileDown,
  Building,
  User,
  Hash,
  Stamp,
  Smartphone,
  Check
} from 'lucide-react';
import { Language, translations } from '../services/localizationService';
import { KENYAN_CLASSES, Student, ClassFee } from '../types';

interface Props {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  feeStructure: ClassFee[];
  setFeeStructure: React.Dispatch<React.SetStateAction<ClassFee[]>>;
  schoolLogo: string | null;
}

interface TransactionReceipt {
  receiptNo: string;
  studentName: string;
  adm: string;
  class: string;
  amount: number;
  method: 'M-PESA' | 'BANK' | 'CASH';
  reference: string;
  date: string;
  balance: number;
  servedBy: string;
}

export const FinanceModule: React.FC<Props & { lang: Language }> = ({ lang, students, setStudents, feeStructure, setFeeStructure, schoolLogo }) => {
  const t = translations[lang];
  
  // Local UI State
  const [activeTab, setActiveTab] = useState<'payments' | 'class-summary' | 'fee-structure'>('class-summary');
  const [selectedClass, setSelectedClass] = useState<string>('All Classes');
  const [isPosting, setIsPosting] = useState(false);
  const [isApplyingFees, setIsApplyingFees] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<TransactionReceipt | null>(null);
  const [generatingIndividualId, setGeneratingIndividualId] = useState<string | null>(null);

  // Form States
  const [globalFeeValue, setGlobalFeeValue] = useState<string>('');
  const [paymentForm, setPaymentForm] = useState({ 
    adm: '', 
    amount: '', 
    method: 'M-PESA' as 'M-PESA' | 'BANK' | 'CASH', 
    reference: '' 
  });

  // Derived Financial Data
  const filteredStudents = useMemo(() => {
    return students.filter(s => selectedClass === 'All Classes' || s.class === selectedClass);
  }, [students, selectedClass]);

  const financeStats = useMemo(() => {
    const totalExpected = filteredStudents.reduce((sum, s) => sum + (s.totalFee || 0), 0);
    const totalCollected = filteredStudents.reduce((sum, s) => sum + (s.paidFee || 0), 0);
    const totalOutstanding = filteredStudents.reduce((sum, s) => sum + (s.feeBalance || 0), 0);
    const totalPrepaid = filteredStudents.reduce((sum, s) => sum + (s.prepaidFee || 0), 0);
    return { expected: totalExpected, collected: totalCollected, outstanding: totalOutstanding, prepaid: totalPrepaid };
  }, [filteredStudents]);

  // Logic: Fee Structure Management
  const handleUpdateClassFee = (className: string, value: string) => {
    const amount = parseFloat(value) || 0;
    setFeeStructure(prev => prev.map(f => f.className === className ? { ...f, amount } : f));
  };

  const applyGlobalFee = () => {
    const amount = parseFloat(globalFeeValue) || 0;
    if (amount <= 0) return;
    setFeeStructure(prev => prev.map(f => ({ ...f, amount })));
    setGlobalFeeValue('');
  };

  const applyFeesToStudents = async () => {
    setIsApplyingFees(true);
    // Simulate complex calculation
    await new Promise(r => setTimeout(r, 1500));
    
    setStudents(prev => prev.map(student => {
      const structure = feeStructure.find(f => f.className === student.class);
      if (structure) {
        const newTotal = structure.amount;
        const paid = student.paidFee || 0;
        let newBalance = newTotal - paid;
        let newPrepaid = 0;
        
        if (newBalance < 0) {
          newPrepaid = Math.abs(newBalance);
          newBalance = 0;
        }
        
        return { ...student, totalFee: newTotal, feeBalance: newBalance, prepaidFee: newPrepaid };
      }
      return student;
    }));
    
    setIsApplyingFees(false);
    alert('Financial Sync Complete: Student invoices have been updated according to the new fee structure.');
  };

  // Logic: Payment Posting
  const handlePostPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.adm || !paymentForm.amount) return;
    setIsPosting(true);
    
    await new Promise(r => setTimeout(r, 1000));

    const amountNum = parseFloat(paymentForm.amount);
    let updatedStudent: Student | undefined;

    setStudents(prev => prev.map(s => {
      if (s.admissionNumber === paymentForm.adm) {
        const newPaid = (s.paidFee || 0) + amountNum;
        let newBalance = (s.totalFee || 0) - newPaid;
        let newPrepaid = s.prepaidFee || 0;
        
        if (newBalance < 0) {
          newPrepaid += Math.abs(newBalance);
          newBalance = 0;
        }

        updatedStudent = { ...s, paidFee: newPaid, feeBalance: newBalance, prepaidFee: newPrepaid };
        return updatedStudent;
      }
      return s;
    }));

    if (updatedStudent) {
      const receipt: TransactionReceipt = {
        receiptNo: paymentForm.reference || `RCP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        studentName: `${updatedStudent.firstName} ${updatedStudent.lastName}`,
        adm: updatedStudent.admissionNumber,
        class: updatedStudent.class,
        amount: amountNum,
        method: paymentForm.method,
        reference: paymentForm.reference || 'SYSTEM_POST',
        date: new Date().toLocaleString(),
        balance: updatedStudent.feeBalance,
        servedBy: 'Admin Terminal'
      };

      setLastReceipt(receipt);
      setShowReceipt(true);
    }

    setIsPosting(false);
    setPaymentForm({ adm: '', amount: '', method: 'M-PESA', reference: '' });
  };

  // Logic: Professional PDF Export (Fixing Blank Issue)
  const exportToPDF = (elementId: string, fileName: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Ensure the element is perfectly visible for the capture context
    const opt = {
      margin: 0,
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const h2p = (window as any).html2pdf;
    if (h2p) {
      h2p().set(opt).from(element).save();
    } else {
      window.print();
    }
  };

  const handleExportIndividualStatement = async (student: Student) => {
    setGeneratingIndividualId(student.id);
    setLastReceipt({
      receiptNo: "STATEMENT",
      studentName: `${student.firstName} ${student.lastName}`,
      adm: student.admissionNumber,
      class: student.class,
      amount: student.paidFee,
      method: "CASH",
      reference: "TERMLY_RECONCILIATION",
      date: new Date().toLocaleDateString(),
      balance: student.feeBalance,
      servedBy: "System Export"
    });
    
    // Delay to allow DOM update in offscreen template
    setTimeout(() => {
      exportToPDF('receipt-print-template', `Statement_${student.admissionNumber}.pdf`);
      setGeneratingIndividualId(null);
    }, 500);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* 
         PROFESSIONAL A4 RECEIPT TEMPLATE (OFFSCREEN)
         Strict alignment for html2pdf capture
      */}
      <div id="receipt-print-template" className="offscreen-template" style={{ width: '210mm', minHeight: '297mm', background: '#ffffff', color: '#111827' }}>
        {lastReceipt && (
          <div style={{ padding: '20mm', fontFamily: 'Inter, sans-serif' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '4px solid #1e3a8a', paddingBottom: '25px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                <div style={{ width: '90px', height: '90px', borderRadius: '20px', overflow: 'hidden', border: '2px solid #f3f4f6' }}>
                  <img src={schoolLogo || `https://api.dicebear.com/7.x/initials/svg?seed=ES&backgroundColor=1e3a8a&fontFamily=Inter&bold=true`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Logo" />
                </div>
                <div>
                   <h1 style={{ margin: '0', fontSize: '32px', fontWeight: '900', color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '-1px' }}>ElimuSmart Academy</h1>
                   <p style={{ margin: '5px 0 0 0', fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '2px' }}>Excellence in Knowledge and Character</p>
                   <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#9ca3af' }}>P.O BOX 1234 - 00100, Nairobi | Tel: 0700 000 000 | info@elimusmart.co.ke</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                 <h2 style={{ margin: '0', fontSize: '18px', fontWeight: '900', color: '#1e3a8a', textTransform: 'uppercase' }}>{lastReceipt.receiptNo === 'STATEMENT' ? 'Fee Statement' : 'Official Receipt'}</h2>
                 <p style={{ margin: '5px 0 0 0', fontSize: '14px', fontWeight: '900', color: '#dc2626' }}>REF: {lastReceipt.receiptNo}</p>
              </div>
            </div>

            {/* Document Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '50px', marginBottom: '50px', background: '#f8fafc', padding: '30px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <span style={{ fontSize: '9px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase' }}>Student Information</span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: '800' }}>{lastReceipt.studentName}</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', fontWeight: '700', color: '#2563eb' }}>ADM: {lastReceipt.adm}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '9px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase' }}>Class & Stream</span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: '700' }}>{lastReceipt.class}</p>
                  </div>
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'right' }}>
                  <div>
                    <span style={{ fontSize: '9px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase' }}>Payment Details</span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: '800' }}>{lastReceipt.method} Transfer</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Code: {lastReceipt.reference}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '9px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase' }}>Issued Date</span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: '700' }}>{lastReceipt.date}</p>
                  </div>
               </div>
            </div>

            {/* Financial Totals Block */}
            <div style={{ marginBottom: '60px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '4px solid #111827', paddingTop: '30px', paddingBottom: '20px' }}>
                  <span style={{ fontSize: '20px', fontWeight: '900', textTransform: 'uppercase' }}>Amount Received:</span>
                  <span style={{ fontSize: '38px', fontWeight: '900', color: '#15803d' }}>KES {lastReceipt.amount.toLocaleString()}.00</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fef2f2', padding: '25px', borderRadius: '15px', border: '1px solid #fee2e2' }}>
                  <span style={{ fontSize: '14px', fontWeight: '900', textTransform: 'uppercase', color: '#b91c1c' }}>Remaining Balance Due:</span>
                  <span style={{ fontSize: '22px', fontWeight: '900', color: '#b91c1c' }}>KES {lastReceipt.balance.toLocaleString()}.00</span>
               </div>
            </div>

            {/* Signatures & Verification */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: '100px' }}>
               <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '220px', borderBottom: '2px solid #111827', marginBottom: '10px' }}></div>
                  <p style={{ margin: '0', fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase' }}>Authorized Cashier Signature</p>
               </div>
               <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '140px', height: '140px', border: '3px dashed #e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px', opacity: '0.2' }}>
                     <Stamp size={60} />
                  </div>
                  <p style={{ margin: '0', fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase' }}>Official School Stamp</p>
               </div>
            </div>

            <div style={{ marginTop: '50px', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
               <p style={{ margin: '0', fontSize: '8px', color: '#94a3b8', fontStyle: 'italic' }}>* This document is an electronic copy valid for accounting purposes. ElimuSmart Cloud ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Financial Hub</h1>
          <p className="text-gray-500 font-medium">L Ledger, Fee Structure & Transaction Terminal.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="p-3 bg-white border-2 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-blue-500 transition-all">
            <option>All Classes</option>
            {KENYAN_CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
          </select>
          <div className="flex p-1 bg-gray-100 rounded-2xl shadow-inner">
            <button onClick={() => setActiveTab('class-summary')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'class-summary' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Ledger</button>
            <button onClick={() => setActiveTab('fee-structure')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'fee-structure' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Fee Structure</button>
            <button onClick={() => setActiveTab('payments')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'payments' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Post Payment</button>
          </div>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Expected Revenue', value: financeStats.expected, icon: Target, color: 'indigo' },
          { label: 'Collected Amount', value: financeStats.collected, icon: Banknote, color: 'green' },
          { label: 'Unpaid Arrears', value: financeStats.outstanding, icon: AlertCircle, color: 'red' },
          { label: 'Credit Balance', value: financeStats.prepaid, icon: Forward, color: 'blue' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 flex items-start justify-between shadow-sm hover:shadow-md transition-all">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
              <h3 className={`text-2xl font-black tracking-tight ${stat.color === 'red' ? 'text-red-700' : stat.color === 'green' ? 'text-green-700' : 'text-gray-900'}`}>
                <span className="text-xs font-medium mr-1 opacity-40">KES</span>
                {stat.value.toLocaleString()}
              </h3>
            </div>
            <div className={`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 border border-${stat.color}-100`}>
              <stat.icon size={20} />
            </div>
          </div>
        ))}
      </div>

      {/* TAB 1: Ledger Summary */}
      {activeTab === 'class-summary' && (
        <div id="ledger-printable-area" className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm animate-in fade-in duration-300">
          <div className="p-10 border-b bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100">
                  <LayoutGrid className="w-6 h-6" />
                </div>
                <div>
                   <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">Student Ledger</h2>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2">Filter: {selectedClass}</p>
                </div>
             </div>
             <div className="flex gap-2">
                <button 
                  onClick={() => exportToPDF('ledger-printable-area', `Ledger_${selectedClass}.pdf`)}
                  className="p-3 bg-blue-600 text-white border border-blue-600 rounded-2xl hover:bg-blue-700 transition-all flex items-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-100"
                >
                  <Download size={16} /> Export PDF
                </button>
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b text-[10px] text-gray-400 uppercase font-black tracking-widest">
                  <th className="px-10 py-6">Learner Credentials</th>
                  <th className="px-8 py-6 text-center">Invoice</th>
                  <th className="px-8 py-6 text-center">Paid</th>
                  <th className="px-8 py-6 text-center">Balance Due</th>
                  <th className="px-8 py-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((s, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/10 transition-colors group">
                    <td className="px-10 py-6">
                      <div className="font-black text-gray-900 text-lg leading-tight group-hover:text-blue-600 transition-colors">{s.firstName} {s.lastName}</div>
                      <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">{s.admissionNumber} • {s.class}</div>
                    </td>
                    <td className="px-8 py-6 text-center font-bold text-gray-700">KES {(s.totalFee || 0).toLocaleString()}</td>
                    <td className="px-8 py-6 text-center font-bold text-green-600">KES {(s.paidFee || 0).toLocaleString()}</td>
                    <td className="px-8 py-6 text-center">
                      <span className={`font-black ${(s.feeBalance || 0) > 0 ? 'text-red-600' : 'text-gray-300'}`}>
                        KES {(s.feeBalance || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-right">
                       <button 
                         onClick={() => handleExportIndividualStatement(s)}
                         disabled={generatingIndividualId === s.id}
                         className="p-3 bg-white border-2 border-gray-100 text-blue-600 hover:bg-blue-50 rounded-2xl transition-all shadow-sm flex items-center gap-2 ml-auto"
                         title="Export Statement"
                       >
                         {generatingIndividualId === s.id ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
                         <span className="text-[9px] font-black uppercase tracking-widest">Statement</span>
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Fee Structure Sync */}
      {activeTab === 'fee-structure' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white p-10 rounded-[48px] border-2 border-blue-50 shadow-2xl shadow-blue-50/50 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
               <div className="p-5 bg-blue-100 text-blue-600 rounded-[32px] shadow-inner">
                  <Settings2 className="w-10 h-10" />
               </div>
               <div>
                  <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none">Termly Fee Structure</h2>
                  <p className="text-xs text-blue-500 font-black uppercase tracking-[0.25em] mt-3 flex items-center gap-2">
                    <ShieldAlert size={14} /> Master Billing Configuration
                  </p>
               </div>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-3xl border border-gray-100">
               <div className="relative">
                  <Banknote className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
                  <input 
                    type="number" 
                    placeholder="Set global fee..." 
                    value={globalFeeValue}
                    onChange={e => setGlobalFeeValue(e.target.value)}
                    className="pl-12 pr-4 py-4 w-48 bg-white border-2 border-transparent rounded-2xl font-black text-sm outline-none focus:border-blue-500 transition-all"
                  />
               </div>
               <button 
                onClick={applyGlobalFee}
                className="bg-gray-900 text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl"
               >
                 Update All
               </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
               <div className="p-8 border-b bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Class-Wise Tuition Allocation</div>
               <div className="divide-y divide-gray-100">
                  {feeStructure.map((fee, idx) => (
                    <div key={idx} className="p-8 flex items-center justify-between hover:bg-gray-50/50 transition-colors group">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white border-2 border-gray-100 flex items-center justify-center font-black text-gray-400 group-hover:border-blue-300 group-hover:text-blue-600 transition-all">{idx + 1}</div>
                          <span className="font-black text-gray-900 text-xl tracking-tight">{fee.className}</span>
                       </div>
                       <div className="flex items-center gap-4">
                          <span className="text-xs font-black text-gray-300 uppercase">KES</span>
                          <input 
                            type="number" 
                            value={fee.amount}
                            onChange={e => handleUpdateClassFee(fee.className, e.target.value)}
                            className="w-36 p-4 bg-gray-100 border-2 border-transparent rounded-2xl text-center font-black text-lg focus:bg-white focus:border-blue-500 transition-all outline-none"
                          />
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="space-y-6">
               <div className="bg-indigo-900 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform">
                    <Zap className="w-48 h-48" />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">Financial Re-Sync</h3>
                    <p className="text-indigo-100/70 font-medium text-sm leading-relaxed mb-8">
                      Clicking sync will instantly apply these fees to all <span className="text-white font-black underline underline-offset-4 decoration-green-400 decoration-2">{students.length} learners</span>. Existing paid amounts will be preserved.
                    </p>
                    <button 
                      onClick={applyFeesToStudents}
                      disabled={isApplyingFees}
                      className="w-full flex items-center justify-center gap-3 bg-green-500 text-white py-5 rounded-3xl font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-xl shadow-green-900/40 disabled:opacity-50"
                    >
                      {isApplyingFees ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                      <span>Sync Students</span>
                    </button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Payment Terminal */}
      {activeTab === 'payments' && (
        <div className="max-w-4xl mx-auto bg-white p-12 rounded-[56px] border-2 border-gray-100 shadow-2xl animate-in zoom-in duration-500 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
             <Smartphone size={200} />
          </div>
          
          <div className="mb-12 flex items-center gap-6 relative z-10">
             <div className="p-5 bg-blue-600 text-white rounded-[28px] shadow-2xl shadow-blue-200">
                <CreditCard className="w-10 h-10" />
             </div>
             <div>
               <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter leading-none">Post Receipt</h2>
               <p className="text-xs text-gray-400 font-black uppercase tracking-[0.3em] mt-3">Official Transaction Terminal</p>
             </div>
          </div>

          <form onSubmit={handlePostPayment} className="space-y-10 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Student Record</label>
                 <select required value={paymentForm.adm} onChange={e => setPaymentForm({...paymentForm, adm: e.target.value})} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-[24px] font-black uppercase outline-none focus:border-blue-500 transition-all">
                  <option value="">Select ADM No...</option>
                  {students.map(s => <option key={s.id} value={s.admissionNumber}>{s.admissionNumber} - {s.firstName} {s.lastName}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Amount (KES)</label>
                 <input required type="number" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-[24px] font-black text-xl outline-none focus:border-blue-500 transition-all" placeholder="0.00" />
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Settlement Channel</label>
                 <div className="grid grid-cols-3 gap-2 p-2 bg-gray-100 rounded-[24px]">
                    {[
                      { id: 'M-PESA', icon: Smartphone },
                      { id: 'BANK', icon: Building },
                      { id: 'CASH', icon: Banknote }
                    ].map(m => (
                      <button 
                        key={m.id} 
                        type="button" 
                        onClick={() => setPaymentForm({...paymentForm, method: m.id as any})} 
                        className={`py-4 rounded-[20px] flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-widest transition-all ${paymentForm.method === m.id ? 'bg-white text-blue-600 shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        <m.icon size={16} />
                        {m.id}
                      </button>
                    ))}
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reference ID / Slip No</label>
                 <input value={paymentForm.reference} onChange={e => setPaymentForm({...paymentForm, reference: e.target.value})} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-[24px] font-black uppercase outline-none focus:border-blue-500 transition-all" placeholder="e.g. SBR4A6HJ78" />
              </div>
            </div>

            <button type="submit" disabled={isPosting} className="w-full bg-blue-600 text-white py-6 rounded-[32px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-100 disabled:opacity-50 hover:bg-blue-700 transition-all flex items-center justify-center gap-4">
              {isPosting ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldAlert className="w-6 h-6" />}
              {isPosting ? 'POSTING...' : 'AUTHORIZE TRANSACTION'}
            </button>
          </form>
        </div>
      )}

      {/* Payment Success Modal */}
      {showReceipt && lastReceipt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
              <div className="p-8 border-b bg-gray-50/50 flex items-center justify-between no-print">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center">
                       <Check size={24} />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tighter text-gray-900">Payment Confirmed</h3>
                 </div>
                 <button onClick={() => setShowReceipt(false)} className="p-2 hover:bg-white rounded-full transition-all text-gray-400">
                    <X className="w-6 h-6" />
                 </button>
              </div>
              <div className="p-10 text-center">
                 <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[32px] mb-8">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Receipt Information</p>
                    <h4 className="text-3xl font-black text-gray-900 leading-none">KES {lastReceipt.amount.toLocaleString()}</h4>
                    <p className="text-sm font-black text-blue-600 mt-2">{lastReceipt.studentName}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase mt-4">REF: {lastReceipt.receiptNo}</p>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => exportToPDF('receipt-print-template', `Receipt_${lastReceipt.receiptNo}.pdf`)} 
                      className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-all"
                    >
                      <Download size={18} /> Save PDF
                    </button>
                    <button 
                      onClick={() => window.print()} 
                      className="flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
                    >
                      <Printer size={18} /> Print Receipt
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
