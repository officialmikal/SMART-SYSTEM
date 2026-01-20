
import React, { useState, useEffect } from 'react';
import { FileText, Download, Printer, Wand2, ShieldCheck, Loader2, Award, CheckCircle } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { Student, ExamResult, CBCGrade } from '../types';
import { schoolService, AcademicConfig } from '../services/schoolService';

const MOCK_TRANSCRIPT_STUDENT: Student = {
  id: 's1',
  admissionNumber: 'ADM/2024/048',
  firstName: 'Juma',
  lastName: 'Kipruto',
  class: 'JSS Grade 7',
  stream: 'Eagle',
  gender: 'Male',
  dob: '2012-05-14',
  guardianPhone: '0711222333',
  guardianName: 'Robert Kipruto',
  feeBalance: 0
};

const MOCK_RESULTS: ExamResult[] = [
  { subject: 'Mathematics', score: 85, grade: 'A', competency: CBCGrade.EE, remarks: 'Excellent logical reasoning.' },
  { subject: 'English Language', score: 78, grade: 'B+', competency: CBCGrade.ME, remarks: 'Strong creative writing skills.' },
  { subject: 'Integrated Science', score: 82, grade: 'A-', competency: CBCGrade.EE, remarks: 'Very inquisitive in lab experiments.' },
  { subject: 'Social Studies', score: 70, grade: 'B', competency: CBCGrade.ME, remarks: 'Good grasp of civic duties.' },
  { subject: 'Kiswahili', score: 92, grade: 'A', competency: CBCGrade.EE, remarks: 'Lugha sanifu na fasaha.' },
  { subject: 'Creative Arts & Sports', score: 88, grade: 'A', competency: CBCGrade.EE, remarks: 'Exceptional athletic performance.' },
];

