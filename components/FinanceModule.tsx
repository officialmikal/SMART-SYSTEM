
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
  FileText,
  Edit3,
  Trash2,
  AlertTriangle,
  ArrowRight,
  Wallet
} from 'lucide-react';
import { Language, translations } from '../services/localizationService';
import { KENYAN_CLASSES, Student, ClassFee, Expenditure } from '../types';
import { apiService } from '../services/apiService';

interface Props {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  expenditures: Expenditure[];
  setExpenditures: React.Dispatch<React.SetStateAction<Expenditure[]>>;
  feeStructure: ClassFee[];
  setFeeStructure: React.Dispatch<React.SetStateAction<ClassFee[]>>;
  schoolLogo: string | null;
  schoolConfig: any;
  isBackendLive?: boolean;
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

export const FinanceModule: React.FC<Props & { lang: Language }> = ({ lang, students, setStudents, expenditures, setExpenditures, feeStructure, setFeeStructure, schoolLogo, schoolConfig, isBackendLive }) => {
  const t = translations[lang];
  
  const [activeTab, setActiveTab] = useState<'payments' | 'class-summary' | 'fee-structure' | 'expenditures'>('class-summary');
  const [selectedClass, setSelectedClass] = useState<string>('All Classes');
  const [financeSearch, setFinanceSearch] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<TransactionReceipt | null>(null);

  // Payment Recording states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<Student | null>(null);
  const [paymentFormData, setPaymentFormData] = useState({ amount: '', method: 'CASH' as 'CASH' | 'BANK', reference: '' });

  // STK Push states
  const [isStkModalOpen, setIsStkModalOpen] = useState(false);
  const [stkStudent, setStkStudent] = useState<Student | null>(null);
  const [stkAmount, setStkAmount] = useState('');
  const [stkPhone, setStkPhone] = useState('');
  const [isStkProcessing, setIsStkProcessing] = useState(false);

  // Billing states
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [selectedStudentForBilling, setSelectedStudentForBilling] = useState<Student | null>(null);
  const [billingFormData, setBillingFormData] = useState({ agreedFee: 0, paidFee: 0 });

  // Expenditure management states
  const [showExpModal, setShowExpModal] = useState(false);
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [expForm, setExpForm] = useState<Partial<Expenditure>>({
    amount: 0,
    category: 'Other',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const filteredStudents = useMemo(() => {
    return (students || []).filter(s => {
      const matchesClass = selectedClass === 'All Classes' || s.class === selectedClass;
      const term = financeSearch.toLowerCase();
      return matchesClass && (s.firstName.toLowerCase().includes(term) || s.lastName.toLowerCase().includes(term) || s.admissionNumber.toLowerCase().includes(term));
    });
  }, [students, selectedClass, financeSearch]);

  const financeStats = useMemo(() => {
    const totalCollected = students.reduce((sum, s) => sum + (s.paidFee || 0), 0);
    const totalExp = expenditures.reduce((sum, e) => sum + e.amount, 0);
    return { 
      expected: students.reduce((sum, s) => sum + (s.agreedFee ?? s.totalFee), 0),
      collected: totalCollected, 
      outstanding: students.reduce((sum, s) => sum + (s.feeBalance || 0), 0), 
      prepaid: students.reduce((sum, s) => sum + (s.prepaidFee || 0), 0),
      expenditure: totalExp,
      net: totalCollected - totalExp 
    };
  }, [students, expenditures]);

  const initiateStkPush = (student: Student) => {
    setStkStudent(student);
    setStkAmount(student.feeBalance.toString());
    setStkPhone(student.guardianPhone);
    setIsStkModalOpen(true);
  };

  const openPaymentModal = (student: Student) => {
    setSelectedStudentForPayment(student);
    setPaymentFormData({ amount: '', method: 'CASH', reference: '' });
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForPayment || !paymentFormData.amount) return;

    const amountToAdd = parseFloat(paymentFormData.amount);
    setStudents(prev => prev.map(s => {
      if (s.id === selectedStudentForPayment.id) {
        const totalPaid = (s.paidFee || 0) + amountToAdd;
        const target = s.agreedFee ?? s.totalFee;
        const balance = Math.max(0, target - totalPaid);
        const prepaid = totalPaid > target ? totalPaid - target : 0;
        
        // Generate receipt
        setLastReceipt({
          receiptNo: `RCT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          studentName: `${s.firstName} ${s.lastName}`,
          adm: s.admissionNumber,
          class: s.class,
          amount: amountToAdd,
          method: paymentFormData.method as any,
          reference: paymentFormData.reference || 'DIRECT COLLECTION',
          date: new Date().toLocaleString(),
          balance: balance,
          servedBy: 'Institutional Finance'
        });
        
        return { ...s, paidFee: totalPaid, feeBalance: balance, prepaidFee: prepaid };
      }
      return s;
    }));

    setIsPaymentModalOpen(false);
    setShowReceipt(true);
  };

  const handleConfirmStk = async () => {
    if (!stkStudent || !stkAmount) return;
    setIsStkProcessing(true);
    try {
      if (isBackendLive) {
        await apiService.request('/mpesa/stk-push', {
          method: 'POST',
          body: JSON.stringify({
            studentId: stkStudent.id,
            amount: parseFloat(stkAmount),
            phone: stkPhone
          })
        });
        alert("STK Push initiated! A prompt has been sent to the guardian's phone.");
      } else {
        await new Promise(r => setTimeout(r, 2000));
        alert("OFFLINE MODE: STK Push simulated. In production, this would send a real Safaricom prompt.");
      }
      setIsStkModalOpen(false);
    } catch (e: any) {
      alert("M-Pesa Error: " + (e.message || "Could not connect to Safaricom Daraja API"));
    } finally {
      setIsStkProcessing(false);
    }
  };

  const openBillingEditor = (student: Student) => {
    setSelectedStudentForBilling(student);
    setBillingFormData({ agreedFee: student.agreedFee ?? student.totalFee, paidFee: student.paidFee || 0 });
    setIsBillingModalOpen(true);
  };

  const handleSaveBilling = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForBilling) return;
    setStudents(prev => prev.map(s => {
      if (s.id === selectedStudentForBilling.id) {
        const target = billingFormData.agreedFee;
        const paid = billingFormData.paidFee;
        let balance = Math.max(0, target - paid);
        let prepaid = paid > target ? paid - target : 0;
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
      method: 'CASH',
      reference: 'ACCOUNT STATEMENT',
      date: new Date().toLocaleString(),
      balance: student.feeBalance,
      servedBy: 'Finance Dept'
    });
    setShowReceipt(true);
  };

  const handleSaveExpenditure = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExpId) {
      setExpenditures(prev => prev.map(exp => exp.id === editingExpId ? { ...exp, ...expForm } as Expenditure : exp));
    } else {
      const newExp = { ...expForm, id: Math.random().toString(36).substr(2, 9) } as Expenditure;
      setExpenditures(prev => [newExp, ...prev]);
    }
    setShowExpModal(false);
    setEditingExpId(null);
  };

  const openExpEditor = (exp?: Expenditure) => {
    if (exp) {
      setEditingExpId(exp.id);
      setExpForm(exp);
    } else {
      setEditingExpId(null);
      setExpForm({
        amount: 0,
        category: 'Other',
        date: new Date().toISOString().split('T')[0],
        description: ''
      });
    }
    setShowExpModal(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">{t.finance}</h1>
          <p className="text-gray-500 font-medium">Manage institutional revenue and integrated M-Pesa payments.</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => openExpEditor()}
             className="flex items-center gap-2 bg-white border-2 border-gray-100 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
           >
             <TrendingDown className="w-4 h-4 text-red-600" /> New Expense
           </button>
           <button 
             onClick={() => setActiveTab('class-summary')}
             className="flex items-center gap-2 bg-blue-600 text-white px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
           >
             <Banknote className="w-4 h-4" /> Collect Fee
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t.total_expected, value: financeStats.expected, icon: Target, color: 'indigo' },
          { label: t.collected_fee, value: financeStats.collected, icon: Banknote, color: 'green' },
          { label: t.outstanding_fees, value: financeStats.outstanding, icon: AlertCircle, color: 'red' },
          { label: 'Expenditures', value: financeStats.expenditure, icon: TrendingDown, color: 'orange' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
             <div className="p-3 rounded-xl bg-gray-50">
                <stat.icon size={20} className={`text-${stat.color}-600`} />
             </div>
             <div>
                <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">{stat.label}</p>
                <p className="text-lg font-black text-gray-900 leading-tight">KES {stat.value.toLocaleString()}</p>
             </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b overflow-x-auto">
          {[
            { id: 'class-summary', label: 'Learner Ledger', icon: ReceiptText },
            { id: 'expenditures', label: 'Expenditures', icon: TrendingDown },
            { id: 'fee-structure', label: 'Fee Structure', icon: Settings2 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-900'}`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        <div className="p-8">
          {activeTab === 'class-summary' && (
            <div className="space-y-6">
               <div className="flex flex-col md:flex-row gap-4 justify-between">
                  <div className="flex-1 relative">
                     <Search className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
                     <input 
                      type="text" 
                      placeholder="Search learners by name or ADM..." 
                      value={financeSearch}
                      onChange={e => setFinanceSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-blue-500 transition-all outline-none"
                     />
                  </div>
                  <select 
                    value={selectedClass} 
                    onChange={e => setSelectedClass(e.target.value)}
                    className="p-2.5 border-2 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none"
                  >
                    <option>All Classes</option>
                    {KENYAN_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
               </div>

               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="text-[9px] font-black uppercase text-gray-400 tracking-widest border-b pb-4">
                       <th className="pb-4 px-2">Learner Name</th>
                       <th className="pb-4 px-2">Grade</th>
                       <th className="pb-4 px-2">Balance</th>
                       <th className="pb-4 px-2 text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                     {filteredStudents.map(student => (
                       <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                         <td className="py-4 px-2">
                            <p className="font-bold text-gray-900">{student.firstName} {student.lastName}</p>
                            <p className="text-[9px] font-mono text-blue-600 uppercase tracking-tighter">{student.admissionNumber}</p>
                         </td>
                         <td className="py-4 px-2"><span className="px-2 py-0.5 bg-gray-100 rounded text-[9px] font-black uppercase">{student.class}</span></td>
                         <td className="py-4 px-2">
                            <p className={`text-xs font-black ${student.feeBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                               KES {(student.feeBalance || 0).toLocaleString()}
                            </p>
                         </td>
                         <td className="py-4 px-2 text-right">
                            <div className="flex justify-end gap-2">
                               <button 
                                 onClick={() => openPaymentModal(student)} 
                                 className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100 hover:bg-blue-100 transition-all shadow-sm"
                               >
                                  <CreditCard size={12} /> Record Payment
                               </button>
                               <button 
                                 onClick={() => initiateStkPush(student)} 
                                 className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-[9px] font-black uppercase tracking-widest border border-green-100 hover:bg-green-100 transition-all shadow-sm"
                               >
                                  <Smartphone size={12} /> STK Push
                               </button>
                               <button onClick={() => openBillingEditor(student)} className="p-2 text-gray-400 hover:text-blue-600" title="Adjust Billing"><Settings2 size={16} /></button>
                               <button onClick={() => generateStudentReceipt(student)} className="p-2 text-gray-400 hover:text-green-600" title="Print Statement"><Printer size={16} /></button>
                            </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {activeTab === 'expenditures' && (
            <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black uppercase tracking-tight text-gray-900">Institutional Expenses</h3>
                  <button onClick={() => openExpEditor()} className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">
                     <Plus size={14} /> Add Record
                  </button>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="text-[9px] font-black uppercase text-gray-400 tracking-widest border-b pb-4">
                       <th className="pb-4">Date</th>
                       <th className="pb-4">Category</th>
                       <th className="pb-4">Description</th>
                       <th className="pb-4">Amount</th>
                       <th className="pb-4 text-right">Edit</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                     {expenditures.map(exp => (
                       <tr key={exp.id} className="hover:bg-gray-50/50 transition-colors">
                         <td className="py-4 text-xs font-bold">{new Date(exp.date).toLocaleDateString()}</td>
                         <td className="py-4"><span className="px-2 py-0.5 bg-gray-100 rounded text-[9px] font-black uppercase">{exp.category}</span></td>
                         <td className="py-4 text-xs text-gray-600">{exp.description}</td>
                         <td className="py-4 font-black text-gray-900">KES {exp.amount.toLocaleString()}</td>
                         <td className="py-4 text-right">
                            <button onClick={() => openExpEditor(exp)} className="p-2 text-gray-400 hover:text-blue-600"><Edit3 size={16} /></button>
                         </td>
                       </tr>
                     ))}
                     {expenditures.length === 0 && (
                       <tr>
                         <td colSpan={5} className="py-12 text-center text-gray-400 font-bold uppercase text-[10px]">No expenditure records found.</td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {activeTab === 'fee-structure' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {feeStructure.map((fee, idx) => (
                 <div key={idx} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                    <div>
                       <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{fee.className}</p>
                       <p className="text-lg font-black text-gray-900">KES {fee.amount.toLocaleString()}</p>
                    </div>
                    <button 
                      onClick={() => {
                        const amt = prompt(`New fee amount for ${fee.className}`, fee.amount.toString());
                        if (amt && !isNaN(Number(amt))) {
                          setFeeStructure(prev => prev.map(f => f.className === fee.className ? { ...f, amount: Number(amt) } : f));
                        }
                      }}
                      className="p-3 bg-white text-gray-400 hover:text-blue-600 rounded-xl shadow-sm border border-gray-100 transition-all"
                    >
                      <Edit3 size={16} />
                    </button>
                 </div>
               ))}
            </div>
          )}
        </div>
      </div>

      {/* Manual Payment Collection Modal */}
      {isPaymentModalOpen && selectedStudentForPayment && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md">
           <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl p-10 animate-in zoom-in duration-300">
              <div className="flex justify-between items-center mb-6">
                 <div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Collect Fee</h2>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">{selectedStudentForPayment.firstName} {selectedStudentForPayment.lastName}</p>
                 </div>
                 <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-red-600"><X size={24} /></button>
              </div>
              <form onSubmit={handleSavePayment} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Amount (KES)</label>
                    <input required autoFocus type="number" value={paymentFormData.amount} onChange={e => setPaymentFormData({...paymentFormData, amount: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-black text-2xl focus:border-blue-500 transition-all outline-none shadow-inner" placeholder="0.00" />
                    <p className="text-[9px] text-gray-400 font-bold uppercase ml-1 italic">Current Balance: KES {selectedStudentForPayment.feeBalance.toLocaleString()}</p>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Channel / Method</label>
                    <div className="grid grid-cols-2 gap-2">
                       <button type="button" onClick={() => setPaymentFormData({...paymentFormData, method: 'CASH'})} className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${paymentFormData.method === 'CASH' ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-gray-50 border-transparent text-gray-400'}`}>Cash Payment</button>
                       <button type="button" onClick={() => setPaymentFormData({...paymentFormData, method: 'BANK'})} className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${paymentFormData.method === 'BANK' ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-gray-50 border-transparent text-gray-400'}`}>Bank Deposit</button>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Transaction Ref (Optional)</label>
                    <input type="text" value={paymentFormData.reference} onChange={e => setPaymentFormData({...paymentFormData, reference: e.target.value.toUpperCase()})} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold uppercase outline-none focus:border-blue-500 shadow-inner" placeholder="E.G. BANK SLIP ID" />
                 </div>
                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="flex-1 py-4 text-gray-400 font-black uppercase text-[10px] tracking-widest">Discard</button>
                    <button type="submit" className="flex-[2] py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95">
                       <Wallet size={16} /> Finalize Collection
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Expenditure Modal */}
      {showExpModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md">
           <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl p-10 animate-in zoom-in duration-300">
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">{editingExpId ? 'Edit Expense' : 'Add Expense'}</h2>
                 <button onClick={() => setShowExpModal(false)} className="text-gray-400 hover:text-red-600"><X size={24} /></button>
              </div>
              <form onSubmit={handleSaveExpenditure} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Amount (KES)</label>
                    <input required type="number" value={expForm.amount} onChange={e => setExpForm({...expForm, amount: Number(e.target.value)})} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-black outline-none focus:border-red-500 transition-all" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                    <select value={expForm.category} onChange={e => setExpForm({...expForm, category: e.target.value as any})} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-black uppercase text-xs outline-none focus:border-red-500 transition-all">
                       <option value="Salaries">Salaries</option>
                       <option value="Food/Supplies">Food/Supplies</option>
                       <option value="Utilities">Utilities</option>
                       <option value="Maintenance">Maintenance</option>
                       <option value="Exams">Exams</option>
                       <option value="Other">Other</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date</label>
                    <input required type="date" value={expForm.date} onChange={e => setExpForm({...expForm, date: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-black outline-none focus:border-red-500 transition-all" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                    <textarea required value={expForm.description} onChange={e => setExpForm({...expForm, description: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-red-500 transition-all h-24" />
                 </div>
                 <div className="flex gap-4 pt-6">
                    <button type="button" onClick={() => setShowExpModal(false)} className="flex-1 py-4 text-gray-400 font-black uppercase text-[10px] tracking-widest">Cancel</button>
                    <button type="submit" className="flex-2 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2">
                       <Save size={16} /> {editingExpId ? 'Update Record' : 'Save Record'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* M-Pesa STK Modal */}
      {isStkModalOpen && stkStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md">
           <div className="bg-white rounded-[40px] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in duration-300">
              <div className="bg-green-600 p-8 text-white text-center">
                 <Smartphone className="w-12 h-12 mx-auto mb-4" />
                 <h2 className="text-2xl font-black uppercase tracking-tighter">Lipa Na M-Pesa</h2>
                 <p className="text-[10px] font-black uppercase opacity-70 tracking-widest mt-1">Direct STK Push Prompt</p>
              </div>
              <div className="p-8 space-y-6">
                 <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Learner ADM: {stkStudent.admissionNumber}</p>
                    <p className="font-black text-gray-900 text-lg">{stkStudent.firstName} {stkStudent.lastName}</p>
                 </div>
                 <div className="space-y-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Amount (KES)</label>
                       <input type="number" value={stkAmount} onChange={e => setStkAmount(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-black text-2xl text-green-700 focus:border-green-500 outline-none transition-all shadow-inner" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Parent Phone Number</label>
                       <input type="tel" value={stkPhone} onChange={e => setStkPhone(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-black focus:border-green-500 outline-none transition-all shadow-inner" placeholder="07XX..." />
                    </div>
                 </div>
                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsStkModalOpen(false)} className="flex-1 py-4 text-gray-400 font-black uppercase text-[10px] tracking-widest">Cancel</button>
                    <button onClick={handleConfirmStk} disabled={isStkProcessing} className="flex-2 py-4 bg-green-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2">
                       {isStkProcessing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                       {isStkProcessing ? 'Requesting PIN...' : 'Trigger Push'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {isBillingModalOpen && selectedStudentForBilling && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md">
           <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl p-10 animate-in zoom-in duration-300">
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-2">Billing Override</h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8">{selectedStudentForBilling.firstName} {selectedStudentForBilling.lastName}</p>
              <form onSubmit={handleSaveBilling} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Negotiated Fee</label>
                    <input type="number" value={billingFormData.agreedFee} onChange={e => setBillingFormData({...billingFormData, agreedFee: Number(e.target.value)})} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-black outline-none focus:border-blue-500 transition-all" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Total Paid</label>
                    <input type="number" value={billingFormData.paidFee} onChange={e => setBillingFormData({...billingFormData, paidFee: Number(e.target.value)})} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-black outline-none focus:border-blue-500 transition-all" />
                 </div>
                 <div className="flex gap-4 pt-6">
                    <button type="button" onClick={() => setIsBillingModalOpen(false)} className="flex-1 py-4 text-gray-400 font-black uppercase text-[10px] tracking-widest">Discard</button>
                    <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Apply Changes</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {showReceipt && lastReceipt && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-md">
           <div className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl p-10 animate-in zoom-in duration-300 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <ShieldCheck size={120} />
              </div>
              <div className="border-b pb-6 mb-6">
                 <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">{schoolConfig.schoolName}</h2>
                 <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Official Receipt</p>
              </div>
              <div className="space-y-4">
                 <div className="flex justify-between text-xs"><span className="text-gray-400 font-bold uppercase tracking-widest">Receipt No</span><span className="font-mono font-black">{lastReceipt.receiptNo}</span></div>
                 <div className="flex justify-between text-xs"><span className="text-gray-400 font-bold uppercase tracking-widest">Learner</span><span className="font-black">{lastReceipt.studentName}</span></div>
                 <div className="flex justify-between text-xs"><span className="text-gray-400 font-bold uppercase tracking-widest">Paid</span><span className="font-black text-green-600">KES {lastReceipt.amount.toLocaleString()}</span></div>
                 <div className="flex justify-between text-xs border-t pt-4"><span className="text-gray-400 font-bold uppercase tracking-widest">Balance</span><span className="font-black text-red-600">KES {lastReceipt.balance.toLocaleString()}</span></div>
              </div>
              <div className="mt-8 flex gap-3">
                 <button onClick={() => setShowReceipt(false)} className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">Close</button>
                 <button onClick={() => window.print()} className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-100 flex items-center justify-center gap-2">
                    <Printer size={12} /> Print
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
