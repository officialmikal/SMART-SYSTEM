
import React, { useState, useMemo } from 'react';
import { 
  AlertCircle, 
  Loader2, 
  Printer, 
  Download, 
  Target, 
  Banknote, 
  Forward, 
  CreditCard, 
  Save, 
  ShieldAlert, 
  Zap, 
  X, 
  CheckCircle2, 
  FileDown,
  User,
  Hash,
  Smartphone,
  Search,
  FileSpreadsheet,
  ShieldCheck,
  ReceiptText
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Language, translations } from '../services/localizationService';
import { KENYAN_CLASSES, Student, ClassFee } from '../types';

interface Props {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  feeStructure: ClassFee[];
  setFeeStructure: React.Dispatch<React.SetStateAction<ClassFee[]>>;
  schoolLogo: string | null;
  schoolConfig: any;
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

export const FinanceModule: React.FC<Props & { lang: Language }> = ({ lang, students, setStudents, feeStructure, setFeeStructure, schoolLogo, schoolConfig }) => {
  const t = translations[lang];
  
  const [activeTab, setActiveTab] = useState<'payments' | 'class-summary' | 'fee-structure'>('class-summary');
  const [selectedClass, setSelectedClass] = useState<string>('All Classes');
  const [financeSearch, setFinanceSearch] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isApplyingFees, setIsApplyingFees] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<TransactionReceipt | null>(null);

  const [globalFeeValue, setGlobalFeeValue] = useState<string>('');
  const [paymentForm, setPaymentForm] = useState({ 
    adm: '', 
    amount: '', 
    method: 'M-PESA' as 'M-PESA' | 'BANK' | 'CASH', 
    reference: '' 
  });

  const filteredStudents = useMemo(() => {
    return (students || []).filter(s => {
      const matchesClass = selectedClass === 'All Classes' || s.class === selectedClass;
      const term = financeSearch.toLowerCase();
      const matchesSearch = 
        s.firstName.toLowerCase().includes(term) || 
        s.lastName.toLowerCase().includes(term) || 
        s.admissionNumber.toLowerCase().includes(term);
      return matchesClass && matchesSearch;
    });
  }, [students, selectedClass, financeSearch]);

  const financeStats = useMemo(() => {
    const targetStudents = filteredStudents || [];
    const totalExpected = targetStudents.reduce((sum, s) => sum + (s.totalFee || 0), 0);
    const totalCollected = targetStudents.reduce((sum, s) => sum + (s.paidFee || 0), 0);
    const totalOutstanding = targetStudents.reduce((sum, s) => sum + (s.feeBalance || 0), 0);
    const totalPrepaid = targetStudents.reduce((sum, s) => sum + (s.prepaidFee || 0), 0);
    return { expected: totalExpected, collected: totalCollected, outstanding: totalOutstanding, prepaid: totalPrepaid };
  }, [filteredStudents]);