export const TranscriptModule: React.FC = () => {
  const [config, setConfig] = useState<AcademicConfig | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiRemarks, setAiRemarks] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  useEffect(() => {
    schoolService.getAcademicConfig()
      .then(data => setConfig(data))
      .finally(() => setIsLoadingConfig(false));
  }, []);

  const generateAIRemarks = async () => {
    if (!process.env.API_KEY) {
      setAiRemarks('Juma demonstrates exceptional aptitude in logical reasoning and languages. He is a self-driven learner with great potential for CBC Level 4 competencies.');
      return;
    }

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Based on these results for a Grade 7 Kenyan student named ${MOCK_TRANSCRIPT_STUDENT.firstName}: 
        ${MOCK_RESULTS.map(r => `${r.subject}: ${r.score}% (${r.competency})`).join(', ')}.
        Provide a concise, encouraging, professional summary for a report card in 50 words. Focus on strengths and one area for improvement. Ensure the tone is academic yet supportive.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      setAiRemarks(response.text || 'Performance is consistent and commendable.');
    } catch (error) {
      console.error(error);
      setAiRemarks('Student shows remarkable growth and discipline in all learning areas.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    const element = document.getElementById('printable-transcript');
    const filename = `Transcript_${MOCK_TRANSCRIPT_STUDENT.firstName}_${MOCK_TRANSCRIPT_STUDENT.lastName}_${config?.year || 2024}.pdf`;
    
    const opt = {
      margin: 0.5,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('PDF Generation Error:', error);
      alert('Failed to generate PDF. Falling back to browser print.');
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoadingConfig) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-gray-500 font-medium tracking-tight">Accessing school records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Official Transcript</h1>
          <p className="text-gray-500 font-medium">Academic Year: {config?.year} | Term: {config?.term}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={generateAIRemarks}
            disabled={isGenerating}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition shadow-lg shadow-indigo-100 font-bold"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            <span>AI Remarks</span>
          </button>
          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center space-x-2 border-2 border-gray-200 px-5 py-2.5 rounded-xl hover:bg-gray-50 transition font-bold text-gray-700"
          >
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Download PDF</span>
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center space-x-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl hover:bg-black transition shadow-lg shadow-gray-200 font-bold"
          >
            <Printer className="w-4 h-4" />
            <span>Print Transcript</span>
          </button>
        </div>
      </div>

      {/* Transcript Document Area - Styled as A4 */}
      <div className="bg-white shadow-2xl mx-auto overflow-hidden p-10 md:p-16 relative" id="printable-transcript" style={{ minHeight: '1123px', width: '100%', maxWidth: '210mm', border: '1px solid #e5e7eb' }}>
        
        {/* Decorative Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] rotate-45 select-none">
          <ShieldCheck className="w-[600px] h-[600px]" />
        </div>

        {/* School Header */}
        <div className="relative z-10 flex flex-col items-center text-center border-b-4 border-blue-900 pb-8 mb-8">
          <div className="mb-4">
            <img 
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${config?.schoolName || 'School'}&backgroundColor=1e3a8a&fontFamily=Inter&fontSize=45&bold=true`} 
              alt="School Logo" 
              className="w-28 h-28 rounded-xl border-4 border-white shadow-xl bg-blue-900 object-cover"
            />
          </div>

          <div className="w-full flex flex-col items-center">
            <h2 className="text-4xl font-black text-blue-900 uppercase tracking-tighter leading-none mb-2">{config?.schoolName}</h2>
            <div className="text-sm font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Motto: {config?.motto}</div>
            <p className="text-gray-700 text-xs tracking-wide font-black">REG NO: {config?.registrationNo}</p>
            <p className="text-gray-500 text-[10px] mt-2 font-medium">
              P.O. BOX 12345 - 00100, NAIROBI, KENYA | TEL: +254 711 000 000<br/>
              EMAIL: INFO@ELIMUSMART.CO.KE | WEB: WWW.ELIMUSMART.CO.KE
            </p>
          </div>
          
          <div className="mt-8 bg-blue-900 text-white px-12 py-2 rounded-lg text-lg font-black uppercase tracking-widest shadow-lg">
            Cumulative Student Transcript
          </div>
        </div>

        {/* Student Details Section */}
        <div className="relative z-10 grid grid-cols-2 gap-x-12 gap-y-4 mb-10 text-sm">
          <div className="space-y-3">
            <div className="flex justify-between border-b pb-1">
              <span className="text-gray-400 font-black uppercase text-[10px]">Student Name:</span>
              <span className="font-black text-gray-900">{MOCK_TRANSCRIPT_STUDENT.firstName} {MOCK_TRANSCRIPT_STUDENT.lastName}</span>
            </div>
            <div className="flex justify-between border-b pb-1">
              <span className="text-gray-400 font-black uppercase text-[10px]">Adm No:</span>
              <span className="font-mono font-black text-blue-700">{MOCK_TRANSCRIPT_STUDENT.admissionNumber}</span>
            </div>
            <div className="flex justify-between border-b pb-1">
              <span className="text-gray-400 font-black uppercase text-[10px]">Date of Birth:</span>
              <span className="font-bold text-gray-800">{new Date(MOCK_TRANSCRIPT_STUDENT.dob).toLocaleDateString('en-KE')}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between border-b pb-1">
              <span className="text-gray-400 font-black uppercase text-[10px]">Level:</span>
              <span className="font-black text-gray-900">{MOCK_TRANSCRIPT_STUDENT.class}</span>
            </div>
            <div className="flex justify-between border-b pb-1">
              <span className="text-gray-400 font-black uppercase text-[10px]">Stream:</span>
              <span className="font-black text-gray-900">{MOCK_TRANSCRIPT_STUDENT.stream}</span>
            </div>
            <div className="flex justify-between border-b pb-1">
              <span className="text-gray-400 font-black uppercase text-[10px]">Status:</span>
              <span className="font-black text-green-600 uppercase">Active</span>
            </div>
          </div>
        </div>

        {/* Academic Performance Table */}
        <div className="relative z-10 mb-10">
          <table className="w-full text-left border-collapse border-2 border-gray-900">
            <thead>
              <tr className="bg-gray-100 text-gray-900 font-black uppercase text-[10px]">
                <th className="p-4 border-2 border-gray-900">Learning Area</th>
                <th className="p-4 border-2 border-gray-900 text-center">Score</th>
                <th className="p-4 border-2 border-gray-900 text-center">CBC Grade</th>
                <th className="p-4 border-2 border-gray-900">Competency Level</th>
              </tr>
            </thead>
            <tbody className="text-[12px]">
              {MOCK_RESULTS.map((res, i) => (
                <tr key={i}>
                  <td className="p-4 border-2 border-gray-900 font-black">{res.subject}</td>
                  <td className="p-4 border-2 border-gray-900 text-center font-mono font-bold text-lg">{res.score}%</td>
                  <td className="p-4 border-2 border-gray-900 text-center font-black text-blue-800 text-base">{res.competency}</td>
                  <td className="p-4 border-2 border-gray-900 text-gray-600 italic leading-snug">{res.remarks}</td>
                </tr>
              ))}
              <tr className="bg-gray-50">
                <td className="p-4 border-2 border-gray-900 font-black uppercase text-blue-900">Cumulative Mean</td>
                <td className="p-4 border-2 border-gray-900 text-center font-mono font-black text-xl">82.5%</td>
                <td className="p-4 border-2 border-gray-900 text-center font-black text-blue-900 text-xl">EE</td>
                <td className="p-4 border-2 border-gray-900 font-black uppercase text-[9px]">Exceeding Expectations</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Remarks Section */}
        <div className="relative z-10 grid grid-cols-2 gap-8 mb-16">
          <div className="p-6 bg-gray-50 border-2 border-gray-200 rounded-xl">
            <h4 className="text-[10px] font-black text-gray-400 uppercase mb-3 flex items-center gap-2 tracking-widest">
              <Wand2 className="w-4 h-4 text-indigo-600" />
              General Progress Assessment
            </h4>
            <p className="text-[12px] text-gray-800 leading-relaxed font-medium min-h-[100px]">
              {aiRemarks || "Student exhibits commendable academic discipline. Strong performance across core learning areas specifically in STEM and languages. Demonstrates potential for leadership and social collaboration."}
            </p>
          </div>

          <div className="p-6 bg-white border-2 border-gray-100 rounded-xl flex flex-col justify-between items-center relative">
            <h4 className="text-[10px] font-black text-gray-400 uppercase mb-4 w-full text-left tracking-widest">Certification</h4>
            
            <div className="mt-4 text-center">
               <div className="font-['Cedarville_Cursive',cursive] text-2xl text-blue-900 mb-1 -rotate-2 select-none">
                  Tr. Maina (Principal)
               </div>
               <div className="w-56 h-[1px] bg-gray-300 mx-auto"></div>
               <div className="text-[9px] text-gray-500 font-black mt-2 uppercase tracking-widest">School Principal / Head of JSS</div>
            </div>

            <div className="absolute top-2 right-2 flex flex-col items-center">
               <div className="w-28 h-28 rounded-full border-4 border-double border-blue-900/10 flex items-center justify-center rotate-[-12deg] relative">
                  <div className="text-[8px] font-black text-blue-900/20 text-center uppercase leading-tight font-mono">
                    ELIMUSMART<br/>ACADEMY<br/>---<br/>VERIFIED RECORD
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Footer & CBC Legend */}
        <div className="relative z-10 mt-auto pt-8 border-t-2 border-gray-100">
          <div className="flex justify-between items-end">
            <div>
              <div className="text-[9px] font-black uppercase text-gray-400 mb-3 tracking-widest">CBC Grading Matrix</div>
              <div className="flex gap-4">
                {[
                  { k: 'EE', v: 'Exceeding Expectations (80-100)', c: 'bg-blue-900' },
                  { k: 'ME', v: 'Meeting Expectations (60-79)', c: 'bg-blue-600' },
                  { k: 'AE', v: 'Approaching Expectations (40-59)', c: 'bg-blue-400' },
                  { k: 'BE', v: 'Below Expectations (0-39)', c: 'bg-blue-100' }
                ].map(grade => (
                  <div key={grade.k} className="flex flex-col items-center">
                    <span className={`w-8 h-4 ${grade.c} text-white text-[9px] flex items-center justify-center font-black rounded-sm mb-1`}>{grade.k}</span>
                    <span className="text-[8px] text-gray-400 font-bold">{grade.v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-right">
               <div className="flex items-center justify-end gap-2 text-green-600 text-[10px] font-black uppercase tracking-widest mb-1">
                 <CheckCircle className="w-3.5 h-3.5" />
                 Secure Transcript System
               </div>
               <div className="text-[8px] text-gray-400 font-medium italic">
                 Generated on {new Date().toLocaleString()} | ES-TR-{MOCK_TRANSCRIPT_STUDENT.id.toUpperCase()}
               </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="print-only text-center text-[10px] text-gray-400 mt-8 pb-10">
        This document is an official digital record. For validation, contact the registrar.
      </div>
    </div>
  );
};
