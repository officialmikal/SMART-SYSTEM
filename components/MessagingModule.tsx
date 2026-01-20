
import React, { useState, useMemo } from 'react';
import { 
  Send, 
  MessageSquare, 
  Calendar, 
  Wallet, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Search,
  ChevronRight,
  Filter,
  Phone,
  LayoutGrid,
  FileText,
  Smartphone,
  Info,
  Plus,
  ArrowUpRight,
  X,
  CreditCard
} from 'lucide-react';
import { smsService } from '../services/smsService';
import { Language, translations } from '../services/localizationService';
import { KENYAN_CLASSES, Student } from '../types';

// Mock student data for recipient targeting
const RECIPIENTS: Student[] = [
  { id: '1', admissionNumber: 'ADM001', firstName: 'Kamau', lastName: 'Njoroge', class: 'Grade 7', stream: 'Oak', gender: 'Male', dob: '2011-04-12', guardianPhone: '0712345678', guardianName: 'Sarah Njoroge', feeBalance: 12500 },
  { id: '2', admissionNumber: 'ADM002', firstName: 'Amara', lastName: 'Kiprono', class: 'Grade 7', stream: 'Palm', gender: 'Female', dob: '2010-08-25', guardianPhone: '0722000111', guardianName: 'David Kiprono', feeBalance: 0 },
  { id: '3', admissionNumber: 'ADM003', firstName: 'Zuri', lastName: 'Achieng', class: 'Grade 4', stream: 'Willow', gender: 'Female', dob: '2014-01-05', guardianPhone: '0788999888', guardianName: 'Grace Achieng', feeBalance: 4500 },
];

type MessageType = 'fee' | 'opening' | 'closing' | 'custom';

