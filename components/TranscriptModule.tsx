
import React, { useState, useMemo } from 'react';
import { Download, Printer, ShieldCheck, Loader2 } from 'lucide-react';
import { Student, ExamResult, CBCGrade } from '../types';
import { schoolService } from '../services/schoolService';

const DEFAULT_MOCK_RESULTS: ExamResult[] = [
  { subject: 'Mathematics', score: 85, grade: 'A', competency: CBCGrade.EE, remarks: 'Exhibits deep understanding of algebraic concepts.' },
  { subject: 'English Language', score: 78, grade: 'B+', competency: CBCGrade.ME, remarks: 'Articulate in oral presentations.' },
  { subject: 'Integrated Science', score: 82, grade: 'A-', competency: CBCGrade.EE, remarks: 'Exceptional observation in lab practicals.' },
  { subject: 'Social Studies', score: 70, grade: 'B', competency: CBCGrade.ME, remarks: 'Good grasp of historical timelines.' },
  { subject: 'Kiswahili', score: 92, grade: 'A', competency: CBCGrade.EE, remarks: 'Mwandishi mbunifu wa insha.' },
  { subject: 'Creative Arts & Sports', score: 88, grade: 'A', competency: CBCGrade.EE, remarks: 'Talented in graphic design and athletics.' },
];

interface TranscriptModuleProps {
  student?: Student;
  hideControls?: boolean;
  schoolLogo: string | null;
  schoolConfig: any;
}

