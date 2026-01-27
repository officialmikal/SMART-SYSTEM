
import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  ClipboardCheck, 
  Wallet, 
  ArrowLeft,
  FileBadge,
  Layers,
  Printer,
  Type,
  Search,
  Filter,
  GraduationCap,
  Users
} from 'lucide-react';
import { TranscriptModule } from './TranscriptModule';
import { Language, translations } from '../services/localizationService';
import { KENYAN_CLASSES, SCHOOL_STREAMS, Student } from '../types';

type ReportView = 'selection' | 'transcript' | 'attendance' | 'fees';
type ReportType = 'academic' | 'attendance' | 'finance';

interface Props {
  students?: Student[];
  schoolLogo: string | null;
  schoolConfig: any;
}

const ReportCard: React.FC<{ title: string; desc: string; icon: any; onClick: () => void; color: string; active?: boolean }> = ({ title, desc, icon: Icon, onClick, color, active }) => (
  <button onClick={onClick} className={`p-8 rounded-[40px] border-2 text-left transition-all hover:shadow-2xl group relative overflow-hidden bg-white ${active ? 'border-blue-500 shadow-xl' : 'border-gray-50'}`}>
    <div className={`p-4 rounded-2xl inline-flex mb-6 group-hover:scale-110 transition-transform ${color === 'indigo' ? 'bg-indigo-50 text-indigo-600' : color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600 shadow-sm border-2 border-white'}`}>
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-none mb-3">{title}</h3>
    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">{desc}</p>
    <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-125 transition-transform duration-700">
      <Icon size={120} />
    </div>
  </button>
);

