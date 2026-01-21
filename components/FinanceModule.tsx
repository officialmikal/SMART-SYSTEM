
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Smartphone, 
  History, 
  AlertCircle, 
  Building2,
  Filter,
  Loader2,
  Printer,
  Download,
  Layers,
  LayoutGrid,
  Target,
  Banknote,
  Forward,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  CheckCircle,
  Search,
  Plus,
  ArrowRight,
  UserCheck,
  CreditCard
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Language, translations } from '../services/localizationService';
import { KENYAN_CLASSES } from '../types';
import { schoolService, AcademicConfig } from '../services/schoolService';

// Synchronized with StudentManagement mock data
const INITIAL_STUDENTS_DATA = [
  { adm: 'ADM001', name: 'Kamau Njoroge', total: 45000, paid: 32500, balance: 12500, prepaid: 0, class: 'Grade 7' },
  { adm: 'ADM002', name: 'Amara Kiprono', total: 45000, paid: 45000, balance: 0, prepaid: 2500, class: 'Grade 7' },
  { adm: 'ADM101', name: 'Neema Wambui', total: 32000, paid: 32000, balance: 0, prepaid: 0, class: 'Grade 4' },
  { adm: 'ADM201', name: 'Jabari Omondi', total: 25000, paid: 25000, balance: 0, prepaid: 500, class: 'PP1' },
  { adm: 'ADM301', name: 'Caleb Kipkorir', total: 48000, paid: 40000, balance: 8000, prepaid: 0, class: 'Grade 9' },
  { adm: 'ADM003', name: 'Zuri Achieng', total: 45000, paid: 40500, balance: 4500, prepaid: 0, class: 'Grade 7' },
];

