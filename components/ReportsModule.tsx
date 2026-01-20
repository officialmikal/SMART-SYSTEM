
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
  FileBadge
} from 'lucide-react';
import { TranscriptModule } from './TranscriptModule';
import { schoolService, AttendanceRecord, FeeTransaction } from '../services/schoolService';
import { Language, translations } from '../services/localizationService';

type ReportView = 'selection' | 'transcript' | 'attendance' | 'fees';

export const ReportsModule: React.FC<{ lang: Language }> = ({ lang }) => {
  const t = translations[lang];
  const [view, setView] = useState<ReportView>('selection');
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [feeData, setFeeData] = useState<FeeTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const loadAttendance = async () => {
    setIsLoading(true);
    const data = await schoolService.getAttendanceHistory('s1');
    setAttendanceData(data);
    setIsLoading(false);
    setView('attendance');
  };

  const loadFees = async () => {
    setIsLoading(true);
    const data = await schoolService.getFeeStatement('s1');
    setFeeData(data);
    setIsLoading(false);
    setView('fees');
  };

  if (view === 'transcript') {
    return (
      <div className="space-y-4">
        <button 
          onClick={() => setView('selection')} 
          className="no-print flex items-center text-blue-600 font-bold hover:gap-2 transition-all"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Reports
        </button>
        <TranscriptModule />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="no-print">
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">{t.reports}</h1>
        <p className="text-gray-500">Generate, print and export comprehensive school reports.</p>
      </div>

      {view === 'selection' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
          <ReportCard 
            title="Report Cards" 
            desc="Academic transcripts with CBC competency ratings and AI analysis."
            icon={FileBadge}
            onClick={() => setView('transcript')}
            color="indigo"
          />
          <ReportCard 
            title="Attendance Summary" 
            desc="Detailed history of student presence, absence and lateness records."
            icon={ClipboardCheck}
            onClick={loadAttendance}
            color="emerald"
          />
          <ReportCard 
            title="Fee Statements" 
            desc="Complete transaction history, invoicing and outstanding balance tracking."
            icon={Wallet}
            onClick={loadFees}
            color="blue"
          />
        </div>
      )}

      {view === 'attendance' && (
        <div className="space-y-6">
          <div className="no-print flex items-center justify-between">
            <button 
              onClick={() => setView('selection')} 
              className="flex items-center text-blue-600 font-bold"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
            <div className="flex gap-2">
              <button 
                onClick={() => exportToCSV(attendanceData, 'Attendance_Report')}
                className="flex items-center space-x-2 border px-4 py-2 rounded-lg hover:bg-gray-50 font-bold text-sm"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
              <button 
                onClick={() => window.print()}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold text-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden p-8">
            <div className="text-center mb-8 border-b pb-8">
              <h2 className="text-3xl font-black text-gray-900 uppercase">Student Attendance Report</h2>
              <p className="text-gray-500 font-bold">Juma Kipruto - ADM/2024/048</p>
            </div>
            
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b text-[11px] font-black uppercase text-gray-400">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData.map((rec, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{rec.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        rec.status === 'Present' ? 'bg-green-100 text-green-700' : 
                        rec.status === 'Absent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 italic">{rec.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'fees' && (
        <div className="space-y-6">
          <div className="no-print flex items-center justify-between">
            <button 
              onClick={() => setView('selection')} 
              className="flex items-center text-blue-600 font-bold"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
            <div className="flex gap-2">
              <button 
                onClick={() => exportToCSV(feeData, 'Fee_Statement')}
                className="flex items-center space-x-2 border px-4 py-2 rounded-lg hover:bg-gray-50 font-bold text-sm"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
              <button 
                onClick={() => window.print()}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold text-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden p-12">
            <div className="flex justify-between items-start mb-12">
              <div>
                <h2 className="text-3xl font-black text-blue-900 uppercase">Fee Statement</h2>
                <p className="text-gray-500 font-bold mt-1">ElimuSmart Academy - Finance Office</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase">Statement Date</p>
                <p className="font-bold">{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-12 bg-gray-50 p-6 rounded-xl border">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Student Details</p>
                <p className="font-black text-gray-900">Juma Kipruto</p>
                <p className="text-sm text-gray-600">ADM: ADM/2024/048</p>
                <p className="text-sm text-gray-600">Grade 7 Eagle</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Current Balance</p>
                <p className="text-4xl font-black text-blue-900">KES 0.00</p>
                <p className="text-xs text-green-600 font-bold uppercase mt-1">Fully Cleared</p>
              </div>
            </div>
            
            <table className="w-full text-left">
              <thead className="border-b-2 border-gray-200">
                <tr className="text-[11px] font-black uppercase text-gray-400">
                  <th className="py-4">Date</th>
                  <th className="py-4">Description</th>
                  <th className="py-4">Ref #</th>
                  <th className="py-4 text-right">Debit</th>
                  <th className="py-4 text-right">Credit</th>
                  <th className="py-4 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {feeData.map((tx, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-4 font-mono">{tx.date}</td>
                    <td className="py-4 font-bold">{tx.description}</td>
                    <td className="py-4 text-gray-500">{tx.reference}</td>
                    <td className="py-4 text-right text-red-600 font-bold">{tx.type === 'Debit' ? tx.amount.toLocaleString() : '-'}</td>
                    <td className="py-4 text-right text-green-600 font-bold">{tx.type === 'Credit' ? tx.amount.toLocaleString() : '-'}</td>
                    <td className="py-4 text-right font-black">KES {tx.balance.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

interface ReportCardProps {
  title: string;
  desc: string;
  icon: any;
  onClick: () => void;
  color: string;
}

const ReportCard: React.FC<ReportCardProps> = ({ title, desc, icon: Icon, onClick, color }) => (
  <button 
    onClick={onClick}
    className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-50 transition-all text-left"
  >
    <div className={`p-4 rounded-xl bg-${color}-50 text-${color}-600 w-fit mb-6 group-hover:scale-110 transition-transform`}>
      <Icon className="w-8 h-8" />
    </div>
    <h3 className="text-xl font-black text-gray-800 mb-2 flex items-center justify-between">
      {title}
      <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
    </h3>
    <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
  </button>
);
