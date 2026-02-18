
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
  History,
  FileSpreadsheet,
  Zap,
  Check,
  CheckSquare,
  LayoutGrid,
  ShieldCheck,
  Wand2,
  Settings,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  ChevronRight,
  MessageCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { GoogleGenAI } from '@google/genai';
import { smsService } from '../services/smsService';
import { apiService } from '../services/apiService';
import { Language, translations } from '../services/localizationService';
import { KENYAN_CLASSES, Student, User, UserRole, SMSProvider, SMSSettings } from '../types';

interface MessageLog {
  id: string;
  type: string;
  recipientsCount: number;
  createdAt: string;
  status: 'Delivered' | 'Failed' | 'Queued' | 'Sent';
  cost: number;
  message: string;
  providerResponse?: string;
  sentBy: string;
}

interface MessagingModuleProps {
  lang: Language;
  user: User;
  students?: Student[];
  schoolConfig: any;
  setSchoolConfig: React.Dispatch<React.SetStateAction<any>>;
}

type MessageType = 'fee' | 'opening' | 'closing' | 'custom';

export const MessagingModule: React.FC<MessagingModuleProps> = ({ lang, user, students = [], schoolConfig, setSchoolConfig }) => {
  const [activeTab, setActiveTab] = useState<'compose' | 'history' | 'settings'>('compose');
  const [selectedType, setSelectedType] = useState<MessageType>('custom'); 
  const [targetClass, setTargetClass] = useState('All Classes');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [smsBalance, setSmsBalance] = useState(4250);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('1000');
  const [isTopUpProcessing, setIsTopUpProcessing] = useState(false);
  const [gatewayConnected, setGatewayConnected] = useState<boolean | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingLink, setIsTestingLink] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);

  // Local buffer for SMS settings
  const [localSmsSettings, setLocalSmsSettings] = useState<SMSSettings>(() => {
    return schoolConfig.smsSettings || {
      provider: SMSProvider.AFRICAS_TALKING,
      username: '',
      apiKey: '',
      senderId: '',
      enabled: true
    };
  });

  useEffect(() => {
    if (activeTab === 'history') fetchLogs();
  }, [activeTab]);

  const fetchLogs = async () => {
    setIsLogsLoading(true);
    try {
      const data = await apiService.request('/messaging/logs');
      setLogs(data);
    } catch (e) {
      console.error("Failed to load SMS history");
    } finally {
      setIsLogsLoading(false);
    }
  };

  useEffect(() => {
    smsService.checkConnection(schoolConfig.smsSettings).then(setGatewayConnected);
  }, [schoolConfig.smsSettings]);
  
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  const templates = {
    fee: `Dear Parent, your child {StudentName}'s outstanding balance at ${schoolConfig.schoolName} is KES {Balance}. Please clear to ensure smooth operations.`,
    opening: `ElimuSmart: Term reopening scheduled for {Date}. Please ensure your child reports to ${schoolConfig.schoolName} by 8:00 AM.`,
    closing: `Dear Parent, school closes for the term today. Report cards for ${schoolConfig.schoolName} are available on the portal. Safe holidays!`,
    custom: customMessage
  };

  const filteredRecipients = useMemo(() => {
    return (students || []).filter(s => {
      const matchesClass = targetClass === 'All Classes' || s.class === targetClass;
      const term = searchQuery.toLowerCase();
      const matchesSearch = s.firstName.toLowerCase().includes(term) || 
                            s.lastName.toLowerCase().includes(term) || 
                            s.admissionNumber.toLowerCase().includes(term);
      const needsFeeAlert = selectedType === 'fee' ? s.feeBalance > 0 : true;
      return matchesClass && matchesSearch && needsFeeAlert;
    });
  }, [students, targetClass, searchQuery, selectedType]);

  const parentGroups = useMemo(() => {
    const selectedStudents = students.filter(s => selectedStudentIds.has(s.id));
    return selectedStudents.reduce<Record<string, Student[]>>((groups, student) => {
      const phone = student.guardianPhone;
      if (!groups[phone]) groups[phone] = [];
      groups[phone].push(student);
      return groups;
    }, {});
  }, [selectedStudentIds, students]);

  const toggleAll = () => {
    if (selectedStudentIds.size === filteredRecipients.length && filteredRecipients.length > 0) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filteredRecipients.map(s => s.id)));
    }
  };

  const currentPreview = useMemo(() => {
    let msg = templates[selectedType] || customMessage;
    const firstPhone = Object.keys(parentGroups)[0];
    const previewKids = firstPhone ? parentGroups[firstPhone] : (students[0] ? [students[0]] : [{ firstName: '{Name}', feeBalance: 0 }]);
    
    const names = previewKids.map(k => k.firstName).join(' & ');
    // Fix for line 135: Explicitly type the accumulator and current value to avoid Student type inference errors in unions
    const totalBal = (previewKids as any[]).reduce((sum: number, k: any) => sum + (Number(k.feeBalance) || 0), 0);

    return msg.replace(/{StudentName}/g, names)
              .replace(/{Balance}/g, totalBal.toLocaleString())
              .replace(/{Date}/g, new Date().toLocaleDateString());
  }, [selectedType, customMessage, parentGroups, students, schoolConfig.schoolName]);

  const handleGenerateAI = async () => {
    if (!process.env.API_KEY) return alert("AI Key missing.");
    setIsGeneratingAI(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Generate a professional Kenyan school SMS for ${selectedType} for ${schoolConfig.schoolName}. Term: ${schoolConfig.term}. Keep it under 160 characters. Return only the SMS body. Use variables: {StudentName}, {Balance}, {Date}.`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setCustomMessage(response.text?.trim() || '');
      setSelectedType('custom');
    } catch (e) {
      alert("AI Generation failed.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSendBulk = async () => {
    const numGroups = Object.keys(parentGroups).length;
    if (smsBalance < numGroups) return alert("Insufficient SMS Balance.");

    const confirmed = window.confirm(`Authorize dispatch to ${numGroups} unique parent endpoints? Consolidation logic will combine sibling data into single messages.`);
    if (!confirmed) return;

    setIsSending(true);
    try {
      const payload = Object.entries(parentGroups).map(([phone, kids]) => {
        const names = kids.map(k => k.firstName).join(' & ');
        // Fix for line 159 (reported): Explicitly type the accumulator and current value to avoid Student type inference errors
        const totalBal = kids.reduce((sum: number, k: Student) => sum + (Number(k.feeBalance) || 0), 0);
        let msg = (templates[selectedType] || customMessage)
          .replace(/{StudentName}/g, names)
          .replace(/{Balance}/g, totalBal.toLocaleString())
          .replace(/{Date}/g, new Date().toLocaleDateString());

        return { name: names, phone: smsService.formatPhone(phone), message: msg };
      });

      // 1. Dispatch through Gateway
      await smsService.sendBulkCampaign(payload, '', selectedType, schoolConfig.smsSettings);
      
      // 2. Persist to Backend
      await apiService.request('/messaging/send-bulk', {
        method: 'POST',
        body: JSON.stringify({
          type: selectedType.toUpperCase(),
          recipientsCount: numGroups,
          message: currentPreview,
          cost: numGroups
        })
      });
      
      setSmsBalance(prev => prev - numGroups);
      alert(`Institutional Sync Complete: ${numGroups} SMS dispatched.`);
      setSelectedStudentIds(new Set());
      setActiveTab('history');
    } catch (err: any) {
      alert("Network Error: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleTestLink = async () => {
    setIsTestingLink(true);
    try {
      const isOk = await smsService.checkConnection(localSmsSettings);
      setGatewayConnected(isOk);
      alert(isOk ? "Handshake Success: Gateway is live." : "Handshake Failed: Check credentials.");
    } finally {
      setIsTestingLink(false);
    }
  };

  const isAdmin = user.role === UserRole.ADMIN;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none italic">Communication</h1>
          <div className="flex items-center gap-4 mt-3">
             <div className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-100 rounded-full shadow-sm">
                <span className={`w-2 h-2 rounded-full ${gatewayConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{schoolConfig.smsSettings.provider}</span>
             </div>
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Institutional Hub</p>
          </div>
        </div>
        <div className="bg-white p-3 rounded-[32px] shadow-2xl border-2 border-gray-50 flex items-center gap-6">
           <div className="pl-6 pr-10 border-r-2 border-gray-50 py-2">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Available Units</p>
              <p className="text-3xl font-black text-gray-900 leading-none mt-1">{smsBalance.toLocaleString()}</p>
           </div>
           <button onClick={() => setIsTopUpModalOpen(true)} className="bg-blue-600 text-white px-10 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl active:scale-95 border-b-4 border-blue-800">Buy Units</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 space-y-4">
          <nav className="bg-white p-3 rounded-[40px] border-2 border-gray-50 shadow-xl space-y-1">
             <NavTab active={activeTab === 'compose'} onClick={() => setActiveTab('compose')} icon={MessageSquare} label="New Campaign" />
             <NavTab active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={History} label="Audit Trail" />
             {isAdmin && <NavTab active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={Settings} label="Gateway Logic" />}
          </nav>

          {activeTab === 'compose' && (
            <div className="bg-gray-900 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><MessageCircle size={120} /></div>
               <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Smart Consolidation</h4>
               <p className="text-xs font-bold italic leading-relaxed opacity-70">Siblings are automatically grouped. A parent with multiple children receives one consolidated SMS to save on institutional costs.</p>
            </div>
          )}
        </aside>

        <main className="lg:col-span-3">
          {activeTab === 'compose' && (
            <div className="bg-white rounded-[56px] shadow-2xl border-2 border-gray-50 overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
              <div className="p-12 border-b bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-8">
                 <div>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">Campaign Builder</h3>
                    <p className="text-[10px] text-gray-400 font-black uppercase mt-4 tracking-widest">Routing: {targetClass} • {selectedStudentIds.size} Marked</p>
                 </div>
                 <div className="flex items-center gap-3">
                    <button onClick={handleGenerateAI} disabled={isGeneratingAI} className="flex items-center gap-3 bg-purple-600 text-white px-8 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-purple-700 transition-all active:scale-95">
                      {isGeneratingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} AI Assistant
                    </button>
                 </div>
              </div>

              <div className="p-12 space-y-12">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Template Logic</label>
                       <div className="grid grid-cols-2 gap-4">
                          <TypeBtn active={selectedType === 'custom'} label="Free Text" onClick={() => setSelectedType('custom')} icon={LayoutGrid} />
                          <TypeBtn active={selectedType === 'fee'} label="Fee Balances" onClick={() => setSelectedType('fee')} icon={Wallet} />
                          <TypeBtn active={selectedType === 'opening'} label="Reopening" onClick={() => setSelectedType('opening')} icon={Calendar} />
                          <TypeBtn active={selectedType === 'closing'} label="Term End" onClick={() => setSelectedType('closing')} icon={CheckCircle2} />
                       </div>
                    </div>
                    <div className="space-y-6">
                       <div className="flex justify-between items-center ml-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Audience</label>
                          <select value={targetClass} onChange={e => {setTargetClass(e.target.value); setSelectedStudentIds(new Set());}} className="bg-gray-50 border-2 border-gray-100 rounded-xl px-3 py-1 text-[9px] font-black uppercase outline-none">
                             <option>All Classes</option>
                             {KENYAN_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                       </div>
                       <div className="p-8 bg-blue-50/50 rounded-[40px] border-2 border-blue-100 shadow-inner">
                          <div className="flex justify-between items-center mb-6">
                            <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest">{selectedStudentIds.size} Learners Selected</p>
                            <button onClick={toggleAll} className="text-[10px] font-black text-blue-600 uppercase border-b-2 border-blue-600">Flip Selection</button>
                          </div>
                          <div className="max-h-48 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                             {filteredRecipients.map(s => (
                               <label key={s.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl border-2 border-white shadow-sm cursor-pointer hover:border-blue-300 transition-all group">
                                  <input type="checkbox" checked={selectedStudentIds.has(s.id)} onChange={() => {
                                    const next = new Set(selectedStudentIds);
                                    if (next.has(s.id)) next.delete(s.id); else next.add(s.id);
                                    setSelectedStudentIds(next);
                                  }} className="w-5 h-5 rounded-lg border-2 border-gray-200 text-blue-600 focus:ring-blue-500" />
                                  <div>
                                     <p className="text-xs font-black text-gray-900 uppercase italic group-hover:text-blue-600 transition-colors">{s.firstName} {s.lastName}</p>
                                     <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{s.admissionNumber} • {s.class}</p>
                                  </div>
                                </label>
                             ))}
                             {filteredRecipients.length === 0 && (
                               <div className="py-10 text-center">
                                  <AlertCircle className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                                  <p className="text-[10px] text-gray-400 font-black uppercase italic tracking-widest">No matching learners found.</p>
                               </div>
                             )}
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="flex justify-between items-center ml-1">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Master Preview</label>
                       <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-full uppercase">Consolidation Active</span>
                    </div>
                    {selectedType === 'custom' ? (
                       <textarea value={customMessage} onChange={e => setCustomMessage(e.target.value)} placeholder="Craft your institutional message here..." className="w-full p-10 bg-gray-50 border-2 border-gray-100 rounded-[48px] h-48 focus:border-blue-500 focus:bg-white transition-all outline-none font-bold text-lg shadow-inner" />
                    ) : (
                       <div className="bg-gray-900 p-12 rounded-[56px] text-white shadow-2xl relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-12 transition-transform"><Smartphone size={100} /></div>
                          <p className="italic text-xl font-bold leading-relaxed relative z-10">"{currentPreview}"</p>
                          <div className="mt-8 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-blue-400 relative z-10">
                             <div className="w-2 h-2 bg-blue-400 rounded-full"></div> Template Draft Verified
                          </div>
                       </div>
                    )}
                 </div>

                 <button onClick={handleSendBulk} disabled={isSending || (selectedType === 'custom' && !customMessage) || selectedStudentIds.size === 0 || !schoolConfig.smsSettings.enabled} className="w-full bg-blue-600 text-white py-8 rounded-[40px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-6 active:scale-95 border-b-8 border-blue-800">
                   {isSending ? <Loader2 className="w-8 h-8 animate-spin" /> : <Zap className="w-8 h-8" />}
                   <span className="text-lg">{isSending ? 'HANDSHAKING GATEWAY...' : 'Authorize Global Dispatch'}</span>
                 </button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-white rounded-[56px] shadow-2xl border-2 border-gray-50 overflow-hidden animate-in fade-in duration-500">
               <div className="p-12 border-b bg-gray-50/50 flex justify-between items-center">
                  <div>
                    <h3 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">History</h3>
                    <p className="text-[10px] text-gray-400 font-black uppercase mt-3">Institutional Dispatch Ledger</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={fetchLogs} className="p-4 bg-white border-2 border-gray-100 rounded-2xl text-blue-600 hover:bg-blue-50 transition-all shadow-sm">
                       <RefreshCw size={20} className={isLogsLoading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={() => {
                        const ws = XLSX.utils.json_to_sheet(logs);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, "SMS Audit");
                        XLSX.writeFile(wb, "SMS_Institutional_History.xlsx");
                    }} className="flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-lg">
                       <FileSpreadsheet size={18} /> Export Audit
                    </button>
                  </div>
               </div>
               <div className="divide-y-2 divide-gray-50">
                  {logs.map(log => (
                    <div key={log.id} className="p-10 flex items-center justify-between hover:bg-blue-50/20 transition-all group">
                       <div className="flex items-center gap-8">
                          <div className="w-16 h-16 rounded-[24px] bg-white border-2 border-gray-100 text-blue-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"><MessageSquare size={32} /></div>
                          <div>
                             <p className="font-black text-gray-900 uppercase italic text-xl tracking-tighter leading-none">{log.type}</p>
                             <div className="flex items-center gap-3 mt-3">
                                <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-md">By {log.sentBy}</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(log.createdAt).toLocaleString()} • {log.recipientsCount} Endpoints</span>
                             </div>
                             <p className="text-xs text-gray-400 italic mt-3 line-clamp-1 group-hover:line-clamp-none transition-all">"{log.message}"</p>
                          </div>
                       </div>
                       <div className="text-right shrink-0">
                          <p className="text-2xl font-black text-gray-900 tracking-tighter">-{log.cost} Units</p>
                          <span className="text-[10px] font-black uppercase text-green-500 flex items-center justify-end gap-2 mt-2"><CheckCircle2 size={14} /> {log.status}</span>
                       </div>
                    </div>
                  ))}
                  {logs.length === 0 && !isLogsLoading && (
                    <div className="py-32 text-center">
                       <History className="w-16 h-16 text-gray-100 mx-auto mb-6" />
                       <p className="text-[12px] text-gray-300 font-black uppercase tracking-[0.4em] italic">No historical dispatches detected.</p>
                    </div>
                  )}
               </div>
            </div>
          )}

          {activeTab === 'settings' && isAdmin && (
            <div className="bg-white rounded-[56px] shadow-2xl border-2 border-gray-50 overflow-hidden animate-in zoom-in duration-500">
               <div className="p-12 border-b bg-gray-50/50 flex items-center gap-8">
                  <div className="p-6 bg-gray-900 text-white rounded-[32px] shadow-2xl"><ShieldCheck size={32} /></div>
                  <div>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">Gateway Hub</h3>
                    <p className="text-[10px] text-gray-400 font-black uppercase mt-4 tracking-[0.3em]">Institutional Configuration</p>
                  </div>
               </div>

               <div className="p-12 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Service Provider</label>
                        <select value={localSmsSettings.provider} onChange={e => setLocalSmsSettings({...localSmsSettings, provider: e.target.value as SMSProvider})} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-[24px] font-black uppercase text-xs focus:border-blue-500 outline-none">
                           <option value={SMSProvider.AFRICAS_TALKING}>Africa's Talking (Kenya Native)</option>
                           <option value={SMSProvider.TWILIO}>Twilio (International)</option>
                           <option value={SMSProvider.Safaricom}>Safaricom Masoko</option>
                        </select>
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Username / App ID</label>
                        <input type="text" value={localSmsSettings.username} onChange={e => setLocalSmsSettings({...localSmsSettings, username: e.target.value})} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-[24px] font-bold outline-none focus:border-blue-500 shadow-inner" />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Secret Key (AES-256)</label>
                        <div className="relative">
                           <input type={showApiKey ? "text" : "password"} value={localSmsSettings.apiKey} onChange={e => setLocalSmsSettings({...localSmsSettings, apiKey: e.target.value})} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-[24px] font-black font-mono outline-none focus:border-blue-500 shadow-inner" />
                           <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-5 top-5 text-gray-400 hover:text-blue-600 transition-colors">{showApiKey ? <EyeOff size={24} /> : <Eye size={24} />}</button>
                        </div>
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Verified Sender ID</label>
                        <input type="text" maxLength={11} value={localSmsSettings.senderId} onChange={e => setLocalSmsSettings({...localSmsSettings, senderId: e.target.value.toUpperCase()})} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-[24px] font-black tracking-[0.2em] outline-none focus:border-blue-500 shadow-inner" />
                     </div>
                  </div>

                  <div className="p-10 bg-blue-50/50 rounded-[48px] border-2 border-blue-100 flex items-center justify-between">
                     <div className="flex items-center gap-6">
                        <div className={`p-4 rounded-[20px] ${localSmsSettings.enabled ? 'bg-green-100 text-green-600 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-gray-200 text-gray-400'}`}>
                           <CheckSquare size={32} />
                        </div>
                        <div>
                           <p className="font-black text-gray-900 uppercase text-lg tracking-tighter leading-none">Gateway Authorization</p>
                           <p className="text-[10px] text-blue-400 font-bold uppercase mt-2 tracking-widest">Global kill-switch for all dispatches</p>
                        </div>
                     </div>
                     <button onClick={() => setLocalSmsSettings({...localSmsSettings, enabled: !localSmsSettings.enabled})} className={`px-12 py-4 rounded-[24px] text-[11px] font-black uppercase tracking-widest transition-all border-b-4 ${localSmsSettings.enabled ? 'bg-green-600 text-white border-green-800 shadow-xl' : 'bg-red-500 text-white border-red-800'}`}>
                        {localSmsSettings.enabled ? 'GATEWAY: ACTIVE' : 'GATEWAY: PAUSED'}
                     </button>
                  </div>
                  
                  <div className="flex gap-6">
                     <button onClick={handleTestLink} disabled={isTestingLink} className="flex-1 py-6 bg-white border-2 border-gray-100 rounded-[32px] font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-4 hover:bg-gray-50 active:scale-95 transition-all shadow-sm">
                        {isTestingLink ? <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> : <RefreshCw size={20} className="text-blue-600" />}
                        Run Diagnostic
                     </button>
                     <button onClick={async () => { setIsSavingConfig(true); await new Promise(r => setTimeout(r, 800)); setSchoolConfig({...schoolConfig, smsSettings: {...localSmsSettings}}); setIsSavingConfig(false); alert("Gateway Profile Updated."); }} disabled={isSavingConfig} className="flex-[2] py-6 bg-gray-900 text-white rounded-[32px] font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 border-b-8 border-black">
                        {isSavingConfig ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={20} />}
                        Sync Institutional Profile
                     </button>
                  </div>
               </div>
            </div>
          )}
        </main>
      </div>

      {isTopUpModalOpen && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white rounded-[64px] w-full max-w-lg shadow-2xl p-16 relative border-8 border-gray-50 animate-in zoom-in duration-500">
              <button onClick={() => setIsTopUpModalOpen(false)} className="absolute top-10 right-10 text-gray-400 hover:text-red-500 transition-colors"><X size={32} /></button>
              <div className="text-center mb-12">
                 <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl border-4 border-white"><Smartphone size={48} /></div>
                 <h2 className="text-4xl font-black text-gray-900 uppercase italic tracking-tighter">Units Top-Up</h2>
                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.4em] mt-4 italic">Standard Rate: 1 Unit = 1.00 KES</p>
              </div>
              <div className="space-y-10">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Units to Acquire</label>
                    <input type="number" value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)} className="w-full p-10 bg-gray-50 border-4 border-gray-100 rounded-[48px] text-6xl font-black text-center focus:border-blue-500 focus:bg-white outline-none transition-all shadow-inner" />
                 </div>
                 <button onClick={async () => {setIsTopUpProcessing(true); await new Promise(r => setTimeout(r, 1500)); setSmsBalance(prev => prev + parseInt(topUpAmount)); setIsTopUpProcessing(false); setIsTopUpModalOpen(false); alert("Institutional Wallet Refilled.");}} className="w-full bg-blue-600 text-white py-8 rounded-[40px] font-black uppercase text-lg tracking-[0.2em] shadow-2xl hover:bg-blue-700 transition-all border-b-8 border-blue-900 active:scale-95 flex items-center justify-center gap-4">
                   {isTopUpProcessing ? <Loader2 className="w-8 h-8 animate-spin" /> : <Smartphone size={32} />}
                   {isTopUpProcessing ? 'SECURE HANDSHAKE...' : 'Refill via M-Pesa'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const NavTab: React.FC<{ active: boolean, onClick: () => void, icon: any, label: string }> = ({ active, onClick, icon: Icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-6 px-8 py-6 rounded-[32px] text-[12px] font-black uppercase tracking-widest transition-all ${active ? 'bg-blue-600 text-white shadow-2xl shadow-blue-200 border-b-4 border-blue-800' : 'text-gray-400 hover:bg-gray-50'}`}>
    <Icon className={`w-6 h-6 ${active ? 'text-white' : 'text-gray-300'}`} /> <span>{label}</span>
  </button>
);

const TypeBtn: React.FC<{ active: boolean, onClick: () => void, icon: any, label: string }> = ({ active, onClick, icon: Icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center p-8 rounded-[40px] border-4 transition-all shadow-lg ${active ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-blue-100' : 'border-gray-50 text-gray-400 hover:border-blue-100 hover:bg-gray-50'}`}>
    <Icon className={`w-10 h-10 mb-4 ${active ? 'text-blue-600' : 'text-gray-300'}`} />
    <span className="text-[10px] font-black uppercase tracking-widest leading-none">{label}</span>
  </button>
);
