
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  ChevronRight, 
  Save, 
  Wand2, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Filter,
  ArrowLeft,
  BookMarked,
  Trash2,
  Edit3,
  X,
  Tags,
  CalendarDays,
  LayoutGrid,
  Type,
  Layers,
  GraduationCap,
  UserX
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { Exam, MarkEntry, CBCGrade, KENYAN_CLASSES, SCHOOL_STREAMS, Student, ExamResult } from '../types';
import { schoolService } from '../services/schoolService';
import { Language, translations } from '../services/localizationService';

interface Subject {
  id: string;
  name: string;
  category: string;
  gradeRange: string;
}

const INITIAL_SUBJECTS: Subject[] = [
  { id: 'sub1', name: 'Mathematics', category: 'STEM', gradeRange: 'PP1 - Grade 9' },
  { id: 'sub2', name: 'English Language', category: 'Languages', gradeRange: 'Grade 1 - Grade 9' },
  { id: 'sub3', name: 'Kiswahili', category: 'Languages', gradeRange: 'Grade 1 - Grade 9' },
  { id: 'sub4', name: 'Integrated Science', category: 'STEM', gradeRange: 'Grade 7 - Grade 9' },
  { id: 'sub5', name: 'Creative Arts', category: 'Arts', gradeRange: 'PP1 - Grade 9' },
  { id: 'sub6', name: 'Pre-Technical Studies', category: 'Technical', gradeRange: 'Grade 7 - Grade 9' },
];

interface AcademicsProps {
  lang: Language;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
}