export const MessagingModule: React.FC<{ lang: Language }> = ({ lang }) => {
  const t = translations[lang];
  
  // UI State
  const [activeTab, setActiveTab] = useState<'compose' | 'history' | 'automated' | 'credits'>('compose');
  const [selectedType, setSelectedType] = useState<MessageType>('fee');
  const [targetClass, setTargetClass] = useState('All Classes');
  const [isSending, setIsSending] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [smsBalance, setSmsBalance] = useState(4250); // Simulated AT Credit in KES/Units
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('1000');
  const [isTopUpProcessing, setIsTopUpProcessing] = useState(false);
  
  // Historical logs
  const [logs, setLogs] = useState([
    { id: '1', type: 'Fee Reminder', recipients: 45, date: '2024-05-10', status: 'Delivered', cost: 45 },
    { id: '2', type: 'Opening Date', recipients: 482, date: '2024-05-01', status: 'Delivered', cost: 482 },
    { id: '3', type: 'CREDIT_TOPUP', recipients: 0, date: '2024-04-15', status: 'Confirmed', cost: -2000 },
  ]);

  // Template Generation Logic
  const templates = {
    fee: "Dear Parent, your child {StudentName}'s outstanding balance is KES {Balance}. Please clear to avoid inconvenience.",
    opening: "ElimuSmart Academy: School reopens for Term 2 on {Date}. Ensure your child reports with all required materials.",
    closing: "Dear Parent, school closes today {Date}. Academic reports will be shared via the portal. Have a safe holiday!",
    custom: customMessage
  };

  const currentPreview = useMemo(() => {
    let msg = templates[selectedType];
    if (selectedType === 'fee') {
      msg = msg.replace('{StudentName}', 'Kamau').replace('{Balance}', '12,500');
    } else if (selectedType === 'opening') {
      msg = msg.replace('{Date}', 'Monday, 6th May');
    } else if (selectedType === 'closing') {
      msg = msg.replace('{Date}', 'Friday, 2nd August');
    }
    return msg;
  }, [selectedType, customMessage]);

  const handleSendBulk = async () => {
    const recipientsToMessage = RECIPIENTS.filter(s => 
      (targetClass === 'All Classes' || s.class === targetClass) &&
      (selectedType !== 'fee' || s.feeBalance > 0)
    );

    if (smsBalance < recipientsToMessage.length) {
      alert("Insufficient SMS Credits. Please Top Up your gateway account.");
      return;
    }

    setIsSending(true);
    try {
      await new Promise(r => setTimeout(r, 2000));
      const newLog = {
        id: Math.random().toString(),
        type: selectedType.toUpperCase(),
        recipients: recipientsToMessage.length,
        date: new Date().toISOString().split('T')[0],
        status: 'Delivered',
        cost: recipientsToMessage.length
      };
      setLogs([newLog, ...logs]);
      setSmsBalance(prev => prev - recipientsToMessage.length);
      alert(`Success: ${recipientsToMessage.length} messages dispatched via Africa's Talking Gateway.`);
      setCustomMessage('');
    } catch (error) {
      alert("Failed to send: Check Africa's Talking API balance.");
    } finally {
      setIsSending(false);
    }
  };

  const handleTopUp = async () => {
    setIsTopUpProcessing(true);
    try {
      // Simulate M-Pesa STK Push flow
      await new Promise(r => setTimeout(r, 3000));
      const amount = parseInt(topUpAmount);
      setSmsBalance(prev => prev + amount);
      const topUpLog = {
        id: 'TX-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        type: 'CREDIT_TOPUP',
        recipients: 0,
        date: new Date().toISOString().split('T')[0],
        status: 'Confirmed',
        cost: -amount
      };
      setLogs([topUpLog, ...logs]);
      setIsTopUpModalOpen(false);
      alert(`KES ${amount} successfully added to your SMS Gateway account via M-Pesa.`);
    } catch (e) {
      alert("Payment failed. Please try again.");
    } finally {
      setIsTopUpProcessing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Communication Hub</h1>
          <p className="text-gray-500 font-medium tracking-tight">Parental alerts & Africa's Talking SMS Gateway</p>
        </div>
        <div className="flex p-1.5 bg-gray-100 rounded-xl no-print">
          <button 
            onClick={() => setActiveTab('compose')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'compose' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Compose Bulk
          </button>
          <button 
            onClick={() => setActiveTab('automated')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'automated' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Automated Rules
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Dispatch Log
          </button>
        </div>
      </div>

      {/* SMS Gateway Health & Balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border-2 border-gray-50 shadow-sm flex items-center justify-between group hover:border-blue-100 transition-all">
          <div className="space-y-1">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Gateway Credits</p>
            <h3 className={`text-3xl font-black tracking-tighter ${smsBalance < 500 ? 'text-red-600' : 'text-gray-900'}`}>{smsBalance.toLocaleString()} Units</h3>
            <div className="flex items-center gap-1.5 text-[9px] font-black text-green-600 uppercase">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              Daraja Sync Active
            </div>
            <button 
              onClick={() => setIsTopUpModalOpen(true)}
              className="mt-3 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
            >
              <Plus className="w-3.5 h-3.5" />
              Top Up Units
            </button>
          </div>
          <div className={`p-4 rounded-2xl ${smsBalance < 500 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
            <Wallet className="w-8 h-8" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border-2 border-gray-50 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Consumption Rates</p>
            <div className="space-y-2 mt-2">
               <div className="flex justify-between items-center w-full gap-4">
                  <span className="text-[10px] font-bold text-gray-600 uppercase">Per SMS Unit</span>
                  <span className="text-xs font-black text-gray-900">KES 1.00</span>
               </div>
               <div className="flex justify-between items-center w-full gap-4">
                  <span className="text-[10px] font-bold text-gray-600 uppercase">Bulk Discount (&gt;5K)</span>
                  <span className="text-xs font-black text-green-600">KES 0.85</span>
               </div>
            </div>
            <p className="text-[9px] text-blue-600 font-black uppercase tracking-widest mt-3 flex items-center gap-1">
               <Info className="w-3 h-3" /> View Unit Calculator
            </p>
          </div>
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
            <ArrowUpRight className="w-8 h-8" />
          </div>
        </div>

        <div className="bg-gray-900 p-6 rounded-2xl shadow-xl flex items-center justify-between text-white overflow-hidden relative">
          <div className="relative z-10 space-y-1">
            <p className="text-[9px] font-black opacity-60 uppercase tracking-widest">Auto-Reminder Engine</p>
            <h3 className="text-lg font-black tracking-tight leading-none">3 active flows scheduled for today</h3>
            <button className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
              Manage Rules
            </button>
          </div>
          <div className="absolute right-0 bottom-0 p-4 opacity-10">
             <Smartphone className="w-24 h-24" />
          </div>
        </div>
      </div>

      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
               <div className="p-8 border-b bg-gray-50/50">
                  <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-3">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                    New Bulk Dispatch
                  </h3>
                  <p className="text-xs text-gray-500 font-medium mt-1">Select a template or compose a manual broadcast message.</p>
               </div>

               <div className="p-8 space-y-8">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Message Intent (Template)</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                       {[
                         { id: 'fee', label: 'Fee Reminder', icon: Wallet },
                         { id: 'opening', label: 'Opening Date', icon: Calendar },
                         { id: 'closing', label: 'Closing Date', icon: Clock },
                         { id: 'custom', label: 'Custom SMS', icon: FileText }
                       ].map(type => (
                         <button 
                           key={type.id}
                           onClick={() => setSelectedType(type.id as MessageType)}
                           className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${selectedType === type.id ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-md' : 'border-gray-50 text-gray-400 hover:border-gray-200'}`}
                         >
                            <type.icon className="w-5 h-5 mb-2" />
                            <span className="text-[10px] font-black uppercase text-center leading-tight">{type.label}</span>
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Recipient Targeting</label>
                     <div className="relative">
                        <select 
                          value={targetClass}
                          onChange={(e) => setTargetClass(e.target.value)}
                          className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-black text-sm appearance-none focus:ring-4 focus:ring-blue-100 outline-none"
                        >
                          <option>All Classes</option>
                          {KENYAN_CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                        </select>
                        <Filter className="w-4 h-4 absolute right-4 top-5 text-gray-400 pointer-events-none" />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sender ID</label>
                     <div className="p-4 bg-gray-100 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 font-mono text-xs flex items-center justify-between">
                        <span>ELIMU_SMART</span>
                        <Info className="w-4 h-4" />
                     </div>
                   </div>
                 </div>

                 {selectedType === 'custom' && (
                    <div className="space-y-2 animate-in slide-in-from-top-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Message Content</label>
                       <textarea 
                         rows={4}
                         value={customMessage}
                         onChange={(e) => setCustomMessage(e.target.value)}
                         className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-medium"
                         placeholder="Enter your custom school announcement here..."
                       />
                    </div>
                 )}

                 <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex gap-4">
                    <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                    <div>
                       <p className="text-sm font-black text-amber-900 uppercase tracking-tight">Financial Disclaimer</p>
                       <p className="text-xs text-amber-700 leading-relaxed font-medium">Standard SMS rates apply (KES 1.00 per unit). Total estimated cost for this dispatch is <b>KES {(RECIPIENTS.filter(s => targetClass === 'All Classes' || s.class === targetClass).length).toFixed(2)}</b>.</p>
                    </div>
                 </div>

                 <button 
                   onClick={handleSendBulk}
                   disabled={isSending || (selectedType === 'custom' && !customMessage)}
                   className="w-full py-5 bg-blue-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3 disabled:opacity-50"
                 >
                   {isSending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                   {isSending ? 'Dispatching via Gateway...' : 'Initialize Broadast'}
                 </button>
               </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden sticky top-8">
               <div className="p-8 border-b bg-gray-50/50">
                  <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Live Preview</h3>
               </div>
               <div className="p-8 flex justify-center">
                 {/* Smartphone UI Mockup */}
                 <div className="w-[280px] h-[540px] border-[8px] border-gray-900 rounded-[40px] relative overflow-hidden shadow-2xl bg-white">
                    <div className="absolute top-0 w-1/2 h-6 bg-gray-900 left-1/4 rounded-b-2xl z-20"></div>
                    <div className="bg-gray-100 h-14 w-full flex items-center justify-between px-6 pt-4 border-b">
                       <span className="text-[10px] font-bold text-gray-500">10:45 AM</span>
                       <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                       </div>
                    </div>
                    
                    <div className="p-4 space-y-4">
                       <div className="bg-gray-200 rounded-2xl px-4 py-2 w-fit mx-auto text-[8px] font-black uppercase tracking-widest text-gray-500">Today</div>
                       
                       <div className="flex flex-col gap-1 items-start">
                          <span className="text-[8px] font-black text-gray-400 ml-2 uppercase">ELIMU_SMART</span>
                          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-[11px] font-medium leading-relaxed text-blue-900 shadow-sm">
                             {currentPreview}
                          </div>
                       </div>
                    </div>

                    <div className="absolute bottom-6 w-1/3 h-1.5 bg-gray-900/10 left-1/3 rounded-full"></div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
           <div className="p-8 border-b bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                 <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Dispatch Audit Logs</h3>
                 <p className="text-xs text-gray-500 font-medium">History of all bulk communications sent through the platform.</p>
              </div>
              <div className="relative">
                 <input type="text" placeholder="Search logs..." className="pl-10 pr-4 py-2.5 border rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                 <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
              </div>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="bg-gray-50/50 border-b text-[10px] font-black text-gray-400 uppercase tracking-widest">
                   <th className="px-8 py-5">Activity / Broadcast Type</th>
                   <th className="px-8 py-5">Dispatch Date</th>
                   <th className="px-8 py-5 text-center">Recipients</th>
                   <th className="px-8 py-5">Units / Cost (KES)</th>
                   <th className="px-8 py-5 text-center">Status</th>
                   <th className="px-8 py-5 text-right">Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y">
                 {logs.map(log => (
                   <tr key={log.id} className="hover:bg-gray-50/30 transition-colors group">
                     <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                           <div className={`p-2 rounded-lg ${log.type === 'CREDIT_TOPUP' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                              {log.type === 'CREDIT_TOPUP' ? <ArrowUpRight className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                           </div>
                           <span className="font-black text-gray-900 tracking-tight">{log.type.replace('_', ' ')}</span>
                        </div>
                     </td>
                     <td className="px-8 py-6 text-gray-500 font-bold text-sm">{log.date}</td>
                     <td className="px-8 py-6 text-center">
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-black">
                          {log.recipients > 0 ? `${log.recipients} Parents` : '--'}
                        </span>
                     </td>
                     <td className={`px-8 py-6 font-black ${log.cost < 0 ? 'text-green-600' : 'text-gray-700'}`}>
                        {log.cost < 0 ? '+' + Math.abs(log.cost).toLocaleString() : log.cost.toLocaleString()}
                     </td>
                     <td className="px-8 py-6 text-center">
                        <span className={`flex items-center justify-center gap-1.5 text-[10px] font-black uppercase ${log.status === 'Confirmed' ? 'text-green-600' : 'text-blue-600'}`}>
                           <CheckCircle2 className="w-3.5 h-3.5" />
                           {log.status}
                        </span>
                     </td>
                     <td className="px-8 py-6 text-right">
                        <button className="p-2 hover:bg-white rounded-lg transition-colors border shadow-sm">
                           <ChevronRight className="w-4 h-4 text-gray-400" />
                        </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {activeTab === 'automated' && (
        <div className="bg-white p-16 rounded-[48px] border border-gray-100 text-center space-y-8 shadow-sm animate-in fade-in duration-300">
           <div className="mx-auto bg-blue-50 w-28 h-28 rounded-full flex items-center justify-center border-4 border-white shadow-2xl">
              <Clock className="w-14 h-14 text-blue-600" />
           </div>
           <div className="space-y-3 max-w-xl mx-auto">
             <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">Smart Scheduler</h3>
             <p className="text-gray-500 font-medium leading-relaxed">Setup recurring triggers like monthly fee balance alerts (every 5th of the month) or automatic holiday assignment reminders.</p>
           </div>
           <button className="bg-blue-600 text-white font-black uppercase tracking-widest px-8 py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100">
             Configure New Workflow
           </button>
        </div>
      )}

      {/* M-Pesa Top Up Modal */}
      {isTopUpModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
             <div className="bg-gray-900 p-8 text-white relative">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                   <Smartphone className="w-20 h-20" />
                </div>
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-green-500 rounded-2xl">
                      <CreditCard className="w-6 h-6 text-white" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black uppercase tracking-tight">Buy SMS Units</h3>
                      <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mt-1">Lipa na M-Pesa Online</p>
                   </div>
                </div>
             </div>

             <div className="p-8 space-y-6">
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Unit Package</label>
                   <div className="grid grid-cols-2 gap-3">
                      {[
                        { amt: '500', units: '500', label: 'Starter' },
                        { amt: '1000', units: '1000', label: 'Growth' },
                        { amt: '2500', units: '2500', label: 'Pro' },
                        { amt: '5000', units: '5800', label: 'Bulk' }
                      ].map(pkg => (
                        <button 
                          key={pkg.amt}
                          onClick={() => setTopUpAmount(pkg.amt)}
                          className={`flex flex-col p-4 rounded-2xl border-2 transition-all text-left ${topUpAmount === pkg.amt ? 'border-green-600 bg-green-50 shadow-md' : 'border-gray-50 hover:border-gray-100'}`}
                        >
                           <span className={`text-[9px] font-black uppercase tracking-widest ${topUpAmount === pkg.amt ? 'text-green-600' : 'text-gray-400'}`}>{pkg.label}</span>
                           <span className="text-lg font-black text-gray-900 mt-1">KES {pkg.amt}</span>
                           <span className="text-[10px] font-bold text-gray-500">{pkg.units} SMS Units</span>
                        </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">M-Pesa Number</label>
                   <div className="relative">
                      <input 
                        type="text" 
                        defaultValue="0711 222 333"
                        className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-black text-gray-800 focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all outline-none pl-12"
                      />
                      <Phone className="w-5 h-5 absolute left-4 top-4 text-gray-400" />
                   </div>
                </div>

                <div className="flex flex-col gap-3">
                   <button 
                      onClick={handleTopUp}
                      disabled={isTopUpProcessing}
                      className="w-full bg-green-600 text-white font-black uppercase tracking-widest py-4 rounded-2xl hover:bg-green-700 transition-all shadow-xl shadow-green-100 flex items-center justify-center gap-2"
                   >
                      {isTopUpProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      {isTopUpProcessing ? 'Pushing STK to Phone...' : `Pay KES ${topUpAmount}`}
                   </button>
                   <button 
                      onClick={() => setIsTopUpModalOpen(false)}
                      disabled={isTopUpProcessing}
                      className="w-full py-2 text-gray-400 font-black uppercase tracking-widest text-[9px] hover:text-gray-600 transition-colors"
                   >
                      Cancel Purchase
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
