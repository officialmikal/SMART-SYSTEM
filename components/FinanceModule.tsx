
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Smartphone, 
  CreditCard, 
  Receipt, 
  History, 
  AlertCircle, 
  CheckCircle2, 
  Banknote, 
  Building2,
  PieChart,
  Search,
  CheckCircle,
  TrendingUp,
  Forward,
  ArrowUpRight,
  Target,
  Users,
  LayoutGrid,
  ChevronRight,
  Filter,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  X,
  Loader2,
  ArrowLeft,
  DollarSign
} from 'lucide-react';
import { Language, translations } from '../services/localizationService';
import { KENYAN_CLASSES, Student } from '../types';

// Expanded Mock Student Financial Data across different grades
const INITIAL_STUDENTS = [
  { adm: 'ADM001', name: 'Kamau Njoroge', total: 45000, paid: 32500, balance: 12500, class: 'Grade 7' },
  { adm: 'ADM002', name: 'Amara Kiprono', total: 45000, paid: 45000, balance: 0, class: 'Grade 7' },
  { adm: 'ADM003', name: 'Zuri Achieng', total: 45000, paid: 15000, balance: 30000, class: 'Grade 7' },
  { adm: 'ADM004', name: 'Sifa Otieno', total: 45000, paid: 0, balance: 45000, class: 'Grade 7' },
  { adm: 'ADM005', name: 'Baraka Ali', total: 45000, paid: 45000, balance: 0, class: 'Grade 7' },
  { adm: 'ADM101', name: 'Neema Wambui', total: 32000, paid: 32000, balance: 0, class: 'Grade 4' },
  { adm: 'ADM102', name: 'David Mwangi', total: 32000, paid: 12000, balance: 20000, class: 'Grade 4' },
  { adm: 'ADM103', name: 'Grace Mutua', total: 32000, paid: 5000, balance: 27000, class: 'Grade 4' },
  { adm: 'ADM201', name: 'Jabari Omondi', total: 25000, paid: 25000, balance: 0, class: 'PP1' },
  { adm: 'ADM202', name: 'Mwikali Musyoka', total: 25000, paid: 10000, balance: 15000, class: 'PP1' },
  { adm: 'ADM301', name: 'Caleb Kipkorir', total: 48000, paid: 40000, balance: 8000, class: 'Grade 9' },
];

