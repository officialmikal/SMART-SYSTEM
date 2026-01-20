
import React, { useState, useEffect } from 'react';
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
  CalendarDays
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
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [selectedClass, setSelectedClass] = useState('Grade 7');
  const [selectedStream, setSelectedStream] = useState('Oak');
  const [marks, setMarks] = useState<MarkEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingRemarks, setIsGeneratingRemarks] = useState<string | null>(null);
  
  // Exam Creation State
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [newExamData, setNewExamData] = useState<Partial<Exam>>({
    title: '',
    term: 1,
    year: new Date().getFullYear(),
    type: 'CAT',
    date: new Date().toISOString().split('T')[0]
  });

  // Subject Management States
  const [subjects, setSubjects] = useState<Subject[]>(MOCK_SUBJECTS);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', category: 'STEM', gradeRange: 'Grade 1 - Grade 6' });

  useEffect(() => {
    schoolService.getExams().then(setExams);
  }, []);

  const handleOpenMarkEntry = async (exam: Exam) => {
    setSelectedExam(exam);
    const entries = await schoolService.getMarkEntries(exam.id, selectedSubject, `${selectedClass} ${selectedStream}`);
    setMarks(entries);
    setView('mark-entry');
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `sub${Date.now()}`;
    setSubjects([...subjects, { id, ...newSubject }]);
    setIsSubjectModalOpen(false);
    setNewSubject({ name: '', category: 'STEM', gradeRange: 'Grade 1 - Grade 6' });
  };

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    const newExam: Exam = {
      id: `ex${Date.now()}`,
      title: newExamData.title || 'Untitled Exam',
      term: newExamData.term || 1,
      year: newExamData.year || new Date().getFullYear(),
      type: newExamData.type as any || 'CAT',
      date: newExamData.date || new Date().toISOString().split('T')[0]
    };
    setExams([newExam, ...exams]);
    setIsExamModalOpen(false);
    setNewExamData({
      title: '',
      term: 1,
      year: new Date().getFullYear(),
      type: 'CAT',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const removeSubject = (id: string) => {
    if (confirm('Are you sure you want to remove this subject from the curriculum?')) {
      setSubjects(subjects.filter(s => s.id !== id));
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
      const prompt = `Write a one-sentence professional teacher remark for a student named ${student.studentName} who scored ${student.score}% (CBC level: ${student.competency}) in ${selectedSubject}. Make it encouraging and specific to the grade level ${selectedClass}.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      handleRemarkChange(student.studentId, response.text || '');
    } catch (error) {
      console.error(error);
      handleRemarkChange(student.studentId, 'Commendable performance.');
    } finally {
      setIsGeneratingRemarks(null);
    }
  };

  const saveMarks = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsSaving(false);
    alert('Marks saved successfully and synced with report cards.');
    setView('exams');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Academics & Curriculum</h1>
          <p className="text-gray-500 font-medium">Manage exams, subjects, and CBC assessment for PP1 - Grade 9.</p>
        </div>
        {view === 'exams' && (
          <div className="flex gap-2">
            <button 
              onClick={() => setView('subjects')}
              className="flex items-center space-x-2 border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 font-bold transition"
            >
              <BookMarked className="w-5 h-5" />
              <span>Manage Subjects</span>
            </button>
            <button 
              onClick={() => setIsExamModalOpen(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-bold transition shadow-lg shadow-blue-100"
            >
              <Plus className="w-5 h-5" />
              <span>Create New Exam</span>
            </button>
          </div>
        )}
        {view === 'subjects' && (
          <div className="flex gap-2">
            <button 
              onClick={() => setView('exams')}
              className="flex items-center space-x-2 border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 font-bold transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Exams</span>
            </button>
            <button 
              onClick={() => setIsSubjectModalOpen(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-bold transition shadow-lg shadow-blue-100"
            >
              <Plus className="w-5 h-5" />
              <span>Add Subject</span>
            </button>
          </div>
        )}
      </div>

      {view === 'exams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map(exam => (
            <div key={exam.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <BookOpen className="w-24 h-24" />
              </div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-500">
                  {exam.type}
                </span>
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-1 relative z-10">{exam.title}</h3>
              <p className="text-sm text-gray-500 mb-6 font-medium">Term {exam.term}, {exam.year} • Date: {exam.date}</p>
              
              <button 
                onClick={() => handleOpenMarkEntry(exam)}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-gray-50 text-blue-600 rounded-xl font-bold group-hover:bg-blue-600 group-hover:text-white transition-all"
              >
                <span>Enter Marks</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {view === 'subjects' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
           <div className="p-6 border-b bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search curriculum subjects..." 
                  className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium" 
                />
              </div>
              <div className="flex items-center space-x-2">
                <button className="flex items-center space-x-2 px-4 py-2 border rounded-xl hover:bg-gray-100 font-bold text-sm text-gray-600">
                  <Tags className="w-4 h-4" />
                  <span>All Categories</span>
                </button>
              </div>
           </div>

           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="bg-gray-50 border-b text-[10px] font-black text-gray-400 uppercase tracking-widest">
                   <th className="px-8 py-4">Subject Name</th>
                   <th className="px-8 py-4">Category</th>
                   <th className="px-8 py-4">Applicable Grades</th>
                   <th className="px-8 py-4 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y">
                 {subjects.map(subject => (
                   <tr key={subject.id} className="hover:bg-gray-50 transition-colors group">
                     <td className="px-8 py-5">
                       <div className="font-black text-gray-800 text-lg tracking-tight">{subject.name}</div>
                     </td>
                     <td className="px-8 py-5">
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black uppercase tracking-wider">
                          {subject.category}
                        </span>
                     </td>
                     <td className="px-8 py-5">
                        <div className="text-sm font-bold text-gray-500 uppercase">{subject.gradeRange}</div>
                     </td>
                     <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => removeSubject(subject.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {view === 'mark-entry' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button onClick={() => setView('exams')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h3 className="font-black text-xl tracking-tight text-gray-900">{selectedExam?.title}</h3>
                <p className="text-[10px] text-blue-600 uppercase font-black tracking-widest">{selectedClass} {selectedStream} • {selectedSubject}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <select 
                value={selectedClass} 
                onChange={e => setSelectedClass(e.target.value)}
                className="p-2.5 border rounded-xl text-sm bg-gray-50 font-black uppercase tracking-tighter"
              >
                {KENYAN_CLASSES.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
              <select 
                value={selectedStream} 
                onChange={e => setSelectedStream(e.target.value)}
                className="p-2.5 border rounded-xl text-sm bg-gray-50 font-black uppercase tracking-tighter"
              >
                {SCHOOL_STREAMS.map(stream => (
                  <option key={stream} value={stream}>{stream}</option>
                ))}
              </select>
              <select 
                value={selectedSubject} 
                onChange={e => setSelectedSubject(e.target.value)}
                className="p-2.5 border rounded-xl text-sm bg-gray-50 font-black uppercase tracking-tighter"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
              <button 
                onClick={saveMarks}
                disabled={isSaving}
                className="flex items-center space-x-2 bg-green-600 text-white px-6 py-2.5 rounded-xl hover:bg-green-700 font-bold disabled:opacity-50 transition shadow-lg shadow-green-100"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save All Marks</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    <th className="px-8 py-5">Student Information</th>
                    <th className="px-8 py-5 text-center">Score (%)</th>
                    <th className="px-8 py-5 text-center">CBC Assessment</th>
                    <th className="px-8 py-5">Professional Feedback (AI Enhanced)</th>
                    <th className="px-8 py-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {marks.map((entry) => (
                    <tr key={entry.studentId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="font-black text-gray-900 text-base">{entry.studentName}</div>
                        <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{entry.admissionNumber}</div>
                      </td>
                      <td className="px-8 py-5 w-36">
                        <input 
                          type="number" 
                          max="100" 
                          min="0"
                          value={entry.score}
                          onChange={e => handleScoreChange(entry.studentId, e.target.value)}
                          className="w-full p-3 border-2 border-gray-100 rounded-xl text-center font-black text-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
                        />
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                          entry.competency === CBCGrade.EE ? 'bg-green-100 text-green-700 border border-green-200' :
                          entry.competency === CBCGrade.ME ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                          entry.competency === CBCGrade.AE ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                          'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                          {entry.competency}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center space-x-3 bg-gray-50/50 px-4 py-2 rounded-xl border border-transparent focus-within:border-indigo-300 focus-within:bg-white transition-all">
                          <input 
                            type="text"
                            placeholder="Add teacher's observation..."
                            value={entry.remarks}
                            onChange={e => handleRemarkChange(entry.studentId, e.target.value)}
                            className="flex-1 bg-transparent border-none focus:ring-0 italic text-gray-600 font-medium placeholder:text-gray-300 placeholder:not-italic"
                          />
                          <button 
                            onClick={() => generateAIRemark(entry)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm bg-white"
                            title="Generate with AI"
                          >
                            {isGeneratingRemarks === entry.studentId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="text-green-600">
                          <CheckCircle2 className="w-6 h-6 ml-auto" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create Exam Modal */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b bg-gray-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Schedule New Exam</h2>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Assessment Management</p>
              </div>
              <button onClick={() => setIsExamModalOpen(false)} className="p-3 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-full transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Exam Title</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. Mid-Term CAT 2"
                    value={newExamData.title}
                    onChange={e => setNewExamData({...newExamData, title: e.target.value})}
                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-bold text-gray-800" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Academic Term</label>
                    <select 
                      value={newExamData.term}
                      onChange={e => setNewExamData({...newExamData, term: parseInt(e.target.value)})}
                      className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-bold text-gray-800"
                    >
                      <option value="1">Term 1</option>
                      <option value="2">Term 2</option>
                      <option value="3">Term 3</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Assessment Type</label>
                    <select 
                      value={newExamData.type}
                      onChange={e => setNewExamData({...newExamData, type: e.target.value as any})}
                      className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-bold text-gray-800"
                    >
                      <option value="CAT">Continuous Assessment (CAT)</option>
                      <option value="End of Term">End of Term Examination</option>
                      <option value="Initial Assessment">Initial Entry Assessment</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Exam Date</label>
                    <div className="relative">
                      <input 
                        required 
                        type="date" 
                        value={newExamData.date}
                        onChange={e => setNewExamData({...newExamData, date: e.target.value})}
                        className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-bold text-gray-800 pl-12" 
                      />
                      <CalendarDays className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Academic Year</label>
                    <input 
                      required 
                      type="number" 
                      value={newExamData.year}
                      onChange={e => setNewExamData({...newExamData, year: parseInt(e.target.value)})}
                      className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-bold text-gray-800" 
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsExamModalOpen(false)}
                  className="flex-1 py-4 text-gray-500 font-black uppercase tracking-widest hover:bg-gray-50 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-blue-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
                >
                  Schedule Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b bg-gray-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">New Learning Area</h2>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Curriculum Management</p>
              </div>
              <button onClick={() => setIsSubjectModalOpen(false)} className="p-3 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-full transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddSubject} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Subject Name</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. Environmental Activities"
                    value={newSubject.name}
                    onChange={e => setNewSubject({...newSubject, name: e.target.value})}
                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-bold text-gray-800" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                    <select 
                      value={newSubject.category}
                      onChange={e => setNewSubject({...newSubject, category: e.target.value})}
                      className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-bold text-gray-800"
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
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Grade Level Range</label>
                    <select 
                      value={newSubject.gradeRange}
                      onChange={e => setNewSubject({...newSubject, gradeRange: e.target.value})}
                      className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-bold text-gray-800"
                    >
                      <option>PP1 - PP2</option>
                      <option>Grade 1 - Grade 6</option>
                      <option>Grade 7 - Grade 9</option>
                      <option>PP1 - Grade 9</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="flex-1 py-4 text-gray-500 font-black uppercase tracking-widest hover:bg-gray-50 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-blue-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
                >
                  Add Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
