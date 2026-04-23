
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
  Wallet,
  UserSearch,
  FileBadge,
  Bus
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
  const [isReceiptDownloading, setIsReceiptDownloading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<TransactionReceipt | null>(null);

  // Global Collection States
  const [isQuickCollectOpen, setIsQuickCollectOpen] = useState(false);
  const [quickCategory, setQuickCategory] = useState<'TUITION' | 'TRANSPORT'>('TUITION');
  const [quickSearchTerm, setQuickSearchTerm] = useState('');

  // Payment Recording states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<Student | null>(null);
  const [paymentFormData, setPaymentFormData] = useState({ 
    amount: '', 
    method: 'CASH' as 'CASH' | 'BANK' | 'M-PESA', 
    reference: '',
    category: 'TUITION' as 'TUITION' | 'TRANSPORT'
  });

  // STK Push states
  const [isStkModalOpen, setIsStkModalOpen] = useState(false);
  const [stkStudent, setStkStudent] = useState<Student | null>(null);
  const [stkAmount, setStkAmount] = useState('');
  const [stkPhone, setStkPhone] = useState('');
  const [isStkProcessing, setIsStkProcessing] = useState(false);

  // Billing states
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [selectedStudentForBilling, setSelectedStudentForBilling] = useState<Student | null>(null);
  const [billingFormData, setBillingFormData] = useState({ 
    agreedFee: 0, 
    paidFee: 0,
    transportFee: 0,
    isUsingTransport: false 
  });

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

  const quickFilterStudents = useMemo(() => {
    if (!quickSearchTerm) return [];
    return (students || []).filter(s => 
      s.firstName.toLowerCase().includes(quickSearchTerm.toLowerCase()) || 
      s.lastName.toLowerCase().includes(quickSearchTerm.toLowerCase()) || 
      s.admissionNumber.toLowerCase().includes(quickSearchTerm.toLowerCase())
    ).slice(0, 5);
  }, [students, quickSearchTerm]);

  const financeStats = useMemo(() => {
    const tuitionCollected = (students || []).reduce((sum, s) => sum + (s.paidFee || 0), 0);
    const transportCollected = (students || []).reduce((sum, s) => sum + (s.paidTransportFee || 0), 0);
    const totalExp = expenditures.reduce((sum, e) => sum + e.amount, 0);

    const tuitionExpected = (students || []).reduce((sum, s) => sum + ((s.agreedFee ?? s.totalFee) || 0), 0);
    const transportExpected = (students || []).reduce((sum, s) => sum + (s.isUsingTransport ? (s.transportFee || 0) : 0), 0);

    return { 
      expected: tuitionExpected + transportExpected,
      collected: tuitionCollected + transportCollected, 
      outstanding: (tuitionExpected + transportExpected) - (tuitionCollected + transportCollected),
      tuitionExpected,
      tuitionCollected,
      tuitionOutstanding: tuitionExpected - tuitionCollected,
      transportExpected,
      transportCollected,
      transportOutstanding: transportExpected - transportCollected,
      prepaid: (students || []).reduce((sum, s) => sum + (s.prepaidFee || 0), 0),
      expenditure: totalExp,
      net: (tuitionCollected + transportCollected) - totalExp 
    };
  }, [students, expenditures]);

  const initiateStkPush = (student: Student) => {
    setStkStudent(student);
    setStkAmount(student.feeBalance.toString());
    setStkPhone(student.guardianPhone);
    setIsStkModalOpen(true);
  };

  const openPaymentModal = (student: Student, categoryOverride?: 'TUITION' | 'TRANSPORT') => {
    setSelectedStudentForPayment(student);
    setPaymentFormData({ 
      amount: '', 
      method: 'CASH', 
      reference: '',
      category: categoryOverride || quickCategory
    });
    setIsPaymentModalOpen(true);
    setIsQuickCollectOpen(false); // Close search if it was open
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForPayment || !paymentFormData.amount) return;

    const amountToAdd = parseFloat(paymentFormData.amount);
    
    if (isBackendLive) {
      try {
        setIsSubmitting(true);
        const response = await apiService.request('/payments', {
          method: 'POST',
          body: JSON.stringify({
            studentId: selectedStudentForPayment.id,
            amount: amountToAdd,
            method: paymentFormData.method,
            transactionId: paymentFormData.reference || `RCT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            description: `Payment for ${paymentFormData.category}`,
            category: paymentFormData.category
          })
        });

        // After successful payment, fetch updated student data or update local state
        const updatedStudent = await apiService.request(`/students/${selectedStudentForPayment.id}`);
        setStudents(prev => prev.map(s => s.id === selectedStudentForPayment.id ? { ...s, ...updatedStudent } : s));
        
        // Generate receipt
        setLastReceipt({
          receiptNo: response.transactionId,
          studentName: `${selectedStudentForPayment.firstName} ${selectedStudentForPayment.lastName}`,
          adm: selectedStudentForPayment.admissionNumber,
          class: selectedStudentForPayment.class,
          amount: amountToAdd,
          method: paymentFormData.method as any,
          reference: response.transactionId,
          date: new Date().toLocaleString(),
          balance: updatedStudent.feeBalance,
          servedBy: 'Institutional Finance'
        });

        setIsPaymentModalOpen(false);
        setShowReceipt(true);
      } catch (err: any) {
        alert("Failed to record payment: " + err.message);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Offline fallback logic
      setStudents(prev => prev.map(s => {
        if (s.id === selectedStudentForPayment.id) {
          let newPaidTuition = s.paidFee || 0;
          let newPaidTransport = s.paidTransportFee || 0;

          if (paymentFormData.category === 'TRANSPORT') {
            newPaidTransport += amountToAdd;
          } else {
            newPaidTuition += amountToAdd;
          }

          const base = s.agreedFee ?? s.totalFee;
          const transport = s.isUsingTransport ? (s.transportFee || 0) : 0;
          const totalExpected = base + transport;
          const totalPaid = newPaidTuition + newPaidTransport;

          const balance = Math.max(0, totalExpected - totalPaid);
          const prepaid = totalPaid > totalExpected ? totalPaid - totalExpected : 0;
          
          // Generate receipt
          setLastReceipt({
            receiptNo: `RCT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            studentName: `${s.firstName} ${s.lastName}`,
            adm: s.admissionNumber,
            class: s.class,
            amount: amountToAdd,
            method: paymentFormData.method as any,
            reference: paymentFormData.reference || (paymentFormData.method === 'M-PESA' ? 'M-PESA MANUAL ENTRY' : 'DIRECT COLLECTION'),
            date: new Date().toLocaleString(),
            balance: balance,
            servedBy: 'Institutional Finance'
          });
          
          return { 
            ...s, 
            paidFee: newPaidTuition, 
            paidTransportFee: newPaidTransport,
            feeBalance: balance, 
            prepaidFee: prepaid 
          };
        }
        return s;
      }));

      setIsPaymentModalOpen(false);
      setShowReceipt(true);
    }
  };

  const downloadReceiptPDF = (elementId: string, fileName: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    setIsReceiptDownloading(true);
    const opt = {
      margin: 10,
      filename: fileName,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false, 
        letterRendering: true,
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    const h2p = (window as any).html2pdf;
    if (typeof h2p === 'function') {
      h2p().set(opt).from(element).save()
        .then(() => setIsReceiptDownloading(false))
        .catch(() => setIsReceiptDownloading(false));
    } else {
      setIsReceiptDownloading(false);
      window.print();
    }
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
    setBillingFormData({ 
      agreedFee: student.agreedFee ?? student.totalFee, 
      paidFee: student.paidFee || 0,
      transportFee: student.transportFee || 0,
      isUsingTransport: student.isUsingTransport || false
    });
    setIsBillingModalOpen(true);
  };

  const handleSaveBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForBilling) return;

    const target = billingFormData.agreedFee + (billingFormData.isUsingTransport ? billingFormData.transportFee : 0);
    const paid = (billingFormData.paidFee || 0);
    const balance = Math.max(0, target - paid);
    const prepaid = paid > target ? paid - target : 0;

    if (isBackendLive) {
      try {
        setIsSubmitting(true);
        const updated = await apiService.request(`/students/${selectedStudentForBilling.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            agreedFee: billingFormData.agreedFee,
            paidFee: billingFormData.paidFee,
            feeBalance: balance,
            prepaidFee: prepaid,
            transportFee: billingFormData.transportFee,
            isUsingTransport: billingFormData.isUsingTransport
          })
        });
        setStudents(prev => prev.map(s => s.id === selectedStudentForBilling.id ? { ...s, ...updated } : s));
        setIsBillingModalOpen(false);
      } catch (err: any) {
        alert("Failed to sync billing: " + err.message);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setStudents(prev => prev.map(s => {
        if (s.id === selectedStudentForBilling.id) {
          return { 
            ...s, 
            agreedFee: billingFormData.agreedFee, 
            paidFee: paid, 
            feeBalance: balance, 
            prepaidFee: prepaid,
            transportFee: billingFormData.transportFee,
            isUsingTransport: billingFormData.isUsingTransport
          };
        }
        return s;
      }));
      setIsBillingModalOpen(false);
    }
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
              onClick={() => { setQuickCategory('TUITION'); setIsQuickCollectOpen(true); }}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 animate-pulse-install"
            >
              <Banknote className="w-4 h-4" /> Collect Fee
            </button>
            <button 
              onClick={() => { setQuickCategory('TRANSPORT'); setIsQuickCollectOpen(true); }}
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
            >
              <Bus className="w-4 h-4" /> Transport Fee
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t.total_expected, value: financeStats.expected, icon: Target, color: 'indigo' },
          { label: t.collected_fee, value: financeStats.collected, icon: Banknote, color: 'green' },
          { label: t.outstanding_fees, value: financeStats.outstanding, icon: AlertCircle, color: 'red' },
          { label: 'Expenditures', value: financeStats.expenditure, icon: TrendingDown, color: 'orange' },
          { label: 'Transport Expected', value: financeStats.transportExpected, icon: Target, color: 'blue' },
          { label: 'Transport Collected', value: financeStats.transportCollected, icon: Banknote, color: 'emerald' },
          { label: 'Transport Arrears', value: financeStats.transportOutstanding, icon: AlertCircle, color: 'pink' },
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
                       <th className="pb-4 px-2">Learner & Period</th>
                       <th className="pb-4 px-2">Grade</th>
                       <th className="pb-4 px-2">Expected Fee</th>
                       <th className="pb-4 px-2">Paid Fee</th>
                       <th className="pb-4 px-2">Outstanding</th>
                       <th className="pb-4 px-2 text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                     {filteredStudents.map(student => {
                       const totalExpected = (student.agreedFee ?? student.totalFee) + (student.isUsingTransport ? (student.transportFee || 0) : 0);
                       const totalPaid = (student.paidFee || 0) + (student.paidTransportFee || 0);
                       const balance = student.feeBalance;
                       
                       return (
                         <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                           <td className="py-4 px-2">
                              <p className="font-bold text-gray-900">{student.firstName} {student.lastName}</p>
                              <div className="flex items-center gap-2 mt-1">
                                 <p className="text-[9px] font-mono text-blue-600 uppercase tracking-tighter">{student.admissionNumber}</p>
                                 <span className="text-[8px] px-1.5 py-0.5 bg-gray-900 text-white rounded font-black uppercase tracking-widest">T{schoolConfig?.term || 1} • {schoolConfig?.year || 2024}</span>
                              </div>
                           </td>
                           <td className="py-4 px-2"><span className="px-2 py-0.5 bg-gray-100 rounded text-[9px] font-black uppercase">{student.class}</span></td>
                           <td className="py-4 px-2">
                              <p className="text-xs font-black text-gray-900 uppercase">KES {totalExpected.toLocaleString()}</p>
                              {student.isUsingTransport && <p className="text-[8px] text-gray-400 font-bold">Incl. Bus: KES {student.transportFee?.toLocaleString()}</p>}
                           </td>
                           <td className="py-4 px-2">
                              <p className="text-xs font-black text-emerald-600 uppercase">KES {totalPaid.toLocaleString()}</p>
                              <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter italic">Last Action: {new Date().toLocaleDateString()}</p>
                           </td>
                           <td className="py-4 px-2">
                              <div className={`inline-block px-3 py-1.5 rounded-xl border-2 ${balance > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                                 <p className={`text-[10px] font-black ${balance > 0 ? 'text-red-700' : 'text-green-700'}`}>
                                    KES {balance.toLocaleString()}
                                 </p>
                              </div>
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
                       );
                     })}
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

      {/* Billing & Negotiated Fee Adjustment Modal */}
      {isBillingModalOpen && selectedStudentForBilling && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md no-print">
           <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl p-10 animate-in zoom-in duration-300">
              <div className="flex justify-between items-center mb-8">
                 <div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Billing Adjustment</h2>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Financial Reconciliation for {selectedStudentForBilling.firstName}</p>
                 </div>
                 <button onClick={() => setIsBillingModalOpen(false)} className="text-gray-400 hover:text-red-600"><X size={24} /></button>
              </div>
              <form onSubmit={handleSaveBilling} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Negotiated Fee (Termly)</label>
                        <input type="number" value={billingFormData.agreedFee} onChange={e => setBillingFormData({...billingFormData, agreedFee: Number(e.target.value)})} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-black outline-none focus:border-blue-500 shadow-inner" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Amount Paid to Date</label>
                        <input type="number" value={billingFormData.paidFee} onChange={e => setBillingFormData({...billingFormData, paidFee: Number(e.target.value)})} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-black outline-none focus:border-blue-500 shadow-inner" />
                     </div>
                  </div>

                  <div className="p-6 bg-blue-50 rounded-3xl border-2 border-blue-100 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg">
                           <ShieldCheck size={20} />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest leading-none">Transport Services</p>
                           <p className="text-[9px] text-blue-600 font-bold uppercase mt-1">Include School Bus Fees</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        {billingFormData.isUsingTransport && (
                          <input 
                            type="number" 
                            placeholder="Transport Fee"
                            value={billingFormData.transportFee} 
                            onChange={e => setBillingFormData({...billingFormData, transportFee: Number(e.target.value)})}
                            className="w-28 p-2 bg-white border border-blue-200 rounded-lg font-black text-xs outline-none focus:border-blue-600 shadow-sm" 
                          />
                        )}
                        <button 
                          type="button"
                          onClick={() => setBillingFormData({...billingFormData, isUsingTransport: !billingFormData.isUsingTransport})}
                          className={`w-12 h-6 rounded-full transition-all relative ${billingFormData.isUsingTransport ? 'bg-blue-600' : 'bg-gray-200'}`}
                        >
                           <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${billingFormData.isUsingTransport ? 'right-1' : 'left-1'}`}></div>
                        </button>
                     </div>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-3xl border-2 border-gray-100 italic space-y-1 shadow-inner">
                     <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Financial Projection</p>
                     <p className="text-xl font-black text-gray-900 leading-none">
                        KES {(billingFormData.agreedFee + (billingFormData.isUsingTransport ? billingFormData.transportFee : 0) - billingFormData.paidFee).toLocaleString()}
                        <span className="text-[10px] text-gray-400 font-normal ml-3 uppercase non-italic tracking-widest">Outstanding Balance</span>
                     </p>
                  </div>

                  <div className="flex gap-4 pt-4">
                     <button type="button" disabled={isSubmitting} onClick={() => setIsBillingModalOpen(false)} className="flex-1 py-4 text-gray-400 font-black uppercase text-[10px] tracking-widest disabled:opacity-50">Dismiss</button>
                     <button type="submit" disabled={isSubmitting} className="flex-[2] py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50">
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                        <span>Sync Account Details</span>
                     </button>
                  </div>
              </form>
           </div>
        </div>
      )}

      {/* Global Quick Collect Modal */}
      {isQuickCollectOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md no-print">
           <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl p-10 animate-in zoom-in duration-300">
              <div className="flex justify-between items-center mb-8">
                 <div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
                       {quickCategory === 'TRANSPORT' ? 'Transport Collection' : 'Quick Collect'}
                    </h2>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Search for a Learner</p>
                 </div>
                 <button onClick={() => setIsQuickCollectOpen(false)} className="text-gray-400 hover:text-red-600"><X size={24} /></button>
              </div>
              <div className="space-y-6">
                 <div className="relative">
                    <UserSearch className="absolute left-4 top-4 text-gray-400" />
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Type Learner Name or ADM No..." 
                      value={quickSearchTerm}
                      onChange={e => setQuickSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold focus:border-blue-500 outline-none shadow-inner"
                    />
                 </div>
                 <div className="space-y-2">
                    {quickFilterStudents.map(s => (
                       <button 
                        key={s.id} 
                        onClick={() => openPaymentModal(s)}
                        className="w-full flex items-center justify-between p-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                       >
                          <div className="text-left">
                             <p className="font-black text-gray-900 uppercase italic">{s.firstName} {s.lastName}</p>
                             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{s.admissionNumber} • {s.class}</p>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="text-right">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                   {quickCategory === 'TRANSPORT' ? 'Bus Bal' : 'School Bal'}
                                </p>
                                <p className="font-black text-red-600">
                                   KES {quickCategory === 'TRANSPORT' 
                                     ? Math.max(0, (s.transportFee || 0) - (s.paidTransportFee || 0)).toLocaleString() 
                                     : Math.max(0, (s.agreedFee ?? s.totalFee) - (s.paidFee || 0)).toLocaleString()}
                                </p>
                             </div>
                             <ChevronRight className="text-blue-500 group-hover:translate-x-1 transition-transform" />
                          </div>
                       </button>
                    ))}
                    {quickSearchTerm && quickFilterStudents.length === 0 && (
                       <div className="py-8 text-center text-gray-400 font-bold uppercase text-[10px] italic tracking-widest">No matching learners found.</div>
                    )}
                    {!quickSearchTerm && (
                       <div className="py-12 text-center">
                          <AlertCircle className="w-10 h-10 text-gray-100 mx-auto mb-3" />
                          <p className="text-[10px] text-gray-300 font-black uppercase tracking-[0.3em]">Start typing to find accounts</p>
                       </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Manual Payment Collection Modal */}
      {isPaymentModalOpen && selectedStudentForPayment && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md no-print">
           <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl p-10 animate-in zoom-in duration-300">
              <div className="flex justify-between items-center mb-6">
                 <div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Recording Entry</h2>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">{selectedStudentForPayment.firstName} {selectedStudentForPayment.lastName}</p>
                 </div>
                 <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-red-600"><X size={24} /></button>
              </div>
              <form onSubmit={handleSavePayment} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Category</label>
                    <div className="grid grid-cols-2 gap-2">
                       <button type="button" onClick={() => setPaymentFormData({...paymentFormData, category: 'TUITION'})} className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all border-2 ${paymentFormData.category === 'TUITION' ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-gray-50 border-transparent text-gray-400'}`}>School Fees</button>
                       <button type="button" onClick={() => setPaymentFormData({...paymentFormData, category: 'TRANSPORT', amount: selectedStudentForPayment.isUsingTransport ? Math.max(0, (selectedStudentForPayment.transportFee || 0) - (selectedStudentForPayment.paidTransportFee || 0)).toString() : ''})} className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all border-2 ${paymentFormData.category === 'TRANSPORT' ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-gray-50 border-transparent text-gray-400'}`}>Transport</button>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Amount (KES)</label>
                    <input required autoFocus type="number" value={paymentFormData.amount} onChange={e => setPaymentFormData({...paymentFormData, amount: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-black text-2xl focus:border-blue-500 transition-all outline-none shadow-inner" placeholder="0.00" />
                    <p className="text-[9px] text-gray-400 font-bold uppercase ml-1 italic">
                       {paymentFormData.category === 'TRANSPORT' 
                         ? `Outstanding Transport: KES ${((selectedStudentForPayment.transportFee || 0) - (selectedStudentForPayment.paidTransportFee || 0)).toLocaleString()}`
                         : `Current Balance: KES ${selectedStudentForPayment.feeBalance.toLocaleString()}`
                       }
                    </p>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Channel / Method</label>
                    <div className="grid grid-cols-3 gap-2">
                       <button type="button" onClick={() => setPaymentFormData({...paymentFormData, method: 'CASH'})} className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all border-2 ${paymentFormData.method === 'CASH' ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-gray-50 border-transparent text-gray-400'}`}>Cash</button>
                       <button type="button" onClick={() => setPaymentFormData({...paymentFormData, method: 'M-PESA'})} className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all border-2 ${paymentFormData.method === 'M-PESA' ? 'bg-green-600 border-green-600 text-white shadow-lg' : 'bg-gray-50 border-transparent text-gray-400'}`}>M-Pesa</button>
                       <button type="button" onClick={() => setPaymentFormData({...paymentFormData, method: 'BANK'})} className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all border-2 ${paymentFormData.method === 'BANK' ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-gray-50 border-transparent text-gray-400'}`}>Bank</button>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Transaction Ref (Optional)</label>
                    <input type="text" value={paymentFormData.reference} onChange={e => setPaymentFormData({...paymentFormData, reference: e.target.value.toUpperCase()})} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold uppercase outline-none focus:border-blue-500 shadow-inner" placeholder="E.G. BANK SLIP OR M-PESA CODE" />
                 </div>
                 <div className="flex gap-4 pt-4">
                    <button type="button" disabled={isSubmitting} onClick={() => setIsPaymentModalOpen(false)} className="flex-1 py-4 text-gray-400 font-black uppercase text-[10px] tracking-widest disabled:opacity-50">Discard</button>
                    <button type="submit" disabled={isSubmitting} className="flex-[2] py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95 disabled:opacity-50">
                       {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet size={16} />} <span>Finalize Collection</span>
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Expenditure Modal */}
      {showExpModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md no-print">
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

      {/* Official Receipt Modal - UPDATED TO SHOW LOGO */}
      {showReceipt && lastReceipt && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-md">
           <div className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl p-10 animate-in zoom-in duration-300 text-center relative overflow-hidden" id="official-receipt-print">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <ShieldCheck size={120} />
              </div>
              <div className="border-b-2 border-gray-100 pb-6 mb-6">
                 {schoolLogo ? (
                   <img src={schoolLogo} className="w-20 h-20 mx-auto mb-4 rounded-xl object-contain" alt="Institution Logo" />
                 ) : (
                   <div className="w-16 h-16 bg-red-900 text-white rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl font-black">ES</div>
                 )}
                 <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-tight">{schoolConfig.schoolName}</h2>
                 <p className="text-[9px] font-black text-red-900/60 uppercase tracking-[0.2em] mt-2 italic">Institutional Revenue Department</p>
              </div>
              
              <div className="space-y-5 text-left mb-10">
                 <div className="flex justify-between items-center text-[10px]">
                    <span className="text-gray-400 font-bold uppercase tracking-widest">Receipt No:</span>
                    <span className="font-mono font-black text-gray-900">{lastReceipt.receiptNo}</span>
                 </div>
                 <div className="flex justify-between items-center text-[10px]">
                    <span className="text-gray-400 font-bold uppercase tracking-widest">Date / Time:</span>
                    <span className="font-bold text-gray-700">{lastReceipt.date}</span>
                 </div>
                 <div className="py-3 border-y border-gray-50 space-y-2">
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] text-gray-400 font-black uppercase">Learner Name</span>
                       <span className="text-xs font-black text-gray-900">{lastReceipt.studentName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] text-gray-400 font-black uppercase">ADM Number</span>
                       <span className="text-xs font-mono font-black text-red-600">{lastReceipt.adm}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] text-gray-400 font-black uppercase">Grade</span>
                       <span className="text-xs font-black text-gray-900">{lastReceipt.class}</span>
                    </div>
                 </div>
                 <div className="space-y-1">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Amount Paid</span>
                       <span className="text-lg font-black text-green-600">KES {lastReceipt.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] text-gray-400">
                       <span className="italic uppercase">via {lastReceipt.method}</span>
                       <span className="font-mono uppercase">{lastReceipt.reference}</span>
                    </div>
                 </div>
                 <div className="flex justify-between items-center border-t-2 border-dashed border-gray-100 pt-5">
                    <span className="text-[11px] text-gray-900 font-black uppercase tracking-widest">Closing Balance</span>
                    <span className="text-xl font-black text-red-600">KES {lastReceipt.balance.toLocaleString()}</span>
                 </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 no-print" data-html2canvas-ignore>
                 <button onClick={() => setShowReceipt(false)} className="flex-1 py-3.5 bg-gray-100 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">Dismiss</button>
                 <button 
                  onClick={() => downloadReceiptPDF('official-receipt-print', `Receipt_${lastReceipt.receiptNo}.pdf`)} 
                  disabled={isReceiptDownloading}
                  className="flex-1 py-3.5 bg-white border-2 border-red-100 text-red-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                 >
                    {isReceiptDownloading ? <Loader2 size={12} className="animate-spin" /> : <FileBadge size={12} />} Save PDF
                 </button>
                 <button onClick={() => window.print()} className="flex-1 py-3.5 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-lg shadow-gray-200 flex items-center justify-center gap-2">
                    <Printer size={12} /> Print
                 </button>
              </div>

              <div className="mt-10 pt-6 border-t border-gray-50 print-only text-center">
                 <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.3em]">Verified Digital Instrument • ElimuSmart Cloud</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
