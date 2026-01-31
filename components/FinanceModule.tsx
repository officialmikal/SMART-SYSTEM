
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
  ReceiptText,
  TrendingDown,
  ChevronRight,
  Plus,
  Settings2,
  FileText
} from 'lucide-react';
import { Language, translations } from '../services/localizationService';
import { KENYAN_CLASSES, Student, ClassFee, Expenditure } from '../types';

interface Props {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  expenditures: Expenditure[];
  setExpenditures: React.Dispatch<React.SetStateAction<Expenditure[]>>;
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

export const FinanceModule: React.FC<Props & { lang: Language }> = ({ lang, students, setStudents, expenditures, setExpenditures, feeStructure, setFeeStructure, schoolLogo, schoolConfig }) => {
  const t = translations[lang];
  
  const [activeTab, setActiveTab] = useState<'payments' | 'class-summary' | 'fee-structure' | 'expenditures'>('class-summary');
  const [selectedClass, setSelectedClass] = useState<string>('All Classes');
  const [financeSearch, setFinanceSearch] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<TransactionReceipt | null>(null);

  // New Billing Edit States
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [selectedStudentForBilling, setSelectedStudentForBilling] = useState<Student | null>(null);
  const [billingFormData, setBillingFormData] = useState({ agreedFee: 0, paidFee: 0 });

  // New Expenditure States
  const [showExpModal, setShowExpModal] = useState(false);
  const [expForm, setExpForm] = useState<Partial<Expenditure>>({
    amount: 0,
    category: 'Other',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  // Payment Logic States
  const [paymentMode, setPaymentMode] = useState<'individual' | 'parent'>('individual');
  const [parentPhone, setParentPhone] = useState('');
  const [paymentForm, setPaymentForm] = useState({ 
    adm: '', 
    amount: '', 
    method: 'M-PESA' as 'M-PESA' | 'BANK' | 'CASH', 
    reference: '' 
  });
  
  const [allocations, setAllocations] = useState<{ studentId: string; amount: number }[]>([]);

  // Sibling Discovery Logic
  const siblings = useMemo(() => {
    if (paymentMode === 'parent' && parentPhone.length >= 9) {
      return students.filter(s => s.guardianPhone.includes(parentPhone));
    }
    return [];
  }, [students, paymentMode, parentPhone]);

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
    const totalExpected = targetStudents.reduce((sum, s) => sum + (s.agreedFee ?? s.totalFee), 0);
    const totalCollected = targetStudents.reduce((sum, s) => sum + (s.paidFee || 0), 0);
    const totalOutstanding = targetStudents.reduce((sum, s) => sum + (s.feeBalance || 0), 0);
    const totalPrepaid = targetStudents.reduce((sum, s) => sum + (s.prepaidFee || 0), 0);
    
    const totalExp = expenditures.reduce((sum, e) => sum + e.amount, 0);
    const netBalance = totalCollected - totalExp;

    return { 
      expected: totalExpected, 
      collected: totalCollected, 
      outstanding: totalOutstanding, 
      prepaid: totalPrepaid,
      expenditure: totalExp,
      net: netBalance 
    };
  }, [filteredStudents, expenditures]);

  const openBillingEditor = (student: Student) => {
    setSelectedStudentForBilling(student);
    setBillingFormData({
      agreedFee: student.agreedFee ?? student.totalFee,
      paidFee: student.paidFee || 0
    });
    setIsBillingModalOpen(true);
  };

  const handleSaveBilling = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForBilling) return;

