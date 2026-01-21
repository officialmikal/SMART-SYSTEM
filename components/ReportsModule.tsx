
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  ClipboardCheck, 
  Wallet, 
  ChevronRight, 
  Download, 
  Printer, 
  Search,
  ArrowLeft,
  FileSpreadsheet,
  FileBadge,
  Filter,
  Loader2,
  Layers
} from 'lucide-react';
import { TranscriptModule } from './TranscriptModule';
import { schoolService, AttendanceRecord, FeeTransaction } from '../services/schoolService';
import { Language, translations } from '../services/localizationService';
import { KENYAN_CLASSES, Student } from '../types';
// @ts-ignore
import _html2pdf from 'html2pdf.js';

type ReportView = 'selection' | 'transcript' | 'attendance' | 'fees';

const MOCK_STUDENTS_LIST: Student[] = [
  { id: 's1', admissionNumber: 'ADM/2024/048', firstName: 'Juma', lastName: 'Kipruto', class: 'Grade 7', stream: 'Eagle', gender: 'Male', dob: '2012-05-14', guardianPhone: '0711222333', guardianName: 'Robert Kipruto', feeBalance: 0 },
  { id: 's2', admissionNumber: 'ADM/2024/001', firstName: 'Sarah', lastName: 'Njeri', class: 'Grade 7', stream: 'Oak', gender: 'Female', dob: '2012-08-20', guardianPhone: '0722111444', guardianName: 'Grace Njeri', feeBalance: 1500 },
  { id: 's3', admissionNumber: 'ADM/2024/002', firstName: 'Kamau', lastName: 'Njoroge', class: 'Grade 7', stream: 'Oak', gender: 'Male', dob: '2011-04-12', guardianPhone: '0712345678', guardianName: 'Sarah Njoroge', feeBalance: 12500 },
  { id: 's4', admissionNumber: 'ADM/2024/105', firstName: 'Zuri', lastName: 'Achieng', class: 'Grade 4', stream: 'Willow', gender: 'Female', dob: '2014-01-05', guardianPhone: '0788999888', guardianName: 'Grace Achieng', feeBalance: 4500 },
];

// Helper component for report types to fix "Cannot find name 'ReportCard'" errors.
const ReportCard: React.FC<{ 
  title: string; 
  desc: string; 
  icon: any; 
  onClick: () => void; 
  color: string; 
  active?: boolean 
}> = ({ title, desc, icon: Icon, onClick, color, active }) => {
  const colorClasses: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
  };

  return (
    <button 
      onClick={onClick}
      className={`p-6 rounded-3xl border-2 text-left transition-all hover:shadow-xl group ${active ? 'border-blue-500 bg-white' : 'border-gray-50 bg-white'}`}
    >
      <div className={`p-3 rounded-2xl inline-flex mb-4 group-hover:scale-110 transition-transform ${colorClasses[color] || colorClasses.blue}`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">{title}</h3>
      <p className="text-sm text-gray-500 font-medium leading-relaxed">{desc}</p>
    </button>
  );
};

