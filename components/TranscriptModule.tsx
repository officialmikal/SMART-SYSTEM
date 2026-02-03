
import React, { useState, useMemo } from 'react';
import { Download, Printer, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { Student, ExamResult, CBCGrade } from '../types';
import { schoolService } from '../services/schoolService';

interface TranscriptModuleProps {
  student?: Student;
  hideControls?: boolean;
  schoolLogo: string | null;
  schoolConfig: any;
  principalName?: string;
}

export const TranscriptModule: React.FC<TranscriptModuleProps> = ({ 
  student, 
  hideControls = false, 
  schoolLogo, 
  schoolConfig,
  principalName = 'Principal Maina'
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const activeStudent = student || ({
    id: 's1',
    admissionNumber: 'ADM/2024/048',
    firstName: 'System',
    lastName: 'Preview',
    class: 'Grade 7',
    stream: 'Eagle',
    gender: 'Male',
    dob: '2012-05-14',
    guardianPhone: '0711222333',
    guardianName: 'Robert Kipruto',
    feeBalance: 0,
    totalFee: 0,
    paidFee: 0,
    prepaidFee: 0,
    results: []
  } as Student);

  const displayResults = useMemo(() => {
    // Priority: Real Data -> Empty Array (don't show mock if student is real but has no marks)
    return activeStudent.results || [];
  }, [activeStudent.results]);

  const meanScore = useMemo(() => {
    if (displayResults.length === 0) return 0;
    const total = displayResults.reduce((sum, r) => sum + r.score, 0);
    return Math.round(total / displayResults.length);
  }, [displayResults]);

  const meanCompetency = useMemo(() => {
    return displayResults.length > 0 ? schoolService.calculateCBCGrade(meanScore) : 'N/A';
  }, [meanScore, displayResults]);

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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print bg-white p-8 rounded-[40px] shadow-2xl border-2 border-gray-50">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">Official Report Card</h1>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-3">Term {schoolConfig?.term || 1} • {activeStudent.firstName} {activeStudent.lastName}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => exportToPDF('reportcard-container', `Report_${activeStudent.firstName}_T${schoolConfig?.term || 1}.pdf`)} disabled={isDownloading} className="flex items-center gap-3 bg-white border-2 border-gray-100 px-6 py-4 rounded-[24px] hover:bg-gray-50 transition-all font-black uppercase text-[10px] tracking-widest text-gray-700 disabled:opacity-50 shadow-sm">
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-blue-600" />}
              <span>Save PDF</span>
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-[24px] hover:bg-black transition-all shadow-xl font-black uppercase text-[10px] tracking-widest border-b-4 border-black active:scale-95">
              <Printer className="w-4 h-4" />
              <span>Print Output</span>
            </button>
          </div>
        </div>
      )}

      <div className={`bg-white shadow-2xl mx-auto overflow-hidden p-16 relative ${hideControls ? 'mb-8' : ''}`} id="reportcard-container" style={{ minHeight: '1123px', width: '100%', maxWidth: '210mm', border: '1px solid #eee' }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.01] rotate-12 select-none">
          <ShieldCheck className="w-[800px] h-[800px]" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center border-b-8 border-blue-900 pb-12 mb-12">
          <div className="mb-8">
            {schoolLogo ? (
              <img src={schoolLogo} alt="Logo" className="w-36 h-36 rounded-[48px] border-8 border-white shadow-2xl object-cover" />
            ) : (
              <div className="w-36 h-36 rounded-[48px] bg-blue-900 flex items-center justify-center text-white text-5xl font-black shadow-2xl">ES</div>
            )}
          </div>
          <h2 className="text-5xl font-black text-blue-900 uppercase tracking-tighter leading-none mb-4 italic">{schoolConfig?.schoolName || 'ElimuSmart Academy'}</h2>
          <div className="text-[11px] font-black text-gray-400 uppercase tracking-[0.5em] mb-4 opacity-70">"{schoolConfig?.motto || 'Excellence in Knowledge and Character'}"</div>
          <p className="text-gray-900 text-xs font-black uppercase tracking-widest bg-gray-50 px-6 py-1 rounded-full border border-gray-100">Ministry Registration: {schoolConfig?.registrationNo || 'MOE/P/2024/0981'}</p>
          <div className="mt-12 bg-blue-900 text-white px-20 py-4 rounded-[32px] text-2xl font-black uppercase tracking-[0.3em] shadow-2xl italic border-b-8 border-blue-800">Learner's Assessment Summary</div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-16 mb-16">
          <div className="space-y-6">
            <div className="flex justify-between items-end border-b-2 border-gray-50 pb-3"><span className="text-gray-300 font-black uppercase text-[9px] tracking-[0.2em]">Learner Name:</span><span className="font-black text-gray-900 uppercase text-lg italic">{activeStudent.firstName} {activeStudent.lastName}</span></div>
            <div className="flex justify-between items-end border-b-2 border-gray-50 pb-3"><span className="text-gray-300 font-black uppercase text-[9px] tracking-[0.2em]">Admission ID:</span><span className="font-mono font-black text-blue-700 text-xl tracking-tighter">{activeStudent.admissionNumber}</span></div>
          </div>
          <div className="space-y-6">
            <div className="flex justify-between items-end border-b-2 border-gray-50 pb-3"><span className="text-gray-300 font-black uppercase text-[9px] tracking-[0.2em]">Level / Section:</span><span className="font-black text-gray-900 uppercase text-lg italic">{activeStudent.class} {activeStudent.stream && `• ${activeStudent.stream}`}</span></div>
            <div className="flex justify-between items-end border-b-2 border-gray-50 pb-3"><span className="text-gray-300 font-black uppercase text-[9px] tracking-[0.2em]">Academic Cycle:</span><span className="font-black text-gray-900 uppercase text-lg italic">{schoolConfig?.year || 2024} • Term {schoolConfig?.term || 1}</span></div>
          </div>
        </div>

        <div className="relative z-10 mb-16">
          {displayResults.length > 0 ? (
            <table className="w-full text-left border-collapse border-8 border-blue-900/10">
              <thead>
                <tr className="bg-gray-900 text-white font-black uppercase text-[10px] tracking-[0.4em]">
                  <th className="p-6 border-2 border-gray-800">Learning Area / Subject</th>
                  <th className="p-6 border-2 border-gray-800 text-center">Score (%)</th>
                  <th className="p-6 border-2 border-gray-800 text-center">CBC Descriptor</th>
                </tr>
              </thead>
              <tbody>
                {displayResults.map((res, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="p-6 border-2 border-gray-100 font-black text-gray-800 uppercase italic text-base tracking-tighter">{res.subject}</td>
                    <td className="p-6 border-2 border-gray-100 text-center font-mono font-black text-2xl text-blue-900">{res.score}</td>
                    <td className="p-6 border-2 border-gray-100 text-center">
                      <span className={`px-4 py-1 rounded-lg font-black text-sm uppercase tracking-widest ${
                        res.competency === CBCGrade.EE ? 'text-green-600' :
                        res.competency === CBCGrade.ME ? 'text-blue-600' :
                        res.competency === CBCGrade.AE ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {res.competency}
                      </span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-blue-900 text-white">
                  <td className="p-8 border-4 border-blue-800 font-black uppercase text-xl italic tracking-tighter">Mean Aggregate Assessment</td>
                  <td className="p-8 border-4 border-blue-800 text-center font-mono font-black text-5xl">{meanScore}</td>
                  <td className="p-8 border-4 border-blue-800 text-center font-black text-3xl uppercase tracking-widest italic">{meanCompetency}</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div className="py-32 text-center bg-gray-50 rounded-[48px] border-4 border-dashed border-gray-100">
               <AlertCircle className="w-20 h-20 text-gray-200 mx-auto mb-6" />
               <p className="text-[12px] font-black uppercase text-gray-400 tracking-[0.4em] italic">No official results recorded for this term.</p>
            </div>
          )}
        </div>

        <div className="relative z-10 grid grid-cols-1 gap-10 mb-20">
           <div className="p-10 bg-gray-50 rounded-[48px] border-4 border-white shadow-inner">
              <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400 mb-6 flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> Class Teacher's Professional Observations</h3>
              <p className="text-xl font-bold text-gray-700 italic leading-relaxed font-serif">
                {displayResults.length > 0 ? (displayResults[0].remarks || "Consistent effort maintained throughout the term.") : "Awaiting final terminal assessments."}
              </p>
           </div>
           <div className="p-10 bg-blue-900 text-white rounded-[48px] border-4 border-blue-800 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><ShieldCheck size={160} /></div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-300 mb-6 relative z-10">Institutional Headteacher's Remarks</h3>
              <p className="text-xl font-bold italic leading-relaxed font-serif relative z-10">"Performance metrics indicate strong academic discipline. Character growth aligns with the school's core pillars of excellence."</p>
           </div>
        </div>

        <div className="relative z-10 mt-auto pt-16 border-t-8 border-blue-900">
          <div className="flex justify-between items-end mb-12">
            <div className="text-center space-y-4">
               <div className="font-serif italic text-4xl text-blue-900">{principalName}</div>
               <div className="w-72 h-[2px] bg-blue-900 shadow-sm"></div>
               <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.5em]">Executive Signature</p>
            </div>
            <div className="w-44 h-44 rounded-full border-[12px] border-double border-blue-900/10 flex items-center justify-center rotate-[-15deg] shadow-inner relative">
               <div className="text-[10px] font-black text-blue-900/20 text-center uppercase leading-tight font-mono tracking-tighter">
                 OFFICIAL SCHOOL SEAL<br/>
                 {schoolConfig?.schoolName || 'ELIMUSMART'}<br/>
                 ACADEMIC AUDIT<br/>
                 {new Date().getFullYear()}
               </div>
            </div>
          </div>
          <div className="text-center pt-8 border-t border-gray-50">
             <p className="text-[8px] text-gray-300 font-black uppercase tracking-[0.6em] opacity-50">ElimuSmart Digital Integrity Protocol • Certificate No: ES-ASSESS-{Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
