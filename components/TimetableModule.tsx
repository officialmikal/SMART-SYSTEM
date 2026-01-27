
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Printer, 
  Filter, 
  BookOpen, 
  Plus, 
  X, 
  Save, 
  Trash2, 
  RotateCcw,
  Zap,
  Calculator,
  Languages,
  FlaskConical,
  Palette,
  Globe2,
  Settings2,
  ChevronRight,
  Info,
  Copy,
  ClipboardCheck,
  Layers,
  Check,
  MoreVertical,
  CopyPlus,
  Type
} from 'lucide-react';
import { TimetableEntry, KENYAN_CLASSES, SCHOOL_STREAMS } from '../types';
import { schoolService } from '../services/schoolService';
import { Language, translations } from '../services/localizationService';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
// Extended to 15:30 which ends at 16:10 (4:10 PM)
const TIME_SLOTS = ['08:00', '08:40', '09:20', '10:00', '10:30', '11:10', '11:50', '12:30', '13:30', '14:10', '14:50', '15:30'];

const SUBJECT_OPTIONS = [
  'Mathematics', 'English Language', 'Kiswahili', 'Integrated Science', 
  'Creative Arts', 'Pre-Technical Studies', 'Social Studies', 'P.E', 'R.E', 'Agriculture', 'Home Science',
  'Short Break', 'Lunch Break', 'Games & Clubs'
];

const TEACHER_OPTIONS = ['Tr. Maina', 'Tr. Wambui', 'Tr. Otieno', 'Tr. Achieng', 'Tr. Kioko', 'Tr. Mutua', '-'];

const getSubjectIcon = (subject: string) => {
  const s = subject.toLowerCase();
  if (s.includes('math')) return <Calculator className="w-4 h-4" />;
  if (s.includes('eng')) return <Languages className="w-4 h-4" />;
  if (s.includes('swa') || s.includes('kisw')) return <Globe2 className="w-4 h-4" />;
  if (s.includes('sci') || s.includes('phys')) return <FlaskConical className="w-4 h-4" />;
  if (s.includes('art') || s.includes('creat')) return <Palette className="w-4 h-4" />;
  if (s.includes('tech') || s.includes('comp')) return <Settings2 className="w-4 h-4" />;
  if (s.includes('break') || s.includes('lunch')) return <Clock className="w-4 h-4" />;
  return <BookOpen className="w-4 h-4" />;
};

