
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
  EyeOff
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { GoogleGenAI } from '@google/genai';
import { smsService } from '../services/smsService';
import { Language, translations } from '../services/localizationService';
import { KENYAN_CLASSES, Student, User, UserRole, SMSProvider, SMSSettings } from '../types';

interface MessageLog {
  id: string;
  type: string;
  recipients: number;
  date: string;
  status: 'Delivered' | 'Failed' | 'Queued' | 'Sent';
  cost: number;
  sampleMessage?: string;
  providerResponse?: string;
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

  // Local buffer for SMS settings to prevent Keystroke-lag and unsaved persistence
  const [localSmsSettings, setLocalSmsSettings] = useState<SMSSettings>(() => {
    return schoolConfig.smsSettings || {
      provider: SMSProvider.AFRICAS_TALKING,
      username: '',
      apiKey: '',
      senderId: '',
      enabled: true
    };
  });
  
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  const [logs, setLogs] = useState<MessageLog[]>([
    { id: '1', type: 'Fee Reminder', recipients: 45, date: '2024-05-10', status: 'Delivered', cost: 45, sampleMessage: "Dear Parent, your child Kamau's outstanding balance is KES 12,500.", providerResponse: "Delivered to Safaricom network." },
    { id: '2', type: 'Opening Date', recipients: 482, date: '2024-05-01', status: 'Delivered', cost: 482, sampleMessage: "School reopens on Monday, 6th May.", providerResponse: "Accepted by Gateway." },
  ]);

  useEffect(() => {
    smsService.checkConnection(schoolConfig.smsSettings).then(setGatewayConnected);
  }, [schoolConfig.smsSettings]);

