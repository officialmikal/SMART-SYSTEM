
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
  LayoutGrid
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { Exam, MarkEntry, CBCGrade, KENYAN_CLASSES, SCHOOL_STREAMS } from '../types';
import { schoolService } from '../services/schoolService';
import { Language, translations } from '../services/localizationService';

interface Subject {
  id: string;
  name: string;
  category: string;
  gradeRange: string;
}

const MOCK_SUBJECTS: Subject[] = [
  { id: 'sub1', name: 'Mathematics', category: 'STEM', gradeRange: 'PP1 - Grade 9' },
  { id: 'sub2', name: 'English Language', category: 'Languages', gradeRange: 'Grade 1 - Grade 9' },
  { id: 'sub3', name: 'Kiswahili', category: 'Languages', gradeRange: 'Grade 1 - Grade 9' },
  { id: 'sub4', name: 'Integrated Science', category: 'STEM', gradeRange: 'Grade 7 - Grade 9' },
  { id: 'sub5', name: 'Creative Arts', category: 'Arts', gradeRange: 'PP1 - Grade 9' },
  { id: 'sub6', name: 'Pre-Technical Studies', category: 'Technical', gradeRange: 'Grade 7 - Grade 9' },
];

export const AcademicsModule: React.FC<{ lang: Language }> = ({ lang }) => {
  const t = translations[lang];
  const [view, setView] = useState<'exams' | 'mark-entry' | 'subjects'>('exams');
  
  // State for Exams
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

  // State for Subjects
  const [subjects, setSubjects] = useState<Subject[]>(MOCK_SUBJECTS);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [subjectFormData, setSubjectFormData] = useState({ 
    name: '', 
    category: 'STEM', 
    gradeRange: 'Grade 1 - Grade 6' 
  });

  // State for Mark Entry
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [selectedClass, setSelectedClass] = useState('Grade 7');
  const [selectedStream, setSelectedStream] = useState('Oak');
  const [marks, setMarks] = useState<MarkEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingRemarks, setIsGeneratingRemarks] = useState<string | null>(null);

  useEffect(() => {
    schoolService.getExams().then(setExams);
  }, []);

  // Filtered Exams
  const filteredExams = useMemo(() => {
    return exams.filter(ex => 
      ex.title.toLowerCase().includes(examSearch.toLowerCase()) ||
      ex.type.toLowerCase().includes(examSearch.toLowerCase())
    );
  }, [exams, examSearch]);

  // Filtered Subjects
  const filteredSubjects = useMemo(() => {
    return subjects.filter(s => 
      s.name.toLowerCase().includes(subjectSearch.toLowerCase()) ||
      s.category.toLowerCase().includes(subjectSearch.toLowerCase())
    );
  }, [subjects, subjectSearch]);

  // Exam CRUD Logic
  const handleOpenMarkEntry = async (exam: Exam) => {
    setSelectedExam(exam);
    const entries = await schoolService.getMarkEntries(exam.id, selectedSubject, `${selectedClass} ${selectedStream}`);
    setMarks(entries);
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

  // Subject CRUD Logic
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
        gradeRange: 'Grade 1 - Grade 6' 
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

  // Mark Entry Logic
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
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1200));
    setIsSaving(false);
    alert('Marks successfully recorded and synced with student analytics.');
    setView('exams');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Academics & Assessments</h1>
          <p className="text-gray-500 font-medium">Manage CBC assessments and subject categories for PP1 - Grade 9.</p>
        </div>
        
        <div className="flex gap-2 no-print">
          {view === 'exams' && (
            <>
              <button 
                onClick={() => setView('subjects')}
                className="flex items-center space-x-2 border-2 border-gray-100 text-gray-600 px-6 py-3 rounded-2xl hover:bg-white hover:border-blue-100 transition-all font-black uppercase text-xs tracking-widest"
              >
                <BookMarked className="w-5 h-5" />
                <span>Curriculum</span>
              </button>
              <button 
                onClick={() => openExamModal()}
                className="flex items-center space-x-2 bg-blue-600 text-white px-8 py-3 rounded-2xl hover:bg-blue-700 transition-all font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-100"
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
                className="flex items-center space-x-2 border-2 border-gray-100 text-gray-600 px-6 py-3 rounded-2xl hover:bg-white transition-all font-black uppercase text-xs tracking-widest"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Exams</span>
              </button>
              <button 
                onClick={() => openSubjectModal()}
                className="flex items-center space-x-2 bg-blue-600 text-white px-8 py-3 rounded-2xl hover:bg-blue-700 transition-all font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-100"
              >
                <Plus className="w-5 h-5" />
                <span>Add Subject</span>
              </button>
            </>
          )}
        </div>
      </div>

      {view === 'exams' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white p-6 rounded-2xl border flex items-center gap-4 no-print">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-300" />
                <input 
                  type="text"
                  placeholder="Filter assessments by title or type..."
                  value={examSearch}
                  onChange={e => setExamSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                />
             </div>
             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Filter className="w-5 h-5" />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.map(exam => (
              <div key={exam.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:scale-110 transition-transform">
                  <LayoutGrid className="w-24 h-24" />
                </div>
                
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-white shadow-sm">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="flex gap-2 no-print">
                    <button 
                      onClick={() => openExamModal(exam)}
                      className="p-2.5 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteExam(exam.id)}
                      className="p-2.5 bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-black text-gray-900 tracking-tight leading-tight">{exam.title}</h3>
                  <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest">
                    <span>Term {exam.term} • {exam.year}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span>{exam.type}</span>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between gap-4">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {exam.date}
                  </div>
                  <button 
                    onClick={() => handleOpenMarkEntry(exam)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Enter Marks <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {filteredExams.length === 0 && (
              <div className="col-span-full py-24 text-center border-2 border-dashed rounded-[40px] border-gray-100">
                <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs italic">No assessments found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'subjects' && (
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
           <div className="p-8 border-b bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search by area name or category..." 
                  value={subjectSearch}
                  onChange={e => setSubjectSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-gray-700" 
                />
              </div>
              <div className="flex items-center space-x-2 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                 <Tags className="w-4 h-4" /> Curriculum Summary
              </div>
           </div>

           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="bg-gray-50/50 border-b text-[10px] font-black text-gray-400 uppercase tracking-widest">
                   <th className="px-10 py-5">Learning Area</th>
                   <th className="px-10 py-5">Category</th>
                   <th className="px-10 py-5">Target Grade Levels</th>
                   <th className="px-10 py-5 text-right no-print">Operational Controls</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {filteredSubjects.map(subject => (
                   <tr key={subject.id} className="hover:bg-blue-50/20 transition-colors group">
                     <td className="px-10 py-6">
                       <div className="font-black text-gray-900 text-lg tracking-tight">{subject.name}</div>
                     </td>
                     <td className="px-10 py-6">
                        <span className="px-3 py-1 bg-white border-2 border-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                          {subject.category}
                        </span>
                     </td>
                     <td className="px-10 py-6">
                        <div className="text-sm font-bold text-blue-600 uppercase italic tracking-tight">{subject.gradeRange}</div>
                     </td>
                     <td className="px-10 py-6 text-right no-print">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => openSubjectModal(subject)}
                            className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          >
                            <Edit3 className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteSubject(subject.id)}
                            className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
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
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white p-8 rounded-[40px] border shadow-2xl shadow-blue-50 flex flex-wrap items-center justify-between gap-6 no-print">
            <div className="flex items-center space-x-6">
              <button onClick={() => setView('exams')} className="p-3 hover:bg-gray-100 rounded-2xl transition-all bg-gray-50 border shadow-sm">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h3 className="font-black text-2xl tracking-tighter text-gray-900 leading-none">{selectedExam.title}</h3>
                <p className="text-[10px] text-blue-600 uppercase font-black tracking-[0.2em] mt-2">{selectedClass} {selectedStream} • {selectedSubject}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <select 
                value={selectedClass} 
                onChange={e => setSelectedClass(e.target.value)}
                className="p-3 border-2 border-gray-100 rounded-2xl text-[11px] bg-gray-50 font-black uppercase tracking-widest outline-none focus:border-blue-500 transition-all"
              >
                {KENYAN_CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
              </select>
              <select 
                value={selectedSubject} 
                onChange={e => setSelectedSubject(e.target.value)}
                className="p-3 border-2 border-gray-100 rounded-2xl text-[11px] bg-gray-50 font-black uppercase tracking-widest outline-none focus:border-blue-500 transition-all"
              >
                {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
              <button 
                onClick={saveMarks}
                disabled={isSaving}
                className="flex items-center space-x-3 bg-blue-600 text-white px-8 py-3 rounded-2xl hover:bg-blue-700 transition-all font-black uppercase text-xs tracking-widest disabled:opacity-50 shadow-xl shadow-blue-100"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Sync Results</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[48px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 border-b text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    <th className="px-12 py-6">Learner Credentials</th>
                    <th className="px-12 py-6 text-center">Score %</th>
                    <th className="px-12 py-6 text-center">CBC Descriptor</th>
                    <th className="px-12 py-6">Personalized AI Feedback</th>
                    <th className="px-12 py-6 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {marks.map((entry) => (
                    <tr key={entry.studentId} className="hover:bg-blue-50/10 transition-colors group">
                      <td className="px-12 py-6">
                        <div className="font-black text-gray-900 text-lg leading-tight">{entry.studentName}</div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{entry.admissionNumber}</div>
                      </td>
                      <td className="px-12 py-6 w-48 text-center">
                        <input 
                          type="number" 
                          max="100" 
                          min="0"
                          value={entry.score}
                          onChange={e => handleScoreChange(entry.studentId, e.target.value)}
                          className="w-24 p-4 border-2 border-gray-100 rounded-2xl text-center font-black text-xl focus:ring-8 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-gray-50 focus:bg-white"
                        />
                      </td>
                      <td className="px-12 py-6 text-center">
                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border-2 ${
                          entry.competency === CBCGrade.EE ? 'bg-green-50 text-green-700 border-green-100' :
                          entry.competency === CBCGrade.ME ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          entry.competency === CBCGrade.AE ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          'bg-red-50 text-red-700 border-red-100'
                        }`}>
                          {entry.competency}
                        </span>
                      </td>
                      <td className="px-12 py-6 min-w-[400px]">
                        <div className="flex items-center space-x-3 bg-gray-100/50 px-6 py-4 rounded-3xl border-2 border-transparent focus-within:border-blue-400 focus-within:bg-white transition-all shadow-inner">
                          <input 
                            type="text"
                            placeholder="Add observation..."
                            value={entry.remarks}
                            onChange={e => handleRemarkChange(entry.studentId, e.target.value)}
                            className="flex-1 bg-transparent border-none focus:ring-0 italic text-gray-600 font-medium placeholder:text-gray-300 placeholder:not-italic"
                          />
                          <button 
                            onClick={() => generateAIRemark(entry)}
                            className="p-3 text-blue-600 hover:bg-blue-600 hover:text-white rounded-2xl transition-all shadow-sm bg-white border border-blue-100"
                            title="Generate with AI"
                          >
                            {isGeneratingRemarks === entry.studentId ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-12 py-6 text-right">
                        <CheckCircle2 className="w-8 h-8 ml-auto text-green-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Exam Modal */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[40px] w-full max-w-xl shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
            <div className="p-10 border-b bg-gray-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">{editingExam ? 'Modify Assessment' : 'New Assessment'}</h2>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-3">Official Examination Entry</p>
              </div>
              <button onClick={() => setIsExamModalOpen(false)} className="p-4 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-full transition-all border border-transparent hover:border-red-100">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="p-10 space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Assessment Title</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. End of Term II Exams"
                    value={examFormData.title}
                    onChange={e => setExamFormData({...examFormData, title: e.target.value})}
                    className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-[24px] focus:ring-8 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-black text-gray-800" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Academic Term</label>
                    <select 
                      value={examFormData.term}
                      onChange={e => setExamFormData({...examFormData, term: parseInt(e.target.value)})}
                      className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-[24px] focus:ring-8 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-black text-gray-800"
                    >
                      <option value="1">Term 1</option>
                      <option value="2">Term 2</option>
                      <option value="3">Term 3</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Assessment Format</label>
                    <select 
                      value={examFormData.type}
                      onChange={e => setExamFormData({...examFormData, type: e.target.value as any})}
                      className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-[24px] focus:ring-8 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-black text-gray-800"
                    >
                      <option value="CAT">Continuous Assessment (CAT)</option>
                      <option value="End of Term">Term Examination</option>
                      <option value="Initial Assessment">Initial Entry Assessment</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Examination Date</label>
                    <div className="relative">
                      <input 
                        required 
                        type="date" 
                        value={examFormData.date}
                        onChange={e => setExamFormData({...examFormData, date: e.target.value})}
                        className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-[24px] focus:ring-8 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-black text-gray-800 pl-14" 
                      />
                      <CalendarDays className="absolute left-5 top-5 text-gray-400 w-6 h-6" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Academic Year</label>
                    <input 
                      required 
                      type="number" 
                      value={examFormData.year}
                      onChange={e => setExamFormData({...examFormData, year: parseInt(e.target.value)})}
                      className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-[24px] focus:ring-8 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-black text-gray-800" 
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button 
                  type="button" 
                  onClick={() => setIsExamModalOpen(false)}
                  className="flex-1 py-5 text-gray-400 font-black uppercase tracking-widest hover:bg-gray-50 rounded-3xl transition-all"
                >
                  Discard
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-5 bg-blue-600 text-white font-black uppercase tracking-widest rounded-3xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
                >
                  {editingExam ? 'Update Schedule' : 'Confirm Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subject Modal */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[40px] w-full max-w-xl shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
            <div className="p-10 border-b bg-gray-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">{editingSubject ? 'Edit Learning Area' : 'New Learning Area'}</h2>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-3">Curriculum Definition</p>
              </div>
              <button onClick={() => setIsSubjectModalOpen(false)} className="p-4 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-full transition-all border border-transparent hover:border-red-100">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="p-10 space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Learning Area Name</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. Agriculture & Nutrition"
                    value={subjectFormData.name}
                    onChange={e => setSubjectFormData({...subjectFormData, name: e.target.value})}
                    className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-[24px] focus:ring-8 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-black text-gray-800" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Area Category</label>
                    <select 
                      value={subjectFormData.category}
                      onChange={e => setSubjectFormData({...subjectFormData, category: e.target.value})}
                      className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-[24px] focus:ring-8 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-black text-gray-800"
                    >
                      <option>STEM</option>
                      <option>Languages</option>
                      <option>Arts</option>
                      <option>Social</option>
                      <option>Technical</option>
                      <option>Physical Ed</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Applicable Grades</label>
                    <select 
                      value={subjectFormData.gradeRange}
                      onChange={e => setSubjectFormData({...subjectFormData, gradeRange: e.target.value})}
                      className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-[24px] focus:ring-8 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-black text-gray-800"
                    >
                      <option>PP1 - PP2</option>
                      <option>Grade 1 - Grade 6</option>
                      <option>Grade 7 - Grade 9</option>
                      <option>PP1 - Grade 9</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button 
                  type="button" 
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="flex-1 py-5 text-gray-400 font-black uppercase tracking-widest hover:bg-gray-50 rounded-3xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-5 bg-blue-600 text-white font-black uppercase tracking-widest rounded-3xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
                >
                  {editingSubject ? 'Update Area' : 'Register Area'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