    setStudents(prev => prev.map(s => {
      if (s.id === selectedStudentForBilling.id) {
        const target = billingFormData.agreedFee;
        const paid = billingFormData.paidFee;
        let balance = target - paid;
        let prepaid = 0;
        if (balance < 0) {
          prepaid = Math.abs(balance);
          balance = 0;
        }
        return { ...s, agreedFee: target, paidFee: paid, feeBalance: balance, prepaidFee: prepaid };
      }
      return s;
    }));
    setIsBillingModalOpen(false);
  };

  const generateStudentReceipt = (student: Student) => {
    setLastReceipt({
      receiptNo: `STA-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      studentName: `${student.firstName} ${student.lastName}`,
      adm: student.admissionNumber,
      class: student.class,
      amount: student.paidFee,
      method: 'CASH', // Default for statement
      reference: 'ACCOUNT STATEMENT',
      date: new Date().toLocaleString(),
      balance: student.feeBalance,
      servedBy: 'ElimuSmart Accounts'
    });
    setShowReceipt(true);
  };

  const handlePostPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMode === 'individual' && (!paymentForm.adm || !paymentForm.amount)) return;
    if (paymentMode === 'parent' && (allocations.length === 0)) return;

    setIsPosting(true);
    await new Promise(r => setTimeout(r, 1000));

    const amountNum = parseFloat(paymentForm.amount);

    if (paymentMode === 'individual') {
      let updatedStudent: Student | undefined;
      setStudents(prev => prev.map(s => {
        if (s.admissionNumber === paymentForm.adm) {
          const newPaid = (s.paidFee || 0) + amountNum;
          const target = s.agreedFee ?? s.totalFee;
          let newBalance = target - newPaid;
          let newPrepaid = 0;
          if (newBalance < 0) {
            newPrepaid = Math.abs(newBalance);
            newBalance = 0;
          }
          updatedStudent = { ...s, paidFee: newPaid, feeBalance: newBalance, prepaidFee: newPrepaid };
          return updatedStudent;
        }
        return s;
      }));

      if (updatedStudent) {
        setLastReceipt({
          receiptNo: `RCP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          studentName: `${updatedStudent.firstName} ${updatedStudent.lastName}`,
          adm: updatedStudent.admissionNumber,
          class: updatedStudent.class,
          amount: amountNum,
          method: paymentForm.method,
          reference: paymentForm.reference || `TXN-${Date.now().toString().slice(-8)}`,
          date: new Date().toLocaleString(),
          balance: updatedStudent.feeBalance,
          servedBy: 'ElimuSmart Accounts'
        });
        setShowReceipt(true);
      }
    } else {
      // Parent Distribution
      setStudents(prev => prev.map(s => {
        const allocation = allocations.find(a => a.studentId === s.id);
        if (allocation) {
          const newPaid = (s.paidFee || 0) + allocation.amount;
          const target = s.agreedFee ?? s.totalFee;
          let newBalance = target - newPaid;
          let newPrepaid = 0;
          if (newBalance < 0) {
            newPrepaid = Math.abs(newBalance);
            newBalance = 0;
          }
          return { ...s, paidFee: newPaid, feeBalance: newBalance, prepaidFee: newPrepaid };
        }
        return s;
      }));
      alert(`Parent Payment of KES ${amountNum} distributed across ${allocations.length} siblings.`);
    }

    setIsPosting(false);
    setPaymentForm({ adm: '', amount: '', method: 'M-PESA', reference: '' });
    setAllocations([]);
    setParentPhone('');
  };

  const handleSaveExpenditure = (e: React.FormEvent) => {
    e.preventDefault();
    const newExp: Expenditure = {
      ...expForm,
      id: `exp-${Date.now()}`,
      amount: parseFloat(expForm.amount as any) || 0
    } as Expenditure;
    setExpenditures(prev => [newExp, ...prev]);
    setShowExpModal(false);
    setExpForm({ amount: 0, category: 'Other', date: new Date().toISOString().split('T')[0], description: '' });
  };

  const exportToPDF = (elementId: string, fileName: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    const opt = {
      margin: 0.2, filename: fileName, image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    const h2p = (window as any).html2pdf;
    if (typeof h2p === 'function') h2p().set(opt).from(element).save();
    else window.print();
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Finance Center</h1>
          <p className="text-gray-500 font-medium tracking-tight">Real-time ledger, parent payments & school expenses.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex p-1 bg-gray-100 rounded-2xl shadow-inner">
            <button onClick={() => setActiveTab('class-summary')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'class-summary' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Ledger</button>
            <button onClick={() => setActiveTab('expenditures')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'expenditures' ? 'bg-white text-red-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Expenditure</button>
            <button onClick={() => setActiveTab('payments')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'payments' ? 'bg-white text-emerald-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Record Payment</button>
            <button onClick={() => setActiveTab('fee-structure')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'fee-structure' ? 'bg-white text-gray-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Settings</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        <StatCard label="Expected Revenue" value={financeStats.expected} icon={Target} color="indigo" />
        <StatCard label="Amount Collected" value={financeStats.collected} icon={Banknote} color="green" />
        <StatCard label="Total Expenditure" value={financeStats.expenditure} icon={TrendingDown} color="red" />
        <StatCard label="Net Balance" value={financeStats.net} icon={ShieldCheck} color="emerald" />
        <StatCard label="Outstanding" value={financeStats.outstanding} icon={AlertCircle} color="amber" />
        <StatCard label="Prepaid Credit" value={financeStats.prepaid} icon={Forward} color="blue" />
      </div>

      {activeTab === 'class-summary' && (
        <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm animate-in fade-in duration-300">
          <div className="p-8 border-b bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="flex items-center gap-4">
               <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="p-2.5 bg-white border-2 rounded-xl text-[10px] font-black uppercase outline-none focus:border-blue-500">
                <option>All Classes</option>
                {KENYAN_CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
               </select>
               <div className="relative w-64">
                   <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                   <input type="text" placeholder="Search ledger..." value={financeSearch} onChange={(e) => setFinanceSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none font-medium text-xs" />
                </div>
             </div>
             <button onClick={() => exportToPDF('class-ledger-table', `Ledger_Report.pdf`)} className="p-3 bg-white border-2 border-gray-100 rounded-2xl text-gray-600 hover:text-blue-600 flex items-center gap-2 font-black uppercase text-[10px] tracking-widest no-print">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Print Summary
             </button>
          </div>
          <div className="overflow-x-auto" id="class-ledger-table">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b text-[10px] text-gray-400 uppercase font-black tracking-widest">
                  <th className="px-8 py-6">Learner Credentials</th>
                  <th className="px-8 py-6 text-center">Agreed/Target Fee</th>
                  <th className="px-8 py-6 text-center">Paid</th>
                  <th className="px-8 py-6 text-center">Arrears</th>
                  <th className="px-8 py-6 text-center">Prepaid</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((s, idx) => {
                  const expected = s.agreedFee ?? s.totalFee;
                  return (
                    <tr key={idx} className="hover:bg-blue-50/10 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="font-black text-gray-900 leading-tight uppercase tracking-tight">{s.firstName} {s.lastName}</div>
                        <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">{s.admissionNumber} • {s.class}</div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="font-bold text-gray-700">KES {expected.toLocaleString()}</div>
                        {s.agreedFee !== undefined && <div className="text-[8px] font-black text-blue-500 uppercase italic">Negotiated Rate</div>}
                      </td>
                      <td className="px-8 py-6 text-center font-bold text-emerald-600">KES {(s.paidFee || 0).toLocaleString()}</td>
                      <td className="px-8 py-6 text-center">
                         <span className={`font-black ${s.feeBalance > 0 ? 'text-red-600' : 'text-gray-300'}`}>
                           KES {(s.feeBalance || 0).toLocaleString()}
                         </span>
                      </td>
                      <td className="px-8 py-6 text-center font-black text-blue-600">KES {(s.prepaidFee || 0).toLocaleString()}</td>
                      <td className="px-8 py-6 text-right">
                         <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openBillingEditor(s)} className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-blue-600 hover:border-blue-200 shadow-sm" title="Edit Billing">
                               <Settings2 size={16} />
                            </button>
                            <button onClick={() => generateStudentReceipt(s)} className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-emerald-600 hover:border-emerald-200 shadow-sm" title="View Statement/Receipt">
                               <ReceiptText size={16} />
                            </button>
                         </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Billing Editor */}
      {isBillingModalOpen && selectedStudentForBilling && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
              <div className="p-8 border-b bg-gray-50/50 flex items-center justify-between">
                 <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter text-gray-900">Billing Adjustment</h2>
                    <p className="text-[10px] text-blue-600 font-bold uppercase">{selectedStudentForBilling.firstName} {selectedStudentForBilling.lastName}</p>
                 </div>
                 <button onClick={() => setIsBillingModalOpen(false)} className="p-2 hover:bg-red-50 text-gray-400 rounded-full transition-all"><X size={24} /></button>
              </div>
              <form onSubmit={handleSaveBilling} className="p-8 space-y-6">
                 <div className="space-y-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Institutional Agreed Fee (Target)</label>
                       <input required type="number" value={billingFormData.agreedFee} onChange={e => setBillingFormData({...billingFormData, agreedFee: parseFloat(e.target.value)})} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-black text-xl outline-none focus:border-blue-500 shadow-inner" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Total Paid To Date</label>
                       <input required type="number" value={billingFormData.paidFee} onChange={e => setBillingFormData({...billingFormData, paidFee: parseFloat(e.target.value)})} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-black text-xl outline-none focus:border-emerald-500 shadow-inner" />
                    </div>
                 </div>
                 <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex justify-between items-center">
                       <p className="text-[9px] font-black text-gray-400 uppercase">New Closing Balance</p>
                       <p className="text-xl font-black text-red-600">KES {(billingFormData.agreedFee - billingFormData.paidFee).toLocaleString()}</p>
                    </div>
                 </div>
                 <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black uppercase tracking-widest rounded-3xl hover:bg-blue-700 transition-all shadow-xl flex items-center justify-center gap-3">
                   <Save className="w-5 h-5" /> Commit Ledger Update
                 </button>
              </form>
           </div>
        </div>
      )}

      {activeTab === 'expenditures' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
             <h3 className="text-xl font-black uppercase tracking-tighter text-gray-800">Operational Expenditure</h3>
             <button onClick={() => setShowExpModal(true)} className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-100">
                <Plus size={16} /> Record Expense
             </button>
          </div>
          
          <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b text-[10px] text-gray-400 uppercase font-black tracking-widest">
                      <th className="px-8 py-6">Category</th>
                      <th className="px-8 py-6">Description</th>
                      <th className="px-8 py-6">Date</th>
                      <th className="px-8 py-6 text-right">Amount (KES)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {expenditures.map(exp => (
                      <tr key={exp.id} className="hover:bg-red-50/10">
                        <td className="px-8 py-6">
                           <span className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{exp.category}</span>
                        </td>
                        <td className="px-8 py-6 font-medium text-gray-700 italic">{exp.description}</td>
                        <td className="px-8 py-6 text-xs text-gray-400 font-bold">{exp.date}</td>
                        <td className="px-8 py-6 text-right font-black text-gray-900 text-lg">KES {exp.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                    {expenditures.length === 0 && (
                      <tr><td colSpan={4} className="py-20 text-center text-gray-400 font-bold uppercase text-[10px]">No expenditures logged yet.</td></tr>
                    )}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="max-w-4xl mx-auto bg-white p-12 rounded-[56px] border-2 border-gray-100 shadow-2xl animate-in zoom-in duration-500 relative overflow-hidden">
          <div className="mb-10 flex items-center justify-between border-b pb-8">
             <div className="flex items-center gap-6">
                <div className="p-5 bg-emerald-600 text-white rounded-[28px] shadow-2xl shadow-emerald-200">
                    <Banknote className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter leading-none">Capture Payment</h2>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-3">M-Pesa / Bank Handshake</p>
                </div>
             </div>
             <div className="flex bg-gray-100 p-1.5 rounded-2xl border">
                <button onClick={() => setPaymentMode('individual')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${paymentMode === 'individual' ? 'bg-white text-emerald-600 shadow-md' : 'text-gray-400'}`}>Single Student</button>
                <button onClick={() => setPaymentMode('parent')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${paymentMode === 'parent' ? 'bg-white text-emerald-600 shadow-md' : 'text-gray-400'}`}>Parent (Multi)</button>
             </div>
          </div>

          <form onSubmit={handlePostPayment} className="space-y-10 relative z-10">
            {paymentMode === 'individual' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Learner</label>
                   <select required value={paymentForm.adm} onChange={e => setPaymentForm({...paymentForm, adm: e.target.value})} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-[24px] font-black uppercase outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner">
                    <option value="">ADM Number...</option>
                    {(students || []).map(s => <option key={s.id} value={s.admissionNumber}>{s.admissionNumber} - {s.firstName} {s.lastName}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Deposit Amount (KES)</label>
                   <input required type="number" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-[24px] font-black text-xl outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner" placeholder="0.00" />
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Parent Phone (Unique Link)</label>
                      <input required type="tel" value={parentPhone} onChange={e => setParentPhone(e.target.value)} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-[24px] font-black outline-none focus:border-emerald-500 shadow-inner" placeholder="07XXXXXXXX" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Total Parent Deposit (KES)</label>
                      <input required type="number" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-[24px] font-black text-xl outline-none focus:border-emerald-500 shadow-inner" placeholder="0.00" />
                   </div>
                </div>

                {siblings.length > 0 && (
                  <div className="p-8 bg-blue-50/50 rounded-[40px] border-2 border-blue-100 space-y-4">
                     <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Sibling Distribution ({siblings.length} found)</h4>
                     <div className="divide-y divide-blue-100">
                        {siblings.map(s => (
                          <div key={s.id} className="py-4 flex items-center justify-between">
                             <div>
                                <p className="font-black text-gray-900 text-sm">{s.firstName} {s.lastName}</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase">Bal: KES {s.feeBalance.toLocaleString()}</p>
                             </div>
                             <div className="flex items-center gap-3">
                                <span className="text-[9px] font-black text-gray-300">KES</span>
                                <input 
                                  type="number" 
                                  placeholder="Amount" 
                                  onChange={e => {
                                    const amt = parseFloat(e.target.value) || 0;
                                    setAllocations(prev => {
                                      const existing = prev.filter(p => p.studentId !== s.id);
                                      return [...existing, { studentId: s.id, amount: amt }];
                                    });
                                  }}
                                  className="w-24 p-2.5 bg-white border rounded-xl font-black text-xs outline-none focus:border-blue-500" 
                                />
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Channel</label>
                 <select value={paymentForm.method} onChange={e => setPaymentForm({...paymentForm, method: e.target.value as any})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-[20px] font-black outline-none">
                    <option>M-PESA</option>
                    <option>BANK</option>
                    <option>CASH</option>
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ref ID</label>
                 <input value={paymentForm.reference} onChange={e => setPaymentForm({...paymentForm, reference: e.target.value.toUpperCase()})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-[20px] font-black uppercase outline-none focus:border-emerald-500" placeholder="SKL-..." />
              </div>
            </div>

            <button type="submit" disabled={isPosting} className="w-full bg-emerald-600 text-white py-6 rounded-[32px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-emerald-100 disabled:opacity-50 hover:bg-emerald-700 transition-all flex items-center justify-center gap-4 active:scale-95 border-b-8 border-emerald-800">
              {isPosting ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldAlert className="w-6 h-6" />}
              {isPosting ? 'AUTHORIZING...' : 'COMMIT TRANSACTION'}
            </button>
          </form>
        </div>
      )}

      {/* MODAL: Add Expenditure */}
      {showExpModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
              <div className="p-8 border-b bg-gray-50/50 flex items-center justify-between">
                 <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900 leading-none">Record School Expense</h2>
                 <button onClick={() => setShowExpModal(false)} className="p-2 hover:bg-red-50 text-gray-400 rounded-full transition-all"><X size={24} /></button>
              </div>
              <form onSubmit={handleSaveExpenditure} className="p-8 space-y-6">
                 <div className="space-y-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Amount (KES)</label>
                       <input required type="number" value={expForm.amount} onChange={e => setExpForm({...expForm, amount: parseFloat(e.target.value)})} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-black text-2xl outline-none focus:border-red-500 shadow-inner" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                       <select value={expForm.category} onChange={e => setExpForm({...expForm, category: e.target.value as any})} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-black outline-none">
                          <option>Salaries</option>
                          <option>Food/Supplies</option>
                          <option>Utilities</option>
                          <option>Maintenance</option>
                          <option>Exams</option>
                          <option>Other</option>
                       </select>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Voucher Description</label>
                       <textarea value={expForm.description} onChange={e => setExpForm({...expForm, description: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-medium outline-none focus:border-red-500 h-24" placeholder="Briefly explain the outflow..." />
                    </div>
                 </div>
                 <button type="submit" className="w-full py-5 bg-red-600 text-white font-black uppercase tracking-widest rounded-3xl hover:bg-red-700 transition-all shadow-xl shadow-red-100 flex items-center justify-center gap-3">
                   <Save className="w-5 h-5" /> Commit Voucher
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* RECEIPT PREVIEW (Unchanged logic but used by finance) */}
      {showReceipt && lastReceipt && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/95 backdrop-blur-xl animate-in fade-in duration-300 no-print">
           <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl relative overflow-hidden animate-in zoom-in duration-300 max-h-[95vh] flex flex-col">
              <div className="p-8 border-b bg-gray-50/50 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <h3 className="text-xl font-black uppercase tracking-tighter text-gray-900">Official Document</h3>
                 </div>
                 <button onClick={() => setShowReceipt(false)} className="p-3 text-gray-400 hover:text-red-500 transition-all"><X size={24} /></button>
              </div>
              <div className="p-8 overflow-y-auto">
                 <div id="receipt-capture-element" className="bg-white border-2 border-gray-100 rounded-[32px] p-8 shadow-inner relative">
                    <div className="flex flex-col items-center justify-between border-b-2 border-blue-900 pb-8 mb-8 text-center">
                       <h2 className="text-2xl font-black text-blue-900 uppercase">{schoolConfig?.schoolName || 'ElimuSmart Academy'}</h2>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{schoolConfig?.motto}</p>
                       <p className="text-sm font-mono text-red-500 font-black mt-2">DOC: {lastReceipt.receiptNo}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-10 mb-10">
                       <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Account Holder</p>
                          <p className="font-black text-gray-900 text-lg uppercase">{lastReceipt.studentName}</p>
                          <p className="text-xs font-bold text-gray-500 uppercase">{lastReceipt.adm} • {lastReceipt.class}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Status</p>
                          <p className="font-black text-emerald-600 text-lg uppercase">{lastReceipt.reference}</p>
                          <p className="text-[10px] font-mono text-gray-400">Printed: {lastReceipt.date}</p>
                       </div>
                    </div>
                    <div className="p-10 bg-blue-50/50 rounded-3xl mb-10 border-2 border-blue-100 text-center">
                       <p className="text-[10px] font-black text-blue-400 uppercase mb-3">Net Collected (KES)</p>
                       <h4 className="text-5xl font-black text-blue-900">{(lastReceipt.amount || 0).toLocaleString()}.00</h4>
                    </div>
                    <div className="flex justify-between items-center p-6 border-2 border-blue-900 rounded-[24px]">
                       <p className="text-[10px] font-black text-gray-400 uppercase">Closing Ledger Balance</p>
                       <p className="text-3xl font-black text-blue-900">KES {(lastReceipt.balance || 0).toLocaleString()}.00</p>
                    </div>
                    <div className="mt-14 flex justify-between items-end border-t border-gray-50 pt-8">
                       <div className="italic text-[10px] text-gray-400">Generated by ElimuSmart Finance</div>
                       <div className="text-center">
                          <div className="w-48 h-[1px] bg-gray-300 mb-2"></div>
                          <div className="font-black uppercase text-gray-800 text-[10px]">Finance Registry Seal</div>
                       </div>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4 mt-10">
                    <button onClick={() => exportToPDF('receipt-capture-element', `Document_${lastReceipt.receiptNo}.pdf`)} className="flex items-center justify-center gap-3 bg-gray-900 text-white py-5 rounded-[24px] font-black uppercase text-xs tracking-widest shadow-xl">
                      <Download size={20} /> Download PDF
                    </button>
                    <button onClick={() => window.print()} className="flex items-center justify-center gap-3 bg-blue-600 text-white py-5 rounded-[24px] font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-100">
                      <Printer size={20} /> Print Output
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number; icon: any; color: string }> = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-3xl border border-gray-100 flex items-start justify-between shadow-sm hover:shadow-md transition-shadow min-w-[180px]">
    <div>
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">{label}</p>
      <h3 className={`text-xl font-black tracking-tight ${color === 'red' ? 'text-red-700' : color === 'green' ? 'text-green-700' : color === 'emerald' ? 'text-emerald-700' : 'text-gray-900'}`}>
        <span className="text-[10px] font-medium mr-1 opacity-40 italic">KES</span>
        {value.toLocaleString()}
      </h3>
    </div>
    <div className={`p-2.5 rounded-xl bg-${color}-50 text-${color}-600 border border-${color}-100 shadow-inner`}>
      <Icon className="w-4 h-4" />
    </div>
  </div>
);