  const templates = {
    fee: "Dear Parent, your child {StudentName}'s outstanding balance is KES {Balance}. Please clear to ensure smooth operations.",
    opening: "ElimuSmart: Term reopening scheduled for {Date}. Please ensure your child reports by 8:00 AM.",
    closing: "Dear Parent, school closes for the term today. Report cards are available on the portal. Safe holidays!",
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

  const toggleAll = () => {
    if (selectedStudentIds.size === filteredRecipients.length && filteredRecipients.length > 0) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filteredRecipients.map(s => s.id)));
    }
  };

  const currentPreview = useMemo(() => {
    let msg = templates[selectedType] || customMessage;
    const firstSelectedId = Array.from(selectedStudentIds)[0];
    const previewStudent = students.find(s => s.id === firstSelectedId) || (students[0] || { firstName: '{Name}', feeBalance: 0 });
    
    return msg.replace(/{StudentName}/g, previewStudent.firstName)
              .replace(/{Balance}/g, (previewStudent.feeBalance || 0).toLocaleString())
              .replace(/{Date}/g, new Date().toLocaleDateString());
  }, [selectedType, customMessage, selectedStudentIds, students]);

  const handleGenerateAI = async () => {
    if (!process.env.API_KEY) return alert("AI Key missing.");
    setIsGeneratingAI(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Generate a short, professional Kenyan school SMS for ${selectedType} in ${lang === 'sw' ? 'Kiswahili' : 'English'}. Keep it under 160 characters. Return only the SMS body. Use variables: {StudentName}, {Balance}, {Date}.`;
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
    const selectedStudents = students.filter(s => selectedStudentIds.has(s.id));
    
    // Grouping logic for parents with multiple children
    const parentGroups = selectedStudents.reduce<Record<string, Student[]>>((groups, student) => {
      const phone = student.guardianPhone;
      if (!groups[phone]) groups[phone] = [];
      groups[phone].push(student);
      return groups;
    }, {});

    const numGroups = Object.keys(parentGroups).length;
    if (smsBalance < numGroups) return alert("Insufficient SMS Balance.");

    const confirmed = window.confirm(`Send consolidated SMS to ${numGroups} unique parents?`);
    if (!confirmed) return;

    setIsSending(true);
    try {
      const payload = Object.entries(parentGroups).map(([phone, kids]) => {
        const names = kids.map(k => k.firstName).join(' & ');
        const totalBal = kids.reduce((sum, k) => sum + k.feeBalance, 0);
        let msg = (templates[selectedType] || customMessage)
          .replace(/{StudentName}/g, names)
          .replace(/{Balance}/g, totalBal.toLocaleString())
          .replace(/{Date}/g, new Date().toLocaleDateString());

        return { name: names, phone: smsService.formatPhone(phone), message: msg };
      });

      const res = await smsService.sendBulkCampaign(payload, '', selectedType, schoolConfig.smsSettings);
      
      setSmsBalance(prev => prev - numGroups);
      setLogs([{
        id: Date.now().toString(),
        type: selectedType.toUpperCase(),
        recipients: numGroups,
        date: new Date().toLocaleString(),
        status: 'Sent',
        cost: numGroups,
        sampleMessage: currentPreview,
        providerResponse: res.providerResponse
      }, ...logs]);
      
      alert(`Success: ${numGroups} SMS dispatched.`);
      setSelectedStudentIds(new Set());
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleTestLink = async () => {
    setIsTestingLink(true);
    try {
      const isOk = await smsService.checkConnection(localSmsSettings);
      alert(isOk ? "Connection Verified: Gateway handshake successful." : "Connection Failed: Invalid Username or API Key.");
    } catch (e) {
      alert("Error testing gateway: Network failure.");
    } finally {
      setIsTestingLink(false);
    }
  };

  const handleSaveConfig = () => {
    setSchoolConfig({
      ...schoolConfig,
      smsSettings: { ...localSmsSettings }
    });
    alert("System Update: SMS Gateway settings saved and persistent.");
  };

  const isAdmin = user.role === UserRole.ADMIN;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none italic">Communication</h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-3 flex items-center gap-3">
             <span className={`w-2.5 h-2.5 rounded-full ${gatewayConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
             {schoolConfig.smsSettings.provider.replace('_', ' ')} GATEWAY • {gatewayConnected ? 'READY' : 'OFFLINE'}
          </p>
        </div>
        <div className="bg-white p-2 rounded-[24px] shadow-xl border-2 border-gray-50 flex items-center gap-4">
           <div className="px-6 py-2 border-r-2 border-gray-50">
              <p className="text-[9px] font-black text-gray-400 uppercase">Balance</p>
              <p className="text-xl font-black text-gray-900">{smsBalance.toLocaleString()} <span className="text-[10px] opacity-30">Units</span></p>
           </div>
           <button onClick={() => setIsTopUpModalOpen(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all">Top Up</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 space-y-4">
          <nav className="bg-white p-3 rounded-[32px] border-2 border-gray-50 shadow-sm space-y-1">
             <NavTab active={activeTab === 'compose'} onClick={() => setActiveTab('compose')} icon={MessageSquare} label="Draft Campaign" />
             <NavTab active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={History} label="Audit Logs" />
             {isAdmin && (
               <NavTab active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={Settings} label="Gateway Config" />
             )}
          </nav>
        </aside>

        <main className="lg:col-span-3">
          {activeTab === 'compose' && (
            <div className="bg-white rounded-[48px] shadow-2xl border-2 border-gray-50 overflow-hidden animate-in slide-in-from-bottom-6">
              <div className="p-10 border-b bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                 <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">Campaign Builder</h3>
                    <p className="text-[10px] text-gray-400 font-black uppercase mt-3">Filter: {targetClass}</p>
                 </div>
                 <div className="flex gap-3">
                    <button onClick={handleGenerateAI} disabled={isGeneratingAI} className="flex items-center gap-3 bg-purple-50 text-purple-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-purple-100 hover:bg-purple-100 transition-all">
                      {isGeneratingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} AI Draft
                    </button>
                    <select value={targetClass} onChange={e => {setTargetClass(e.target.value); setSelectedStudentIds(new Set());}} className="bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 text-[10px] font-black uppercase outline-none">
                      <option>All Classes</option>
                      {KENYAN_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
              </div>

              <div className="p-10 space-y-10">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">1. Choose Template</label>
                       <div className="grid grid-cols-2 gap-3">
                          <TypeBtn active={selectedType === 'custom'} label="Free Text" onClick={() => setSelectedType('custom')} icon={LayoutGrid} />
                          <TypeBtn active={selectedType === 'fee'} label="Fees" onClick={() => setSelectedType('fee')} icon={Wallet} />
                          <TypeBtn active={selectedType === 'opening'} label="Opening" onClick={() => setSelectedType('opening')} icon={Calendar} />
                          <TypeBtn active={selectedType === 'closing'} label="Closing" onClick={() => setSelectedType('closing')} icon={CheckCircle2} />
                       </div>
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">2. Target Audience</label>
                       <div className="p-6 bg-blue-50/50 rounded-[32px] border-2 border-blue-100">
                          <div className="flex justify-between items-center mb-4">
                            <p className="text-[10px] font-black text-blue-900 uppercase">{selectedStudentIds.size} Selected</p>
                            <button onClick={toggleAll} className="text-[10px] font-black text-blue-600 uppercase border-b-2 border-blue-600">Toggle All</button>
                          </div>
                          <div className="max-h-32 overflow-y-auto space-y-2">
                             {filteredRecipients.map(s => (
                               <label key={s.id} className="flex items-center gap-3 p-2 bg-white rounded-xl border border-gray-100 cursor-pointer">
                                  <input type="checkbox" checked={selectedStudentIds.has(s.id)} onChange={() => {
                                    const next = new Set(selectedStudentIds);
                                    if (next.has(s.id)) next.delete(s.id); else next.add(s.id);
                                    setSelectedStudentIds(next);
                                  }} className="rounded-md" />
                                  <span className="text-[10px] font-bold text-gray-600 uppercase">{s.firstName} {s.lastName}</span>
                               </label>
                             ))}
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">3. Live Message Preview</label>
                    {selectedType === 'custom' ? (
                       <textarea value={customMessage} onChange={e => setCustomMessage(e.target.value)} placeholder="Type your message..." className="w-full p-8 bg-gray-50 border-2 border-gray-100 rounded-[32px] h-32 focus:border-blue-500 transition-all outline-none font-bold" />
                    ) : (
                       <div className="bg-gray-900 p-8 rounded-[40px] text-white italic text-lg font-bold">"{currentPreview}"</div>
                    )}
                 </div>

                 <button onClick={handleSendBulk} disabled={isSending || selectedStudentIds.size === 0 || !schoolConfig.smsSettings.enabled} className="w-full bg-blue-600 text-white py-6 rounded-[32px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-4">
                   {isSending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
                   {isSending ? 'PROCESSING...' : 'Commit Gateway Dispatch'}
                 </button>
              </div>
            </div>
          )}

          {activeTab === 'settings' && isAdmin && (
            <div className="bg-white rounded-[48px] shadow-2xl border-2 border-gray-50 overflow-hidden animate-in zoom-in duration-500">
               <div className="p-10 border-b bg-gray-50/50 flex items-center gap-6">
                  <div className="p-5 bg-blue-600 text-white rounded-[24px] shadow-xl"><ShieldCheck size={32} /></div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">Gateway Hub</h3>
                    <p className="text-[10px] text-gray-400 font-black uppercase mt-3">Encryption-First Configuration</p>
                  </div>
               </div>

               <div className="p-10 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Service Provider</label>
                        <select value={localSmsSettings.provider} onChange={e => setLocalSmsSettings({...localSmsSettings, provider: e.target.value as SMSProvider})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-black uppercase text-xs">
                           <option value={SMSProvider.AFRICAS_TALKING}>Africa's Talking</option>
                           <option value={SMSProvider.TWILIO}>Twilio</option>
                           <option value={SMSProvider.Safaricom}>Safaricom Masoko</option>
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Username / SID</label>
                        <input type="text" value={localSmsSettings.username} onChange={e => setLocalSmsSettings({...localSmsSettings, username: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Secret Key (Encrypted)</label>
                        <div className="relative">
                           <input type={showApiKey ? "text" : "password"} value={localSmsSettings.apiKey} onChange={e => setLocalSmsSettings({...localSmsSettings, apiKey: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold font-mono" />
                           <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-4 top-4 text-gray-400">{showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Official Sender ID</label>
                        <input type="text" maxLength={11} value={localSmsSettings.senderId} onChange={e => setLocalSmsSettings({...localSmsSettings, senderId: e.target.value.toUpperCase()})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-black tracking-widest" />
                     </div>
                  </div>

                  <div className="p-8 bg-blue-50 rounded-[32px] flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <CheckSquare className={localSmsSettings.enabled ? 'text-green-600' : 'text-gray-400'} size={24} />
                        <div>
                           <p className="font-black text-blue-900 uppercase text-xs">Gateway Active</p>
                           <p className="text-[9px] text-blue-400 font-bold uppercase">Toggle to pause all dispatch</p>
                        </div>
                     </div>
                     <button onClick={() => setLocalSmsSettings({...localSmsSettings, enabled: !localSmsSettings.enabled})} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${localSmsSettings.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {localSmsSettings.enabled ? 'ENABLED' : 'DISABLED'}
                     </button>
                  </div>
                  
                  <div className="flex gap-4">
                     <button onClick={handleTestLink} disabled={isTestingLink} className="flex-1 py-5 bg-white border-2 rounded-3xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                        {isTestingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {isTestingLink ? 'Testing...' : 'Test Link'}
                     </button>
                     <button onClick={handleSaveConfig} className="flex-[2] py-5 bg-gray-900 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl">
                        Save Config
                     </button>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-white rounded-[48px] shadow-2xl border-2 border-gray-50 overflow-hidden">
               <div className="p-10 border-b bg-gray-50/50 flex justify-between items-center">
                  <h3 className="text-2xl font-black text-gray-900 uppercase italic">Audit Logs</h3>
                  <button onClick={() => {
                      const ws = XLSX.utils.json_to_sheet(logs);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, "SMS Audit");
                      XLSX.writeFile(wb, "SMS_History.xlsx");
                  }} className="flex items-center gap-2 p-3 border-2 rounded-xl text-[10px] font-black uppercase"><FileSpreadsheet size={16} /> Export</button>
               </div>
               <div className="divide-y-2 divide-gray-50">
                  {logs.map(log => (
                    <div key={log.id} className="p-8 flex items-center justify-between hover:bg-gray-50">
                       <div className="flex items-center gap-6">
                          <div className="w-14 h-14 rounded-[20px] bg-blue-50 text-blue-600 flex items-center justify-center"><MessageSquare size={28} /></div>
                          <div>
                             <p className="font-black text-gray-900 uppercase italic leading-none">{log.type}</p>
                             <p className="text-[10px] text-gray-400 font-black uppercase mt-2">{log.date} • {log.recipients} Recipients</p>
                             <p className="text-[9px] text-gray-400 italic mt-1 line-clamp-1">"{log.sampleMessage}"</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-xl font-black text-gray-900">-{log.cost} Units</p>
                          <span className="text-[9px] font-black uppercase text-green-500 flex items-center justify-end gap-1"><CheckCircle2 size={12} /> {log.status}</span>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </main>
      </div>

      {isTopUpModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-xl animate-in fade-in">
           <div className="bg-white rounded-[56px] w-full max-w-md shadow-2xl p-10 relative border-8 border-gray-50">
              <button onClick={() => setIsTopUpModalOpen(false)} className="absolute top-8 right-8 text-gray-400 hover:text-red-500"><X size={24} /></button>
              <h2 className="text-3xl font-black text-gray-900 uppercase italic mb-8">Units Top-Up</h2>
              <div className="space-y-6">
                 <div className="p-6 bg-blue-50 rounded-3xl border-2 border-blue-100 flex items-center justify-between">
                    <p className="text-[10px] font-black text-blue-900 uppercase">Rate: 1 Unit = 1.00 KES</p>
                    <Smartphone size={32} className="text-blue-200" />
                 </div>
                 <input type="number" value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)} className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-3xl text-4xl font-black text-center" />
                 <button onClick={async () => {setIsTopUpProcessing(true); await new Promise(r => setTimeout(r, 1500)); setSmsBalance(prev => prev + parseInt(topUpAmount)); setIsTopUpProcessing(false); setIsTopUpModalOpen(false);}} className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest">
                   {isTopUpProcessing ? 'AUTHORIZING...' : 'Pay via M-Pesa'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const NavTab: React.FC<{ active: boolean, onClick: () => void, icon: any, label: string }> = ({ active, onClick, icon: Icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-5 px-6 py-5 rounded-[24px] text-[11px] font-black uppercase transition-all ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}>
    <Icon className="w-6 h-6" /> <span>{label}</span>
  </button>
);

const TypeBtn: React.FC<{ active: boolean, onClick: () => void, icon: any, label: string }> = ({ active, onClick, icon: Icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center p-4 rounded-[24px] border-2 transition-all ${active ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-50 text-gray-400 hover:border-blue-100'}`}>
    <Icon className="w-5 h-5 mb-2" />
    <span className="text-[9px] font-black uppercase leading-none">{label}</span>
  </button>
);
