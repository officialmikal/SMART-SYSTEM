
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
  CreditCard,
  History
} from 'lucide-react';
import { smsService } from '../services/smsService';
import { Language, translations } from '../services/localizationService';
import { KENYAN_CLASSES, Student } from '../types';

// Mock student data for recipient targeting
const RECIPIENTS: Student[] = [
  // Fix: Added missing totalFee, paidFee, and prepaidFee properties to satisfy the Student interface
  { id: '1', admissionNumber: 'ADM001', firstName: 'Kamau', lastName: 'Njoroge', class: 'Grade 7', stream: 'Oak', gender: 'Male', dob: '2011-04-12', guardianPhone: '0712345678', guardianName: 'Sarah Njoroge', feeBalance: 12500, totalFee: 45000, paidFee: 32500, prepaidFee: 0 },
  // Fix: Added missing totalFee, paidFee, and prepaidFee properties to satisfy the Student interface
  { id: '2', admissionNumber: 'ADM002', firstName: 'Amara', lastName: 'Kiprono', class: 'Grade 7', stream: 'Palm', gender: 'Female', dob: '2010-08-25', guardianPhone: '0722000111', guardianName: 'David Kiprono', feeBalance: 0, totalFee: 45000, paidFee: 45000, prepaidFee: 2500 },
  // Fix: Added missing totalFee, paidFee, and prepaidFee properties to satisfy the Student interface
  { id: '3', admissionNumber: 'ADM003', firstName: 'Zuri', lastName: 'Achieng', class: 'Grade 4', stream: 'Willow', gender: 'Female', dob: '2014-01-05', guardianPhone: '0788999888', guardianName: 'Grace Achieng', feeBalance: 4500, totalFee: 45000, paidFee: 40500, prepaidFee: 0 },
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
      // Simulate real SMS dispatch
      await new Promise(r => setTimeout(r, 2000));
      setSmsBalance(prev => prev - recipientsToMessage.length);
      setLogs([{
        id: Date.now().toString(),
        type: selectedType === 'custom' ? 'Announcement' : selectedType === 'fee' ? 'Fee Reminder' : 'Academic Alert',
        recipients: recipientsToMessage.length,
        date: new Date().toISOString().split('T')[0],
        status: 'Delivered',
        cost: recipientsToMessage.length
      }, ...logs]);
      alert(`Bulk campaign dispatched to ${recipientsToMessage.length} recipients.`);
      setCustomMessage('');
    } catch (error) {
      alert("Failed to connect to SMS Gateway.");
    } finally {
      setIsSending(false);
    }
  };

  const handleTopUp = async () => {
    setIsTopUpProcessing(true);
    await new Promise(r => setTimeout(r, 1500));
    setSmsBalance(prev => prev + parseInt(topUpAmount));
    setLogs([{
      id: Date.now().toString(),
      type: 'CREDIT_TOPUP',
      recipients: 0,
      date: new Date().toISOString().split('T')[0],
      status: 'Confirmed',
      cost: -parseInt(topUpAmount)
    }, ...logs]);
    setIsTopUpProcessing(false);
    setIsTopUpModalOpen(false);
    alert("Credits topped up successfully via M-Pesa STK.");
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Cloud Messaging Hub</h1>
          <p className="text-gray-500 font-medium">Manage bulk SMS alerts and automated parent notifications.</p>
        </div>
        <div className="flex items-center gap-3 bg-blue-600 p-1.5 rounded-2xl shadow-xl shadow-blue-100">
           <div className="px-4 py-2 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-white opacity-60" />
              <div className="text-right">
                <p className="text-[9px] font-black text-blue-200 uppercase leading-none mb-1">SMS Balance</p>
                <p className="text-lg font-black text-white leading-none">{smsBalance.toLocaleString()}</p>
              </div>
           </div>
           <button 
            onClick={() => setIsTopUpModalOpen(true)}
            className="bg-white text-blue-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center gap-2"
           >
             <Plus className="w-4 h-4" />
             Top Up
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside className="md:col-span-1">
          <nav className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm space-y-1">
             <NavTab active={activeTab === 'compose'} onClick={() => setActiveTab('compose')} icon={MessageSquare} label="Compose Bulk" />
             <NavTab active={activeTab === 'automated'} onClick={() => setActiveTab('automated')} icon={Clock} label="Automation" />
             <NavTab active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={History} label="Logs & Delivery" />
          </nav>

          <div className="mt-6 p-6 bg-indigo-900 rounded-3xl text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <Info className="w-16 h-16" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Gateway Status</p>
             <div className="flex items-center gap-2 text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-black uppercase tracking-widest">Active (Africa's Talking)</span>
             </div>
             <p className="text-[10px] mt-4 opacity-70 font-medium leading-relaxed">Integrated with Safaricom Daraja for real-time STK credit top-ups.</p>
          </div>
        </aside>

        <div className="md:col-span-3">
          {activeTab === 'compose' && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
               <div className="p-8 border-b bg-gray-50/50 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Compose Campaign</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Direct Parent Outreach</p>
                  </div>
               </div>
               
               <div className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Campaign Type</label>
                       <div className="grid grid-cols-2 gap-2">
                          <TypeBtn active={selectedType === 'fee'} label="Fee Arrears" onClick={() => setSelectedType('fee')} icon={Wallet} />
                          <TypeBtn active={selectedType === 'opening'} label="Term Dates" onClick={() => setSelectedType('opening')} icon={Calendar} />
                          <TypeBtn active={selectedType === 'closing'} label="End of Term" onClick={() => setSelectedType('closing')} icon={CheckCircle2} />
                          <TypeBtn active={selectedType === 'custom'} label="Announcement" onClick={() => setSelectedType('custom')} icon={LayoutGrid} />
                       </div>
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Target Audience</label>
                       <select 
                        value={targetClass}
                        onChange={(e) => setTargetClass(e.target.value)}
                        className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-black text-sm uppercase outline-none focus:border-blue-500 transition-all"
                       >
                         <option>All Classes</option>
                         {KENYAN_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                       <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center gap-3">
                          <Users className="w-5 h-5 text-blue-600" />
                          <span className="text-[10px] font-black uppercase text-blue-900">{RECIPIENTS.filter(s => targetClass === 'All Classes' || s.class === targetClass).length} Parent Contacts Targeted</span>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Message Content</label>
                    {selectedType === 'custom' ? (
                      <textarea 
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        placeholder="Type your announcement here..."
                        className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-3xl h-32 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-medium"
                      />
                    ) : (
                      <div className="p-6 bg-gray-100 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400 italic font-medium">
                        Using standardized template. See preview below.
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Live SMS Preview</label>
                    <div className="bg-gray-900 p-6 rounded-3xl relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:scale-110 transition-transform">
                          <Send className="w-20 h-20 text-white" />
                       </div>
                       <div className="relative z-10 flex gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                             <MessageSquare className="w-5 h-5 text-white" />
                          </div>
                          <div className="space-y-2">
                             <p className="text-white font-medium text-sm leading-relaxed">{currentPreview}</p>
                             <div className="flex items-center gap-4">
                                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{currentPreview.length} Characters</span>
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">1 Page (KES 1.00)</span>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleSendBulk}
                    disabled={isSending || (selectedType === 'custom' && !customMessage)}
                    className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 disabled:opacity-50"
                  >
                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    Dispatch Bulk SMS Campaign
                  </button>
               </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
               <div className="p-8 border-b bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Campaign Logs</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Delivery reports & billing</p>
                  </div>
                  <div className="flex gap-2">
                     <button className="p-3 border rounded-xl hover:bg-gray-50 transition-colors"><Search className="w-4 h-4 text-gray-400" /></button>
                     <button className="p-3 border rounded-xl hover:bg-gray-50 transition-colors"><Filter className="w-4 h-4 text-gray-400" /></button>
                  </div>
               </div>
               
               <div className="divide-y">
                 {logs.map(log => (
                   <div key={log.id} className="p-6 flex items-center justify-between hover:bg-gray-50/30 transition-colors">
                      <div className="flex items-center gap-4">
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${log.cost < 0 ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                            {log.cost < 0 ? <CreditCard className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
                         </div>
                         <div>
                            <p className="font-black text-gray-900">{log.type}</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{log.date} • {log.recipients > 0 ? `${log.recipients} Recipients` : 'Wallet Operation'}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className={`text-lg font-black tracking-tight ${log.cost < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                           {log.cost < 0 ? `+KES ${Math.abs(log.cost).toLocaleString()}` : `-${log.cost} Units`}
                         </p>
                         <span className="text-[9px] font-black uppercase text-green-500 tracking-widest flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {log.status}
                         </span>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {activeTab === 'automated' && (
             <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center space-y-6 animate-in fade-in duration-300">
                <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-xl">
                   <Clock className="w-12 h-12" />
                </div>
                <div className="max-w-md mx-auto space-y-2">
                   <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Automated Triggers</h3>
                   <p className="text-gray-500 font-medium">Smart alerts that send without human intervention based on system events.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                   <AutoToggle label="Absence Alerts" active desc="Sends SMS when student is marked absent." />
                   <AutoToggle label="Fee Postings" active desc="Instant receipt SMS on fee payment." />
                   <AutoToggle label="Exam Results" desc="Dispatch mean grades once principal approves marks." />
                   <AutoToggle label="Event Reminders" desc="Automated alerts 24h before school events." />
                </div>
             </div>
          )}
        </div>
      </div>

      {/* Top Up Modal */}
      {isTopUpModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
              <div className="p-8 border-b bg-gray-50/50 flex items-center justify-between">
                 <div>
                   <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Top Up Credits</h3>
                   <p className="text-xs text-blue-600 font-black uppercase tracking-widest mt-1">Lipa Na M-Pesa Online</p>
                 </div>
                 <button onClick={() => setIsTopUpModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-all text-gray-400"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Amount (KES)</label>
                    <div className="grid grid-cols-3 gap-2">
                       {['500', '1000', '2000', '5000', '10000', '20000'].map(amt => (
                         <button 
                           key={amt}
                           onClick={() => setTopUpAmount(amt)}
                           className={`py-3 rounded-xl text-xs font-black transition-all ${topUpAmount === amt ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                         >
                           {parseInt(amt).toLocaleString()}
                         </button>
                       ))}
                    </div>
                 </div>
                 <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                    <div>
                       <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Total Credits</p>
                       <p className="text-xl font-black text-blue-900">{parseInt(topUpAmount).toLocaleString()} Units</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Rate</p>
                       <p className="text-xs font-black text-blue-900">KES 1.00 / SMS</p>
                    </div>
                 </div>
                 <button 
                  onClick={handleTopUp}
                  disabled={isTopUpProcessing}
                  className="w-full bg-green-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-green-700 transition-all shadow-xl shadow-green-100"
                 >
                    {isTopUpProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Smartphone className="w-5 h-5" />}
                    Confirm & Send STK Push
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const NavTab: React.FC<{ active: boolean, onClick: () => void, icon: any, label: string }> = ({ active, onClick, icon: Icon, label }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-sm font-black uppercase tracking-tighter transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
  >
    <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-400'}`} />
    <span>{label}</span>
  </button>
);

const TypeBtn: React.FC<{ active: boolean, onClick: () => void, icon: any, label: string }> = ({ active, onClick, icon: Icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all group ${active ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-md' : 'border-gray-50 text-gray-400 hover:border-blue-100'}`}
  >
    <Icon className={`w-6 h-6 mb-2 transition-transform group-hover:scale-110 ${active ? 'text-blue-600' : 'text-gray-300'}`} />
    <span className="text-[10px] font-black uppercase tracking-tight">{label}</span>
  </button>
);

const AutoToggle: React.FC<{ label: string, desc: string, active?: boolean }> = ({ label, desc, active = false }) => (
  <div className={`p-6 rounded-2xl border-2 transition-all text-left group ${active ? 'border-green-100 bg-green-50/50' : 'border-gray-50 bg-white opacity-60'}`}>
     <div className="flex items-center justify-between mb-2">
        <h4 className={`font-black uppercase tracking-tight ${active ? 'text-green-900' : 'text-gray-400'}`}>{label}</h4>
        <div className={`w-10 h-5 rounded-full relative shadow-inner cursor-pointer transition-colors ${active ? 'bg-green-500' : 'bg-gray-200'}`}>
           <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${active ? 'right-1' : 'left-1'}`}></div>
        </div>
     </div>
     <p className="text-[10px] font-medium text-gray-500 leading-tight">{desc}</p>
  </div>
);