export const TranscriptModule: React.FC<TranscriptModuleProps> = ({ student, hideControls = false, schoolLogo, schoolConfig }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const activeStudent = student || {
    id: 's1',
    admissionNumber: 'ADM/2024/048',
    firstName: 'Juma',
    lastName: 'Kipruto',
    class: 'Grade 7',
    stream: 'Eagle',
    gender: 'Male',
    dob: '2012-05-14',
    guardianPhone: '0711222333',
    guardianName: 'Robert Kipruto',
    feeBalance: 0
  } as Student;

  const displayResults = useMemo(() => {
    if (activeStudent.results && activeStudent.results.length > 0) {
      return activeStudent.results;
    }
    return DEFAULT_MOCK_RESULTS;
  }, [activeStudent.results]);

  const meanScore = useMemo(() => {
    if (displayResults.length === 0) return 0;
    const total = displayResults.reduce((sum, r) => sum + r.score, 0);
    return Math.round(total / displayResults.length);
  }, [displayResults]);

  const meanCompetency = useMemo(() => {
    return schoolService.calculateCBCGrade(meanScore);
  }, [meanScore]);

  const exportToPDF = (elementId: string, fileName: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    setIsDownloading(true);
    
    const opt = {
      margin: 0.2,
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 1.5, useCORS: true, logging: false },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    const h2p = (window as any).html2pdf;
    if (typeof h2p === 'function') {
      h2p().set(opt).from(element).save()
        .then(() => setIsDownloading(false))
        .catch(() => setIsDownloading(false));
    } else {
      setIsDownloading(false);
      window.print();
    }
  };

  return (
    <div className={`space-y-6 max-w-5xl mx-auto ${hideControls ? '' : 'pb-20'}`}>
      {!hideControls && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Student Report Card</h1>
            <p className="text-gray-500 font-medium">Academic Year: {schoolConfig?.year || new Date().getFullYear()} | Term: {schoolConfig?.term || 1}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => exportToPDF('reportcard-container', `Report_${activeStudent.firstName}_T${schoolConfig?.term || 1}.pdf`)} disabled={isDownloading} className="flex items-center space-x-2 border-2 border-gray-100 px-6 py-3 rounded-2xl hover:bg-gray-50 transition font-black uppercase text-xs tracking-widest text-gray-700 disabled:opacity-50">
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>Save PDF</span>
            </button>
            <button onClick={() => window.print()} className="flex items-center space-x-2 bg-gray-900 text-white px-6 py-3 rounded-2xl hover:bg-black transition shadow-lg font-black uppercase text-xs tracking-widest">
              <Printer className="w-4 h-4" />
              <span>Print Card</span>
            </button>
          </div>
        </div>
      )}

      <div className={`bg-white shadow-2xl mx-auto overflow-hidden p-16 relative ${hideControls ? 'mb-8' : ''}`} id="reportcard-container" style={{ minHeight: '1123px', width: '100%', maxWidth: '210mm', border: '1px solid #eee' }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] rotate-45 select-none">
          <ShieldCheck className="w-[600px] h-[600px]" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center border-b-4 border-blue-900 pb-10 mb-10">
          <div className="mb-6">
            {schoolLogo ? (
              <img src={schoolLogo} alt="Logo" className="w-32 h-32 rounded-[40px] border-4 border-white shadow-2xl object-cover" />
            ) : (
              <div className="w-32 h-32 rounded-[40px] bg-blue-900 flex items-center justify-center text-white text-4xl font-black shadow-2xl">ES</div>
            )}
          </div>
          <h2 className="text-5xl font-black text-blue-900 uppercase tracking-tighter leading-none mb-3">{schoolConfig?.schoolName || 'ElimuSmart Academy'}</h2>
          <div className="text-sm font-black text-gray-500 uppercase tracking-[0.4em] mb-2">{schoolConfig?.motto || 'Excellence in Knowledge and Character'}</div>
          <p className="text-gray-800 text-xs font-black uppercase tracking-widest">Reg No: {schoolConfig?.registrationNo || 'N/A'}</p>
          <div className="mt-10 bg-blue-900 text-white px-16 py-3 rounded-2xl text-xl font-black uppercase tracking-[0.2em] shadow-xl">Student Assessment Report Card</div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-12 mb-12 text-sm">
          <div className="space-y-4">
            <div className="flex justify-between border-b-2 border-gray-100 pb-2"><span className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Full Name:</span><span className="font-black text-gray-900 uppercase">{activeStudent.firstName} {activeStudent.lastName}</span></div>
            <div className="flex justify-between border-b-2 border-gray-100 pb-2"><span className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Adm No:</span><span className="font-mono font-black text-blue-700">{activeStudent.admissionNumber}</span></div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between border-b-2 border-gray-100 pb-2"><span className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Grade / Level:</span><span className="font-black text-gray-900 uppercase">{activeStudent.class} {activeStudent.stream && `• ${activeStudent.stream}`}</span></div>
            <div className="flex justify-between border-b-2 border-gray-100 pb-2"><span className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Academic Year:</span><span className="font-black text-gray-900 uppercase">{schoolConfig?.year || new Date().getFullYear()} • Term {schoolConfig?.term || 1}</span></div>
          </div>
        </div>

        <div className="relative z-10 mb-12">
          <table className="w-full text-left border-collapse border-4 border-gray-900">
            <thead>
              <tr className="bg-gray-100 text-gray-900 font-black uppercase text-[10px] tracking-widest">
                <th className="p-5 border-4 border-gray-900">Learning Area / Subject</th>
                <th className="p-5 border-4 border-gray-900 text-center">Score (%)</th>
                <th className="p-5 border-4 border-gray-900 text-center">CBC Assessment</th>
              </tr>
            </thead>
            <tbody className="text-[13px] font-medium">
              {displayResults.map((res, i) => (
                <tr key={i}>
                  <td className="p-5 border-4 border-gray-900 font-black text-gray-800 uppercase">{res.subject}</td>
                  <td className="p-5 border-4 border-gray-900 text-center font-mono font-black text-xl">{res.score}</td>
                  <td className="p-5 border-4 border-gray-900 text-center font-black text-blue-800 text-lg">{res.competency}</td>
                </tr>
              ))}
              <tr className="bg-blue-50">
                <td className="p-5 border-4 border-gray-900 font-black uppercase text-blue-900 text-lg">Mean Assessment Score</td>
                <td className="p-5 border-4 border-gray-900 text-center font-mono font-black text-3xl text-blue-900">{meanScore}</td>
                <td className="p-5 border-4 border-gray-900 text-center font-black text-blue-900 text-2xl uppercase tracking-widest">{meanCompetency}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="relative z-10 grid grid-cols-1 gap-6 mb-12">
           <div className="p-8 bg-gray-50 rounded-[32px] border-2 border-gray-100">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-3">Teacher's Remarks</h3>
              <p className="text-base font-medium text-gray-700 italic leading-relaxed">
                {activeStudent.results?.length ? activeStudent.results[0].remarks : `"Excellent effort and academic discipline. Keep up the high standard of performance."`}
              </p>
           </div>
           <div className="p-8 bg-blue-50/50 rounded-[32px] border-2 border-blue-100">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-3">Headteacher's Observations</h3>
              <p className="text-base font-medium text-blue-900 italic leading-relaxed">"Commendable progress this term. Character development is outstanding alongside academic merit."</p>
           </div>
        </div>

        <div className="relative z-10 mt-auto pt-10 border-t-4 border-gray-900">
          <div className="flex justify-between items-center mb-8">
            <div className="text-center">
               <div className="font-serif italic text-3xl text-blue-900 mb-1">Tr. Maina</div>
               <div className="w-56 h-[1px] bg-gray-900 mx-auto"></div>
               <p className="text-[10px] text-gray-500 font-black mt-2 uppercase tracking-widest">Headteacher's Signature</p>
            </div>
            <div className="w-32 h-32 rounded-full border-8 border-double border-blue-900/10 flex items-center justify-center rotate-[-12deg] shadow-inner">
               <div className="text-[10px] font-black text-blue-900/20 text-center uppercase leading-none font-mono">OFFICIAL SEAL<br/>{schoolConfig?.schoolName || 'ELIMUSMART'}<br/>ACADEMY</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
