
import React, { useState } from 'react';
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
  FileText
} from 'lucide-react';
import { smsService } from '../services/smsService';
import { schoolService } from '../services/schoolService';
import { Language, translations } from '../services/localizationService';
import { KENYAN_CLASSES, SCHOOL_STREAMS } from '../types';

const MOCK_ATTENDANCE_STUDENTS = [
  { id: '1', name: 'Kamau Njoroge', adm: 'ADM001', status: 'present', phone: '0711111111' },
  { id: '2', name: 'Amara Kiprono', adm: 'ADM002', status: 'absent', phone: '0722222222' },
  { id: '3', name: 'Zuri Achieng', adm: 'ADM003', status: 'present', phone: '0733333333' },
  { id: '4', name: 'Sifa Otieno', adm: 'ADM004', status: 'present', phone: '0744444444' },
  { id: '5', name: 'Baraka Ali', adm: 'ADM005', status: 'late', phone: '0755555555' },
  { id: '6', name: 'Mwikali Musyoka', adm: 'ADM006', status: 'present', phone: '0766666666' },
  { id: '7', name: 'Jabari Omondi', adm: 'ADM007', status: 'absent', phone: '0777777777' },
];

export const AttendanceModule: React.FC<{ lang: Language }> = ({ lang }) => {
  const t = translations[lang];
  const [attendance, setAttendance] = useState(MOCK_ATTENDANCE_STUDENTS);
  const [classSelected, setClassSelected] = useState('Grade 7');
  const [streamSelected, setStreamSelected] = useState('Oak');
  const [sendSMS, setSendSMS] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const updateStatus = (id: string, newStatus: string) => {
    setAttendance(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
  };

  const setBulkStatus = (status: 'present' | 'absent') => {
    setAttendance(prev => prev.map(s => ({ ...s, status })));
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Admission No', 'Status', 'Date'];
    const date = new Date().toLocaleDateString();
    const rows = attendance.map(s => [s.name, s.adm, s.status, date]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendance_${classSelected}_${streamSelected}_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await schoolService.saveAttendance(`${classSelected} ${streamSelected}`, attendance);
      
      if (sendSMS) {
        const absents = attendance.filter(s => s.status === 'absent');
        if (absents.length > 0) {
          await smsService.sendBulkAbsenceAlerts(absents.map(a => ({ name: a.name, phone: a.phone })));
        }
      }
      alert('Attendance records submitted successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to save attendance.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStudents = attendance.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.adm.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    present: attendance.filter(s => s.status === 'present').length,
    absent: attendance.filter(s => s.status === 'absent').length,
    late: attendance.filter(s => s.status === 'late').length,
    total: attendance.length
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">{t.attendance}</h1>
          <p className="text-gray-500">Daily roll call for {classSelected} {streamSelected}.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleExportCSV}
            className="flex items-center space-x-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition font-bold text-sm text-gray-700"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>CSV</span>
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center space-x-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition font-bold text-sm text-gray-700"
          >
            <Printer className="w-4 h-4" />
            <span>PDF</span>
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-bold transition shadow-lg disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{isSubmitting ? 'Submitting...' : 'Finalize Attendance'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Controls Panel */}
        <div className="md:col-span-1 space-y-6 no-print">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Class Selection</label>
              <div className="grid grid-cols-1 gap-2">
                <select 
                  value={classSelected} 
                  onChange={(e) => setClassSelected(e.target.value)}
                  className="w-full p-2.5 border rounded-lg bg-gray-50 font-bold focus:ring-2 focus:ring-blue-500"
                >
                  {KENYAN_CLASSES.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
                <select 
                  value={streamSelected} 
                  onChange={(e) => setStreamSelected(e.target.value)}
                  className="w-full p-2.5 border rounded-lg bg-gray-50 font-bold focus:ring-2 focus:ring-blue-500"
                >
                  {SCHOOL_STREAMS.map(stream => (
                    <option key={stream} value={stream}>{stream}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t space-y-3">
               <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Bulk Marking</label>
               <div className="flex flex-col gap-2">
                 <button 
                   onClick={() => setBulkStatus('present')}
                   className="w-full py-2 bg-green-50 text-green-700 rounded-lg text-sm font-bold hover:bg-green-100 transition"
                 >
                   {t.mark_all_present}
                 </button>
                 <button 
                   onClick={() => setBulkStatus('absent')}
                   className="w-full py-2 bg-red-50 text-red-700 rounded-lg text-sm font-bold hover:bg-red-100 transition"
                 >
                   {t.mark_all_absent}
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
                <span className="text-sm font-black text-gray-700 uppercase tracking-tighter">{t.sms_alerts}</span>
              </label>
              <p className="text-[10px] text-gray-500 mt-2 font-medium italic">{t.absent_alert}</p>
            </div>
          </div>

          <div className="bg-blue-900 p-6 rounded-xl text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="text-[10px] font-black uppercase opacity-70 tracking-widest mb-1">Today's Presence</h4>
              <div className="text-4xl font-black mb-4">{stats.present} <span className="text-xl opacity-60">/ {stats.total}</span></div>
              <div className="space-y-2">
                <div className="h-1.5 w-full bg-blue-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-1000" 
                    style={{ width: `${(stats.present / stats.total) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                  <span className="text-green-300">{stats.present} Present</span>
                  <span className="text-red-300">{stats.absent} Absent</span>
                  <span className="text-amber-300">{stats.late} Late</span>
                </div>
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
               <UserCheck className="w-32 h-32" />
            </div>
          </div>
        </div>

        {/* Student List */}
        <div className="md:col-span-3 space-y-4">
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder={t.search} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex items-center space-x-2 text-xs font-bold text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>{new Date().toDateString()}</span>
              </div>
            </div>

            <div className="divide-y overflow-y-auto max-h-[600px]">
              {filteredStudents.map((student) => (
                <div key={student.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition gap-4">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black uppercase border-2 shadow-sm ${
                      student.status === 'present' ? 'bg-green-50 text-green-600 border-green-100' : 
                      student.status === 'absent' ? 'bg-red-50 text-red-600 border-red-100' : 
                      'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {student.name[0]}
                    </div>
                    <div>
                      <div className="font-black text-gray-900">{student.name}</div>
                      <div className="text-[10px] text-gray-500 font-mono tracking-tighter uppercase">{student.adm} • {student.phone}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center bg-gray-100 p-1 rounded-xl no-print">
                    {[
                      { id: 'present', label: t.present, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-100' },
                      { id: 'late', label: t.late, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
                      { id: 'absent', label: t.absent, icon: UserX, color: 'text-red-600', bg: 'bg-red-100' }
                    ].map(status => (
                      <button 
                        key={status.id}
                        onClick={() => updateStatus(student.id, status.id)}
                        className={`
                          flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
                          ${student.status === status.id ? `${status.bg} ${status.color} shadow-sm ring-1 ring-white` : 'text-gray-400 hover:text-gray-600'}
                        `}
                      >
                        <status.icon className="w-3 h-3" />
                        <span className="hidden sm:inline">{status.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Print Only Status */}
                  <div className="hidden print-only font-bold text-sm uppercase">
                    {student.status}
                  </div>
                </div>
              ))}
              {filteredStudents.length === 0 && (
                <div className="py-20 text-center text-gray-400">
                  <UserX className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p className="font-bold">No students found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Print Footer */}
      <div className="hidden print-only mt-10 pt-10 border-t border-gray-200">
         <div className="flex justify-between text-xs font-bold text-gray-500">
            <div>Generated by ElimuSmart Cloud SMS</div>
            <div>Sign: __________________________</div>
         </div>
      </div>
    </div>
  );
};