export const FinanceModule: React.FC<{ lang: Language }> = ({ lang }) => {
  const t = translations[lang];
  const [students, setStudents] = useState(INITIAL_STUDENTS_DATA);
  const [history, setHistory] = useState([
    { name: 'Kamau Njoroge', adm: 'ADM001', method: 'M-PESA', amount: 15000, id: 'SBR4A6HJ78', status: 'Confirmed', time: '10:45 AM', date: '2024-05-20', class: 'Grade 7' },
    { name: 'Amara Kiprono', adm: 'ADM002', method: 'CASH', amount: 5000, id: 'RCP-88902', status: 'Confirmed', time: '09:15 AM', date: '2024-05-19', class: 'Grade 7' },
    { name: 'Neema Wambui', adm: 'ADM101', method: 'BANK', amount: 32000, id: 'BNK-10022', status: 'Confirmed', time: '02:30 PM', date: '2024-05-18', class: 'Grade 4' },
  ]);

  const [activeTab, setActiveTab] = useState<'payments' | 'class-summary'>('class-summary');
  const [selectedClass, setSelectedClass] = useState<string>('All Classes');
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [lastTx, setLastTx] = useState<any>(null);
  const [schoolConfig, setSchoolConfig] = useState<AcademicConfig | null>(null);

  // Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    adm: '',
    amount: '',
    method: 'M-PESA',
    reference: ''
  });
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    schoolService.getAcademicConfig().then(setSchoolConfig);
  }, []);

  // Filtered Students for the current selection
  const filteredStudents = useMemo(() => {
    return students.filter(s => selectedClass === 'All Classes' || s.class === selectedClass);
  }, [students, selectedClass]);

  // Real-time calculated stats from current student state
  const financeStats = useMemo(() => {
    const totalExpected = filteredStudents.reduce((sum, s) => sum + s.total, 0);
    const totalCollected = filteredStudents.reduce((sum, s) => sum + s.paid, 0);
    const totalOutstanding = filteredStudents.reduce((sum, s) => sum + s.balance, 0);
    const totalPrepaid = filteredStudents.reduce((sum, s) => sum + s.prepaid, 0);
    
    return {
      expected: totalExpected,
      collected: totalCollected,
      outstanding: totalOutstanding,
      prepaid: totalPrepaid,
      studentsCount: filteredStudents.length
    };
  }, [filteredStudents]);

  const filteredHistory = useMemo(() => {
    return history.filter(h => selectedClass === 'All Classes' || h.class === selectedClass);
  }, [history, selectedClass]);

  const exportToPDF = (elementId: string, fileName: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    setIsPdfGenerating(true);
    const opt = {
      margin: 0.5,
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    const h2p = (window as any).html2pdf;
    if (typeof h2p === 'function') {
      h2p().set(opt).from(element).save().then(() => setIsPdfGenerating(false)).catch(() => setIsPdfGenerating(false));
    } else {
      setIsPdfGenerating(false);
      window.print();
    }
  };

  const handlePostPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.adm || !paymentForm.amount) return;

    setIsPosting(true);
    await new Promise(r => setTimeout(r, 1200)); // Simulate processing

    const amountNum = parseFloat(paymentForm.amount);
    const studentIdx = students.findIndex(s => s.adm === paymentForm.adm);

    if (studentIdx === -1) {
      alert("Student not found.");
      setIsPosting(false);
      return;
    }

    const student = { ...students[studentIdx] };
    const newPaid = student.paid + amountNum;
    
    // If payment covers the total, handle excess as prepaid
    let newBalance = student.total - newPaid;
    let newPrepaid = student.prepaid;

    if (newBalance < 0) {
      newPrepaid += Math.abs(newBalance);
      newBalance = 0;
    }

    const updatedStudents = [...students];
    updatedStudents[studentIdx] = {
      ...student,
      paid: newPaid,
      balance: newBalance,
      prepaid: newPrepaid
    };

    const newTx = {
      name: student.name,
      adm: student.adm,
      method: paymentForm.method,
      amount: amountNum,
      id: paymentForm.reference || `TX-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      status: 'Confirmed',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString().split('T')[0],
      class: student.class
    };

    setStudents(updatedStudents);
    setHistory([newTx, ...history]);
    setIsPosting(false);
    setActiveTab('class-summary');
    setPaymentForm({ adm: '', amount: '', method: 'M-PESA', reference: '' });
    alert(`Payment of KES ${amountNum.toLocaleString()} for ${student.name} posted successfully!`);
  };

  return (
    <div className="space-y-8">
      {/* Off-screen Export Buffer */}
      <div className="offscreen-template" aria-hidden="true">
        {lastTx && (
          <div id="receipt-container" className="bg-white p-12" style={{ width: '210mm' }}>
            <ReceiptTemplate 
              tx={lastTx} 
              balance={students.find(s => s.adm === lastTx.adm)?.balance || 0} 
              schoolConfig={schoolConfig} 
            />
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Finance Hub</h1>
          <p className="text-gray-500 font-medium tracking-tight">Real-time ledger and transaction processing.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 no-print">
          <div className="relative">
            <select 
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="appearance-none pl-10 pr-12 py-3 bg-white border-2 border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-700 focus:border-blue-500 outline-none shadow-sm transition-all"
            >
              <option>All Classes</option>
              {KENYAN_CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
            </select>
            <Filter className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400 pointer-events-none" />
          </div>

          <div className="flex p-1.5 bg-gray-100 rounded-2xl">
            <button 
              onClick={() => setActiveTab('class-summary')} 
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'class-summary' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
            >
              Ledger
            </button>
            <button 
              onClick={() => setActiveTab('payments')} 
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'payments' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
            >
              Post Payment
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Expected', value: `KES ${(financeStats.expected / 1000).toFixed(1)}K`, icon: Target, color: 'indigo', sub: 'Projected Revenue' },
          { label: 'Collected Fee', value: `KES ${(financeStats.collected / 1000).toFixed(1)}K`, icon: Banknote, color: 'green', sub: 'Cash at Bank' },
          { label: 'Outstanding Fees', value: `KES ${(financeStats.outstanding / 1000).toFixed(1)}K`, icon: AlertCircle, color: 'red', sub: 'Current Arrears' },
          { label: 'Prepaid Fees', value: `KES ${(financeStats.prepaid / 1000).toFixed(1)}K`, icon: Forward, color: 'blue', sub: 'Adv. Payments' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between group hover:shadow-lg transition-all">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                <h3 className={`text-2xl font-black mt-1 tracking-tighter ${stat.color === 'red' ? 'text-red-700' : stat.color === 'green' ? 'text-green-700' : 'text-gray-900'}`}>{stat.value}</h3>
                <div className="mt-2 text-[9px] font-black uppercase tracking-widest text-gray-400">
                  {stat.sub}
                </div>
              </div>
              <div className={`p-3 rounded-xl transition-transform group-hover:scale-110 ${
                stat.color === 'blue' ? 'bg-blue-50 text-blue-600' : 
                stat.color === 'green' ? 'bg-green-50 text-green-600' : 
                stat.color === 'red' ? 'bg-red-50 text-red-600' : 
                stat.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                'bg-purple-50 text-purple-600'
              } border border-white shadow-sm`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {activeTab === 'class-summary' && (
        <div className="space-y-10">
          {/* Detailed Summary Table */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-8 border-b bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="font-black text-gray-800 uppercase tracking-tight flex items-center gap-3 text-lg">
                  <LayoutGrid className="w-6 h-6 text-blue-600" /> 
                  Class Financial Summary: {selectedClass}
                </h3>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-gray-50/50 border-b text-[10px] text-gray-400 uppercase font-black tracking-widest">
                         <th className="px-8 py-5">Learner Profile</th>
                         <th className="px-8 py-5">Total Expected</th>
                         <th className="px-8 py-5">Total Paid</th>
                         <th className="px-8 py-5">Balance Due</th>
                         <th className="px-8 py-5">Prepaid</th>
                         <th className="px-8 py-5 text-right">Status</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                      {filteredStudents.map((s, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/20 transition-colors group">
                           <td className="px-8 py-5">
                              <div className="font-black text-gray-900 text-base">{s.name}</div>
                              <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">{s.adm} • {s.class}</div>
                           </td>
                           <td className="px-8 py-5 font-bold text-gray-700">KES {s.total.toLocaleString()}</td>
                           <td className="px-8 py-5 font-bold text-green-600">KES {s.paid.toLocaleString()}</td>
                           <td className="px-8 py-5 font-black text-red-600">KES {s.balance.toLocaleString()}</td>
                           <td className="px-8 py-5 font-bold text-blue-600">KES {s.prepaid.toLocaleString()}</td>
                           <td className="px-8 py-5 text-right">
                              {s.balance === 0 ? (
                                <span className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-[9px] font-black uppercase tracking-widest">Cleared</span>
                              ) : (
                                <span className="px-3 py-1 bg-red-50 text-red-700 rounded-lg text-[9px] font-black uppercase tracking-widest">Arrears</span>
                              )}
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="font-black text-gray-800 uppercase tracking-tight flex items-center gap-3 text-lg">
                <History className="w-6 h-6 text-blue-600" /> 
                Recent Transactions
              </h3>
              <div className="flex flex-wrap gap-2">
                 <button 
                  onClick={() => window.print()} 
                  className="flex items-center gap-2 bg-white border-2 border-gray-100 px-5 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-all"
                 >
                    <Printer className="w-4 h-4" /> Print Log
                 </button>
              </div>
            </div>
            <div className="divide-y">
              {filteredHistory.map((tx, idx) => (
                <div key={idx} className="p-6 flex items-center justify-between hover:bg-gray-50/30 transition-colors group">
                  <div className="flex items-center space-x-5">
                    <div className={`p-4 rounded-2xl ${tx.method === 'M-PESA' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                      {tx.method === 'M-PESA' ? <Smartphone className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="font-black text-gray-900 text-lg leading-tight">{tx.name}</div>
                      <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">{tx.adm} • {tx.class} • {tx.id}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                     <div className="text-right">
                       <div className="font-black text-gray-900 text-lg tracking-tighter text-blue-600">KES {tx.amount.toLocaleString()}</div>
                       <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{tx.date} • {tx.time}</div>
                     </div>
                     <div className="flex gap-2">
                        <button 
                          onClick={() => { setLastTx(tx); setTimeout(() => exportToPDF('receipt-container', `Receipt_${tx.id}.pdf`), 100); }}
                          className="p-3 bg-gray-100 rounded-xl text-gray-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                          title="Save Receipt as PDF"
                          disabled={isPdfGenerating}
                        >
                          {isPdfGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                        </button>
                     </div>
                  </div>
                </div>
              ))}
              {filteredHistory.length === 0 && (
                <div className="p-20 text-center text-gray-300">
                   <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                   <p className="font-bold italic uppercase tracking-widest text-xs">No matching transactions found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                 <CreditCard className="w-32 h-32 text-blue-900" />
              </div>

              <div className="mb-10">
                 <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none mb-2">Post Payment Transaction</h2>
                 <p className="text-xs text-gray-400 font-black uppercase tracking-[0.3em]">Official Financial Posting Terminal</p>
              </div>

              <form onSubmit={handlePostPayment} className="space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Target Learner (By ADM)</label>
                       <div className="relative">
                          <Search className="absolute left-4 top-4 w-5 h-5 text-gray-300" />
                          <select 
                            required
                            value={paymentForm.adm}
                            onChange={e => setPaymentForm({...paymentForm, adm: e.target.value})}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all outline-none font-black text-gray-800 appearance-none"
                          >
                            <option value="">Select Student...</option>
                            {filteredStudents.map(s => (
                              <option key={s.adm} value={s.adm}>{s.adm} - {s.name} ({s.class})</option>
                            ))}
                          </select>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Amount (KES)</label>
                       <div className="relative">
                          <Banknote className="absolute left-4 top-4 w-5 h-5 text-gray-300" />
                          <input 
                            required
                            type="number"
                            placeholder="e.g. 5000"
                            value={paymentForm.amount}
                            onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all outline-none font-black text-gray-800"
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Method</label>
                       <div className="grid grid-cols-3 gap-3 p-1.5 bg-gray-100 rounded-2xl">
                          {['M-PESA', 'BANK', 'CASH'].map(method => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => setPaymentForm({...paymentForm, method})}
                              className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentForm.method === method ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                              {method}
                            </button>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reference No. (Optional)</label>
                       <div className="relative">
                          <CheckCircle className="absolute left-4 top-4 w-5 h-5 text-gray-300" />
                          <input 
                            type="text"
                            placeholder="e.g. SBR1234567"
                            value={paymentForm.reference}
                            onChange={e => setPaymentForm({...paymentForm, reference: e.target.value})}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all outline-none font-mono font-black text-blue-600 uppercase"
                          />
                       </div>
                    </div>
                 </div>

                 {paymentForm.adm && (
                    <div className="p-6 bg-blue-50 rounded-3xl border-2 border-blue-100 animate-in slide-in-from-top-2 duration-300">
                       <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-xl shadow-sm">
                             <UserCheck className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                             <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Active Ledger Summary</p>
                             <div className="flex flex-wrap gap-x-8 gap-y-2 mt-1">
                                <span className="text-sm font-black text-gray-900 uppercase">
                                  {students.find(s => s.adm === paymentForm.adm)?.name}
                                </span>
                                <span className="text-sm font-black text-red-600">
                                  Balance: KES {students.find(s => s.adm === paymentForm.adm)?.balance.toLocaleString()}
                                </span>
                                <span className="text-sm font-black text-blue-600">
                                  Prepaid: KES {students.find(s => s.adm === paymentForm.adm)?.prepaid.toLocaleString()}
                                </span>
                             </div>
                          </div>
                       </div>
                    </div>
                 )}

                 <button 
                  type="submit"
                  disabled={isPosting}
                  className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 disabled:opacity-50 group"
                 >
                    {isPosting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                    {isPosting ? 'Processing Transaction...' : 'Post Secure Payment'}
                 </button>
              </form>
           </div>
           
           <div className="bg-gray-50 p-8 rounded-[40px] border-2 border-dashed border-gray-200 text-center">
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] max-w-sm mx-auto leading-relaxed italic">Posting a payment will automatically reconcile the student ledger and generate a verifiable receipt.</p>
           </div>
        </div>
      )}
    </div>
  );
};

