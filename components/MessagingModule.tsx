
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
  History,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { smsService } from '../services/smsService';
import { Language, translations } from '../services/localizationService';
import { KENYAN_CLASSES, Student } from '../types';

interface MessageLog {
  id: string;
  type: string;
  recipients: number;
  date: string;
  status: 'Delivered' | 'Failed' | 'Queued' | 'Sent';
  cost: number;
  sampleMessage?: string;
}

interface MessagingModuleProps {
  lang: Language;
  students?: Student[]; // Made optional with defensive handling
}

type MessageType = 'fee' | 'opening' | 'closing' | 'custom';

export const MessagingModule: React.FC<MessagingModuleProps> = ({ lang, students = [] }) => {
  const t = translations[lang];
  
  const [activeTab, setActiveTab] = useState<'compose' | 'history' | 'automated'>('compose');
  const [selectedType, setSelectedType] = useState<MessageType>('fee');
  const [targetClass, setTargetClass] = useState('All Classes');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [smsBalance, setSmsBalance] = useState(4250);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('1000');
  const [isTopUpProcessing, setIsTopUpProcessing] = useState(false);
  
  const [logs, setLogs] = useState<MessageLog[]>([
    { id: '1', type: 'Fee Reminder', recipients: 45, date: '2024-05-10', status: 'Delivered', cost: 45, sampleMessage: "Dear Parent, your child Kamau's outstanding balance is KES 12,500." },
    { id: '2', type: 'Opening Date', recipients: 482, date: '2024-05-01', status: 'Delivered', cost: 482, sampleMessage: "School reopens on Monday, 6th May." },
  ]);

  const templates = {
    fee: "Dear Parent, your child {StudentName}'s outstanding balance is KES {Balance}. Please clear to avoid inconvenience.",
    opening: "ElimuSmart Academy: School reopens for Term 2 on {Date}. Ensure your child reports with all required materials.",
    closing: "Dear Parent, school closes today {Date}. Academic reports will be shared via the portal. Have a safe holiday!",
    custom: customMessage
  };

  // Filter students based on selection criteria - Added defensive filter
  const targetRecipients = useMemo(() => {
    return (students || []).filter(s => {
      const matchesClass = targetClass === 'All Classes' || s.class === targetClass;
      const matchesSearch = s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            s.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const needsFeeAlert = selectedType === 'fee' ? s.feeBalance > 0 : true;
      return matchesClass && matchesSearch && needsFeeAlert;
    });
  }, [students, targetClass, searchQuery, selectedType]);

  const currentPreview = useMemo(() => {
    let msg = templates[selectedType];
    const previewStudent = targetRecipients[0] || { firstName: '{Name}', feeBalance: 0 };
    
    msg = msg.replace(/{StudentName}/g, previewStudent.firstName)
             .replace(/{Balance}/g, (previewStudent.feeBalance || 0).toLocaleString())
             .replace(/{Date}/g, new Date().toLocaleDateString());
    return msg;
  }, [selectedType, customMessage, targetRecipients]);

  const handleSendBulk = async () => {
    if (targetRecipients.length === 0) {
      alert("No recipients found for current filters.");
      return;
    }

    const estimatedCost = targetRecipients.length;
    if (smsBalance < estimatedCost) {
      alert(`Insufficient Credits. Need ${estimatedCost}, have ${smsBalance}.`);
      return;
    }

    const confirmed = window.confirm(`Authorize live dispatch to ${targetRecipients.length} parents via Africa's Talking?`);
    if (!confirmed) return;

    setIsSending(true);
    try {
      const payload = targetRecipients.map(s => ({
        name: s.firstName,
        phone: smsService.formatPhone(s.guardianPhone),
        balance: s.feeBalance
      }));

      // Call the service (which hits our backend)
      await smsService.sendBulkCampaign(payload, templates[selectedType], selectedType);
      
      // Update UI
      setSmsBalance(prev => prev - estimatedCost);
      const newLog: MessageLog = {
        id: 'L' + Date.now(),
        type: selectedType.toUpperCase(),
        recipients: targetRecipients.length,
        date: new Date().toLocaleString(),
        status: 'Sent',
        cost: estimatedCost,
        sampleMessage: currentPreview
      };
      setLogs(prev => [newLog, ...prev]);
      alert("Success: Campaign queued for delivery via Africa's Talking.");
      if (selectedType === 'custom') setCustomMessage('');
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const exportLogs = (format: 'excel' | 'pdf') => {
    if (format === 'excel') {
      const ws = XLSX.utils.json_to_sheet(logs);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "SMS Logs");
      XLSX.writeFile(wb, "ElimuSmart_SMS_Logs.xlsx");
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Cloud Messaging Hub</h1>
          <p className="text-gray-500 font-medium tracking-tight">Africa's Talking Live Gateway Portal</p>
        </div>
        <div className="flex items-center gap-3 bg-blue-600 p-1.5 rounded-2xl shadow-xl shadow-blue-100">
           <div className="px-4 py-2 flex items-center gap-2 border-r border-blue-500">
              <Smartphone className="w-5 h-5 text-white opacity-60" />
              <div className="text-right">
                <p className="text-[9px] font-black text-blue-200 uppercase leading-none mb-1">Live Units</p>
                <p className="text-lg font-black text-white leading-none">{smsBalance.toLocaleString()}</p>
              </div>
           </div>
           <button onClick={() => setIsTopUpModalOpen(true)} className="bg-white text-blue-600 px-4 py-2 rounded-xl text-xs font-black uppercase hover:bg-blue-50 transition-all flex items-center gap-2">
             <Plus className="w-4 h-4" /> Top Up
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside className="md:col-span-1 space-y-4">
          <nav className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm space-y-1">
             <NavTab active={activeTab === 'compose'} onClick={() => setActiveTab('compose')} icon={MessageSquare} label="Compose Bulk" />
             <NavTab active={activeTab === 'automated'} onClick={() => setActiveTab('automated')} icon={Clock} label="Smart Automation" />
             <NavTab active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={History} label="Audit Logs" />
          </nav>

          <div className="p-6 bg-indigo-900 rounded-3xl text-white relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
               <Info className="w-16 h-16" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Carrier Status</p>
             <div className="flex items-center gap-2 text-green-400 font-black uppercase text-xs">
                <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]"></div>
                Connected: Safaricom / AT
             </div>
             <p className="text-[10px] mt-4 opacity-70 font-medium leading-relaxed italic border-t border-white/10 pt-4">Sender ID: ELIMUSMART</p>
          </div>
        </aside>

        <div className="md:col-span-3">
          {activeTab === 'compose' && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
               <div className="p-8 border-b bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Bulk Dispatcher</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">UTF-8 Encoded • Live Delivery Tracking</p>
                  </div>
                  <div className="flex gap-2">
                    <select value={targetClass} onChange={e => setTargetClass(e.target.value)} className="p-2 bg-white border-2 rounded-xl text-[10px] font-black uppercase outline-none focus:border-blue-500 transition-all">
                      <option>All Classes</option>
                      {KENYAN_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
               </div>
               
               <div className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Template Category</label>
                      <div className="grid grid-cols-2 gap-2">
                        <TypeBtn active={selectedType === 'fee'} label="Fee Arrears" onClick={() => setSelectedType('fee')} icon={Wallet} />
                        <TypeBtn active={selectedType === 'opening'} label="Term Dates" onClick={() => setSelectedType('opening')} icon={Calendar} />
                        <TypeBtn active={selectedType === 'closing'} label="End of Term" onClick={() => setSelectedType('closing')} icon={CheckCircle2} />
                        <TypeBtn active={selectedType === 'custom'} label="Announcement" onClick={() => setSelectedType('custom')} icon={LayoutGrid} />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Refine Audience</label>
                      <div className="relative">
                        <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                        <input type="text" placeholder="Search specific student/parent..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none font-medium transition-all text-sm shadow-inner" />
                      </div>
                      <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <Users className="w-5 h-5 text-blue-600" />
                           <span className="text-[10px] font-black uppercase text-blue-900">{targetRecipients.length} Targets Selected</span>
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Message Preview & Edit</label>
                    {selectedType === 'custom' ? (
                      <textarea value={customMessage} onChange={e => setCustomMessage(e.target.value)} placeholder="Type official announcement..." className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-3xl h-32 focus:ring-8 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-medium text-gray-700 shadow-inner" />
                    ) : (
                      <div className="bg-gray-900 p-8 rounded-[32px] relative overflow-hidden group shadow-2xl border-4 border-gray-800">
                         <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform"><Send className="w-24 h-24 text-white" /></div>
                         <div className="relative z-10 flex gap-6">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20"><MessageSquare className="w-6 h-6 text-white" /></div>
                            <div className="space-y-3 flex-1">
                               <p className="text-white font-medium text-sm leading-relaxed">{currentPreview}</p>
                               <div className="flex items-center gap-6">
                                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{currentPreview.length} Chars</span>
                                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><CreditCard className="w-3 h-3" /> 1 Unit / SMS</span>
                               </div>
                            </div>
                         </div>
                      </div>
                    )}
                  </div>

                  <button onClick={handleSendBulk} disabled={isSending || (selectedType === 'custom' && !customMessage)} className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-blue-700 transition-all shadow-2xl shadow-blue-100 disabled:opacity-50 active:scale-[0.98]">
                    {isSending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                    {isSending ? 'DISPATCHING LIVE...' : 'Authorize Gateway Release'}
                  </button>
               </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
               <div className="p-8 border-b bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Audit Logs</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Permanent Record of Parent Outreach</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => exportLogs('excel')} className="flex items-center gap-2 p-3 bg-white border-2 rounded-xl text-[10px] font-black uppercase text-gray-600 hover:text-green-600 hover:border-green-100 transition-all shadow-sm">
                      <FileSpreadsheet className="w-4 h-4" /> Excel
                    </button>
                    <button onClick={() => exportLogs('pdf')} className="flex items-center gap-2 p-3 bg-white border-2 rounded-xl text-[10px] font-black uppercase text-gray-600 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm">
                      <Download className="w-4 h-4" /> PDF
                    </button>
                  </div>
               </div>
               
               <div className="divide-y max-h-[600px] overflow-y-auto">
                 {logs.map(log => (
                   <div key={log.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors group">
                      <div className="flex items-center gap-5">
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${log.cost < 0 ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                            {log.cost < 0 ? <CreditCard className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
                         </div>
                         <div>
                            <p className="font-black text-gray-900 text-base">{log.type}</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{log.date} • {log.recipients > 0 ? `${log.recipients} SMS Pushed` : 'Transaction Confirmed'}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className={`text-lg font-black tracking-tight ${log.cost < 0 ? 'text-green-600' : 'text-gray-900'}`}>{log.cost < 0 ? `+KES ${Math.abs(log.cost)}` : `-${log.cost} Units`}</p>
                         <span className={`text-[9px] font-black uppercase tracking-widest flex items-center justify-end gap-1.5 ${log.status === 'Delivered' ? 'text-green-500' : 'text-blue-500'}`}>
                            <CheckCircle2 className="w-3.5 h-3.5" /> {log.status}
                         </span>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const NavTab: React.FC<{ active: boolean, onClick: () => void, icon: any, label: string }> = ({ active, onClick, icon: Icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-tight transition-all border-2 ${active ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-100' : 'text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-900'}`}>
    <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-400'}`} />
    <span>{label}</span>
  </button>
);

const TypeBtn: React.FC<{ active: boolean, onClick: () => void, icon: any, label: string }> = ({ active, onClick, icon: Icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all group ${active ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-md' : 'border-gray-50 text-gray-400 hover:border-blue-100'}`}>
    <Icon className={`w-6 h-6 mb-2 transition-transform group-hover:scale-110 ${active ? 'text-blue-600' : 'text-gray-300'}`} />
    <span className="text-[10px] font-black uppercase tracking-tight">{label}</span>
  </button>
);
