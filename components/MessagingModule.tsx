
import React, { useState, useMemo, useEffect } from 'react';
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
  Filter,
  Smartphone,
  Info,
  Plus,
  X,
  CreditCard,
  History,
  FileSpreadsheet,
  Download,
  Zap,
  Check,
  CheckSquare,
  Square,
  LayoutGrid,
  ChevronRight
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
  students?: Student[];
}

type MessageType = 'fee' | 'opening' | 'closing' | 'custom';

export const MessagingModule: React.FC<MessagingModuleProps> = ({ lang, students = [] }) => {
  const t = translations[lang];
  
  const [activeTab, setActiveTab] = useState<'compose' | 'history' | 'automated'>('compose');
  const [selectedType, setSelectedType] = useState<MessageType>('custom'); // Set default to custom to show all students
  const [targetClass, setTargetClass] = useState('All Classes');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [smsBalance, setSmsBalance] = useState(4250);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('1000');
  const [isTopUpProcessing, setIsTopUpProcessing] = useState(false);
  const [gatewayConnected, setGatewayConnected] = useState<boolean | null>(null);
  
  // Selection State
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  const [logs, setLogs] = useState<MessageLog[]>([
    { id: '1', type: 'Fee Reminder', recipients: 45, date: '2024-05-10', status: 'Delivered', cost: 45, sampleMessage: "Dear Parent, your child Kamau's outstanding balance is KES 12,500." },
    { id: '2', type: 'Opening Date', recipients: 482, date: '2024-05-01', status: 'Delivered', cost: 482, sampleMessage: "School reopens on Monday, 6th May." },
  ]);

  // Initial Gateway Handshake
  useEffect(() => {
    smsService.checkConnection().then(setGatewayConnected);
  }, []);

  const templates = {
    fee: "Dear Parent, your child {StudentName}'s outstanding balance is KES {Balance}. Please clear to avoid inconvenience.",
    opening: "ElimuSmart Academy: School reopens for Term 2 on {Date}. Ensure your child reports with all required materials.",
    closing: "Dear Parent, school closes today {Date}. Academic reports will be shared via the portal. Have a safe holiday!",
    custom: customMessage
  };

  // Filter students based on selection criteria
  const filteredRecipients = useMemo(() => {
    return (students || []).filter(s => {
      const matchesClass = targetClass === 'All Classes' || s.class === targetClass;
      const term = searchQuery.toLowerCase();
      const matchesSearch = s.firstName.toLowerCase().includes(term) || 
                            s.lastName.toLowerCase().includes(term) || 
                            s.admissionNumber.toLowerCase().includes(term);
      
      // If "Fee Arrears" type is selected, only show those with balance, otherwise show everyone
      const needsFeeAlert = selectedType === 'fee' ? s.feeBalance > 0 : true;
      
      return matchesClass && matchesSearch && needsFeeAlert;
    });
  }, [students, targetClass, searchQuery, selectedType]);

  // Handle selecting all in current filtered view
  const toggleAll = () => {
    if (selectedStudentIds.size === filteredRecipients.length && filteredRecipients.length > 0) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filteredRecipients.map(s => s.id)));
    }
  };

  const toggleStudentSelection = (id: string) => {
    const next = new Set(selectedStudentIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedStudentIds(next);
  };

  const currentPreview = useMemo(() => {
    let msg = templates[selectedType] || customMessage;
    const firstSelectedId = Array.from(selectedStudentIds)[0];
    const previewStudent = students.find(s => s.id === firstSelectedId) || (students[0] || { firstName: '{Name}', feeBalance: 0 });
    
    msg = msg.replace(/{StudentName}/g, previewStudent.firstName)
             .replace(/{Balance}/g, (previewStudent.feeBalance || 0).toLocaleString())
             .replace(/{Date}/g, new Date().toLocaleDateString());
    return msg;
  }, [selectedType, customMessage, selectedStudentIds, students]);

  const handleSendBulk = async () => {
    if (selectedStudentIds.size === 0) {
      alert("Please select at least one recipient.");
      return;
    }

    const estimatedCost = selectedStudentIds.size;
    if (smsBalance < estimatedCost) {
      alert(`Insufficient Credits. You need ${estimatedCost} units, but currently have ${smsBalance}.`);
      return;
    }

    const confirmed = window.confirm(`Authorize live dispatch to ${selectedStudentIds.size} parents via Africa's Talking Gateway?`);
    if (!confirmed) return;

    setIsSending(true);
    try {
      const actualRecipients = students.filter(s => selectedStudentIds.has(s.id));
      const payload = actualRecipients.map(s => ({
        name: s.firstName,
        phone: smsService.formatPhone(s.guardianPhone),
        balance: s.feeBalance
      }));

      await smsService.sendBulkCampaign(payload, templates[selectedType], selectedType);
      
      setSmsBalance(prev => prev - estimatedCost);
      const newLog: MessageLog = {
        id: 'L' + Date.now(),
        type: selectedType.toUpperCase().replace('_', ' '),
        recipients: actualRecipients.length,
        date: new Date().toLocaleString(),
        status: 'Sent',
        cost: estimatedCost,
        sampleMessage: currentPreview
      };
      setLogs(prev => [newLog, ...prev]);
      alert("Success: Campaign released to Africa's Talking Gateway.");
      if (selectedType === 'custom') setCustomMessage('');
      setSelectedStudentIds(new Set());
    } catch (err: any) {
      alert("Gateway Error: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleTopUp = async () => {
    setIsTopUpProcessing(true);
    await new Promise(r => setTimeout(r, 2000));
    setSmsBalance(prev => prev + parseInt(topUpAmount));
    setLogs(prev => [{
      id: 'T' + Date.now(),
      type: 'TOP UP (M-PESA)',
      recipients: 0,
      date: new Date().toLocaleString(),
      status: 'Delivered',
      cost: -parseInt(topUpAmount)
    }, ...prev]);
    setIsTopUpProcessing(false);
    setIsTopUpModalOpen(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none italic">Communication Hub</h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-3 flex items-center gap-3">
             <span className={`w-2.5 h-2.5 rounded-full ${gatewayConnected === true ? 'bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gray-300'}`}></span>
             Africa's Talking Gateway • {gatewayConnected === true ? 'LIVE' : 'AUTHENTICATING'}
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-[24px] shadow-xl border-2 border-gray-50">
           <div className="px-6 py-2 flex items-center gap-4 border-r-2 border-gray-50">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shadow-inner">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1">SMS Credit</p>
                <p className="text-xl font-black text-gray-900 leading-none">{smsBalance.toLocaleString()}<span className="text-[10px] ml-1 opacity-30">Units</span></p>
              </div>
           </div>
           <button onClick={() => setIsTopUpModalOpen(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-100 active:scale-95">
             <Plus className="w-4 h-4" /> Top Up
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <aside className="xl:col-span-1 space-y-4">
          <nav className="bg-white p-3 rounded-[32px] border-2 border-gray-50 shadow-sm space-y-1">
             <NavTab active={activeTab === 'compose'} onClick={() => setActiveTab('compose')} icon={MessageSquare} label="Bulk Dispatch" />
             <NavTab active={activeTab === 'automated'} onClick={() => setActiveTab('automated')} icon={Clock} label="Smart Automation" />
             <NavTab active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={History} label="Audit Logs" />
          </nav>

          <div className="bg-white rounded-[32px] p-6 border-2 border-gray-50 shadow-sm">
             <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Class Distribution</h4>
             <div className="space-y-2">
                {KENYAN_CLASSES.slice(0, 8).map(cls => {
                  const count = students.filter(s => s.class === cls).length;
                  if (count === 0) return null;
                  return (
                    <div key={cls} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                       <span className="text-[10px] font-black uppercase text-gray-600">{cls}</span>
                       <span className="text-xs font-black text-blue-600 bg-white px-2 py-0.5 rounded-lg border shadow-sm">{count}</span>
                    </div>
                  );
                })}
             </div>
          </div>
        </aside>

        <div className="xl:col-span-3 space-y-8">
          {activeTab === 'compose' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700">
               <div className="bg-white rounded-[48px] shadow-2xl border-2 border-gray-50 overflow-hidden">
                  <div className="p-10 border-b bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                     <div className="flex items-center gap-6">
                       <div className="p-5 bg-gray-900 text-white rounded-[24px] shadow-xl">
                          <Send className="w-8 h-8" />
                       </div>
                       <div>
                         <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">Campaign Builder</h3>
                         <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-3">Targeting: {targetClass}</p>
                       </div>
                     </div>
                     <div className="flex items-center gap-3">
                       <div className="bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
                          <Filter className="w-4 h-4 text-blue-600" />
                          <select 
                            value={targetClass} 
                            onChange={e => {
                               setTargetClass(e.target.value);
                               setSelectedStudentIds(new Set()); // Reset selection on class change for safety
                            }} 
                            className="bg-transparent text-[11px] font-black uppercase tracking-widest outline-none"
                          >
                            <option>All Classes</option>
                            {KENYAN_CLASSES.map(c => (
                              <option key={c} value={c}>{c} ({students.filter(s => s.class === c).length})</option>
                            ))}
                          </select>
                       </div>
                     </div>
                  </div>
                  
                  <div className="p-10 space-y-10">
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="space-y-6">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] ml-1">1. Message Type</label>
                           <div className="grid grid-cols-2 gap-4">
                              <TypeBtn active={selectedType === 'custom'} label="Free Form" onClick={() => setSelectedType('custom')} icon={LayoutGrid} color="indigo" />
                              <TypeBtn active={selectedType === 'fee'} label="Fee Balances" onClick={() => setSelectedType('fee')} icon={Wallet} color="red" />
                              <TypeBtn active={selectedType === 'opening'} label="Term Opening" onClick={() => setSelectedType('opening')} icon={Calendar} color="blue" />
                              <TypeBtn active={selectedType === 'closing'} label="Term Closing" onClick={() => setSelectedType('closing')} icon={CheckCircle2} color="emerald" />
                           </div>
                        </div>
                        
                        <div className="space-y-6">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] ml-1">2. Refine Search</label>
                           <div className="relative">
                              <Search className="absolute left-4 top-4 w-5 h-5 text-gray-300" />
                              <input 
                                type="text" 
                                placeholder="Search by name or admission..." 
                                value={searchQuery} 
                                onChange={e => setSearchQuery(e.target.value)} 
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-[24px] focus:border-blue-500 outline-none font-black text-[11px] uppercase transition-all shadow-inner placeholder:text-gray-300" 
                              />
                           </div>
                           <div className="p-6 bg-blue-50/50 rounded-[32px] border-2 border-blue-100 flex items-center justify-between shadow-sm">
                              <div className="flex items-center gap-4">
                                 <div className="p-2 bg-white rounded-xl shadow-sm"><Users className="w-5 h-5 text-blue-600" /></div>
                                 <div>
                                    <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest">{selectedStudentIds.size} Selected</p>
                                    <p className="text-[9px] font-bold text-blue-400 uppercase mt-1">{filteredRecipients.length} Matching Learners</p>
                                 </div>
                              </div>
                              <button 
                                onClick={toggleAll} 
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedStudentIds.size > 0 ? 'bg-blue-600 text-white' : 'bg-white text-gray-400 border border-gray-100'}`}
                              >
                                 {selectedStudentIds.size === filteredRecipients.length && filteredRecipients.length > 0 ? 'Deselect All' : 'Select All Match'}
                              </button>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] ml-1">3. Preview Dispatch</label>
                        {selectedType === 'custom' ? (
                           <div className="relative">
                              <textarea 
                                value={customMessage} 
                                onChange={e => setCustomMessage(e.target.value)} 
                                placeholder="Type your official announcement here..." 
                                className="w-full p-8 bg-gray-50 border-2 border-gray-100 rounded-[40px] h-40 focus:ring-8 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-bold text-gray-700 shadow-inner" 
                              />
                              <div className="absolute bottom-6 right-6 flex items-center gap-4">
                                 <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest bg-white px-3 py-1 rounded-full border shadow-sm">{customMessage.length} Characters</span>
                              </div>
                           </div>
                        ) : (
                           <div className="bg-gray-900 p-10 rounded-[48px] relative overflow-hidden group shadow-2xl border-b-8 border-gray-800">
                              <div className="absolute top-0 right-0 p-10 opacity-[0.02] scale-150 group-hover:rotate-6 transition-transform"><Send className="w-32 h-32 text-white" /></div>
                              <div className="relative z-10 flex gap-10">
                                 <div className="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center shrink-0 shadow-2xl shadow-blue-500/20"><MessageSquare className="w-8 h-8 text-white" /></div>
                                 <div className="space-y-4 flex-1">
                                    <p className="text-white font-black text-xl tracking-tight leading-relaxed italic">"{currentPreview}"</p>
                                    <div className="flex items-center gap-8 pt-6 border-t border-white/5">
                                       <div className="flex items-center gap-2">
                                          <Smartphone size={12} className="text-blue-400" />
                                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Gateway: AT-KENYA</span>
                                       </div>
                                       <div className="flex items-center gap-2">
                                          <CreditCard size={12} className="text-green-400" />
                                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Cost: 1.0 Unit/SMS</span>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        )}
                     </div>

                     <button 
                        onClick={handleSendBulk} 
                        disabled={isSending || (selectedType === 'custom' && !customMessage) || selectedStudentIds.size === 0} 
                        className="w-full bg-blue-600 text-white py-8 rounded-[40px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-6 hover:bg-blue-700 transition-all shadow-2xl shadow-blue-100 disabled:opacity-50 active:scale-[0.97] border-b-8 border-blue-800 text-lg"
                     >
                        {isSending ? <Loader2 className="w-8 h-8 animate-spin" /> : <Zap className="w-8 h-8" />}
                        {isSending ? 'COMMITTING DISPATCH...' : 'Authorize Gateway Release'}
                     </button>
                  </div>
               </div>

               {/* RECIPIENT GRID */}
               <div className="bg-white rounded-[48px] shadow-sm border-2 border-gray-50 overflow-hidden">
                  <div className="p-8 border-b bg-gray-50/50 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <Users className="w-5 h-5 text-gray-400" />
                        <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em]">Select Individual Learners ({filteredRecipients.length})</h4>
                     </div>
                     <div className="text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                        {targetClass} Active
                     </div>
                  </div>
                  
                  {filteredRecipients.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-8 max-h-[500px] overflow-y-auto bg-gray-50/20">
                      {filteredRecipients.map(s => (
                          <div 
                            key={s.id} 
                            onClick={() => toggleStudentSelection(s.id)} 
                            className={`p-5 rounded-[28px] border-2 transition-all cursor-pointer flex items-center justify-between group ${selectedStudentIds.has(s.id) ? 'bg-blue-600 border-blue-700 shadow-xl -translate-y-1' : 'bg-white border-gray-100 hover:border-blue-200'}`}
                          >
                             <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden border-2 ${selectedStudentIds.has(s.id) ? 'border-blue-400 bg-blue-500' : 'border-gray-50 bg-gray-50'}`}>
                                   {s.photo ? (
                                     <img src={s.photo} className="w-full h-full object-cover" />
                                   ) : (
                                     <span className={`font-black text-sm ${selectedStudentIds.has(s.id) ? 'text-white' : 'text-gray-400'}`}>{s.firstName[0]}</span>
                                   )}
                                </div>
                                <div>
                                   <p className={`font-black text-sm tracking-tight ${selectedStudentIds.has(s.id) ? 'text-white' : 'text-gray-900'}`}>{s.firstName} {s.lastName}</p>
                                   <p className={`text-[10px] font-bold uppercase ${selectedStudentIds.has(s.id) ? 'text-blue-100' : 'text-gray-400'}`}>{s.class} • {s.admissionNumber}</p>
                                </div>
                             </div>
                             <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedStudentIds.has(s.id) ? 'bg-white border-white text-blue-600' : 'border-gray-100'}`}>
                                {selectedStudentIds.has(s.id) && <Check size={14} strokeWidth={4} />}
                             </div>
                          </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-24 text-center">
                       <Info className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                       <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">No students found for class: {targetClass}</p>
                       <button onClick={() => { setTargetClass('All Classes'); setSelectedType('custom'); }} className="mt-4 text-blue-600 font-black uppercase text-[9px] tracking-widest border-b border-blue-600">Reset Filters</button>
                    </div>
                  )}
               </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-white rounded-[48px] shadow-2xl border-2 border-gray-50 overflow-hidden animate-in fade-in duration-500">
               <div className="p-10 border-b bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">Gateway Logs</h3>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-3">Transaction & Broadcast Audit</p>
                  </div>
                  <button onClick={() => {
                      const ws = XLSX.utils.json_to_sheet(logs);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, "SMS Audit");
                      XLSX.writeFile(wb, "ElimuSmart_SMS_History.xlsx");
                  }} className="flex items-center gap-3 p-4 bg-white border-2 border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-green-600 hover:border-green-200 transition-all shadow-sm">
                    <FileSpreadsheet className="w-5 h-5" /> Export History
                  </button>
               </div>
               
               <div className="divide-y-2 divide-gray-50 max-h-[600px] overflow-y-auto">
                 {logs.map(log => (
                   <div key={log.id} className="p-8 flex items-center justify-between hover:bg-blue-50/20 transition-all group">
                      <div className="flex items-center gap-6">
                         <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform ${log.cost < 0 ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                            {log.cost < 0 ? <Plus className="w-7 h-7" /> : <MessageSquare className="w-7 h-7" />}
                         </div>
                         <div>
                            <p className="font-black text-gray-900 text-xl tracking-tighter uppercase italic leading-none">{log.type}</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">{log.date} • {log.recipients > 0 ? `${log.recipients} Successfull Delivers` : 'Gateway Transaction'}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className={`text-2xl font-black tracking-tighter ${log.cost < 0 ? 'text-green-600' : 'text-gray-900'}`}>{log.cost < 0 ? `+KES ${Math.abs(log.cost)}` : `-${log.cost} Units`}</p>
                         <span className={`text-[10px] font-black uppercase tracking-widest flex items-center justify-end gap-2 mt-2 ${log.status === 'Delivered' || log.status === 'Sent' ? 'text-green-500' : 'text-blue-500'}`}>
                            <CheckCircle2 size={14} /> {log.status}
                         </span>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Up Modal */}
      {isTopUpModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white rounded-[56px] w-full max-w-lg shadow-2xl relative overflow-hidden animate-in zoom-in duration-500 border-8 border-gray-50">
              <div className="p-10 border-b bg-gray-50/50 flex items-center justify-between">
                 <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">Units Top-Up</h2>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-3">Africa's Talking Billing Portal</p>
                 </div>
                 <button onClick={() => setIsTopUpModalOpen(false)} className="p-4 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all border-2 border-white shadow-sm bg-white">
                    <X size={24} />
                 </button>
              </div>

              <div className="p-10 space-y-8">
                 <div className="p-8 bg-blue-50/50 rounded-[32px] border-2 border-blue-100 flex items-center justify-between">
                    <div>
                       <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1 leading-none">Exchange Rate</p>
                       <p className="text-xl font-black text-blue-900 tracking-tighter uppercase leading-none">1 Unit = 1.00 KES</p>
                    </div>
                    <Smartphone className="w-10 h-10 text-blue-200" />
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Enter Credit Amount</label>
                    <input type="number" value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)} className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-[32px] text-4xl font-black text-gray-900 focus:border-blue-500 outline-none text-center shadow-inner" />
                 </div>

                 <div className="pt-6">
                    <button 
                      onClick={handleTopUp} 
                      disabled={isTopUpProcessing}
                      className="w-full bg-blue-600 text-white py-6 rounded-[32px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-100 disabled:opacity-50 hover:bg-blue-700 transition-all flex items-center justify-center gap-4 active:scale-95 border-b-8 border-blue-800"
                    >
                       {isTopUpProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check size={24} strokeWidth={4} />}
                       {isTopUpProcessing ? 'PROCESSING...' : 'Pay via M-Pesa'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const NavTab: React.FC<{ active: boolean, onClick: () => void, icon: any, label: string }> = ({ active, onClick, icon: Icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-5 px-6 py-5 rounded-[24px] text-[11px] font-black uppercase tracking-tight transition-all border-2 ${active ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-100' : 'text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-900'}`}>
    <Icon className={`w-6 h-6 ${active ? 'text-white' : 'text-gray-400'}`} />
    <span>{label}</span>
  </button>
);

const TypeBtn: React.FC<{ active: boolean, onClick: () => void, icon: any, label: string, color: string }> = ({ active, onClick, icon: Icon, label, color }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center p-6 rounded-[32px] border-2 transition-all group relative overflow-hidden ${active ? `border-blue-600 bg-blue-50 text-blue-600 shadow-xl` : 'border-gray-50 text-gray-400 hover:border-blue-100'}`}>
    <div className={`p-3 rounded-2xl mb-3 transition-transform group-hover:scale-110 shadow-sm ${active ? 'bg-white text-blue-600' : 'bg-gray-50 text-gray-300'}`}>
       <Icon className="w-6 h-6" />
    </div>
    <span className="text-[10px] font-black uppercase tracking-tight leading-none text-center">{label}</span>
  </button>
);