const ReceiptTemplate: React.FC<{ tx: any, balance: number, schoolConfig: AcademicConfig | null }> = ({ tx, balance, schoolConfig }) => (
  <div className="text-gray-900 font-sans border-[12px] border-gray-50 p-10 rounded-[48px] bg-white">
    <div className="flex justify-between border-b-4 border-gray-900 pb-12 mb-10">
      <div className="flex items-center gap-8">
        <img 
          src={`https://api.dicebear.com/7.x/initials/svg?seed=${schoolConfig?.schoolName || 'ES'}&backgroundColor=1e3a8a&fontFamily=Inter&fontSize=45&bold=true`} 
          className="w-24 h-24 rounded-3xl bg-blue-900 border-4 border-white shadow-2xl"
          alt="School Logo"
        />
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-blue-900 leading-none mb-2">{schoolConfig?.schoolName}</h1>
          <p className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-400">Official Financial Receipt</p>
          <div className="mt-4 flex items-center gap-3">
             <div className="px-4 py-1.5 bg-gray-100 rounded-xl text-[11px] font-black uppercase tracking-widest text-gray-700">Receipt No: {tx.id}</div>
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-4xl font-black tracking-tighter">{tx.date}</div>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Date of Issue</div>
      </div>
    </div>
    
    <div className="grid grid-cols-2 gap-20 mb-12">
      <div className="space-y-10">
        <div className="border-b-2 border-gray-100 pb-4">
          <span className="text-[10px] font-black text-gray-400 uppercase block tracking-[0.2em] mb-2">Student Particulars</span>
          <span className="text-2xl font-black uppercase tracking-tight text-gray-900">{tx.name}</span>
          <p className="text-lg font-black text-blue-800 mt-1">{tx.adm} • {tx.class}</p>
        </div>
        <div className="border-b-2 border-gray-100 pb-4">
          <span className="text-[10px] font-black text-gray-400 uppercase block tracking-[0.2em] mb-2">Category</span>
          <span className="text-xl font-black uppercase text-gray-700">Tuition & Operations</span>
        </div>
      </div>
      <div className="space-y-10">
        <div className="border-b-2 border-gray-100 pb-4">
          <span className="text-[10px] font-black text-gray-400 uppercase block tracking-[0.2em] mb-2">Payment Source</span>
          <span className="text-2xl font-black uppercase tracking-widest text-blue-700">{tx.method}</span>
        </div>
        <div className="border-b-2 border-gray-100 pb-4 text-right">
          <span className="text-[10px] font-black text-gray-400 uppercase block tracking-[0.2em] mb-2">Outstanding Arrears</span>
          <span className={`text-3xl font-black tracking-tighter ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
            KES {balance.toLocaleString()}.00
          </span>
        </div>
      </div>
    </div>

    <div className="bg-gray-100 p-14 rounded-[48px] mb-12 flex justify-between items-center border-2 border-gray-200 shadow-inner">
       <span className="text-4xl font-black uppercase tracking-tight text-gray-400">Total Paid</span>
       <div className="text-right">
          <span className="text-7xl font-black text-blue-900 tracking-tighter">KES {tx.amount.toLocaleString()}</span>
          <div className="text-[10px] font-black uppercase tracking-widest text-blue-500 mt-2 font-mono">Verified Transaction</div>
       </div>
    </div>

    <div className="flex justify-between items-end mt-24 pt-10 border-t-2 border-dashed border-gray-200">
       <div className="text-left">
          <div className="text-[10px] font-black uppercase text-gray-400 mb-12 tracking-[0.2em]">Authorized Bursar Signature</div>
          <div className="w-72 h-[3px] bg-gray-900"></div>
          <p className="text-[11px] font-black text-gray-900 mt-4 uppercase tracking-[0.1em]">ElimuSmart School Finance Office</p>
       </div>
       <div className="text-right">
          <div className="w-36 h-36 border-[10px] border-double border-blue-900/10 rounded-full flex items-center justify-center opacity-40 rotate-[15deg] scale-110 origin-bottom-right">
            <span className="text-[11px] font-black text-center uppercase tracking-tighter leading-none text-blue-900 font-mono">
              OFFICIAL<br/>PAYMENT<br/>SEAL
            </span>
          </div>
       </div>
    </div>
  </div>
);
