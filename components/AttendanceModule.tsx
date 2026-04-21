
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  UserCheck, 
  UserX, 
  Clock, 
  Send, 
  FileSpreadsheet, 
  Printer, 
  Search, 
  Loader2, 
  CheckCircle2, 
  MoreHorizontal,
  FileText,
  Users
} from 'lucide-react';
import { smsService } from '../services/smsService';
import { schoolService } from '../services/schoolService';
import { Language, translations } from '../services/localizationService';
import { KENYAN_CLASSES, Student } from '../types';

interface AttendanceModuleProps {
  lang: Language;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
}

export const AttendanceModule: React.FC<AttendanceModuleProps> = ({ lang, students = [], setStudents }) => {
  const t = translations[lang];
  const today = new Date().toISOString().split('T')[0];
  
  // Selection criteria
  const [classSelected, setClassSelected] = useState('Grade 7');
  const [streamSelected, setStreamSelected] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Tracking statuses for the active group
  // We initialize from existing student data if marked today
  const [markedStatuses, setMarkedStatuses] = useState<Record<string, string>>({});
  
  const [sendSMS, setSendSMS] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Streams
  const availableStreams = useMemo(() => {
    const streams = new Set(students.map(s => s.stream).filter(Boolean));
    return Array.from(streams).sort();
  }, [students]);

  // Load existing attendance for today
  useEffect(() => {
    const next: Record<string, string> = {};
    students.forEach(s => {
      const todayRecord = s.attendance?.find(a => a.date === today);
      if (todayRecord) {
        next[s.id] = todayRecord.status;
      }
    });
    setMarkedStatuses(next);
  }, [students, today]);

  // Filter students based on Class and Stream
  const filteredStudents = useMemo(() => {
    return (students || []).filter(s => {
      const matchesClass = s.class.toLowerCase() === classSelected.toLowerCase();
      const matchesStream = streamSelected === '' || s.stream.toLowerCase() === streamSelected.toLowerCase();
      const matchesSearch = s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            s.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesClass && matchesStream && matchesSearch;
    });
  }, [students, classSelected, streamSelected, searchQuery]);

  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let unmarked = 0;

    filteredStudents.forEach(s => {
      const status = markedStatuses[s.id];
      if (status === 'present') present++;
      else if (status === 'absent') absent++;
      else if (status === 'late') late++;
      else unmarked++;
    });

    return { present, absent, late, unmarked, total: filteredStudents.length };
  }, [filteredStudents, markedStatuses]);

  const updateStatus = (id: string, newStatus: string) => {
    setMarkedStatuses(prev => ({ ...prev, [id]: newStatus }));
  };

  const setBulkStatus = (status: 'present' | 'absent') => {
    const next: Record<string, string> = { ...markedStatuses };
    filteredStudents.forEach(s => {
      next[s.id] = status;
    });
    setMarkedStatuses(next);
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Admission No', 'Status', 'Date'];
    const date = new Date().toLocaleDateString();
    const rows = filteredStudents.map(s => [
      `${s.firstName} ${s.lastName}`, 
      s.admissionNumber, 
      markedStatuses[s.id] || 'present', 
      date
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendance_${classSelected}_${streamSelected || 'All'}_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async () => {
    if (filteredStudents.length === 0) {
      alert("No students matching current filters to mark.");
      return;
    }

    const unmarkedCount = stats.unmarked;
    if (unmarkedCount > 0) {
      if (!confirm(`CAUTION: ${unmarkedCount} learners have not been marked. Proceeding will save the current ledger state. Continue?`)) return;
    }

    setIsSubmitting(true);
    try {
      const records = filteredStudents.map(s => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        status: markedStatuses[s.id] || 'present', // fallback to present on finalization if not touched
        phone: s.guardianPhone
      }));

      // Update Local State for Students
      setStudents(prev => prev.map(student => {
        const mark = records.find(r => r.id === student.id);
        if (mark) {
          const attendance = student.attendance || [];
          const filtered = attendance.filter(a => a.date !== today);
          return {
            ...student,
            attendance: [...filtered, { date: today, status: mark.status as any }]
          };
        }
        return student;
      }));

      await schoolService.saveAttendance(`${classSelected} ${streamSelected}`, records);
      
      if (sendSMS) {
        const absents = records.filter(r => r.status === 'absent');
        if (absents.length > 0) {
          await smsService.sendBulkAbsenceAlerts(absents.map(a => ({ name: a.name, phone: a.phone })));
        }
      }
      alert(`Institutional Ledger Updated: Attendance for ${records.length} learners for ${today} has been committed.`);
    } catch (error) {
      console.error(error);
      alert('Failed to save attendance.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">{t.attendance}</h1>
          <p className="text-gray-500 font-medium">Daily register for {classSelected} {streamSelected || '(All Streams)'}.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleExportCSV}
            className="flex items-center space-x-2 bg-white border-2 border-gray-100 px-5 py-2.5 rounded-xl hover:bg-gray-50 transition font-black text-[10px] uppercase tracking-widest text-gray-600 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center space-x-2 bg-white border-2 border-gray-100 px-5 py-2.5 rounded-xl hover:bg-gray-50 transition font-black text-[10px] uppercase tracking-widest text-gray-600 shadow-sm"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>Print List</span>
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center space-x-2 bg-blue-600 text-white px-8 py-3 rounded-2xl hover:bg-blue-700 font-black uppercase text-xs tracking-widest transition shadow-xl shadow-blue-100 disabled:opacity-50 active:scale-95"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{isSubmitting ? 'Processing...' : 'Finalize Ledger'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Controls Panel */}
        <div className="md:col-span-1 space-y-6 no-print">
          <div className="bg-white p-6 rounded-[32px] border-2 border-gray-50 shadow-sm space-y-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Target Class</label>
              <select 
                value={classSelected} 
                onChange={(e) => setClassSelected(e.target.value)}
                className="w-full p-3.5 border-2 border-gray-100 rounded-2xl bg-gray-50 font-black text-xs uppercase focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-inner"
              >
                {KENYAN_CLASSES.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Target Stream (Dynamic)</label>
              <div className="flex items-center bg-gray-50 border-2 border-gray-100 rounded-2xl focus-within:border-blue-500 transition-all px-4 py-1 shadow-inner">
                <input 
                  list="school-streams-attendance"
                  placeholder="All Streams"
                  value={streamSelected} 
                  onChange={(e) => setStreamSelected(e.target.value)}
                  className="w-full bg-transparent py-2.5 font-black uppercase text-[11px] outline-none placeholder:text-gray-300"
                />
                <datalist id="school-streams-attendance">
                  {availableStreams.map(s => <option key={s} value={s}>{s}</option>)}
                </datalist>
              </div>
            </div>

            <div className="pt-4 border-t space-y-3">
               <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Bulk Marking</label>
               <div className="grid grid-cols-1 gap-2">
                 <button 
                   onClick={() => setBulkStatus('present')}
                   className="w-full py-3 bg-green-50 text-green-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-green-100 transition border border-green-100"
                 >
                   All Present
                 </button>
                 <button 
                   onClick={() => setBulkStatus('absent')}
                   className="w-full py-3 bg-red-50 text-red-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition border border-red-100"
                 >
                   All Absent
                 </button>
               </div>
            </div>
            
            <div className="pt-4 border-t">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${sendSMS ? 'bg-green-600' : 'bg-gray-300'}`}>
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={sendSMS}
                    onChange={(e) => setSendSMS(e.target.checked)} 
                  />
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${sendSMS ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
                <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">{t.sms_alerts}</span>
              </label>
              <p className="text-[10px] text-gray-400 mt-3 font-bold italic leading-relaxed uppercase tracking-tighter">Absentee notifications will be dispatched to guardians via Africa's Talking Gateway.</p>
            </div>
          </div>

          <div className="bg-blue-900 p-8 rounded-[40px] text-white shadow-2xl shadow-blue-200 relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="text-[10px] font-black uppercase opacity-50 tracking-widest mb-2">Live Session Presence</h4>
              <div className="text-5xl font-black tracking-tighter mb-6">
                {(stats.total - stats.unmarked)} <span className="text-2xl opacity-40">/ {stats.total} Marked</span>
              </div>
              <div className="space-y-3">
                <div className="h-3 w-full bg-blue-800/50 rounded-full overflow-hidden border border-blue-700/50">
                  <div 
                    className="h-full bg-green-400 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(74,222,128,0.5)]" 
                    style={{ width: `${stats.total > 0 ? ((stats.total - stats.unmarked) / stats.total) * 100 : 0}%` }}
                  ></div>
                </div>
                <div className="grid grid-cols-4 text-[8px] font-black uppercase tracking-tighter gap-1">
                  <div className="text-green-300 bg-white/5 px-1 py-1 rounded-lg text-center truncate">{stats.present} Presence</div>
                  <div className="text-red-300 bg-white/5 px-1 py-1 rounded-lg text-center truncate">{stats.absent} Absence</div>
                  <div className="text-amber-300 bg-white/5 px-1 py-1 rounded-lg text-center truncate">{stats.late} Tardy</div>
                  <div className="text-blue-200 bg-white/10 px-1 py-1 rounded-lg text-center truncate">{stats.unmarked} Unmarked</div>
                </div>
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
               <UserCheck size={160} />
            </div>
          </div>
        </div>

        {/* Student List */}
        <div className="md:col-span-3 space-y-4">
          <div className="bg-white rounded-[40px] border-2 border-gray-50 shadow-xl overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search current list..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-inner"
                />
              </div>
              <div className="flex items-center space-x-3 px-4 py-2.5 bg-white border-2 border-gray-100 rounded-2xl text-[10px] font-black text-gray-500 uppercase tracking-widest shadow-sm">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>{new Date().toDateString()}</span>
              </div>
            </div>

            <div className="divide-y-2 divide-gray-50 overflow-y-auto max-h-[700px]">
              {filteredStudents.map((student) => {
                const status = markedStatuses[student.id]; // undefined if not marked
                const isMarked = !!status;
                
                return (
                  <div key={student.id} className={`p-6 flex flex-col sm:flex-row sm:items-center justify-between transition-all gap-4 group ${isMarked ? 'bg-white hover:bg-blue-50/20' : 'bg-gray-50/30'}`}>
                    <div className="flex items-center space-x-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black uppercase border-2 shadow-sm transition-all overflow-hidden ${
                        status === 'present' ? 'bg-white text-green-600 border-green-100 shadow-green-100' : 
                        status === 'absent' ? 'bg-white text-red-600 border-red-100 shadow-red-100' : 
                        status === 'late' ? 'bg-white text-amber-600 border-amber-100 shadow-amber-100' :
                        'bg-gray-100 text-gray-300 border-gray-200 shadow-inner'
                      }`}>
                        {student.photo ? (
                          <img src={student.photo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="text-xl">{student.firstName[0]}</span>
                        )}
                      </div>
                      <div>
                        <div className={`font-black text-lg tracking-tight leading-none ${isMarked ? 'text-gray-900' : 'text-gray-400'}`}>{student.firstName} {student.lastName}</div>
                        <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">{student.admissionNumber} • {student.stream} • {student.gender}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center bg-gray-50 p-1.5 rounded-[20px] no-print border-2 border-gray-100 shadow-inner">
                      {[
                        { id: 'present', label: t.present, icon: UserCheck, color: 'text-green-600', activeBg: 'bg-white shadow-lg border-green-100' },
                        { id: 'late', label: t.late, icon: Clock, color: 'text-amber-600', activeBg: 'bg-white shadow-lg border-amber-100' },
                        { id: 'absent', label: t.absent, icon: UserX, color: 'text-red-600', activeBg: 'bg-white shadow-lg border-red-100' }
                      ].map(s => {
                        const Icon = s.icon;
                        const isActive = status === s.id;
                        return (
                          <button 
                            key={s.id}
                            onClick={() => updateStatus(student.id, s.id)}
                            className={`
                              flex items-center gap-2 px-5 py-2.5 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all border-2
                              ${isActive ? `${s.activeBg} ${s.color}` : 'text-gray-400 border-transparent hover:text-gray-600'}
                            `}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{s.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Print Only Status */}
                    <div className="hidden print-only font-black text-[10px] uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-lg">
                      {status}
                    </div>
                  </div>
                );
              })}
              {filteredStudents.length === 0 && (
                <div className="py-32 text-center">
                  <Users className="w-16 h-16 text-gray-100 mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 italic">No learners found in {classSelected} {streamSelected}</p>
                  <button onClick={() => { setClassSelected('Grade 7'); setStreamSelected(''); }} className="mt-6 text-blue-600 font-black uppercase text-[9px] tracking-widest border-b-2 border-blue-600 hover:text-blue-700 transition-colors">Reset Marking Target</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Print Footer */}
      <div className="hidden print-only mt-20 pt-10 border-t-4 border-blue-900 flex justify-between items-end px-10">
         <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-900">System Certified Ledger</p>
            <p className="text-[8px] font-medium text-gray-400 italic">Generated by ElimuSmart Cloud SMS Engine</p>
         </div>
         <div className="text-center">
            <div className="w-64 h-[1px] bg-gray-300 mb-2"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-900">Official Seal & Signature</p>
         </div>
      </div>
    </div>
  );
};
