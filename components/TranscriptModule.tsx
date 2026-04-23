
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
  classTeacherName?: string;
  examinationOfficerName?: string;
  reportType?: 'academic' | 'attendance' | 'finance';
}

export const TranscriptModule: React.FC<TranscriptModuleProps> = ({ 
  student, 
  hideControls = false, 
  schoolLogo, 
  schoolConfig,
  principalName = 'Principal Maina',
  classTeacherName = 'Tr. Sarah Wambui',
  examinationOfficerName = 'Mr. John Koech',
  reportType = 'academic'
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
    return displayResults.length > 0 ? schoolService.calculateCBCGrade(meanScore) : null;
  }, [meanScore, displayResults]);

  const attendanceStats = useMemo(() => {
    const events = activeStudent.attendance || [];
    const presentCount = events.filter(e => e.status === 'present').length;
    const lateCount = events.filter(e => e.status === 'late').length;
    const absentCount = events.filter(e => e.status === 'absent').length;
    const total = events.length;
    const rate = total > 0 ? Math.round(((presentCount + lateCount) / total) * 100) : 0;

    // Longitudinal Monthly Breakdown
    const monthlyMap: Record<string, { openings: number, attended: number }> = {};
    events.forEach(e => {
      const month = new Date(e.date).toLocaleString('default', { month: 'long' });
      if (!monthlyMap[month]) monthlyMap[month] = { openings: 0, attended: 0 };
      monthlyMap[month].openings++;
      if (e.status !== 'absent') monthlyMap[month].attended++;
    });

    return { 
      present: presentCount, 
      late: lateCount, 
      absent: absentCount, 
      total, 
      rate,
      breakdown: Object.entries(monthlyMap).map(([month, data]) => ({
        month,
        ...data,
        percent: data.openings > 0 ? Math.round((data.attended / data.openings) * 100) : 0
      }))
    };
  }, [activeStudent.attendance]);

  const exportToPDF = (elementId: string, fileName: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    setIsDownloading(true);
    
    const opt = {
      margin: 0,
      filename: fileName,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false, 
        letterRendering: true,
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
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
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">
              {reportType === 'academic' ? 'Official Report Card' : reportType === 'attendance' ? 'Attendance Statement' : 'Financial Statement'}
            </h1>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-3">Term {schoolConfig?.term || 1} • {activeStudent.firstName} {activeStudent.lastName}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => exportToPDF('reportcard-container', `Report_${activeStudent.firstName}_T${schoolConfig?.term || 1}.pdf`)} disabled={isDownloading} className="flex items-center gap-3 bg-white border-2 border-gray-100 px-6 py-4 rounded-[24px] hover:bg-gray-50 transition-all font-black uppercase text-[10px] tracking-widest text-gray-700 disabled:opacity-50 shadow-sm">
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-red-600" />}
              <span>Save PDF</span>
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-[24px] hover:bg-black transition-all shadow-xl font-black uppercase text-[10px] tracking-widest border-b-4 border-black active:scale-95">
              <Printer className="w-4 h-4" />
              <span>Print Output</span>
            </button>
          </div>
        </div>
      )}

      <div 
        className={`bg-white mx-auto relative overflow-hidden print:shadow-none print:border-0 ${hideControls ? 'mb-4' : ''}`} 
        id="reportcard-container" 
        style={{ 
          width: '210mm', 
          height: '296.5mm', 
          padding: '10mm', 
          border: '1px solid #eee',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page { size: A4; margin: 0; }
            body { margin: 0; padding: 0; background: white !important; -webkit-print-color-adjust: exact !important; }
            .no-print { display: none !important; }
            #reportcard-container { 
              margin: 0 !important; 
              border: none !important; 
              width: 210mm !important; 
              height: 297mm !important; 
              padding: 10mm !important;
              box-shadow: none !important;
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              z-index: 9999 !important;
              box-sizing: border-box !important;
              page-break-after: avoid !important;
              page-break-before: avoid !important;
            }
            main, nav, footer, aside, header { display: none !important; }
            body > div:not(#reportcard-container) { display: none !important; }
            #reportcard-container, #reportcard-container * {
              visibility: visible !important;
            }
          }
        `}} />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] rotate-12 select-none">
          <ShieldCheck className="w-[600px] h-[600px]" />
        </div>

        {/* HEADER SECTION */}
        <div className="relative z-10 flex flex-col items-center text-center border-b-4 border-red-900 pb-6 mb-6">
          <div className="flex items-center gap-8 mb-4">
            {schoolLogo ? (
              <img src={schoolLogo} alt="Logo" className="w-24 h-24 rounded-[24px] border-4 border-white shadow-xl object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-[24px] bg-red-900 flex items-center justify-center text-white text-3xl font-black shadow-xl">ES</div>
            )}
            <div className="text-left">
              <h2 className="text-3xl font-black text-red-900 uppercase tracking-tighter leading-none mb-1">{schoolConfig?.schoolName || 'ElimuSmart Academy'}</h2>
              <div className="text-[9px] font-black text-gray-400 font-mono uppercase tracking-[0.3em] mb-2">{schoolConfig?.motto || 'Excellence through Innovation'}</div>
              <p className="text-gray-900 text-[9px] font-black uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full border border-gray-100 inline-block">Reg No: {schoolConfig?.registrationNo || 'MOE/P/2024/0981'}</p>
            </div>
          </div>
          <div className="w-full bg-red-900 text-white py-2 rounded-xl text-lg font-black uppercase tracking-[0.4em] shadow-lg border-b-4 border-red-800">
            {reportType === 'academic' ? 'Student Progress Report' : reportType === 'attendance' ? 'Institutional Presence Audit' : 'Learner Financial Statement'}
          </div>
        </div>

        {/* BIO SECTION */}
        <div className="relative z-10 grid grid-cols-4 gap-4 mb-6 bg-gray-50/50 p-5 rounded-[24px] border border-gray-100/50">
          <div className="space-y-3">
            <div>
              <p className="text-[7px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Full Legal Name</p>
              <p className="font-black text-gray-900 uppercase text-xs leading-none">{activeStudent.firstName} {activeStudent.lastName}</p>
            </div>
            <div>
              <p className="text-[7px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Gender</p>
              <p className="font-black text-gray-900 uppercase text-[10px] leading-none">{activeStudent.gender}</p>
            </div>
          </div>
          <div className="space-y-3 border-l-2 border-gray-100/50 pl-4">
            <div>
              <p className="text-[7px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Admission Index</p>
              <p className="font-mono font-black text-red-700 text-sm tracking-tighter leading-none">{activeStudent.admissionNumber}</p>
            </div>
            <div>
              <p className="text-[7px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Academic Cycle</p>
              <p className="font-black text-gray-900 uppercase text-[10px] leading-none">Term {schoolConfig?.term || 1} • {schoolConfig?.year || 2024}</p>
            </div>
          </div>
          <div className="space-y-3 border-l-2 border-gray-100/50 pl-4">
            <div>
              <p className="text-[7px] font-black text-red-900/40 uppercase tracking-[0.2em] mb-0.5">Academic Stream</p>
              <p className="font-black text-gray-900 uppercase text-xs leading-none">{activeStudent.class} {activeStudent.stream && `• ${activeStudent.stream}`}</p>
            </div>
            <div>
              <p className="text-[7px] font-black text-red-900/40 uppercase tracking-[0.2em] mb-0.5">Issue Date</p>
              <p className="font-black text-gray-900 uppercase text-[10px] leading-none">{new Intl.DateTimeFormat('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())}</p>
            </div>
          </div>
          <div className="space-y-3 border-l-2 border-gray-100/50 pl-4">
            <div>
              <p className="text-[7px] font-black text-red-900/40 uppercase tracking-[0.2em] mb-0.5">Class Teacher</p>
              <p className="font-black text-red-900 uppercase text-xs leading-none italic underline decoration-red-200">{classTeacherName}</p>
            </div>
            <div>
              <p className="text-[7px] font-black text-red-900/40 uppercase tracking-[0.2em] mb-0.5">ID Status</p>
              <p className="font-black text-gray-900 uppercase text-[10px] leading-none">Active • Verified</p>
            </div>
          </div>
        </div>

        {/* DATA SECTION */}
        <div className="relative z-10 mb-6 flex-grow">
          {reportType === 'academic' && (
            <>
              {displayResults.length > 0 ? (
                <>
                  <table className="w-full text-left border-collapse border-4 border-red-900/5">
                    <thead>
                      <tr className="bg-gray-900 text-white font-black uppercase text-[9px] tracking-[0.3em]">
                        <th className="p-3 border border-gray-800">Learning Area</th>
                        <th className="p-3 border border-gray-800 text-center">Competency Level</th>
                        <th className="p-3 border border-gray-800 text-center">Score</th>
                        <th className="p-3 border border-gray-800 text-center">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayResults.map((res, i) => {
                        const assessment = schoolService.calculateCBCGrade(res.score);
                        return (
                          <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                            <td className="p-3 border border-gray-100 font-black text-gray-800 uppercase text-sm tracking-tight">{res.subject}</td>
                            <td className="p-3 border border-gray-100 text-center">
                              <div className="font-black text-red-900 text-sm leading-none">{assessment.level}</div>
                              <div className="text-[7px] text-gray-400 font-black uppercase tracking-widest mt-0.5">{assessment.descriptor}</div>
                            </td>
                            <td className="p-3 border border-gray-100 text-center font-mono font-black text-lg text-red-900">{res.score}</td>
                            <td className="p-3 border border-gray-100 text-center font-mono font-black text-lg text-red-700">{assessment.points.toFixed(1)}</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-red-900 text-white">
                        <td className="p-4 border border-red-800 font-black uppercase text-base tracking-tight">Mean Aggregate Assessment</td>
                        <td className="p-4 border border-red-800 text-center font-black text-base uppercase">{meanCompetency?.level || 'N/A'}</td>
                        <td className="p-4 border border-red-800 text-center font-mono font-black text-2xl">{meanScore}</td>
                        <td className="p-4 border border-red-800 text-center font-mono font-black text-xl">{meanCompetency?.points.toFixed(1) || '0.0'}</td>
                      </tr>
                    </tbody>
                  </table>
                  {/* GRADING LEGEND */}
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {[
                      { l: 'EE', d: 'Exceeding Expectations', c: 'bg-emerald-50 text-emerald-700' },
                      { l: 'ME', d: 'Meeting Expectations', c: 'bg-blue-50 text-blue-700' },
                      { l: 'AE', d: 'Approaching Expectations', c: 'bg-amber-50 text-amber-700' },
                      { l: 'BE', d: 'Below Expectations', c: 'bg-red-50 text-red-700' }
                    ].map(grade => (
                      <div key={grade.l} className={`p-2 rounded-lg border border-current opacity-40 flex items-center gap-2 ${grade.c}`}>
                        <span className="font-black text-[10px]">{grade.l}</span>
                        <span className="text-[7px] font-bold uppercase tracking-tighter truncate">{grade.d}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-16 text-center bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-100">
                  <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em]">No terminal assessments recorded.</p>
                </div>
              )}
            </>
          )}

          {reportType === 'attendance' && (
            <div className="space-y-8">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-6 bg-green-50 rounded-3xl border-2 border-green-100 text-center">
                  <p className="text-[9px] font-black text-green-600 uppercase tracking-widest mb-1">Total Present</p>
                  <p className="text-3xl font-black text-green-900 leading-none">{attendanceStats.present}</p>
                  <p className="text-[8px] font-bold text-green-500 uppercase mt-2">Days Attended</p>
                </div>
                <div className="p-6 bg-red-50 rounded-3xl border-2 border-red-100 text-center">
                  <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">Total Absent</p>
                  <p className="text-3xl font-black text-red-900 leading-none">{attendanceStats.absent}</p>
                  <p className="text-[8px] font-bold text-red-500 uppercase mt-2">Excused/Unexcused</p>
                </div>
                <div className="p-6 bg-blue-50 rounded-3xl border-2 border-blue-100 text-center">
                  <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Attendance Rate</p>
                  <p className="text-3xl font-black text-blue-900 leading-none">{attendanceStats.rate}%</p>
                  <p className="text-[8px] font-bold text-blue-500 uppercase mt-2">Term Average</p>
                </div>
              </div>
              
              {attendanceStats.breakdown.length > 0 ? (
                <table className="w-full text-left border-collapse border-4 border-red-900/5">
                   <thead>
                      <tr className="bg-gray-900 text-white font-black uppercase text-[9px] tracking-[0.3em]">
                         <th className="p-4 border border-gray-800">Month</th>
                         <th className="p-4 border border-gray-800 text-center">Openings</th>
                         <th className="p-4 border border-gray-800 text-center">Attended</th>
                         <th className="p-4 border border-gray-800 text-right">Percentage</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                      {attendanceStats.breakdown.map((row, idx) => (
                        <tr key={row.month} className={`font-black text-[11px] uppercase ${idx % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
                           <td className="p-4 text-gray-900 text-sm">{row.month}</td>
                           <td className="p-4 text-center text-gray-500">{row.openings}</td>
                           <td className="p-4 text-center text-red-900">{row.attended}</td>
                           <td className="p-4 text-right text-gray-900">{row.percent}%</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
              ) : (
                <div className="py-16 text-center bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-100">
                  <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em]">No longitudinal attendance records found.</p>
                </div>
              )}
              
              <div className="p-6 bg-gray-50 rounded-3xl border-2 border-white shadow-inner">
                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Longitudinal Context</p>
                 <p className="text-xs font-bold text-gray-600 leading-relaxed font-serif">
                   {attendanceStats.rate >= 90 
                     ? "Learner demonstrates consistent discipline in attendance. Punctual arrivals recorded for most term openings."
                     : attendanceStats.rate >= 75
                     ? "Moderate consistency in attendance. Some irregular absences noted that may impact academic progression."
                     : attendanceStats.total > 0
                     ? "Critical attendance concerns identified. Urgent institutional intervention required to stabilize learner presence."
                     : "Awaiting sufficient longitudinal data for context appraisal."}
                 </p>
              </div>
            </div>
          )}

          {reportType === 'finance' && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-8 bg-blue-50 rounded-[32px] border-2 border-white shadow-sm">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-4">Invoice Summary</p>
                    <div className="space-y-3">
                       <div className="flex justify-between items-center"><span className="text-[9px] font-black text-gray-400 uppercase">Grade Instruction</span><span className="font-black text-gray-900">KES {(activeStudent.totalFee || 0).toLocaleString()}</span></div>
                       <div className="flex justify-between items-center"><span className="text-[9px] font-black text-gray-400 uppercase">Transport Levy</span><span className="font-black text-gray-900">KES {(activeStudent.transportFee || 0).toLocaleString()}</span></div>
                       <div className="flex justify-between items-center pt-3 border-t-2 border-blue-100/50"><span className="text-[10px] font-black text-blue-800 uppercase">Gross Liability</span><span className="font-black text-blue-900 text-lg">KES {((activeStudent.agreedFee ?? activeStudent.totalFee) + (activeStudent.transportFee || 0)).toLocaleString()}</span></div>
                    </div>
                 </div>
                 <div className="p-8 bg-emerald-50 rounded-[32px] border-2 border-white shadow-sm">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-4">Collection Status</p>
                    <div className="space-y-3">
                       <div className="flex justify-between items-center"><span className="text-[9px] font-black text-gray-400 uppercase">Payments to Date</span><span className="font-black text-emerald-600">KES {(activeStudent.paidFee + (activeStudent.paidTransportFee || 0)).toLocaleString()}</span></div>
                       <div className="flex justify-between items-center"><span className="text-[9px] font-black text-gray-400 uppercase">Unallocated Credit</span><span className="font-black text-emerald-700">KES {(activeStudent.prepaidFee || 0).toLocaleString()}</span></div>
                       <div className="flex justify-between items-center pt-3 border-t-2 border-emerald-100/50"><span className="text-[10px] font-black text-emerald-800 uppercase">Net Outstanding</span><span className="font-black text-red-600 text-lg">KES {(activeStudent.feeBalance + ((activeStudent.transportFee || 0) - (activeStudent.paidTransportFee || 0))).toLocaleString()}</span></div>
                    </div>
                 </div>
              </div>

              <div className="border-4 border-red-900/5 rounded-2xl overflow-hidden">
                 <div className="bg-gray-900 text-white p-4 font-black uppercase text-[10px] tracking-[0.3em]">Transaction Ledger (Current Cycle)</div>
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="bg-gray-50 border-b border-gray-100 text-[9px] font-black text-gray-400 uppercase">
                          <th className="p-4">Reference</th>
                          <th className="p-4">Date</th>
                          <th className="p-4 text-right">Debit (KES)</th>
                          <th className="p-4 text-right">Credit (KES)</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       <tr className="text-[10px] font-black uppercase text-gray-900">
                          <td className="p-4">Term Opening Invoice</td>
                          <td className="p-4 text-gray-400">03 Jan 2024</td>
                          <td className="p-4 text-right">{((activeStudent.agreedFee ?? activeStudent.totalFee) + (activeStudent.transportFee || 0)).toLocaleString()}</td>
                          <td className="p-4 text-right">0</td>
                       </tr>
                       {activeStudent.paidFee > 0 && (
                         <tr className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50/20">
                            <td className="p-4">Electronic Funds Transfer</td>
                            <td className="p-4 text-emerald-400">15 Jan 2024</td>
                            <td className="p-4 text-right">0</td>
                            <td className="p-4 text-right">{(activeStudent.paidFee + (activeStudent.paidTransportFee || 0)).toLocaleString()}</td>
                         </tr>
                       )}
                    </tbody>
                 </table>
              </div>
              <div className="p-6 bg-red-900/5 rounded-3xl border-2 border-red-900/10 flex justify-between items-center">
                 <div>
                    <p className="text-[8px] font-black text-red-900 uppercase tracking-widest mb-1">Institutional Status</p>
                    <p className="text-xs font-bold text-red-900 leading-none">
                       {activeStudent.feeBalance > 0 ? "Account currently in arrears. Clearance requested." : "Account cleared. Institutional standing: Active."}
                    </p>
                 </div>
                 <div className="px-6 py-2 bg-white rounded-xl border border-red-900/10 font-black text-red-900 text-[10px] uppercase truncate">Official Ledger Receipt</div>
              </div>
            </div>
          )}
        </div>

        {/* REMARKS SECTION */}
        <div className="relative z-10 grid grid-cols-2 gap-6 mb-8 mt-auto">
           <div className="p-5 bg-gray-50/80 rounded-[32px] border-2 border-white shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-gray-200"></div>
              <h3 className="text-[7px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2 flex items-center gap-2">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div> 
                Teacher's Academic Appraisal
              </h3>
              <p className="text-[11px] font-bold text-gray-700 leading-relaxed font-serif italic">
                "{displayResults.length > 0 ? (displayResults[0].remarks || "Consistent effort observed. Encouraged to maintain focus on technical subjects.") : "Awaiting final academic appraisal."}"
              </p>
           </div>
           <div className="p-5 bg-red-900/[0.03] rounded-[32px] border-2 border-red-900/5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-900/20"></div>
              <h3 className="text-[7px] font-black uppercase tracking-[0.3em] text-red-900/40 mb-2 flex items-center gap-2">
                <div className="w-1 h-1 bg-red-900/40 rounded-full"></div>
                Institutional Head's Comment
              </h3>
              <p className="text-[11px] font-bold leading-relaxed font-serif text-red-900/80 italic">
                "Satisfactory progression. Character development mirrors the institution's commitment to excellence and discipline."
              </p>
           </div>
        </div>

        {/* SIGNATURE SECTION */}
        <div className="relative z-10 pt-4 border-t-4 border-red-900">
          <div className="grid grid-cols-3 gap-12 items-end mb-12">
            <div className="text-center">
               <div className="font-serif text-[11px] text-gray-900 h-10 flex items-end justify-center pb-2 italic leading-none">{examinationOfficerName}</div>
               <div className="w-full h-0.5 bg-gray-100 mx-auto"></div>
               <p className="text-[7px] text-red-900/40 font-black uppercase tracking-[0.2em] mt-2.5">Exam Officer</p>
            </div>

            <div className="text-center">
               <div className="font-serif text-[11px] text-red-900 h-10 flex items-end justify-center pb-2 italic font-black leading-none">{principalName}</div>
               <div className="w-full h-0.5 bg-red-100 mx-auto"></div>
               <p className="text-[7px] text-red-900/60 font-black uppercase tracking-[0.2em] mt-2.5">Principal / Head</p>
            </div>

            <div className="text-center">
               <div className="font-serif text-[10px] text-gray-500 h-10 flex items-end justify-center pb-2 italic leading-none">
                 {new Intl.DateTimeFormat('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())}
               </div>
               <div className="w-full h-0.5 bg-gray-100 mx-auto"></div>
               <p className="text-[7px] text-red-900/40 font-black uppercase tracking-[0.2em] mt-2.5">Issue Date</p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-50 relative">
             <div className="w-24 h-24 rounded-full border-4 border-double border-red-900/10 flex items-center justify-center rotate-[-15deg] shadow-inner absolute -top-16 right-4 sm:right-12 bg-white/60 backdrop-blur-[2px] z-20 pointer-events-none">
                <div className="text-[6px] font-black text-red-900/30 text-center uppercase leading-tight font-mono tracking-tighter">
                  OFFICIAL SEAL<br/>
                  {schoolConfig?.schoolName?.split(' ')[0] || 'ELIMUSMART'}<br/>
                  {new Date().getFullYear()}
                </div>
             </div>
             <p className="text-[6px] text-gray-200 font-black uppercase tracking-[0.4em] italic">Validated Electronic Document</p>
             <p className="text-[6px] text-gray-300 font-black uppercase tracking-[0.2em]">Audit ID: ES-TR-{Math.random().toString(36).substring(2, 8).toUpperCase()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