export const AcademicsModule: React.FC<AcademicsProps> = ({ lang, students = [], setStudents }) => {
  const t = translations[lang];
  const [view, setView] = useState<'exams' | 'mark-entry' | 'subjects'>('exams');
  
  const [exams, setExams] = useState<Exam[]>([]);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [examSearch, setExamSearch] = useState('');
  const [examFormData, setExamFormData] = useState<Partial<Exam>>({
    title: '',
    term: 1,
    year: new Date().getFullYear(),
    type: 'CAT',
    date: new Date().toISOString().split('T')[0]
  });

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('elimusmart_curriculum');
    return saved ? JSON.parse(saved) : INITIAL_SUBJECTS;
  });

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [subjectFormData, setSubjectFormData] = useState({ 
    name: '', 
    category: 'STEM', 
    gradeRange: 'Grade 1 - Grade 9' 
  });

  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [selectedClass, setSelectedClass] = useState('Grade 7');
  const [selectedStream, setSelectedStream] = useState(''); // Default to empty (All Streams)
  const [marks, setMarks] = useState<MarkEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingRemarks, setIsGeneratingRemarks] = useState<string | null>(null);

  useEffect(() => {
    schoolService.getExams().then(setExams);
  }, []);

  useEffect(() => {
    localStorage.setItem('elimusmart_curriculum', JSON.stringify(subjects));
  }, [subjects]);

  // Sync marks whenever filters change while in mark-entry mode
  useEffect(() => {
    if (view === 'mark-entry' && selectedExam) {
      const classStudents = students.filter(s => 
        s.class.toLowerCase() === selectedClass.toLowerCase() && 
        (selectedStream === '' || s.stream.toLowerCase() === selectedStream.toLowerCase())
      );
      
      const entries: MarkEntry[] = classStudents.map(s => {
        const existing = s.results?.find(r => r.examId === selectedExam.id && r.subject === selectedSubject);
        return {
          studentId: s.id,
          studentName: `${s.firstName} ${s.lastName}`,
          admissionNumber: s.admissionNumber,
          score: existing?.score || 0,
          competency: existing?.competency || CBCGrade.BE,
          remarks: existing?.remarks || ''
        };
      });
      setMarks(entries);
    }
  }, [selectedClass, selectedStream, selectedSubject, selectedExam, view, students]);

  const filteredExams = useMemo(() => {
    return exams.filter(ex => 
      ex.title.toLowerCase().includes(examSearch.toLowerCase()) ||
      ex.type.toLowerCase().includes(examSearch.toLowerCase())
    );
  }, [exams, examSearch]);

  const filteredSubjects = useMemo(() => {
    return subjects.filter(s => 
      s.name.toLowerCase().includes(subjectSearch.toLowerCase()) ||
      s.category.toLowerCase().includes(subjectSearch.toLowerCase())
    );
  }, [subjects, subjectSearch]);

  const handleOpenMarkEntry = (exam: Exam) => {
    setSelectedExam(exam);
    setView('mark-entry');
  };

  const openExamModal = (exam?: Exam) => {
    if (exam) {
      setEditingExam(exam);
      setExamFormData({
        title: exam.title,
        term: exam.term,
        year: exam.year,
        type: exam.type,
        date: exam.date
      });
    } else {
      setEditingExam(null);
      setExamFormData({
        title: '',
        term: 1,
        year: new Date().getFullYear(),
        type: 'CAT',
        date: new Date().toISOString().split('T')[0]
      });
    }
    setIsExamModalOpen(true);
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExam) {
      setExams(prev => prev.map(ex => 
        ex.id === editingExam.id ? { ...ex, ...examFormData } as Exam : ex
      ));
    } else {
      const newExam: Exam = {
        id: `ex${Date.now()}`,
        title: examFormData.title || 'New Assessment',
        term: examFormData.term || 1,
        year: examFormData.year || new Date().getFullYear(),
        type: examFormData.type as any || 'CAT',
        date: examFormData.date || new Date().toISOString().split('T')[0]
      };
      setExams(prev => [newExam, ...prev]);
    }
    setIsExamModalOpen(false);
  };

  const handleDeleteExam = (id: string) => {
    if (confirm('Are you sure you want to delete this exam and all associated records?')) {
      setExams(prev => prev.filter(ex => ex.id !== id));
    }
  };

  const openSubjectModal = (subject?: Subject) => {
    if (subject) {
      setEditingSubject(subject);
      setSubjectFormData({ 
        name: subject.name, 
        category: subject.category, 
        gradeRange: subject.gradeRange 
      });
    } else {
      setEditingSubject(null);
      setSubjectFormData({ 
        name: '', 
        category: 'STEM', 
        gradeRange: 'Grade 1 - Grade 9' 
      });
    }
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSubject) {
      setSubjects(prev => prev.map(s => 
        s.id === editingSubject.id ? { ...s, ...subjectFormData } : s
      ));
    } else {
      const newSub: Subject = {
        id: `sub${Date.now()}`,
        ...subjectFormData
      };
      setSubjects(prev => [...prev, newSub]);
    }
    setIsSubjectModalOpen(false);
  };

  const handleDeleteSubject = (id: string) => {
    if (confirm('Are you sure you want to remove this subject from the school curriculum?')) {
      setSubjects(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleScoreChange = (studentId: string, scoreStr: string) => {
    const score = parseInt(scoreStr) || 0;
    setMarks(prev => prev.map(m => 
      m.studentId === studentId 
        ? { ...m, score, competency: schoolService.calculateCBCGrade(score) } 
        : m
    ));
  };

  const handleRemarkChange = (studentId: string, remarks: string) => {
    setMarks(prev => prev.map(m => m.studentId === studentId ? { ...m, remarks } : m));
  };

  const generateAIRemark = async (student: MarkEntry) => {
    if (!process.env.API_KEY) {
      handleRemarkChange(student.studentId, `${student.studentName} shows ${student.competency} in ${selectedSubject}. Keep it up!`);
      return;
    }

    setIsGeneratingRemarks(student.studentId);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const promptText = `Write a one-sentence professional teacher remark for a student named ${student.studentName} who scored ${student.score}% (CBC level: ${student.competency}) in ${selectedSubject}. Make it encouraging and specific to the grade level ${selectedClass}.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: promptText
      });
      handleRemarkChange(student.studentId, response.text || 'Commendable performance.');
    } catch (error) {
      console.error(error);
      handleRemarkChange(student.studentId, 'Performance is within expectations.');
    } finally {
      setIsGeneratingRemarks(null);
    }
  };

  const saveMarks = async () => {
    if (marks.length === 0) {
      alert("No student marks to commit.");
      return;
    }
    
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1200));

    setStudents(prev => prev.map(student => {
      const markEntry = marks.find(m => m.studentId === student.id);
      if (markEntry && selectedExam) {
        const result: ExamResult = {
          examId: selectedExam.id,
          subject: selectedSubject,
          score: markEntry.score,
          grade: markEntry.score >= 80 ? 'A' : markEntry.score >= 60 ? 'B' : markEntry.score >= 40 ? 'C' : 'D',
          competency: markEntry.competency,
          remarks: markEntry.remarks
        };

        const existingResults = student.results || [];
        const filteredResults = existingResults.filter(r => !(r.examId === selectedExam.id && r.subject === selectedSubject));
        
        return {
          ...student,
          results: [...filteredResults, result]
        };
      }
      return student;
    }));

    setIsSaving(false);
    alert('Marks successfully recorded and synced with student report cards.');
    setView('exams');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <datalist id="kenyan-classes">
        {KENYAN_CLASSES.map(c => <option key={c} value={c} />)}
      </datalist>
      <datalist id="school-streams">
        <option value="">All Streams</option>
        {SCHOOL_STREAMS.map(s => <option key={s} value={s} />)}
      </datalist>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">Academics Engine</h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-3 flex items-center gap-3">
             <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
             CBC Assessment Control • Flexible Routing
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 no-print">
          {view === 'exams' && (
            <>
              <button 
                onClick={() => setView('subjects')}
                className="flex items-center space-x-3 bg-white border-2 border-gray-100 text-gray-600 px-6 py-3 rounded-2xl hover:bg-gray-50 hover:border-purple-200 transition-all font-black uppercase text-[10px] tracking-widest shadow-sm"
              >
                <BookMarked className="w-5 h-5 text-purple-500" />
                <span>Curriculum</span>
              </button>
              <button 
                onClick={() => openExamModal()}
                className="flex items-center space-x-3 bg-gray-900 text-white px-8 py-3 rounded-2xl hover:bg-black transition-all font-black uppercase text-[10px] tracking-widest shadow-xl shadow-gray-200 border-b-4 border-black"
              >
                <Plus className="w-5 h-5" />
                <span>Schedule Exam</span>
              </button>
            </>
          )}
          {view === 'subjects' && (
            <>
              <button 
                onClick={() => setView('exams')}
                className="flex items-center space-x-3 bg-white border-2 border-gray-100 text-gray-600 px-6 py-3 rounded-2xl hover:bg-gray-50 transition-all font-black uppercase text-[10px] tracking-widest shadow-sm"
              >
                <ArrowLeft className="w-5 h-5 text-blue-500" />
                <span>Back to Exams</span>
              </button>
              <button 
                onClick={() => openSubjectModal()}
                className="flex items-center space-x-3 bg-purple-600 text-white px-8 py-3 rounded-2xl hover:bg-purple-700 transition-all font-black uppercase text-[10px] tracking-widest shadow-xl shadow-purple-100 border-b-4 border-purple-800"
              >
                <Plus className="w-5 h-5" />
                <span>Add Subject</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* GLOBAL FILTERS: Visible in both Exams and Mark Entry views */}
      {view !== 'subjects' && (
        <div className="bg-white p-6 rounded-[32px] border-2 border-gray-50 flex flex-col xl:flex-row items-center gap-6 no-print shadow-xl">
           <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Academic Target (Class)</label>
                 <div className="flex items-center bg-gray-50 border-2 border-gray-100 rounded-2xl focus-within:border-blue-500 transition-all px-4 py-1 shadow-inner">
                   <Type size={16} className="text-gray-400 mr-2" />
                   <input 
                     list="kenyan-classes"
                     value={selectedClass}
                     placeholder="Select Grade..."
                     onChange={e => setSelectedClass(e.target.value)}
                     className="w-full bg-transparent py-2.5 font-black uppercase text-[11px] outline-none placeholder:text-gray-300"
                   />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Section / Stream</label>
                 <div className="flex items-center bg-gray-50 border-2 border-gray-100 rounded-2xl focus-within:border-blue-500 transition-all px-4 py-1 shadow-inner">
                   <Layers size={16} className="text-gray-400 mr-2" />
                   <input 
                     list="school-streams"
                     value={selectedStream}
                     placeholder="All Streams"
                     onChange={e => setSelectedStream(e.target.value)}
                     className="w-full bg-transparent py-2.5 font-black uppercase text-[11px] outline-none placeholder:text-gray-300"
                   />
                 </div>
              </div>
              
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Learning Area</label>
                 <select 
                   value={selectedSubject} 
                   onChange={e => setSelectedSubject(e.target.value)}
                   className="w-full p-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-black uppercase text-[11px] focus:border-blue-500 outline-none transition-all shadow-inner"
                 >
                   {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                 </select>
              </div>
           </div>

           {view === 'exams' && (
             <div className="w-full xl:w-64 self-end">
                <div className="relative">
                    <input 
                      type="text"
                      placeholder="Filter assessments..."
                      value={examSearch}
                      onChange={e => setExamSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 bg-white border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none font-black text-[11px] uppercase"
                    />
                    <Filter className="absolute left-3 top-4 w-4 h-4 text-gray-300" />
                </div>
             </div>
           )}
        </div>
      )}

      {view === 'exams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map(exam => (
            <div key={exam.id} className="bg-white p-8 rounded-[40px] border-2 border-gray-50 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
              <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-32 h-32" />
              </div>
              
              <div className="flex justify-between items-start mb-8">
                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl border-2 border-white shadow-sm">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="flex gap-2 no-print opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                  <button onClick={() => openExamModal(exam)} className="p-3 bg-white text-gray-400 hover:text-blue-600 rounded-xl transition-all border-2 border-gray-50 hover:border-blue-100 shadow-sm"><Edit3 className="w-5 h-5" /></button>
                  <button onClick={() => handleDeleteExam(exam.id)} className="p-3 bg-white text-gray-400 hover:text-red-600 rounded-xl transition-all border-2 border-gray-50 hover:border-red-100 shadow-sm"><Trash2 className="w-5 h-5" /></button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-gray-900 tracking-tighter leading-none uppercase italic">{exam.title}</h3>
                <div className="flex items-center gap-3 text-[10px] font-black text-blue-500 uppercase tracking-widest">
                  <span className="bg-blue-50 px-2 py-0.5 rounded-md">Term {exam.term} • {exam.year}</span>
                  <span className="w-1.5 h-1.5 bg-gray-200 rounded-full"></span>
                  <span className="text-gray-400">{exam.type}</span>
                </div>
              </div>

              <div className="mt-10 flex items-center justify-between gap-4">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-blue-500" />
                  {new Date(exam.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </div>
                <button 
                  onClick={() => handleOpenMarkEntry(exam)}
                  className="flex items-center gap-3 bg-gray-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 border-b-4 border-black"
                >
                  Enter Marks <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {filteredExams.length === 0 && (
            <div className="col-span-full py-24 text-center bg-white rounded-[48px] border-2 border-dashed border-gray-100">
               <CalendarDays className="w-16 h-16 text-gray-100 mx-auto mb-6" />
               <p className="text-[12px] font-black uppercase text-gray-400 tracking-[0.4em] italic">No scheduled assessments matching your filters.</p>
            </div>
          )}
        </div>
      )}

      {view === 'subjects' && (
        <div className="bg-white rounded-[48px] shadow-2xl border-2 border-gray-50 overflow-hidden">
           <div className="p-10 border-b bg-gray-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search global curriculum..." 
                  value={subjectSearch}
                  onChange={e => setSubjectSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-100 rounded-[24px] focus:ring-8 focus:ring-purple-500/10 focus:border-purple-500 outline-none font-black text-[11px] uppercase tracking-widest shadow-inner" 
                />
              </div>
              <div className="flex items-center gap-3 px-6 py-2 bg-white rounded-full border-2 border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-widest shadow-sm">
                 <Tags className="w-4 h-4 text-purple-500" /> {subjects.length} Learning Areas
              </div>
           </div>

           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="bg-gray-50/80 border-b-2 border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                   <th className="px-10 py-8">Learning Area</th>
                   <th className="px-10 py-8">Category</th>
                   <th className="px-10 py-8">Target Levels</th>
                   <th className="px-10 py-8 text-right no-print">Controls</th>
                 </tr>
               </thead>
               <tbody className="divide-y-2 divide-gray-50">
                 {filteredSubjects.map(subject => (
                   <tr key={subject.id} className="hover:bg-purple-50/10 transition-colors group">
                     <td className="px-10 py-8">
                       <div className="font-black text-gray-900 text-xl tracking-tighter uppercase italic">{subject.name}</div>
                       <p className="text-[9px] text-gray-300 font-black uppercase mt-1 tracking-widest">Institutional Curriculum</p>
                     </td>
                     <td className="px-10 py-8">
                        <span className={`px-4 py-2 border-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${
                          subject.category === 'STEM' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          subject.category === 'Languages' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          'bg-purple-50 text-purple-600 border-purple-100'
                        }`}>
                          {subject.category}
                        </span>
                     </td>
                     <td className="px-10 py-8">
                        <div className="text-xs font-black text-gray-500 uppercase italic tracking-tight">{subject.gradeRange}</div>
                     </td>
                     <td className="px-10 py-8 text-right no-print">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openSubjectModal(subject)} className="p-3 bg-white text-gray-400 hover:text-blue-600 rounded-xl transition-all border-2 border-gray-50 shadow-sm"><Edit3 className="w-5 h-5" /></button>
                          <button onClick={() => handleDeleteSubject(subject.id)} className="p-3 bg-white text-gray-400 hover:text-red-600 rounded-xl transition-all border-2 border-gray-50 shadow-sm"><Trash2 className="w-5 h-5" /></button>
                        </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {view === 'mark-entry' && selectedExam && (
        <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-700">
          <div className="bg-white p-10 rounded-[48px] border-2 border-gray-50 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8 no-print">
            <div className="flex items-center gap-8">
              <button onClick={() => setView('exams')} className="p-4 hover:bg-gray-100 rounded-2xl transition-all bg-gray-50 border-2 border-gray-100 shadow-sm">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h3 className="font-black text-3xl tracking-tighter text-gray-900 leading-none uppercase italic">{selectedExam.title}</h3>
                <p className="text-[10px] text-blue-600 uppercase font-black tracking-[0.4em] mt-3 flex items-center gap-2">
                   <CheckCircle2 size={12} /> Live Entry • {selectedClass} {selectedStream || 'All Streams'} • {selectedSubject}
                </p>
              </div>
            </div>
            
            <button 
              onClick={saveMarks}
              disabled={isSaving || marks.length === 0}
              className="w-full lg:w-auto flex items-center justify-center gap-4 bg-blue-600 text-white px-10 py-5 rounded-[32px] hover:bg-blue-700 transition-all font-black uppercase text-xs tracking-[0.2em] disabled:opacity-50 shadow-2xl shadow-blue-100 border-b-4 border-blue-800 active:scale-95"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              <span>Commit Assessment</span>
            </button>
          </div>

          <div className="bg-white rounded-[56px] shadow-2xl border-2 border-gray-50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-[0.4em]">
                    <th className="px-12 py-8">Learner Credentials</th>
                    <th className="px-12 py-8 text-center">Score %</th>
                    <th className="px-12 py-8 text-center">Descriptor</th>
                    <th className="px-12 py-8">Professional Remark</th>
                    <th className="px-12 py-8 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-gray-50">
                  {marks.map((entry) => (
                    <tr key={entry.studentId} className="hover:bg-blue-50/20 transition-colors group">
                      <td className="px-12 py-8">
                        <div className="font-black text-gray-900 text-xl tracking-tighter uppercase leading-tight">{entry.studentName}</div>
                        <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-1">ADM: {entry.admissionNumber}</div>
                      </td>
                      <td className="px-12 py-8 w-48 text-center">
                        <input 
                          type="number" max="100" min="0" value={entry.score}
                          onChange={e => handleScoreChange(entry.studentId, e.target.value)}
                          className="w-24 p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl text-center font-black text-2xl focus:ring-8 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all outline-none shadow-inner"
                        />
                      </td>
                      <td className="px-12 py-8 text-center">
                        <span className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm border-2 ${
                          entry.competency === CBCGrade.EE ? 'bg-green-50 text-green-700 border-green-100' :
                          entry.competency === CBCGrade.ME ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          entry.competency === CBCGrade.AE ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          'bg-red-50 text-red-700 border-red-100'
                        }`}>
                          {entry.competency}
                        </span>
                      </td>
                      <td className="px-12 py-8 min-w-[450px]">
                        <div className="flex items-center gap-3 bg-gray-50 px-6 py-4 rounded-[32px] border-2 border-transparent focus-within:border-blue-400 focus-within:bg-white transition-all shadow-inner">
                          <input 
                            type="text" placeholder="Individualized observation..." value={entry.remarks}
                            onChange={e => handleRemarkChange(entry.studentId, e.target.value)}
                            className="flex-1 bg-transparent border-none focus:ring-0 italic text-gray-700 font-bold placeholder:text-gray-300 placeholder:not-italic"
                          />
                          <button 
                            onClick={() => generateAIRemark(entry)}
                            className="p-3 bg-white text-blue-600 hover:bg-blue-600 hover:text-white rounded-2xl transition-all shadow-sm border border-blue-100"
                            title="Generate with Gemini"
                          >
                            {isGeneratingRemarks === entry.studentId ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-12 py-8 text-right">
                        <div className="flex justify-end">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${entry.score > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-200'}`}>
                              <CheckCircle2 size={24} />
                           </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {marks.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-32 text-center">
                        <div className="max-w-xs mx-auto">
                          <UserX className="w-20 h-20 text-gray-100 mx-auto mb-6" />
                          <h4 className="text-xl font-black text-gray-900 tracking-tight uppercase mb-2">No Students Found</h4>
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                            No learners match the selected target: <span className="text-blue-500">{selectedClass} {selectedStream}</span>. Please verify your filters in the control panel above.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals remain same but use standard sizing */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[56px] w-full max-w-xl shadow-2xl relative overflow-hidden animate-in zoom-in duration-500 max-h-[95vh] flex flex-col border-8 border-gray-50">
            <div className="p-12 border-b bg-gray-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none italic">{editingSubject ? 'Edit Subject' : 'Add Subject'}</h2>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.4em] mt-4">Global Curriculum Management</p>
              </div>
              <button onClick={() => setIsSubjectModalOpen(false)} className="p-5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all border-2 border-transparent hover:border-red-100 shadow-sm bg-white"><X size={28} /></button>
            </div>

            <form onSubmit={handleSaveSubject} className="p-12 space-y-8 overflow-y-auto">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Learning Area Name</label>
                  <input required type="text" placeholder="e.g. Physics" value={subjectFormData.name} onChange={e => setSubjectFormData({...subjectFormData, name: e.target.value})} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl font-black text-gray-900 focus:border-blue-500 outline-none transition-all shadow-inner" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Domain / Category</label>
                    <select value={subjectFormData.category} onChange={e => setSubjectFormData({...subjectFormData, category: e.target.value})} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl font-black uppercase text-xs focus:border-blue-500 outline-none shadow-inner">
                      <option value="STEM">STEM Domain</option>
                      <option value="Languages">Languages & Comm</option>
                      <option value="Arts">Creative Arts & Sports</option>
                      <option value="Technical">Pre-Technical Studies</option>
                      <option value="Social">Humanities & Social</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Level Coverage</label>
                    <input type="text" placeholder="e.g. Grade 1 - Grade 9" value={subjectFormData.gradeRange} onChange={e => setSubjectFormData({...subjectFormData, gradeRange: e.target.value})} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl font-bold text-sm focus:border-blue-500 outline-none shadow-inner" />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsSubjectModalOpen(false)} className="flex-1 py-6 bg-gray-100 text-gray-400 font-black uppercase tracking-widest rounded-[32px] hover:bg-gray-200 transition-all">Discard</button>
                <button type="submit" className="flex-2 py-6 bg-purple-600 text-white font-black uppercase tracking-[0.2em] rounded-[32px] hover:bg-purple-700 transition-all shadow-xl shadow-purple-100 border-b-4 border-purple-800">
                  {editingSubject ? 'Update Area' : 'Add to Curriculum'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exam Modal */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[56px] w-full max-w-xl shadow-2xl relative overflow-hidden animate-in zoom-in duration-500 max-h-[95vh] flex flex-col border-8 border-gray-50">
            <div className="p-12 border-b bg-gray-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none italic">{editingExam ? 'Modify Exam' : 'Schedule Exam'}</h2>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.4em] mt-4">Official Assessment Schedule</p>
              </div>
              <button onClick={() => setIsExamModalOpen(false)} className="p-5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all border-2 border-transparent hover:border-red-100 shadow-sm bg-white"><X size={28} /></button>
            </div>

            <form onSubmit={handleSaveExam} className="p-12 space-y-8 overflow-y-auto">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Assessment Title</label>
                  <input required type="text" placeholder="e.g. Term 3 Final Exams" value={examFormData.title} onChange={e => setExamFormData({...examFormData, title: e.target.value})} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl font-black text-gray-900 focus:border-blue-500 outline-none shadow-inner" />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Academic Term</label>
                    <select value={examFormData.term} onChange={e => setExamFormData({...examFormData, term: parseInt(e.target.value)})} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl font-black uppercase text-xs focus:border-blue-500 outline-none shadow-inner"><option value="1">Term 1</option><option value="2">Term 2</option><option value="3">Term 3</option></select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Exam Type</label>
                    <select value={examFormData.type} onChange={e => setExamFormData({...examFormData, type: e.target.value as any})} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl font-black uppercase text-xs focus:border-blue-500 outline-none shadow-inner"><option value="CAT">Continuous (CAT)</option><option value="End of Term">End of Term</option><option value="Initial Assessment">Initial Entry</option></select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Official Date</label>
                  <input type="date" value={examFormData.date} onChange={e => setExamFormData({...examFormData, date: e.target.value})} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl font-black text-gray-900 focus:border-blue-500 outline-none shadow-inner" />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsExamModalOpen(false)} className="flex-1 py-6 bg-gray-100 text-gray-400 font-black uppercase tracking-widest rounded-[32px] hover:bg-gray-200 transition-all">Cancel</button>
                <button type="submit" className="flex-2 py-6 bg-gray-900 text-white font-black uppercase tracking-[0.2em] rounded-[32px] hover:bg-black transition-all shadow-xl shadow-gray-100 border-b-4 border-black">
                  {editingExam ? 'Commit Change' : 'Authorize Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
