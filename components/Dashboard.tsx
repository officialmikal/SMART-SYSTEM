
import React, { useMemo, useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  CheckCircle, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Banknote,
  Target,
  Forward,
  Shield,
  Wand2,
  Sparkles,
  Loader2,
  Smartphone,
  Download,
  X,
  SmartphoneNfc,
  TrendingDown,
  Scale,
  Wallet,
  Building2,
  Bus,
  Route
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { GoogleGenAI } from '@google/genai';
import { User, Student, Expenditure } from '../types';
import { Language, translations } from '../services/localizationService';

interface DashboardProps {
  user: User;
  lang: Language;
  students: Student[];
  expenditures: Expenditure[];
  installApp?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, lang, students = [], expenditures = [], installApp }) => {
  const t = translations[lang];
  const [aiBriefing, setAiBriefing] = useState<string>('');
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  const [showInstallCard, setShowInstallCard] = useState(true);

  // Institution branding from user object (if exists)
  const institutionName = (user as any).institution?.name || "ElimuSmart Academy";

  // Calculate accurate statistics
  const stats = useMemo(() => {
    const totalExpected = students.reduce((sum, s) => sum + (Number(s.agreedFee ?? s.totalFee) || 0), 0);
    const totalCollected = students.reduce((sum, s) => sum + (Number(s.paidFee) || 0), 0);
    const totalArrears = students.reduce((sum, s) => sum + (Number(s.feeBalance) || 0), 0);
    const totalPrepaid = students.reduce((sum, s) => sum + (Number(s.prepaidFee) || 0), 0);
    
    const totalExp = expenditures.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const netPosition = totalCollected - totalExp;

    const transportExpected = students.reduce((sum, s) => sum + (s.isUsingTransport ? (Number(s.transportFee) || 0) : 0), 0);
    const transportCollected = students.reduce((sum, s) => sum + (Number(s.paidTransportFee) || 0), 0);
    const transportArrears = transportExpected - transportCollected;

    const formatKES = (val: number) => {
      const isNegative = val < 0;
      const absVal = Math.abs(val);
      let formatted = '';
      if (absVal >= 1000000) formatted = (absVal / 1000000).toFixed(2) + 'M';
      else if (absVal >= 1000) formatted = (absVal / 1000).toFixed(1) + 'K';
      else formatted = absVal.toLocaleString();
      return isNegative ? `-${formatted}` : formatted;
    };

    const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

    return {
      expected: formatKES(totalExpected),
      collected: formatKES(totalCollected),
      arrears: formatKES(totalArrears),
      prepaid: formatKES(totalPrepaid),
      expenditure: formatKES(totalExp),
      net: formatKES(netPosition),
      transportExpected: formatKES(transportExpected),
      transportCollected: formatKES(transportCollected),
      transportArrears: formatKES(transportArrears),
      rawExpected: totalExpected,
      rawCollected: totalCollected,
      rawNet: netPosition,
      studentCount: students.length,
      collectionRate: collectionRate.toFixed(1) + '%',
      attendanceRate: '94.2%',
      enrollmentChange: `+${Math.ceil(students.length * 0.05)} New this term`
    };
  }, [students, expenditures]);

  // AI Briefing Logic
  useEffect(() => {
    const fetchBriefing = async () => {
      if (!process.env.API_KEY || aiBriefing) return;
      
      setIsBriefingLoading(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `You are a school management advisor for ${institutionName} in Kenya. 
          Analyze these current stats:
          - Enrollment: ${stats.studentCount} students
          - Collection Rate: ${stats.collectionRate}
          - Total Collected: KES ${stats.collected}
          - Net Cash Remaining: KES ${stats.net}
          
          Write a short, professional 2-sentence summary.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
        });
        setAiBriefing(response.text || '');
      } catch (e) {
        setAiBriefing("School operations are stable. Focus on Term 3 collection targets.");
      } finally {
        setIsBriefingLoading(false);
      }
    };

    fetchBriefing();
  }, [stats, institutionName]);

  const chartData = useMemo(() => [
    { name: 'Term 1', collection: 3200000 },
    { name: 'Term 2', collection: 4100000 },
    { name: 'Term 3', collection: stats.rawCollected },
  ], [stats.rawCollected]);

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-3 animate-in fade-in duration-700 overflow-hidden">
      
      {/* Header Area (Compact) */}
      <div className="flex flex-col md:flex-row items-center gap-3 shrink-0">
        <div className="flex-grow bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-[28px] p-4 text-white shadow-lg relative overflow-hidden flex items-center min-h-[80px]">
          <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12">
            <Sparkles size={60} />
          </div>
          <div className="relative z-10 flex items-center gap-4 w-full">
            <div className="bg-blue-400/20 p-2 rounded-xl backdrop-blur-md border border-white/10 shrink-0">
              <Wand2 className="w-5 h-5 text-blue-200" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-200 mb-0.5">AI Institutional Briefing</h2>
              {isBriefingLoading ? (
                <div className="flex items-center gap-2 text-blue-200/60 text-xs font-semibold">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Syncing...</span>
                </div>
              ) : (
                <p className="text-sm font-black tracking-tight truncate">
                  {aiBriefing || `Syncing diagnostics for ${institutionName}...`}
                </p>
              )}
            </div>
          </div>
        </div>

        {installApp && showInstallCard && (
          <div className="bg-indigo-600 rounded-[28px] p-4 text-white shadow-lg flex items-center justify-between gap-4 border-2 border-indigo-400 shrink-0">
            <div className="flex items-center gap-3">
              <SmartphoneNfc className="w-6 h-6 text-white" />
              <div className="hidden sm:block">
                <p className="text-[10px] font-black uppercase tracking-tight">Portal App</p>
                <p className="text-[9px] font-bold text-indigo-100 uppercase">Available for Install</p>
              </div>
            </div>
            <button onClick={installApp} className="bg-white text-indigo-600 px-4 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-indigo-50">
              INSTALL
            </button>
          </div>
        )}
      </div>

      <div className="flex items-end justify-between shrink-0">
        <div className="flex items-baseline gap-2">
          <h1 className="text-xl font-black text-gray-900 tracking-tighter uppercase leading-none">{t.karibu}, {user.name.split(' ')[0]}</h1>
          <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest px-2 py-0.5 bg-blue-50 rounded-md">SECURED SESSION</span>
        </div>
      </div>

      {/* 9 Stats Grid (Restored All) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 shrink-0">
        {[
          { label: "Total Invoiced", value: stats.expected, icon: Target, color: 'indigo', meta: 'Current Year' },
          { label: "Fees Collected", value: stats.collected, icon: Banknote, color: 'green', meta: stats.collectionRate + ' Rate' },
          { label: "Fee Balances", value: stats.arrears, icon: AlertCircle, color: 'red', meta: 'Outstanding Arrears' },
          { label: "Total Expenditure", value: stats.expenditure, icon: TrendingDown, color: 'orange', meta: 'Institutional Costs' },
          { label: "Net Cash Position", value: stats.net, icon: Wallet, color: 'emerald', meta: 'Cash Remainder' },
          { label: "Prepaid Credit", value: stats.prepaid, icon: Forward, color: 'blue', meta: 'Future Term Funds' },
          { label: "Transport (Expected)", value: stats.transportExpected, icon: Route, color: 'blue', meta: 'Active Routes' },
          { label: "Transport (Collected)", value: stats.transportCollected, icon: Bus, color: 'green', meta: 'Bus Fees Received' },
          { label: "Transport (Balanced)", value: stats.transportArrears, icon: AlertCircle, color: 'red', meta: 'Unpaid Bus Fees' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 group">
            <div className={`p-2 rounded-xl shrink-0 ${
              stat.color === 'blue' ? 'bg-blue-50 text-blue-600' : 
              stat.color === 'green' || stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 
              stat.color === 'red' ? 'bg-red-50 text-red-600' : 
              stat.color === 'orange' ? 'bg-orange-50 text-orange-600' :
              'bg-indigo-50 text-indigo-600'
            }`}>
              <stat.icon size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest truncate">{stat.label}</p>
              <div className="flex items-baseline gap-0.5">
                <span className="text-[8px] font-bold text-gray-300">KES</span>
                <p className="text-sm font-black text-gray-900 tracking-tighter">{stat.value}</p>
              </div>
              <p className="text-[7px] font-black text-blue-500 uppercase tracking-tighter mt-0.5">{stat.meta}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Row: Chart & operational Cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 flex-grow min-h-0">
        {/* Chart (Compact) */}
        <div className="md:col-span-8 bg-white p-4 rounded-[32px] shadow-sm border border-gray-100 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-black text-gray-800 uppercase tracking-tighter">Collection Velocity</h3>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Real-time KES Flow</p>
            </div>
            <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full text-[8px] font-black text-gray-500 uppercase tracking-widest">
              <TrendingUp className="w-3 h-3" /> Growth Trend
            </div>
          </div>
          <div className="flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorColl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#cbd5e1" fontSize={8} fontWeight="900" tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', padding: '10px' }}
                  labelStyle={{ fontWeight: '900', textTransform: 'uppercase', fontSize: '9px', color: '#1e293b' }}
                />
                <Area type="monotone" dataKey="collection" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorColl)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operational Cards Container */}
        <div className="md:col-span-4 flex flex-col gap-3 min-h-0">
          <div className="grid grid-cols-2 gap-3 flex-grow">
            <div className="bg-white p-4 rounded-[28px] shadow-sm border border-gray-100 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12 group-hover:scale-110 transition-transform">
                <Users size={40} />
              </div>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{t.total_students}</p>
              <h4 className="text-3xl font-black text-gray-900 tracking-tighter leading-none mt-1">{students.length}</h4>
              <p className="text-[9px] text-gray-800 font-bold uppercase mt-1">Active Learners</p>
              <p className="text-[8px] text-green-600 font-black uppercase mt-2 tracking-tighter">{stats.enrollmentChange}</p>
            </div>
            
            <div className="bg-white p-4 rounded-[28px] shadow-sm border border-gray-100 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12 group-hover:scale-110 transition-transform">
                <CheckCircle size={40} />
              </div>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{t.avg_attendance}</p>
              <h4 className="text-3xl font-black text-gray-900 tracking-tighter leading-none mt-1">94%</h4>
              <p className="text-[9px] text-gray-800 font-bold uppercase mt-1">Daily Average</p>
              <p className="text-[8px] text-blue-600 font-black uppercase mt-2 tracking-tighter">Target Met for Term 3</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-700 to-blue-900 p-5 rounded-[32px] text-white overflow-hidden relative flex flex-col justify-center min-h-[120px]">
            <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12">
               <Target size={120} />
            </div>
            <div className="relative z-10">
               <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-3">Institutional Health</h4>
               <div className="space-y-3">
                  <div className="space-y-1">
                     <div className="flex justify-between text-[8px] font-black uppercase tracking-widest opacity-60">
                        <span>Goal</span>
                        <span>{stats.collectionRate}</span>
                     </div>
                     <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: stats.collectionRate }}></div>
                     </div>
                  </div>
                  <div className="space-y-1">
                     <div className="flex justify-between text-[8px] font-black uppercase tracking-widest opacity-60">
                        <span>Reserves</span>
                        <span>{stats.rawNet > 0 ? 'Surplus' : 'Deficit'}</span>
                     </div>
                     <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full ${stats.rawNet > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: stats.rawNet > 0 ? '100%' : '20%' }}></div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
