
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
  FileSpreadsheet
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
    return students.filter(s => {
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
    const totalExpected = filteredStudents.reduce((sum, s) => sum + (s.totalFee || 0), 0);
    const totalCollected = filteredStudents.reduce((sum, s) => sum + (s.paidFee || 0), 0);
    const totalOutstanding = filteredStudents.reduce((sum, s) => sum + (s.feeBalance || 0), 0);
    const totalPrepaid = filteredStudents.reduce((sum, s) => sum + (s.prepaidFee || 0), 0);
    return { expected: totalExpected, collected: totalCollected, outstanding: totalOutstanding, prepaid: totalPrepaid };
  }, [filteredStudents]);

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

  const syncFeesToStudents = async () => {
    setIsApplyingFees(true);
    await new Promise(r => setTimeout(r, 1200));
    
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
    alert('Synchronization Successful! All student balances recalculated based on the updated Class Fee Structure.');
  };

  const handlePostPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.adm || !paymentForm.amount) return;
    setIsPosting(true);
    
    await new Promise(r => setTimeout(r, 800));

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
        reference: paymentForm.reference || 'CASH_ENTRY',
        date: new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }),
        balance: updatedStudent.feeBalance,
        servedBy: 'System Admin'
      };
      setLastReceipt(receipt);
      setShowReceipt(true);
    }

    setIsPosting(false);
    setPaymentForm({ adm: '', amount: '', method: 'M-PESA', reference: '' });
  };

  const exportToPDF = (elementId: string, fileName: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const opt = {
      margin: 0.5,
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    const h2p = (window as any).html2pdf;
    if (typeof h2p === 'function') {
      h2p().set(opt).from(element).save();
    } else {
      window.print();
    }
  };

  const handleIndividualExportExcel = (student: Student) => {
    const data = [{
      'Admission Number': student.admissionNumber,
      'Name': `${student.firstName} ${student.lastName}`,
      'Class': student.class,
      'Stream': student.stream,
      'Total Termly Invoice': student.totalFee,
      'Total Paid to Date': student.paidFee,
      'Prepaid/Credit': student.prepaidFee,
      'Outstanding Balance': student.feeBalance,
      'Statement Date': new Date().toLocaleDateString()
    }];
    const ws = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, ws, "Fee Statement");
    XLSX.writeFile(workbook, `FeeStatement_${student.admissionNumber}.xlsx`);
  };

  const handleIndividualExportPDF = (student: Student) => {
    const mockStatement: TransactionReceipt = {
        receiptNo: "STMT-" + student.admissionNumber,
        studentName: `${student.firstName} ${student.lastName}`,
        adm: student.admissionNumber,
        class: student.class,
        amount: student.paidFee, 
        method: "CASH",
        reference: "TERM_STATEMENT",
        date: new Date().toLocaleDateString(),
        balance: student.feeBalance,
        servedBy: "Ledger Export"
    };
    setLastReceipt(mockStatement);
    setTimeout(() => {
        exportToPDF('receipt-print-template', `FeeStatement_${student.admissionNumber}.pdf`);
    }, 100);
  };

  return (
    <div className="space-y-8 pb-20">
      <div id="receipt-print-template" className="offscreen-template">
        {lastReceipt && (
          <div style={{ padding: '40px', background: 'white', color: 'black', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ borderBottom: '2px solid #1e3a8a', paddingBottom: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a' }}>ElimuSmart Academy</h1>
                <p style={{ margin: '5px 0', fontSize: '12px' }}>P.O BOX 1234 - 00100, Nairobi | Tel: +254 700 000 000</p>
                <p style={{ margin: '0', fontSize: '12px' }}>Official Fee Document</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ margin: '0', fontSize: '18px' }}>{lastReceipt.receiptNo.startsWith('STMT') ? 'Fee Statement' : 'Payment Receipt'}</h2>
                <p style={{ margin: '5px 0', fontWeight: 'bold' }}>REF: {lastReceipt.receiptNo}</p>
                <p style={{ margin: '0', fontSize: '12px' }}>Date: {lastReceipt.date}</p>
              </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <p><strong>Student Name:</strong> {lastReceipt.studentName}</p>
              <p><strong>ADM Number:</strong> {lastReceipt.adm}</p>
              <p><strong>Class:</strong> {lastReceipt.class}</p>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Description</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>Amount (KES)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    {lastReceipt.receiptNo.startsWith('STMT') ? 'Total Tuition Fees Invoiced' : 'School Fees Payment Settlement'}
                    <br/><small>Ref: {lastReceipt.reference}</small>
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>{lastReceipt.amount.toLocaleString()}.00</td>
                </tr>
              </tbody>
            </table>

            <div style={{ textAlign: 'right', marginBottom: '50px' }}>
              <p style={{ fontSize: '18px', fontWeight: 'bold' }}>Remaining Balance: KES {lastReceipt.balance.toLocaleString()}.00</p>
            </div>

            <div style={{ borderTop: '1px solid #ddd', paddingTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid black', width: '150px', marginBottom: '5px' }}></div>
                <p style={{ fontSize: '10px' }}>Served By: {lastReceipt.servedBy}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid black', width: '150px', marginBottom: '5px' }}></div>
                <p style={{ fontSize: '10px' }}>School Official Stamp</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Finance Center</h1>
          <p className="text-gray-500 font-medium">Automatic billing and student ledger management.</p>
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
                          onClick={() => handleIndividualExportExcel(s)}
                          className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-transparent hover:border-emerald-100"
                          title="Export Excel Ledger"
                        >
                          <FileSpreadsheet className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleIndividualExportPDF(s)}
                          className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100"
                          title="Generate PDF Statement"
                        >
                          <FileDown className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">No matching student records found in current ledger.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                     Clicking sync will instantly update the fee records of all {students.length} students to match these new values.
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
                  {students.map(s => <option key={s.id} value={s.admissionNumber}>{s.admissionNumber} - {s.firstName} {s.lastName}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Banknote className="w-3 h-3" /> Amount (KES)</label>
                 <input required type="number" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-[24px] font-black text-xl outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner" placeholder="0.00" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Method</label>
                 <div className="grid grid-cols-3 gap-2 p-2 bg-gray-100 rounded-[24px] shadow-inner">
                    {['M-PESA', 'BANK', 'CASH'].map(m => (
                      <button key={m} type="button" onClick={() => setPaymentForm({...paymentForm, method: m as any})} className={`py-4 rounded-[20px] text-[10px] font-black uppercase transition-all ${paymentForm.method === m ? 'bg-white text-blue-600 shadow-xl' : 'text-gray-400'}`}>{m}</button>
                    ))}
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Hash className="w-3 h-3" /> Reference Code</label>
                 <input value={paymentForm.reference} onChange={e => setPaymentForm({...paymentForm, reference: e.target.value})} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-[24px] font-black uppercase outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner" placeholder="e.g. SBR4A6HJ78" />
              </div>
            </div>
            <button type="submit" disabled={isPosting} className="w-full bg-blue-600 text-white py-6 rounded-[32px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-100 disabled:opacity-50 hover:bg-blue-700 transition-all flex items-center justify-center gap-4">
              {isPosting ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldAlert className="w-6 h-6" />}
              {isPosting ? 'POSTING...' : 'AUTHORIZE & PRINT'}
            </button>
          </form>
        </div>
      )}

      {/* Success Modal */}
      {showReceipt && lastReceipt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
              <div className="p-8 border-b bg-gray-50/50 flex items-center justify-between no-print">
                 <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                    <h3 className="text-xl font-black uppercase tracking-tighter text-gray-900">Payment Processed</h3>
                 </div>
                 <button onClick={() => setShowReceipt(false)} className="p-2 hover:bg-white rounded-full transition-all text-gray-400"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-10 text-center">
                 <div className="p-10 bg-gray-50 border-4 border-dashed border-gray-200 rounded-[40px] mb-10 shadow-inner">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Amount Credited</p>
                    <h4 className="text-4xl font-black text-gray-900 leading-none">KES {lastReceipt.amount.toLocaleString()}.00</h4>
                    <div className="mt-6 flex flex-col items-center">
                       <p className="text-sm font-black text-blue-600 uppercase tracking-tighter">{lastReceipt.studentName}</p>
                       <span className="text-[9px] font-black text-gray-400 uppercase mt-2 tracking-widest">Receipt ID: {lastReceipt.receiptNo}</span>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => exportToPDF('receipt-print-template', `Receipt_${lastReceipt.receiptNo}.pdf`)} className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-all shadow-sm border border-gray-100"><Download size={18} /> Save PDF</button>
                    <button onClick={() => window.print()} className="flex items-center justify-center gap-2 bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 border border-blue-500"><Printer size={18} /> Print Now</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