export const TimetableModule: React.FC<{ lang: Language }> = ({ lang }) => {
  const t = translations[lang];
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [selectedClass, setSelectedClass] = useState('Grade 7');
  const [selectedStream, setSelectedStream] = useState('Eagle');
  const [activeDayView, setActiveDayView] = useState(DAYS[new Date().getDay() - 1] || 'Monday');
  
  // Interaction State
  const [editingSlot, setEditingSlot] = useState<{ day: string, time: string } | null>(null);
  const [formData, setFormData] = useState<Partial<TimetableEntry>>({});
  const [clipboard, setClipboard] = useState<Partial<TimetableEntry> | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showToast, setShowToast] = useState<string | null>(null);

  // Load data for custom class/stream
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    const key = `tt_v4_${selectedClass}_${selectedStream}`;
    const saved = localStorage.getItem(key);
    
    if (saved) {
      setEntries(JSON.parse(saved));
    } else {
      schoolService.getTimetable(`${selectedClass} ${selectedStream}`).then(setEntries);
    }
    return () => clearInterval(timer);
  }, [selectedClass, selectedStream]);

  const persist = (data: TimetableEntry[]) => {
    setEntries(data);
    localStorage.setItem(`tt_v4_${selectedClass}_${selectedStream}`, JSON.stringify(data));
  };

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3000);
  };

  const getEntry = (day: string, time: string) => entries.find(e => e.day === day && e.time === time);

  const isCurrentSlot = (day: string, time: string) => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    if (dayNames[currentTime.getDay()] !== day) return false;
    const [h, m] = time.split(':').map(Number);
    const start = new Date(currentTime); start.setHours(h, m, 0);
    const end = new Date(start); end.setMinutes(end.getMinutes() + 40);
    return currentTime >= start && currentTime < end;
  };

  const handleEditClick = (day: string, time: string) => {
    const existing = getEntry(day, time);
    setFormData(existing || (({ day, time, subject: 'Mathematics', teacher: 'Tr. Maina', category: 'STEM', room: 'Classroom 1' } as any) as Partial<TimetableEntry>));
    setEditingSlot({ day, time });
  };

  const saveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: TimetableEntry = {
      id: formData.id || `${formData.day}-${formData.time}-${Date.now()}`,
      day: formData.day!,
      time: formData.time!,
      subject: formData.subject!,
      teacher: formData.teacher || 'Unassigned',
      category: formData.category as any || 'STEM',
      room: formData.room || 'General'
    };
    const updated = entries.filter(e => !(e.day === formData.day && e.time === formData.time));
    persist([...updated, newEntry]);
    setEditingSlot(null);
    triggerToast("Schedule Updated");
  };

  const copySlot = (e: React.MouseEvent, entry: TimetableEntry) => {
    e.stopPropagation();
    setClipboard(entry);
    triggerToast(`Copied ${entry.subject}`);
  };

  const pasteSlot = (e: React.MouseEvent, day: string, time: string) => {
    e.stopPropagation();
    if (!clipboard) return;
    const newEntry: TimetableEntry = {
      ...clipboard,
      id: `${day}-${time}-${Date.now()}`,
      day,
      time
    } as TimetableEntry;
    const updated = entries.filter(e => !(e.day === day && e.time === time));
    persist([...updated, newEntry]);
    triggerToast(`Pasted to ${day}`);
  };

  const cloneDay = (fromDay: string, toDay: string) => {
    if (confirm(`Overwrite ${toDay}'s schedule with everything from ${fromDay}?`)) {
      const fromEntries = entries.filter(e => e.day === fromDay);
      const otherEntries = entries.filter(e => e.day !== toDay);
      const cloned = fromEntries.map(e => ({ 
        ...e, 
        id: `${toDay}-${e.time}-${Date.now()}`, 
        day: toDay 
      }));
      persist([...otherEntries, ...cloned]);
      triggerToast(`${toDay} synchronized with ${fromDay}`);
    }
  };

  const clearDay = (day: string) => {
    if (confirm(`Permanently clear all scheduled entries for ${day}?`)) {
      const updated = entries.filter(e => e.day !== day);
      persist(updated);
      triggerToast(`${day} schedule wiped`);
    }
  };

  const deleteSlot = () => {
    if (editingSlot) {
      const updated = entries.filter(e => !(e.day === editingSlot.day && e.time === editingSlot.time));
      persist(updated);
      setEditingSlot(null);
      triggerToast("Period cleared");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 relative">
      <datalist id="kenyan-classes">
        {KENYAN_CLASSES.map(c => <option key={c} value={c} />)}
      </datalist>
      <datalist id="school-streams">
        {SCHOOL_STREAMS.map(s => <option key={s} value={s} />)}
      </datalist>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[250] bg-gray-900 text-white px-8 py-4 rounded-3xl flex items-center gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-gray-800 animate-in slide-in-from-top-10 duration-500">
           <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <Check size={14} className="text-white" strokeWidth={4} />
           </div>
           <span className="text-[11px] font-black uppercase tracking-[0.2em]">{showToast}</span>
        </div>
      )}

      {/* Primary Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none italic">Master Timetable</h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-3 flex items-center gap-3">
             <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
             Full Scheduling Engine • 4:00 PM Extended
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 no-print">
          <div className="flex items-center bg-white p-1.5 rounded-[24px] shadow-sm border-2 border-gray-100 focus-within:border-blue-500 transition-colors">
             <div className="flex items-center px-3 gap-2 border-r border-gray-100">
                <Type size={14} className="text-gray-400" />
                <input 
                  list="kenyan-classes"
                  value={selectedClass}
                  placeholder="Class"
                  onChange={e => setSelectedClass(e.target.value)}
                  className="bg-transparent w-24 py-2 text-[10px] font-black uppercase tracking-widest border-none outline-none text-gray-900 placeholder:text-gray-300"
                />
             </div>
             <div className="flex items-center px-3 gap-2">
                <Layers size={14} className="text-gray-400" />
                <input 
                  list="school-streams"
                  value={selectedStream}
                  placeholder="Stream"
                  onChange={e => setSelectedStream(e.target.value)}
                  className="bg-transparent w-24 py-2 text-[10px] font-black uppercase tracking-widest border-none outline-none text-gray-900 placeholder:text-gray-300"
                />
             </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => { if(confirm("Reset this specific timetable to template?")) schoolService.getTimetable(`${selectedClass} ${selectedStream}`).then(persist); }} className="p-4 bg-white border-2 border-gray-100 rounded-[20px] text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm" title="Institutional Reset">
              <RotateCcw size={20} />
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-4 bg-gray-900 text-white px-8 py-4 rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-black transition-all active:scale-95 border-b-4 border-black">
              <Printer size={18} /> Print Template
            </button>
          </div>
        </div>
      </div>

      {/* Batch Actions & Mobile Nav */}
      <div className="bg-white p-4 rounded-[32px] border border-gray-100 shadow-xl no-print flex flex-col md:flex-row items-center gap-6">
         {/* Mobile Day Selector */}
         <div className="flex gap-2 xl:hidden w-full overflow-x-auto pb-2 snap-x">
            {DAYS.map(day => (
              <button 
                key={day} 
                onClick={() => setActiveDayView(day)}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap snap-start ${activeDayView === day ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400'}`}
              >
                {day}
              </button>
            ))}
         </div>

         <div className="flex flex-wrap items-center gap-4 w-full">
            <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100">
               <Layers size={18} className="text-blue-600" />
               <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Clone <span className="text-blue-600">{activeDayView}</span> To:</span>
            </div>
            <div className="flex gap-2">
              {DAYS.filter(d => d !== activeDayView).map(day => (
                <button 
                 key={day} 
                 onClick={() => cloneDay(activeDayView, day)} 
                 className="px-4 py-2 bg-white hover:bg-blue-600 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border-2 border-gray-50 hover:border-blue-500 shadow-sm"
                >
                  {day}
                </button>
              ))}
            </div>
            <div className="h-8 w-[1px] bg-gray-100 mx-2 hidden md:block"></div>
            <button 
              onClick={() => clearDay(activeDayView)}
              className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all group"
            >
              <Trash2 size={16} className="group-hover:rotate-12 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-widest">Clear {activeDayView}</span>
            </button>
         </div>

         {clipboard && (
            <div className="flex items-center gap-4 px-6 py-3 bg-green-50 rounded-2xl border-2 border-green-100 animate-pulse w-full md:w-auto">
               <ClipboardCheck size={20} className="text-green-600 shrink-0" />
               <div className="truncate">
                  <p className="text-[8px] font-black text-green-400 uppercase tracking-widest leading-none mb-1">Clipboard Ready</p>
                  <p className="text-[10px] font-black text-green-700 uppercase leading-none truncate">{clipboard.subject}</p>
               </div>
               <button onClick={() => setClipboard(null)} className="p-1.5 hover:bg-green-100 rounded-lg text-green-400 transition-colors ml-auto"><X size={14} /></button>
            </div>
         )}
      </div>

      {/* Main Timetable Grid */}
      <div className="bg-white rounded-[48px] border-2 border-gray-50 shadow-2xl overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-100">
                <th className="p-8 border-r-2 border-gray-100 w-32 text-[10px] font-black uppercase text-gray-400 tracking-[0.4em] text-center">Period</th>
                {DAYS.map(day => (
                  <th key={day} className={`p-8 border-r-2 border-gray-100 min-w-[220px] text-center transition-all ${activeDayView === day ? 'bg-blue-50' : 'hidden xl:table-cell'}`}>
                    <span className={`text-[12px] font-black uppercase tracking-[0.4em] ${activeDayView === day ? 'text-blue-900' : 'text-gray-400'}`}>{day}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((time) => (
                <tr key={time} className="border-b-2 border-gray-50 group hover:bg-gray-50/20 transition-colors">
                  <td className="p-8 border-r-2 border-gray-100 text-center">
                    <div className="text-[14px] font-black text-gray-900 tracking-tighter leading-none">{time}</div>
                    <div className="text-[8px] font-black text-gray-300 uppercase mt-2 tracking-widest">40 Min</div>
                  </td>
                  {DAYS.map(day => {
                    const entry = getEntry(day, time);
                    const isLive = isCurrentSlot(day, time);
                    const isBreak = entry?.category === 'Break';
                    
                    return (
                      <td 
                        key={`${day}-${time}`} 
                        onClick={() => handleEditClick(day, time)}
                        className={`p-2 border-r-2 border-gray-100 transition-all cursor-pointer relative ${activeDayView === day ? 'table-cell' : 'hidden xl:table-cell'}`}
                      >
                        {entry ? (
                          <div className={`h-full min-h-[110px] p-5 rounded-[32px] border-2 transition-all flex flex-col justify-between group/card overflow-hidden relative ${isBreak ? 'bg-gray-100 text-gray-400 border-gray-200 border-dashed opacity-70 shadow-inner' : 'bg-white text-gray-700 border-gray-100 hover:border-blue-500 hover:shadow-2xl hover:-translate-y-1 shadow-sm'} ${isLive ? 'ring-4 ring-blue-500/20 border-blue-400 shadow-2xl' : ''}`}>
                            {isLive && (
                              <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 text-white rounded-full text-[8px] font-black tracking-widest animate-bounce z-10 shadow-lg shadow-blue-500/30">
                                <Zap size={8} fill="white" className="animate-pulse" /> LIVE
                              </div>
                            )}
                            
                            <div className="relative z-0">
                               <div className="flex items-center gap-3 mb-2">
                                  <div className={`p-2 rounded-xl ${isBreak ? 'bg-gray-200 text-gray-400 shadow-inner' : 'bg-blue-50 text-blue-600 border border-white'}`}>
                                    {getSubjectIcon(entry.subject)}
                                  </div>
                                  <h4 className="font-black text-[13px] uppercase leading-tight tracking-tight truncate">{entry.subject}</h4>
                               </div>
                               {!isBreak && (
                                 <div className="flex items-center gap-2 mt-1 opacity-50">
                                    <User size={10} className="text-blue-500" />
                                    <span className="text-[9px] font-bold uppercase truncate tracking-widest">{entry.teacher}</span>
                                 </div>
                               )}
                            </div>

                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center gap-1 opacity-40">
                                 <MapPin size={10} />
                                 <span className="text-[9px] font-black uppercase tracking-widest">{entry.room || 'R1'}</span>
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover/card:opacity-100 transition-all translate-y-2 group-hover/card:translate-y-0 no-print">
                                <button 
                                  onClick={(e) => copySlot(e, entry)} 
                                  className="p-2 bg-white border-2 border-gray-50 hover:border-blue-200 rounded-xl shadow-sm text-gray-400 hover:text-blue-600 transition-all"
                                  title="Duplicate"
                                >
                                  <Copy size={12} />
                                </button>
                                <div className="p-2 bg-white rounded-xl shadow-sm text-gray-300">
                                  <Settings2 size={12} />
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full min-h-[110px] border-2 border-dashed border-gray-100 rounded-[32px] flex items-center justify-center group/empty transition-all hover:border-blue-200 hover:bg-blue-50/30">
                             {clipboard ? (
                               <button 
                                onClick={(e) => pasteSlot(e, day, time)}
                                className="flex flex-col items-center gap-3 text-blue-400 hover:text-blue-600 transition-all animate-in zoom-in"
                               >
                                 <div className="w-10 h-10 rounded-2xl bg-white shadow-xl flex items-center justify-center border-2 border-blue-50">
                                    <ClipboardCheck size={20} />
                                 </div>
                                 <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Paste</span>
                               </button>
                             ) : (
                               <div className="flex flex-col items-center gap-2 opacity-20 group-hover/empty:opacity-60 transition-opacity">
                                  <Plus size={20} className="text-gray-400" />
                                  <span className="text-[8px] font-black uppercase tracking-widest">Add Period</span>
                               </div>
                             )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Period Modal */}
      {editingSlot && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white rounded-[56px] w-full max-w-xl shadow-2xl relative overflow-hidden animate-in zoom-in duration-500 max-h-[95vh] flex flex-col border-8 border-gray-50">
              <div className="p-12 border-b bg-gray-50/50 flex items-center justify-between shrink-0">
                 <div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none italic">Configure Period</h2>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.4em] mt-4 flex items-center gap-2">
                       <Calendar size={12} className="text-blue-500" /> 
                       Editing {editingSlot.day} @ {editingSlot.time}
                    </p>
                 </div>
                 <button onClick={() => setEditingSlot(null)} className="p-5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all border-2 border-transparent hover:border-red-100 shadow-sm bg-white">
                    <X size={28} />
                 </button>
              </div>

              <form onSubmit={saveEntry} className="p-12 space-y-10 overflow-y-auto">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Destination Day</label>
                       <select 
                        value={formData.day} 
                        onChange={e => setFormData({...formData, day: e.target.value})}
                        className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl font-black uppercase text-xs focus:border-blue-500 outline-none transition-all shadow-inner"
                       >
                         {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                       </select>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Start Time</label>
                       <select 
                        value={formData.time} 
                        onChange={e => setFormData({...formData, time: e.target.value})}
                        className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl font-black uppercase text-xs focus:border-blue-500 outline-none transition-all shadow-inner"
                       >
                         {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                       </select>
                    </div>

                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Learning Area</label>
                       <select 
                        required 
                        value={formData.subject} 
                        onChange={e => setFormData({...formData, subject: e.target.value})}
                        className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl font-black text-gray-900 focus:border-blue-500 outline-none transition-all shadow-inner"
                       >
                         {SUBJECT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                       </select>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Assigned Teacher</label>
                       <select 
                        value={formData.teacher} 
                        onChange={e => setFormData({...formData, teacher: e.target.value})}
                        className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl font-bold text-gray-700 focus:border-blue-500 outline-none transition-all shadow-inner"
                       >
                         {TEACHER_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                       </select>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Classification</label>
                       <select 
                         value={formData.category} 
                         onChange={e => setFormData({...formData, category: e.target.value as any})}
                         className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl font-black uppercase text-[11px] focus:border-blue-500 outline-none transition-all shadow-inner"
                       >
                          <option value="STEM">STEM Field</option>
                          <option value="Languages">Languages & Comm</option>
                          <option value="Arts">Creative Arts & Sports</option>
                          <option value="Technical">Pre-Technical Studies</option>
                          <option value="Social">Humanities & Social</option>
                          <option value="Break">Institutional Recess</option>
                       </select>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Venue / Room</label>
                       <input 
                         placeholder="e.g. Science Lab B" 
                         value={formData.room} 
                         onChange={e => setFormData({...formData, room: e.target.value})}
                         className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl font-bold text-gray-700 focus:border-blue-500 outline-none transition-all shadow-inner"
                       />
                    </div>
                 </div>

                 <div className="p-8 bg-blue-50 rounded-[40px] border-2 border-blue-100 flex items-start gap-6">
                    <div className="p-3 bg-white rounded-2xl shadow-sm"><Info className="w-6 h-6 text-blue-500" /></div>
                    <p className="text-xs font-bold text-blue-900 italic leading-relaxed">
                      Updating this period affects the portal view for students and guardians. Ensure the assigned teacher is notified of the shift.
                    </p>
                 </div>

                 <div className="flex gap-4 pt-6 shrink-0">
                    <button type="button" onClick={deleteSlot} className="flex-1 py-6 bg-red-50 text-red-600 font-black uppercase tracking-widest rounded-[32px] hover:bg-red-100 transition-all flex items-center justify-center gap-3 border-2 border-red-100">
                       <Trash2 size={22} /> Remove Period
                    </button>
                    <button type="submit" className="flex-2 py-6 bg-blue-600 text-white font-black uppercase tracking-[0.2em] rounded-[32px] hover:bg-blue-700 transition-all shadow-2xl shadow-blue-100 flex items-center justify-center gap-4 active:scale-95 border-b-4 border-blue-800">
                       <Save size={22} /> Commit & Sync
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