export const ReportsModule: React.FC<Props & { lang: Language }> = ({ lang, students = [], schoolLogo, schoolConfig }) => {
  const t = translations[lang];
  const [view, setView] = useState<ReportView>('selection');
  const [reportType, setReportType] = useState<ReportType>('academic');
  const [selectedClass, setSelectedClass] = useState('Grade 7');
  const [selectedStream, setSelectedStream] = useState(''); // Default to empty (All Streams) to ensure students show up
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStudents = useMemo(() => {
    return (students || []).filter(s => {
      const matchesClass = s.class.toLowerCase() === selectedClass.toLowerCase();
      const matchesStream = selectedStream === '' || s.stream.toLowerCase() === selectedStream.toLowerCase();
      const matchesSearch = `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            s.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesClass && matchesStream && matchesSearch;
    });
  }, [students, selectedClass, selectedStream, searchQuery]);

  const openIndividualTranscript = (student: Student) => {
    setSelectedStudent(student);
    setView('transcript');
  };

  if (view === 'transcript' && selectedStudent) {
    return (
      <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
        <button onClick={() => setView('selection')} className="flex items-center gap-2 text-gray-900 font-black uppercase text-[10px] tracking-[0.3em] bg-white px-6 py-3 rounded-2xl border-2 border-gray-100 hover:border-blue-500 transition-all shadow-sm">
          <ArrowLeft className="w-5 h-5 text-blue-600" /> Back to Directory
        </button>
        <TranscriptModule student={selectedStudent} schoolLogo={schoolLogo} schoolConfig={schoolConfig} />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 animate-in fade-in duration-500">
      <datalist id="kenyan-classes-reports">
        {KENYAN_CLASSES.map(c => <option key={c} value={c} />)}
      </datalist>
      <datalist id="school-streams-reports">
        <option value="">All Streams</option>
        {SCHOOL_STREAMS.map(s => <option key={s} value={s} />)}
      </datalist>

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none italic">Insight Hub</h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-3 flex items-center gap-3">
             <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
             Report Generation • Official Records
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 no-print">
          <div className="flex items-center bg-white p-1.5 rounded-[24px] shadow-sm border-2 border-gray-50 focus-within:border-blue-500 transition-colors">
             <div className="flex items-center px-4 gap-2 border-r border-gray-100">
                <Type size={14} className="text-gray-400" />
                <input 
                  list="kenyan-classes-reports"
                  value={selectedClass}
                  placeholder="Class"
                  onChange={e => setSelectedClass(e.target.value)}
                  className="bg-transparent w-28 py-2 text-[10px] font-black uppercase tracking-widest border-none outline-none text-gray-900"
                />
             </div>
             <div className="flex items-center px-4 gap-2">
                <Layers size={14} className="text-gray-400" />
                <input 
                  list="school-streams-reports"
                  value={selectedStream}
                  placeholder="All Streams"
                  onChange={e => setSelectedStream(e.target.value)}
                  className="bg-transparent w-28 py-2 text-[10px] font-black uppercase tracking-widest border-none outline-none text-gray-900"
                />
             </div>
          </div>
          <button className="flex items-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-black transition-all border-b-4 border-black">
            <Layers className="w-4 h-4" /> Bulk Export
          </button>
        </div>
      </div>

      {view === 'selection' && (
        <div className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ReportCard 
              title="Transcripts" 
              desc="Generate official CBC individual report cards." 
              icon={FileBadge} 
              onClick={() => setReportType('academic')} 
              color="indigo" 
              active={reportType === 'academic'} 
            />
            <ReportCard 
              title="Attendance" 
              desc="Review longitudinal presence tracking history." 
              icon={ClipboardCheck} 
              onClick={() => setReportType('attendance')} 
              color="emerald" 
              active={reportType === 'attendance'} 
            />
            <ReportCard 
              title="Financials" 
              desc="Access detailed fee statements and balances." 
              icon={Wallet} 
              onClick={() => setReportType('finance')} 
              color="blue" 
              active={reportType === 'finance'} 
            />
          </div>

          <div className="bg-white rounded-[48px] border-2 border-gray-50 overflow-hidden shadow-2xl relative">
             <div className="p-10 border-b bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                   <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">Student Directory</h3>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">{selectedClass} {selectedStream || 'All Streams'} • {filteredStudents.length} Found</p>
                </div>
                <div className="relative w-full md:w-80">
                    <input 
                      type="text"
                      placeholder="Filter directory..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-100 rounded-[24px] focus:ring-8 focus:ring-blue-100 focus:border-blue-500 outline-none font-black text-[11px] uppercase shadow-inner"
                    />
                    <Filter className="absolute left-4 top-4 w-5 h-5 text-gray-300" />
                </div>
             </div>

             <div className="divide-y-2 divide-gray-50">
                {filteredStudents.map(student => (
                  <div key={student.id} className="p-8 flex flex-col sm:flex-row items-center justify-between hover:bg-blue-50/20 transition-all gap-6 group">
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[24px] bg-white border-2 border-gray-100 flex items-center justify-center font-black text-blue-600 shadow-sm group-hover:scale-110 transition-transform overflow-hidden">
                           {student.photo ? (
                             <img src={student.photo} className="w-full h-full object-cover" />
                           ) : (
                             <span className="text-xl">{student.firstName[0]}</span>
                           )}
                        </div>
                        <div>
                           <p className="font-black text-gray-900 text-xl tracking-tighter leading-none uppercase italic">{student.firstName} {student.lastName}</p>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">ADM: {student.admissionNumber} • {student.stream}</p>
                        </div>
                     </div>
                     <div className="flex gap-3">
                        <button 
                          onClick={() => openIndividualTranscript(student)} 
                          className="flex items-center gap-3 bg-white border-2 border-gray-100 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm"
                        >
                           <FileText className="w-5 h-5" /> {reportType === 'academic' ? 'Generate Card' : reportType === 'attendance' ? 'View Attendance' : 'Fee Statement'}
                        </button>
                        <button onClick={() => window.print()} className="p-3 bg-gray-900 text-white rounded-2xl hover:bg-black transition-all shadow-lg shadow-gray-200"><Printer className="w-5 h-5" /></button>
                     </div>
                  </div>
                ))}
                {filteredStudents.length === 0 && (
                  <div className="py-24 text-center">
                    <Search className="w-16 h-16 text-gray-100 mx-auto mb-6" />
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.4em] italic">No learners match your current filter.</p>
                    <button 
                      onClick={() => { setSelectedClass('Grade 7'); setSelectedStream(''); setSearchQuery(''); }}
                      className="mt-6 px-6 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
                    >
                      Reset Directory View
                    </button>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
