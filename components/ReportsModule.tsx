
import React, { useState } from 'react';
import { 
  FileText, 
  ClipboardCheck, 
  Wallet, 
  ArrowLeft,
  FileBadge,
  Filter,
  Loader2,
  Layers,
  Printer
} from 'lucide-react';
import { TranscriptModule } from './TranscriptModule';
import { schoolService, AttendanceRecord, FeeTransaction } from '../services/schoolService';
import { Language, translations } from '../services/localizationService';
import { KENYAN_CLASSES, Student } from '../types';
// @ts-ignore
import _html2pdf from 'html2pdf.js';

type ReportView = 'selection' | 'transcript' | 'attendance' | 'fees';

interface Props {
  students?: Student[]; // Made optional
}

const ReportCard: React.FC<{ title: string; desc: string; icon: any; onClick: () => void; color: string; active?: boolean }> = ({ title, desc, icon: Icon, onClick, color, active }) => (
  <button onClick={onClick} className={`p-6 rounded-3xl border-2 text-left transition-all hover:shadow-xl group bg-white ${active ? 'border-blue-500' : 'border-gray-50'}`}>
    <div className={`p-3 rounded-2xl inline-flex mb-4 group-hover:scale-110 transition-transform ${color === 'indigo' ? 'bg-indigo-50 text-indigo-600' : color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">{title}</h3>
    <p className="text-sm text-gray-500 font-medium leading-relaxed">{desc}</p>
  </button>
);

export const ReportsModule: React.FC<Props & { lang: Language }> = ({ lang, students = [] }) => {
  const [view, setView] = useState<ReportView>('selection');
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [feeData, setFeeData] = useState<FeeTransaction[]>([]);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [selectedClass, setSelectedClass] = useState('Grade 7');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Added defensive check for students array
  const filteredStudents = (students || []).filter(s => selectedClass === 'All Classes' || s.class === selectedClass);

  const openIndividualTranscript = (student: Student) => {
    setSelectedStudent(student);
    setView('transcript');
  };

  if (view === 'transcript' && selectedStudent) {
    return (
      <div className="space-y-6">
        <button onClick={() => setView('selection')} className="flex items-center text-blue-600 font-black uppercase text-xs tracking-widest"><ArrowLeft className="w-5 h-5 mr-2" /> Back</button>
        <TranscriptModule student={selectedStudent} />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight uppercase">Reporting Center</h1>
          <p className="text-gray-500 font-medium">Generate academic and financial insights.</p>
        </div>
        <div className="flex gap-3">
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="p-3 bg-white border-2 rounded-2xl text-xs font-black uppercase">
            <option>All Classes</option>
            {KENYAN_CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
          </select>
          <button className="flex items-center gap-3 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-xl shadow-blue-100">
            <Layers className="w-5 h-5" /> Bulk Export
          </button>
        </div>
      </div>

      {view === 'selection' && (
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ReportCard title="Transcripts" desc="Individual CBC report cards." icon={FileBadge} onClick={() => {}} color="indigo" active />
            <ReportCard title="Attendance" desc="Presence tracking history." icon={ClipboardCheck} onClick={() => setView('attendance')} color="emerald" />
            <ReportCard title="Financials" desc="Fee statements and balances." icon={Wallet} onClick={() => setView('fees')} color="blue" />
          </div>

          <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
             <div className="p-8 border-b bg-gray-50/50 flex items-center justify-between">
                <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Student Register ({selectedClass})</h3>
             </div>
             <div className="divide-y">
                {filteredStudents.map(student => (
                  <div key={student.id} className="p-6 flex items-center justify-between hover:bg-blue-50/20 transition-all">
                     <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center font-black text-blue-600 border">{student.firstName[0]}</div>
                        <div>
                           <p className="font-black text-gray-900 text-lg leading-tight">{student.firstName} {student.lastName}</p>
                           <p className="text-[10px] font-black text-gray-400 uppercase">{student.admissionNumber}</p>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => openIndividualTranscript(student)} className="flex items-center gap-2 bg-white border-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase text-gray-700 hover:border-blue-200 transition-all">
                           <FileText className="w-4 h-4 text-blue-500" /> View Card
                        </button>
                        <button onClick={() => window.print()} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Printer className="w-5 h-5" /></button>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