export const ReportsModule: React.FC<{ lang: Language }> = ({ lang }) => {
  const t = translations[lang];
  const [view, setView] = useState<ReportView>('selection');
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [feeData, setFeeData] = useState<FeeTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [selectedClass, setSelectedClass] = useState('Grade 7');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const filteredStudents = MOCK_STUDENTS_LIST.filter(s => 
    selectedClass === 'All Classes' || s.class === selectedClass
  );

  const getHtml2Pdf = () => {
    if (typeof _html2pdf === 'function') return _html2pdf;
    if ((_html2pdf as any)?.default && typeof (_html2pdf as any).default === 'function') return (_html2pdf as any).default;
    if (typeof (window as any).html2pdf === 'function') return (window as any).html2pdf;
    return null;
  };

  const handleBulkDownload = async () => {
    if (filteredStudents.length === 0) return;
    setIsPdfGenerating(true);
    
    const element = document.getElementById('bulk-transcripts-container');
    if (!element) {
      setIsPdfGenerating(false);
      return;
    }

    const filename = `Report_Cards_${selectedClass.replace(/\s+/g, '_')}.pdf`;
    const html2pdf = getHtml2Pdf();

    if (!html2pdf) {
      window.print();
      setIsPdfGenerating(false);
      return;
    }

    const opt = {
      margin: 0.2,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 1.2, 
        useCORS: true, 
        logging: false 
      },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'avoid-all', after: '.bulk-page' }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Bulk generation failed:', error);
      window.print();
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const openIndividualTranscript = (student: Student) => {
    setSelectedStudent(student);
    setView('transcript');
  };

  if (view === 'transcript' && selectedStudent) {
    return (
      <div className="space-y-6">
        <button 
          onClick={() => setView('selection')} 
          className="no-print flex items-center text-blue-600 font-black uppercase text-xs tracking-widest hover:gap-2 transition-all"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Reporting Center
        </button>
        <TranscriptModule student={selectedStudent} />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight uppercase">Academic Reporting</h1>
          <p className="text-gray-500 font-medium">Generate report cards and academic transcripts.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <select 
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="appearance-none pl-10 pr-12 py-3 bg-white border-2 border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-700 focus:ring-4 focus:ring-blue-100 outline-none shadow-sm transition-all"
            >
              <option>All Classes</option>
              {KENYAN_CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
            </select>
            <Filter className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400 pointer-events-none" />
          </div>
          <button 
            onClick={handleBulkDownload}
            disabled={isPdfGenerating || filteredStudents.length === 0}
            className="flex items-center gap-3 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xl shadow-blue-100"
          >
            {isPdfGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Layers className="w-5 h-5" />}
            Bulk Export {selectedClass}
          </button>
        </div>
      </div>

      {view === 'selection' && (
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
            <ReportCard 
              title="Individual Cards" 
              desc="Detailed report cards with CBC ratings."
              icon={FileBadge}
              onClick={() => {}}
              color="indigo"
              active={true}
            />
            <ReportCard 
              title="Attendance Records" 
              desc="Class presence and engagement history."
              icon={ClipboardCheck}
              onClick={async () => {
                setIsLoading(true);
                const data = await schoolService.getAttendanceHistory('s1');
                setAttendanceData(data);
                setIsLoading(false);
                setView('attendance');
              }}
              color="emerald"
            />
            <ReportCard 
              title="Fee Summaries" 
              desc="Institutional billing and arrears tracking."
              icon={Wallet}
              onClick={async () => {
                setIsLoading(true);
                const data = await schoolService.getFeeStatement('s1');
                setFeeData(data);
                setIsLoading(false);
                setView('fees');
              }}
              color="blue"
            />
          </div>

          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden no-print">
             <div className="p-8 border-b bg-gray-50/50 flex items-center justify-between">
                <div>
                   <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Learner Directory ({selectedClass})</h3>
                </div>
             </div>
             <div className="divide-y">
                {filteredStudents.map(student => (
                  <div key={student.id} className="p-6 flex items-center justify-between hover:bg-blue-50/20 transition-all group">
                     <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center font-black text-xl text-blue-600 border border-blue-100">
                           {student.firstName[0]}
                        </div>
                        <div>
                           <p className="font-black text-gray-900 text-lg leading-tight">{student.firstName} {student.lastName}</p>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{student.admissionNumber} • {student.stream}</p>
                        </div>
                     </div>
                     <div className="flex gap-3">
                        <button 
                          onClick={() => openIndividualTranscript(student)}
                          className="flex items-center gap-2 bg-white border-2 border-gray-100 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-700 hover:border-blue-200 transition-all shadow-sm"
                        >
                           <FileText className="w-4 h-4 text-blue-500" /> View Card
                        </button>
                        <button 
                          onClick={() => { setSelectedStudent(student); setTimeout(() => window.print(), 100); }}
                          className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100"
                        >
                           <Printer className="w-5 h-5" />
                        </button>
                     </div>
                  </div>
                ))}
                {filteredStudents.length === 0 && (
                   <div className="p-24 text-center">
                      <p className="text-gray-400 font-bold italic uppercase tracking-widest text-xs">No learners found in this class.</p>
                   </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* Bulk Rendering Stage */}
      <div id="bulk-transcripts-container" className="offscreen-template" style={{ width: '210mm' }}>
        {filteredStudents.map(student => (
          <div key={student.id} className="bulk-page" style={{ pageBreakAfter: 'always', padding: '20px', background: 'white' }}>
            <TranscriptModule student={student} hideControls />
          </div>
        ))}
      </div>

      {view === 'attendance' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="no-print flex items-center justify-between">
            <button onClick={() => setView('selection')} className="flex items-center text-blue-600 font-black uppercase text-xs tracking-widest"><ArrowLeft className="w-4 h-4 mr-2" /> Back</button>
            <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black uppercase text-xs shadow-lg transition-all"><Printer className="w-4 h-4 inline mr-2" /> Print Report</button>
          </div>
          <div className="bg-white rounded-3xl shadow-sm border p-12">
            <h2 className="text-4xl font-black text-gray-900 uppercase text-center mb-8 border-b-4 border-gray-900 pb-8">Student Attendance Report</h2>
            <table className="w-full text-left">
              <thead><tr className="bg-gray-50 border-b text-[10px] font-black uppercase text-gray-400 tracking-widest"><th className="px-8 py-5">Session Date</th><th className="px-8 py-5">Presence Status</th><th className="px-8 py-5">Remarks</th></tr></thead>
              <tbody className="divide-y">{attendanceData.map((rec, i) => (<tr key={i} className="hover:bg-gray-50/50"><td className="px-8 py-5 font-black text-gray-800 text-lg">{rec.date}</td><td className="px-8 py-5"><span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${rec.status === 'Present' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{rec.status}</span></td><td className="px-8 py-5 text-gray-500 italic font-medium">{rec.remarks || 'Normal'}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'fees' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="no-print flex items-center justify-between">
            <button onClick={() => setView('selection')} className="flex items-center text-blue-600 font-black uppercase text-xs tracking-widest"><ArrowLeft className="w-4 h-4 mr-2" /> Back</button>
            <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black uppercase text-xs shadow-lg transition-all"><Printer className="w-4 h-4 inline mr-2" /> Print Statement</button>
          </div>
          <div className="bg-white rounded-3xl shadow-sm border p-12">
            <h2 className="text-4xl font-black text-blue-900 uppercase text-center mb-12 border-b-4 border-blue-900 pb-10">Fee Statement</h2>
            <table className="w-full text-left">
              <thead className="border-b-4 border-blue-900"><tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest"><th className="py-6 px-4">Post Date</th><th className="py-6 px-4">Particulars</th><th className="py-6 px-4 text-right">Debit</th><th className="py-6 px-4 text-right">Credit</th><th className="py-6 px-4 text-right">Net</th></tr></thead>
              <tbody className="text-sm font-medium">{feeData.map((tx, i) => (<tr key={i} className="border-b hover:bg-gray-50/50 transition-colors"><td className="py-6 px-4 font-mono text-xs text-gray-500">{tx.date}</td><td className="py-6 px-4 font-black text-gray-900">{tx.description}</td><td className="py-6 px-4 text-right text-red-600 font-black">{tx.type === 'Debit' ? tx.amount.toLocaleString() : '-'}</td><td className="py-6 px-4 text-right text-green-600 font-black">{tx.type === 'Credit' ? tx.amount.toLocaleString() : '-'}</td><td className="py-6 px-4 text-right font-black text-gray-900 text-lg">KES {tx.balance.toLocaleString()}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