export const FinanceModule: React.FC<{ lang: Language }> = ({ lang }) => {
  const t = translations[lang];
  
  // Financial State Management
  const [allStudents, setAllStudents] = useState(INITIAL_STUDENTS);
  const [history, setHistory] = useState([
    { name: 'Kamau Njoroge', method: 'M-PESA', amount: 15000, id: 'SBR4A6HJ78', status: 'Confirmed', time: '10:45 AM' },
    { name: 'Amara Kiprono', method: 'CASH', amount: 5000, id: 'RCP-88902', status: 'Confirmed', time: '09:15 AM' },
  ]);

  // UI State
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'identify' | 'details' | 'review' | 'success'>('identify');
  const [paymentMode, setPaymentMode] = useState<'mpesa' | 'cash' | 'bank'>('mpesa');
  const [activeTab, setActiveTab] = useState<'payments' | 'class-summary' | 'reconciliation'>('class-summary');
  const [selectedClass, setSelectedClass] = useState<string>('All Classes');
  const [studentSearch, setStudentSearch] = useState('');
  
  // Payment Form State
  const [admSearch, setAdmSearch] = useState('');
  const [targetedLearner, setTargetedLearner] = useState<any | null>(null);
  const [amount, setAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');

  // Class Summary Logic - Aggregates data for the overview table
  const classSummaryData = useMemo(() => {
    return KENYAN_CLASSES.map(cls => {
      const clsStudents = allStudents.filter(s => s.class === cls);
      const expected = clsStudents.length > 0 ? clsStudents.reduce((acc, s) => acc + s.total, 0) : 450000;
      const collected = clsStudents.length > 0 ? clsStudents.reduce((acc, s) => acc + s.paid, 0) : Math.floor(expected * 0.7);
      return {
        name: cls,
        expected,
        collected,
        students: clsStudents.length > 0 ? clsStudents.length : 40
      };
    });
  }, [allStudents]);

  // Dynamic Statistics Calculation for Header Cards
  const currentStats = useMemo(() => {
    let filteredList = allStudents;
    if (selectedClass !== 'All Classes') {
      filteredList = allStudents.filter(s => s.class === selectedClass);
    }

    const expected = selectedClass === 'All Classes' 
      ? classSummaryData.reduce((acc, curr) => acc + curr.expected, 0)
      : classSummaryData.find(c => c.name === selectedClass)?.expected || 0;

    const collected = selectedClass === 'All Classes'
      ? classSummaryData.reduce((acc, curr) => acc + curr.collected, 0)
      : classSummaryData.find(c => c.name === selectedClass)?.collected || 0;

    const studentCount = selectedClass === 'All Classes'
      ? classSummaryData.reduce((acc, curr) => acc + curr.students, 0)
      : classSummaryData.find(c => c.name === selectedClass)?.students || 0;

    const outstanding = filteredList.reduce((acc, s) => acc + (s.balance > 0 ? s.balance : 0), 0);
    const prepaid = filteredList.reduce((acc, s) => acc + (s.balance < 0 ? Math.abs(s.balance) : 0), 0);

    return {
      students: studentCount,
      expected,
      collected,
      outstanding: selectedClass === 'All Classes' ? (expected - collected) : outstanding,
      prepaid: selectedClass === 'All Classes' ? 240000 : (prepaid || 0)
    };
  }, [selectedClass, allStudents, classSummaryData]);

  const handleIdentifyLearner = (customAdm?: string) => {
    const adm = (customAdm || admSearch).toUpperCase();
    if (!adm) return;
    setIsProcessing(true);
    
    setTimeout(() => {
      const student = allStudents.find(s => s.adm === adm);
      if (student) {
        setTargetedLearner(student);
        setStep('details');
        setActiveTab('payments');
      } else {
        alert("Student ADM not found. Please try a different number.");
      }
      setIsProcessing(false);
    }, 600);
  };

  const handlePostPayment = () => {
    if (!targetedLearner || !amount) return;
    setIsProcessing(true);
    
    const payAmount = parseInt(amount);
    
    setTimeout(() => {
      setAllStudents(prev => prev.map(s => {
        if (s.adm === targetedLearner.adm) {
          const newPaid = s.paid + payAmount;
          return {
            ...s,
            paid: newPaid,
            balance: s.total - newPaid
          };
        }
        return s;
      }));

      const newTx = {
        name: targetedLearner.name,
        method: paymentMode.toUpperCase(),
        amount: payAmount,
        id: transactionId,
        status: 'Confirmed',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setHistory([newTx, ...history]);

      setStep('success');
      setIsProcessing(false);
    }, 1500);
  };

  const resetForm = () => {
    setStep('identify');
    setTargetedLearner(null);
    setAdmSearch('');
    setAmount('');
    setTransactionId('');
  };

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `KES ${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `KES ${(val / 1000).toFixed(1)}K`;
    return `KES ${val.toLocaleString()}`;
  };

  const filteredStudents = useMemo(() => {
    return allStudents.filter(s => 
      (selectedClass === 'All Classes' || s.class === selectedClass) &&
      (s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
       s.adm.toLowerCase().includes(studentSearch.toLowerCase()))
    );
  }, [allStudents, selectedClass, studentSearch]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">{t.finance}</h1>
          <p className="text-gray-500 font-medium tracking-tight">Institutional Financial Records & Cashier Portal</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 no-print">
          <div className="relative">
            <select 
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                // Automatically switch to ledger view when a specific class is selected
                if (e.target.value !== 'All Classes') setActiveTab('class-summary');
              }}
              className="appearance-none pl-10 pr-10 py-2.5 bg-white border-2 border-gray-100 rounded-xl text-xs font-black uppercase tracking-widest text-gray-700 focus:border-blue-500 outline-none shadow-sm transition-all hover:border-blue-100"
            >
              <option>All Classes</option>
              {KENYAN_CLASSES.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
            <Filter className="w-4 h-4 absolute left-3.5 top-3 text-gray-400 pointer-events-none" />
          </div>

          <div className="flex p-1.5 bg-gray-100 rounded-xl">
            <button 
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'payments' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Post Payment
            </button>
            <button 
              onClick={() => setActiveTab('class-summary')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'class-summary' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {selectedClass === 'All Classes' ? 'Overview' : `${selectedClass} Ledger`}
            </button>
            <button 
              onClick={() => setActiveTab('reconciliation')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'reconciliation' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Sync
            </button>
          </div>
        </div>
      </div>

      {/* Reactive Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border-2 border-gray-50 shadow-sm relative overflow-hidden group hover:border-blue-100 transition-all">
          <div className="absolute top-0 right-0 p-3 opacity-[0.05] group-hover:scale-110 transition-transform">
            <Users className="w-16 h-16 text-blue-600" />
          </div>
          <div className="relative z-10">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Learners on Roll</p>
            <h3 className="text-xl font-black text-gray-900 tracking-tighter">{currentStats.students}</h3>
            <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-blue-600 uppercase">
              <span className="px-2 py-0.5 bg-blue-50 rounded-lg">{selectedClass === 'All Classes' ? 'Whole School' : 'Class Roll'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-indigo-50 shadow-sm relative overflow-hidden group hover:border-indigo-100 transition-all">
          <div className="absolute top-0 right-0 p-3 opacity-[0.05] group-hover:scale-110 transition-transform">
            <Target className="w-16 h-16 text-indigo-600" />
          </div>
          <div className="relative z-10">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Expected Revenue</p>
            <h3 className="text-xl font-black text-indigo-900 tracking-tighter">{formatCurrency(currentStats.expected)}</h3>
            <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-indigo-600 uppercase">
              <span className="px-2 py-0.5 bg-indigo-50 rounded-lg">Budget Target</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-green-50 shadow-sm relative overflow-hidden group hover:border-green-100 transition-all">
          <div className="absolute top-0 right-0 p-3 opacity-[0.05] group-hover:scale-110 transition-transform">
            <TrendingUp className="w-16 h-16 text-green-600" />
          </div>
          <div className="relative z-10">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Collected Fees</p>
            <h3 className="text-xl font-black text-green-700 tracking-tighter">{formatCurrency(currentStats.collected)}</h3>
            <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-green-600 uppercase">
              <span className="px-2 py-0.5 bg-green-50 rounded-lg">
                {currentStats.expected > 0 ? Math.round((currentStats.collected / currentStats.expected) * 100) : 0}% Realized
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-red-50 shadow-sm relative overflow-hidden group hover:border-red-100 transition-all">
          <div className="absolute top-0 right-0 p-3 opacity-[0.05] group-hover:scale-110 transition-transform">
            <AlertCircle className="w-16 h-16 text-red-600" />
          </div>
          <div className="relative z-10">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Outstanding Debt</p>
            <h3 className="text-xl font-black text-red-700 tracking-tighter">{formatCurrency(currentStats.outstanding)}</h3>
            <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-red-500 uppercase">
              <span className="px-2 py-0.5 bg-red-50 rounded-lg">Total Arrears</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-blue-50 shadow-sm relative overflow-hidden group hover:border-blue-100 transition-all">
          <div className="absolute top-0 right-0 p-3 opacity-[0.05] group-hover:scale-110 transition-transform">
            <Forward className="w-16 h-16 text-blue-600" />
          </div>
          <div className="relative z-10">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Prepaid Credits</p>
            <h3 className="text-xl font-black text-blue-700 tracking-tighter">{formatCurrency(currentStats.prepaid)}</h3>
            <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-blue-600 uppercase">
              <span className="px-2 py-0.5 bg-blue-50 rounded-lg">Adv. Payments</span>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'payments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
          <div className="lg:col-span-1 no-print">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden sticky top-8">
              <div className="bg-gray-900 p-8 text-white relative">
                 <div className="absolute top-0 right-0 p-6 opacity-10">
                   <ShieldCheck className="w-16 h-16" />
                 </div>
                 <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                   <div className="p-2 bg-blue-600 rounded-lg">
                    <Receipt className="w-5 h-5 text-white" />
                   </div>
                   Record Payment
                 </h3>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2">Bursar Authorization Portal</p>
              </div>

              <div className="p-8 space-y-6">
                {step === 'identify' && (
                  <div className="space-y-6 animate-in slide-in-from-right-2">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Identify Learner (ADM No.)</label>
                      <div className="relative group">
                        <input 
                          type="text" 
                          autoFocus
                          value={admSearch}
                          onChange={(e) => setAdmSearch(e.target.value)}
                          className="w-full p-4 border-2 border-gray-100 rounded-2xl pl-12 font-black text-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none" 
                          placeholder="e.g. ADM001" 
                        />
                        <Search className="w-6 h-6 absolute left-4 top-4 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                      </div>
                    </div>
                    <button 
                      onClick={() => handleIdentifyLearner()}
                      disabled={!admSearch || isProcessing}
                      className="w-full bg-blue-600 text-white font-black uppercase tracking-widest py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
                    >
                      {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserCheck className="w-5 h-5" />}
                      Verify Student Record
                    </button>
                  </div>
                )}

                {step === 'details' && targetedLearner && (
                  <div className="space-y-6 animate-in slide-in-from-right-4">
                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                       <div>
                         <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Learner Verified</p>
                         <h4 className="font-black text-blue-900">{targetedLearner.name}</h4>
                         <p className="text-[10px] text-blue-600 font-bold uppercase">{targetedLearner.class} • Balance: KES {targetedLearner.balance.toLocaleString()}</p>
                       </div>
                       <button onClick={() => setStep('identify')} className="p-2 hover:bg-white rounded-xl transition-colors text-blue-400">
                         <X className="w-4 h-4" />
                       </button>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Financial Channel</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'mpesa', icon: Smartphone, label: 'M-Pesa' },
                          { id: 'bank', icon: Building2, label: 'Bank' },
                          { id: 'cash', icon: Banknote, label: 'Cash' }
                        ].map(mode => (
                          <button 
                            key={mode.id}
                            onClick={() => setPaymentMode(mode.id as any)}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${paymentMode === mode.id ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-md' : 'border-gray-50 text-gray-400'}`}
                          >
                            <mode.icon className="w-5 h-5 mb-1" />
                            <span className="text-[9px] font-black uppercase">{mode.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Transaction Ref</label>
                          <input 
                            type="text" 
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                            className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-black focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none uppercase" 
                            placeholder={paymentMode === 'mpesa' ? 'e.g. SBR4A6HJ78' : 'Ref Number'}
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Amount (KES)</label>
                          <input 
                            type="number" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full p-4 border-2 border-gray-100 rounded-2xl font-black text-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none text-gray-900" 
                            placeholder="0.00"
                          />
                       </div>
                    </div>

                    <button 
                      onClick={() => setStep('review')}
                      disabled={!amount || !transactionId}
                      className="w-full bg-blue-600 text-white font-black uppercase tracking-widest py-4 rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                    >
                      Verify Details
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {step === 'review' && targetedLearner && (
                   <div className="space-y-6 animate-in zoom-in duration-200">
                      <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200 space-y-4">
                         <div className="flex justify-between border-b border-gray-100 pb-3">
                            <span className="text-[10px] font-black text-gray-400 uppercase">Learner</span>
                            <span className="font-black text-gray-900">{targetedLearner.name}</span>
                         </div>
                         <div className="flex justify-between border-b border-gray-100 pb-3">
                            <span className="text-[10px] font-black text-gray-400 uppercase">Ref #</span>
                            <span className="font-black text-blue-600">{transactionId}</span>
                         </div>
                         <div className="flex justify-between pt-1">
                            <span className="text-[10px] font-black text-gray-400 uppercase">Total Amount</span>
                            <span className="text-2xl font-black text-green-600">KES {parseInt(amount).toLocaleString()}</span>
                         </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <button 
                          onClick={handlePostPayment}
                          disabled={isProcessing}
                          className="w-full bg-green-600 text-white font-black uppercase tracking-widest py-4 rounded-2xl hover:bg-green-700 transition-all shadow-xl shadow-green-100 flex items-center justify-center gap-2"
                        >
                          {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                          Finalize Posting
                        </button>
                        <button 
                          onClick={() => setStep('details')}
                          className="w-full py-2 text-gray-400 font-black uppercase tracking-widest text-[9px] hover:text-gray-600 transition-colors"
                        >
                          Back to Edit
                        </button>
                      </div>
                   </div>
                )}

                {step === 'success' && (
                  <div className="text-center py-10 space-y-6 animate-in zoom-in duration-300">
                    <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-xl">
                      <CheckCircle2 className="w-12 h-12 text-green-600" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Posted Successfully</h4>
                      <p className="text-sm text-gray-500 font-medium tracking-tight px-4">The student ledger and school balances have been updated in real-time.</p>
                    </div>
                    <button 
                      onClick={resetForm}
                      className="bg-blue-600 text-white font-black uppercase tracking-widest py-4 px-8 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
                    >
                      Post Another
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-8 border-b flex items-center justify-between bg-gray-50/50">
                <div>
                  <h3 className="font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
                    <History className="w-5 h-5 text-blue-600" />
                    Recent Transactions
                  </h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Audit log of all financial postings</p>
                </div>
                <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-2 border-blue-50 px-4 py-2 rounded-xl hover:bg-blue-50 transition-all">Download Log</button>
              </div>
              <div className="divide-y border-t border-gray-100">
                {history.map((tx, idx) => (
                  <div key={idx} className="p-8 flex items-center justify-between hover:bg-gray-50/30 transition-colors group">
                    <div className="flex items-center space-x-6">
                      <div className={`p-4 rounded-2xl shadow-sm transition-transform group-hover:scale-110 ${tx.method === 'M-PESA' ? 'bg-green-50 text-green-600 border border-green-100' : tx.method === 'BANK' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                        {tx.method === 'M-PESA' ? <Smartphone className="w-6 h-6" /> : tx.method === 'BANK' ? <Building2 className="w-6 h-6" /> : <Banknote className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="font-black text-gray-900 text-lg tracking-tight">{tx.name}</div>
                        <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600">{tx.id}</span>
                          • {tx.time}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-gray-900 text-xl tracking-tighter">KES {tx.amount.toLocaleString()}</div>
                      <div className={`text-[9px] font-black uppercase tracking-widest flex items-center justify-end gap-1.5 mt-2 ${tx.status === 'Confirmed' ? 'text-green-600' : 'text-amber-600'}`}>
                        <div className={`w-2 h-2 rounded-full ${tx.status === 'Confirmed' ? 'bg-green-600' : 'bg-amber-600'}`}></div>
                        {tx.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'class-summary' && (
        <div className="space-y-6 animate-in fade-in duration-300">
           <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8 border-b bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div>
                    <div className="flex items-center gap-3">
                       {selectedClass !== 'All Classes' && (
                         <button 
                           onClick={() => setSelectedClass('All Classes')}
                           className="p-2 hover:bg-white rounded-lg transition-all border shadow-sm bg-white"
                         >
                           <ArrowLeft className="w-4 h-4 text-blue-600" />
                         </button>
                       )}
                       <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                          <LayoutGrid className="w-6 h-6 text-blue-600" />
                          {selectedClass === 'All Classes' ? 'Institutional Class Summary' : `${selectedClass} Student Fee Ledger`}
                       </h3>
                    </div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
                       {selectedClass === 'All Classes' 
                          ? 'Real-time financial collection tracking for all academic levels.' 
                          : `Manage balances for all learners registered in ${selectedClass}.`}
                    </p>
                 </div>
                 
                 {selectedClass !== 'All Classes' && (
                    <div className="relative max-w-xs w-full">
                       <input 
                          type="text" 
                          placeholder="Search learners..." 
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                       />
                       <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                    </div>
                 )}
              </div>

              <div className="overflow-x-auto">
                 {selectedClass === 'All Classes' ? (
                   <table className="w-full text-left">
                      <thead>
                         <tr className="bg-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <th className="px-8 py-5">Class Name</th>
                            <th className="px-8 py-5">Students</th>
                            <th className="px-8 py-5">Total Expected</th>
                            <th className="px-8 py-5">Collected</th>
                            <th className="px-8 py-5">Progress</th>
                            <th className="px-8 py-5 text-right">Action</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                         {classSummaryData.map((cls, idx) => {
                            const percent = Math.round((cls.collected / (cls.expected || 1)) * 100);
                            return (
                               <tr key={idx} onClick={() => setSelectedClass(cls.name)} className="hover:bg-blue-50/30 transition-colors group cursor-pointer">
                                  <td className="px-8 py-6">
                                     <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                                           {cls.name[0]}
                                        </div>
                                        <span className="font-black text-gray-900 text-lg tracking-tight">{cls.name}</span>
                                     </div>
                                  </td>
                                  <td className="px-8 py-6 text-gray-600 font-bold">{cls.students} Learners</td>
                                  <td className="px-8 py-6 font-black text-gray-900">KES {cls.expected.toLocaleString()}</td>
                                  <td className="px-8 py-6 font-black text-green-600">KES {cls.collected.toLocaleString()}</td>
                                  <td className="px-8 py-6">
                                     <div className="flex items-center gap-2">
                                        <div className="w-full bg-gray-100 rounded-full h-2 min-w-[80px]">
                                           <div 
                                              className={`h-full rounded-full transition-all duration-1000 ${percent > 75 ? 'bg-green-500' : percent > 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                              style={{ width: `${percent}%` }}
                                           />
                                        </div>
                                        <span className="font-black text-[10px] text-gray-800">{percent}%</span>
                                     </div>
                                  </td>
                                  <td className="px-8 py-6 text-right">
                                     <button className="p-2 hover:bg-white rounded-lg transition-colors border-2 border-transparent hover:border-blue-100 text-blue-600 font-black uppercase text-[10px] tracking-widest flex items-center gap-2 ml-auto">
                                        Open Ledger
                                        <ChevronRight className="w-4 h-4" />
                                     </button>
                                  </td>
                               </tr>
                            );
                         })}
                      </tbody>
                   </table>
                 ) : (
                   <table className="w-full text-left">
                      <thead>
                         <tr className="bg-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <th className="px-8 py-5">ADM No.</th>
                            <th className="px-8 py-5">Student Name</th>
                            <th className="px-8 py-5">Total Fees</th>
                            <th className="px-8 py-5">Paid</th>
                            <th className="px-8 py-5">Balance</th>
                            <th className="px-8 py-5 text-center">Status</th>
                            <th className="px-8 py-5 text-right">Action</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                         {filteredStudents.map((student, idx) => (
                            <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                               <td className="px-8 py-5 font-mono font-bold text-gray-600">{student.adm}</td>
                               <td className="px-8 py-5 font-black text-gray-900">{student.name}</td>
                               <td className="px-8 py-5 font-bold text-gray-400">KES {student.total.toLocaleString()}</td>
                               <td className="px-8 py-5 font-black text-green-600">KES {student.paid.toLocaleString()}</td>
                               <td className="px-8 py-5 font-black text-red-600">
                                 {student.balance >= 0 ? `KES ${student.balance.toLocaleString()}` : `(CREDIT) KES ${Math.abs(student.balance).toLocaleString()}`}
                               </td>
                               <td className="px-8 py-5 text-center">
                                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                    student.balance <= 0 ? 'bg-green-100 text-green-700' :
                                    student.paid > 0 ? 'bg-amber-100 text-amber-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                     {student.balance <= 0 ? 'Cleared' : student.paid > 0 ? 'Partial' : 'No Payment'}
                                  </span>
                               </td>
                               <td className="px-8 py-5 text-right">
                                  <button 
                                    onClick={() => handleIdentifyLearner(student.adm)}
                                    className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all ml-auto shadow-sm"
                                  >
                                     <DollarSign className="w-3.5 h-3.5" />
                                     Post Payment
                                  </button>
                               </td>
                            </tr>
                         ))}
                         {filteredStudents.length === 0 && (
                            <tr>
                              <td colSpan={7} className="px-8 py-20 text-center">
                                <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                                <p className="text-gray-400 font-medium italic">No students found for this class filter.</p>
                              </td>
                            </tr>
                         )}
                      </tbody>
                   </table>
                 )}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'reconciliation' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">M-Pesa Gateway Sync</p>
                <div className="bg-green-100 p-2 rounded-lg text-green-600">
                  <Smartphone className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">ONLINE</h3>
              <p className="text-[9px] text-green-600 font-black uppercase tracking-widest mt-2">Daraja API Connected</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bank Feed</p>
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">STABLE</h3>
              <p className="text-[9px] text-blue-600 font-black uppercase tracking-widest mt-2">KCB/Co-op Live Sync</p>
            </div>
          </div>
          <div className="bg-white p-16 rounded-3xl border border-gray-100 text-center space-y-8 shadow-sm">
             <div className="mx-auto bg-blue-50 w-28 h-28 rounded-full flex items-center justify-center border-4 border-white shadow-2xl">
                <PieChart className="w-14 h-14 text-blue-600" />
             </div>
             <div className="space-y-3 max-w-xl mx-auto">
               <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">Automated Reconciliation</h3>
               <p className="text-gray-500 font-medium leading-relaxed">System balances are updated automatically upon every confirmed posting. Use this tool for manual bank statement matching or legacy data imports.</p>
             </div>
             <button className="bg-blue-600 text-white font-black uppercase tracking-widest px-8 py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100">
               Import Bank Statement (CSV)
             </button>
          </div>
        </div>
      )}
    </div>
  );
};