  const handlePostPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.adm || !paymentForm.amount) return;
    setIsPosting(true);
    
    // Simulate Daraja STK / Bank Handshake
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
        receiptNo: `RCP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        studentName: `${updatedStudent.firstName} ${updatedStudent.lastName}`,
        adm: updatedStudent.admissionNumber,
        class: updatedStudent.class,
        amount: amountNum,
        method: paymentForm.method,
        reference: paymentForm.reference || `TXN-${Date.now().toString().slice(-8)}`,
        date: new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }),
        balance: updatedStudent.feeBalance,
        servedBy: 'Bursar Office Official'
      };
      setLastReceipt(receipt);
      setShowReceipt(true);
    }

    setIsPosting(false);
    setPaymentForm({ adm: '', amount: '', method: 'M-PESA', reference: '' });
  };

  const exportToPDF = (elementId: string, fileName: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
      alert("Error: Receipt content not found.");
      return;
    }
    
    // Using high resolution and capturing the actual visible element to prevent blank PDFs
    const opt = {
      margin: 0.3,
      filename: fileName,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false, 
        letterRendering: true,
        backgroundColor: '#ffffff'
      },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    const h2p = (window as any).html2pdf;
    if (typeof h2p === 'function') {
      h2p().set(opt).from(element).save();
    } else {
      window.print();
    }
  };

  const handleUpdateClassFee = (className: string, value: string) => {
    const amount = parseFloat(value) || 0;
    setFeeStructure(prev => prev.map(f => f.className === className ? { ...f, amount } : f));
  };

  const applyGlobalFee = () => {
    const amount = parseFloat(globalFeeValue) || 0;
    if (amount > 0) {
      setFeeStructure(prev => prev.map(f => ({ ...f, amount })));
      setGlobalFeeValue('');
    }
  };

  const syncFeesToStudents = async () => {
    setIsApplyingFees(true);
    await new Promise(r => setTimeout(r, 1000));
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
    alert('Student Records Synchronized.');
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Finance Center</h1>
          <p className="text-gray-500 font-medium">Automated student ledgering and billing.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="p-3 bg-white border-2 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-blue-500 transition-all shadow-sm">
            <option>All Classes</option>
            {KENYAN_CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
          </select>
          <div className="flex p-1 bg-gray-100 rounded-2xl shadow-inner">
            <button onClick={() => setActiveTab('class-summary')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'class-summary' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Ledger</button>
            <button onClick={() => setActiveTab('fee-structure')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'fee-structure' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Fee Settings</button>
            <button onClick={() => setActiveTab('payments')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'payments' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Post Receipt</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Expected Revenue', value: financeStats.expected, icon: Target, color: 'indigo' },
          { label: 'Amount Collected', value: financeStats.collected, icon: Banknote, color: 'green' },
          { label: 'Outstanding Debt', value: financeStats.outstanding, icon: AlertCircle, color: 'red' },
          { label: 'Credit Balance', value: financeStats.prepaid, icon: Forward, color: 'blue' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 flex items-start justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
              <h3 className={`text-2xl font-black tracking-tight ${stat.color === 'red' ? 'text-red-700' : stat.color === 'green' ? 'text-green-700' : 'text-gray-900'}`}>
                <span className="text-xs font-medium mr-1 opacity-40">KES</span>
                {stat.value.toLocaleString()}
              </h3>
            </div>
            <div className={`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 border border-${stat.color}-100`}>
              <stat.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {activeTab === 'class-summary' && (
        <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm animate-in fade-in duration-300">
          <div className="p-8 border-b bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="flex-1 flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                   <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                   <input 
                      type="text" 
                      placeholder="Find student by name or ADM..." 
                      value={financeSearch}
                      onChange={(e) => setFinanceSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none font-medium transition-all text-sm shadow-inner"
                   />
                </div>
             </div>
             <button onClick={() => exportToPDF('class-ledger-table', `Global_Ledger_${selectedClass}.pdf`)} className="p-3 bg-white border-2 border-gray-100 rounded-2xl text-gray-600 hover:text-blue-600 hover:border-blue-200 transition-all flex items-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-sm">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Full Class Ledger
             </button>
          </div>
          <div className="overflow-x-auto" id="class-ledger-table">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b text-[10px] text-gray-400 uppercase font-black tracking-widest">
                  <th className="px-8 py-6">Student Information</th>
                  <th className="px-8 py-6 text-center">Invoiced</th>
                  <th className="px-8 py-6 text-center">Paid</th>
                  <th className="px-8 py-6 text-center">Balance</th>
                  <th className="px-8 py-6 text-right">Statements</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((s, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/10 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="font-black text-gray-900 text-lg leading-tight">{s.firstName} {s.lastName}</div>
                      <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">{s.admissionNumber} • {s.class}</div>
                    </td>
                    <td className="px-8 py-6 text-center font-bold text-gray-700">KES {(s.totalFee || 0).toLocaleString()}</td>
                    <td className="px-8 py-6 text-center font-bold text-green-600">KES {(s.paidFee || 0).toLocaleString()}</td>
                    <td className="px-8 py-6 text-center font-black">
                       <span className={s.feeBalance > 0 ? 'text-red-600' : 'text-green-600'}>
                         KES {(s.feeBalance || 0).toLocaleString()}
                       </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            setLastReceipt({
                              receiptNo: "STMT-" + s.admissionNumber,
                              studentName: `${s.firstName} ${s.lastName}`,
                              adm: s.admissionNumber,
                              class: s.class,
                              amount: s.paidFee,
                              method: "BANK",
                              reference: "SYS_RECONCILE",
                              date: new Date().toLocaleDateString(),
                              balance: s.feeBalance,
                              servedBy: "Ledger Engine"
                            });
                            setShowReceipt(true);
                          }}
                          className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100"
                          title="Generate Digital Statement"
                        >
                          <FileDown className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="max-w-4xl mx-auto bg-white p-12 rounded-[56px] border-2 border-gray-100 shadow-2xl animate-in zoom-in duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
             <Smartphone size={200} />
          </div>
          <div className="mb-10 flex items-center gap-6">
             <div className="p-5 bg-blue-600 text-white rounded-[28px] shadow-2xl shadow-blue-200">
                <CreditCard className="w-10 h-10" />
             </div>
             <div>
               <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter leading-none">Post Receipt</h2>
               <p className="text-xs text-gray-400 font-black uppercase tracking-[0.3em] mt-3">M-Pesa / Bank Terminal</p>
             </div>
          </div>

          <form onSubmit={handlePostPayment} className="space-y-10 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><User className="w-3 h-3" /> Select Learner</label>
                 <select required value={paymentForm.adm} onChange={e => setPaymentForm({...paymentForm, adm: e.target.value})} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-[24px] font-black uppercase outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner">
                  <option value="">ADM Number...</option>
                  {(students || []).map(s => <option key={s.id} value={s.admissionNumber}>{s.admissionNumber} - {s.firstName} {s.lastName}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Banknote className="w-3 h-3" /> Amount (KES)</label>
                 <input required type="number" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-[24px] font-black text-xl outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner" placeholder="0.00" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Method</label>
                 <div className="grid grid-cols-3 gap-2 p-2 bg-gray-100 rounded-[24px] shadow-inner">
                    {['M-PESA', 'BANK', 'CASH'].map(m => (
                      <button key={m} type="button" onClick={() => setPaymentForm({...paymentForm, method: m as any})} className={`py-4 rounded-[20px] text-[10px] font-black uppercase transition-all ${paymentForm.method === m ? 'bg-white text-blue-600 shadow-xl' : 'text-gray-400'}`}>{m}</button>
                    ))}
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Hash className="w-3 h-3" /> Transaction Reference</label>
                 <input value={paymentForm.reference} onChange={e => setPaymentForm({...paymentForm, reference: e.target.value.toUpperCase()})} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-[24px] font-black uppercase outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner" placeholder="E.G. SAF4X6HT..." />
              </div>
            </div>
            <button type="submit" disabled={isPosting} className="w-full bg-blue-600 text-white py-6 rounded-[32px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-100 disabled:opacity-50 hover:bg-blue-700 transition-all flex items-center justify-center gap-4">
              {isPosting ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldAlert className="w-6 h-6" />}
              {isPosting ? 'POSTING...' : 'AUTHORIZE & PRINT'}
            </button>
          </form>
        </div>
      )}

      {/* SUCCESS MODAL / DIGITAL RECEIPT PREVIEW */}
      {showReceipt && lastReceipt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/95 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl relative overflow-hidden animate-in zoom-in duration-300 max-h-[95vh] flex flex-col">
              <div className="p-8 border-b bg-gray-50/50 flex items-center justify-between no-print">
                 <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-full">
                       <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black uppercase tracking-tighter text-gray-900 leading-none">Payment Success</h3>
                       <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">Transaction Ledger Recorded</p>
                    </div>
                 </div>
                 <button onClick={() => setShowReceipt(false)} className="p-3 hover:bg-red-50 rounded-full transition-all text-gray-400 hover:text-red-500"><X className="w-6 h-6" /></button>
              </div>

              <div className="p-8 overflow-y-auto">
                 {/* DIGITAL RECEIPT UI - THIS IS THE SOURCE FOR THE PDF CAPTURE */}
                 <div id="active-receipt-container" className="bg-white border-2 border-gray-100 rounded-[32px] p-8 shadow-inner relative">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between border-b-2 border-blue-900 pb-8 mb-8 gap-6">
                       <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                          {schoolLogo ? (
                             <img src={schoolLogo} className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-md" crossOrigin="anonymous" />
                          ) : (
                             <div className="w-20 h-20 bg-blue-900 rounded-2xl flex items-center justify-center text-white font-black text-3xl">ES</div>
                          )}
                          <div>
                             <h2 className="text-2xl font-black text-blue-900 uppercase leading-none tracking-tighter">{schoolConfig?.schoolName || 'ElimuSmart Academy'}</h2>
                             <p className="text-[10px] font-black text-gray-400 uppercase mt-2 tracking-widest leading-tight">{schoolConfig?.motto || 'Excellence in Knowledge'}</p>
                             <p className="text-[9px] text-blue-600 font-black uppercase mt-1 tracking-widest">Reg No: {schoolConfig?.registrationNo || 'N/A'}</p>
                          </div>
                       </div>
                       <div className="text-center sm:text-right">
                          <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Official Receipt</h3>
                          <p className="text-sm font-mono text-red-500 font-black leading-none mt-2">#{lastReceipt.receiptNo}</p>
                          <div className="mt-4 flex items-center justify-center sm:justify-end gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-green-100">
                             <ShieldCheck size={12} /> Verified Payment
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-10 mb-10">
                       <div className="space-y-4">
                          <div>
                             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><User size={10} /> Received From</p>
                             <p className="font-black text-gray-900 text-lg leading-tight uppercase">{lastReceipt.studentName}</p>
                             <p className="text-xs font-bold text-gray-500 uppercase mt-0.5">{lastReceipt.adm} • {lastReceipt.class}</p>
                          </div>
                       </div>
                       <div className="text-right space-y-4">
                          <div>
                             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1 justify-end"><CreditCard size={10} /> Payment Details</p>
                             <p className="font-black text-emerald-600 text-lg leading-none">{lastReceipt.method}</p>
                             <p className="text-[10px] font-mono font-bold text-gray-400 mt-1 uppercase">Ref: {lastReceipt.reference}</p>
                          </div>
                       </div>
                    </div>

                    <div className="p-10 bg-blue-50/50 rounded-3xl mb-10 border-2 border-blue-100 text-center relative overflow-hidden">
                       <div className="absolute top-0 left-0 p-4 opacity-[0.03] rotate-12"><ReceiptText size={100} /></div>
                       <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-3">Amount Deposited (KES)</p>
                       <h4 className="text-5xl font-black text-blue-900 leading-none tracking-tighter">{(lastReceipt.amount || 0).toLocaleString()}.00</h4>
                    </div>

                    <div className="flex justify-between items-center p-6 border-2 border-blue-900 rounded-[24px] bg-white shadow-2xl shadow-blue-100/50">
                       <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">New Account Balance</p>
                          <p className="text-3xl font-black text-blue-900 leading-none">KES {(lastReceipt.balance || 0).toLocaleString()}.00</p>
                       </div>
                       <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
                          <Banknote className="w-8 h-8 text-blue-900 opacity-40" />
                       </div>
                    </div>

                    <div className="mt-14 flex justify-between items-end border-t-2 border-gray-50 pt-8">
                       <div className="italic text-[10px] text-gray-400 font-medium">
                          Timestamp: {lastReceipt.date}<br/>
                          Issued by: {lastReceipt.servedBy}
                       </div>
                       <div className="text-center">
                          <div className="w-48 h-[1px] bg-gray-300 mb-2 mx-auto"></div>
                          <div className="font-black uppercase tracking-[0.2em] leading-none text-gray-800 text-[10px]">Institutional Seal</div>
                       </div>
                    </div>
                    
                    <div className="mt-8 text-center pt-4 border-t border-gray-50">
                       <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">ElimuSmart Cloud Document Integrity Hash: {Math.random().toString(36).substring(2, 12).toUpperCase()}</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4 mt-10 no-print">
                    <button 
                      onClick={() => exportToPDF('active-receipt-container', `Receipt_${lastReceipt.receiptNo}.pdf`)} 
                      className="flex items-center justify-center gap-3 bg-gray-900 text-white py-5 rounded-[24px] font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200"
                    >
                      <Download size={20} /> Save Copy (PDF)
                    </button>
                    <button 
                      onClick={() => window.print()} 
                      className="flex items-center justify-center gap-3 bg-blue-600 text-white py-5 rounded-[24px] font-black uppercase text-xs tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 border border-blue-500"
                    >
                      <Printer size={20} /> Physical Print
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Fee Settings View */}
      {activeTab === 'fee-structure' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-2 bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
             <div className="p-8 border-b bg-gray-50/50 flex items-center justify-between">
                <div>
                   <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Billing Structure</h3>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Set Tuition per Class</p>
                </div>
                <div className="flex items-center gap-2">
                   <input type="number" placeholder="Global Fee..." value={globalFeeValue} onChange={e => setGlobalFeeValue(e.target.value)} className="w-32 p-3 bg-white border rounded-xl font-bold text-xs" />
                   <button onClick={applyGlobalFee} className="p-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">Apply All</button>
                </div>
             </div>
             <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {feeStructure.map((fee, idx) => (
                  <div key={idx} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">{idx + 1}</div>
                        <span className="font-black text-gray-800">{fee.className}</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-gray-400 uppercase">KES</span>
                        <input 
                          type="number" 
                          value={fee.amount} 
                          onChange={e => handleUpdateClassFee(fee.className, e.target.value)} 
                          className="w-32 p-3 bg-gray-100 border-2 border-transparent rounded-xl text-center font-black focus:border-blue-500 focus:bg-white transition-all outline-none shadow-inner" 
                        />
                     </div>
                  </div>
                ))}
             </div>
          </div>

          <div className="space-y-6">
             <div className="bg-indigo-900 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform">
                  <Zap className="w-48 h-48" />
                </div>
                <div className="relative z-10">
                   <h4 className="text-2xl font-black uppercase tracking-tighter mb-3">Sync Global Invoices</h4>
                   <p className="text-indigo-100/70 font-medium text-sm leading-relaxed mb-8 italic">
                     Clicking sync will instantly update the fee records of all {(students || []).length} students to match these new values.
                   </p>
                   <button 
                    onClick={syncFeesToStudents}
                    disabled={isApplyingFees}
                    className="w-full bg-green-500 text-white py-5 rounded-3xl font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-xl shadow-green-900/40 disabled:opacity-50 flex items-center justify-center gap-3"
                   >
                     {isApplyingFees ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="v-5 h-5" />}
                     Sync Billing Records
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
