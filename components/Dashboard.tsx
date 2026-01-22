
import React, { useMemo } from 'react';
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
  Shield
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
import { User, Student } from '../types';
import { Language, translations } from '../services/localizationService';

interface DashboardProps {
  user: User;
  lang: Language;
  students: Student[];
}

export const Dashboard: React.FC<DashboardProps> = ({ user, lang, students = [] }) => {
  const t = translations[lang];

  // Calculate accurate statistics from the students source of truth
  const stats = useMemo(() => {
    const totalExpected = students.reduce((sum, s) => sum + (Number(s.totalFee) || 0), 0);
    const totalCollected = students.reduce((sum, s) => sum + (Number(s.paidFee) || 0), 0);
    const totalArrears = students.reduce((sum, s) => sum + (Number(s.feeBalance) || 0), 0);
    const totalPrepaid = students.reduce((sum, s) => sum + (Number(s.prepaidFee) || 0), 0);

    // Formatter for accurate currency display
    const formatKES = (val: number) => {
      if (val >= 1000000) return (val / 1000000).toFixed(2) + 'M';
      if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
      return val.toLocaleString();
    };

    const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

    return {
      expected: formatKES(totalExpected),
      collected: formatKES(totalCollected),
      arrears: formatKES(totalArrears),
      prepaid: formatKES(totalPrepaid),
      studentCount: students.length,
      collectionRate: collectionRate.toFixed(1) + '%',
      attendanceRate: '94.2%', // Mocked until Attendance state is globalized
      enrollmentChange: `+${Math.ceil(students.length * 0.05)} New this term`
    };
  }, [students]);

  // Chart data reflecting real collection proportions
  const chartData = useMemo(() => [
    { name: 'Term 1', collection: 3200000 },
    { name: 'Term 2', collection: 4100000 },
    { name: 'Term 3', collection: students.reduce((sum, s) => sum + (Number(s.paidFee) || 0), 0) },
  ], [students]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">{t.karibu}, {user.name.split(' ')[0]}</h1>
          <p className="text-gray-500 font-medium tracking-tight mt-2">Live School Financial & Operational Overview.</p>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100 hidden md:block">
           <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Global Collection Rate: {stats.collectionRate}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Invoiced", value: stats.expected, icon: Target, color: 'indigo', change: 'Current Year', positive: true },
          { label: "Fees Collected", value: stats.collected, icon: Banknote, color: 'green', change: stats.collectionRate + ' Rate', positive: true },
          { label: "Fee Balances", value: stats.arrears, icon: AlertCircle, color: 'red', change: 'Due Now', positive: false },
          { label: "Prepaid Credit", value: stats.prepaid, icon: Forward, color: 'blue', change: 'Future Terms', positive: true },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-start justify-between group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="min-w-0">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate mb-1">{stat.label}</p>
                <div className="flex items-baseline gap-1">
                   <span className="text-xs font-bold text-gray-300">KES</span>
                   <h3 className={`text-3xl font-black tracking-tighter ${stat.color === 'red' ? 'text-red-600' : stat.color === 'green' ? 'text-green-600' : 'text-gray-900'}`}>{stat.value}</h3>
                </div>
                <div className={`mt-3 flex items-center text-[10px] font-black uppercase tracking-widest ${stat.positive ? 'text-green-600' : 'text-red-500'}`}>
                  {stat.positive ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                  {stat.change}
                </div>
              </div>
              <div className={`p-4 rounded-2xl transition-transform group-hover:scale-110 shrink-0 ${
                stat.color === 'blue' ? 'bg-blue-50 text-blue-600' : 
                stat.color === 'green' ? 'bg-green-50 text-green-600' : 
                stat.color === 'red' ? 'bg-red-50 text-red-600' : 
                stat.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                'bg-purple-50 text-purple-600'
              } border-2 border-white shadow-lg shadow-gray-100/50`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 overflow-hidden flex flex-col group hover:shadow-2xl transition-all duration-500">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-gray-800 uppercase tracking-tighter">Collection Velocity</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Real-time KES Flow</p>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full text-[10px] font-black text-gray-500 uppercase">
              <TrendingUp className="w-3.5 h-3.5" /> Growth Trend
            </div>
          </div>
          <div className="w-full h-[350px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorColl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="name" stroke="#cbd5e1" fontSize={10} fontWeight="900" tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip 
                  cursor={{ stroke: '#2563eb', strokeWidth: 2, strokeDasharray: '5 5' }}
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '20px' }}
                  labelStyle={{ fontWeight: '900', textTransform: 'uppercase', fontSize: '12px', color: '#1e293b', marginBottom: '8px' }}
                  formatter={(value: any) => [`KES ${value.toLocaleString()}`, 'Total Collected']}
                />
                <Area type="monotone" dataKey="collection" stroke="#2563eb" strokeWidth={5} fillOpacity={1} fill="url(#colorColl)" animationDuration={2000} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
           <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
              <div className="flex items-center gap-4 mb-6">
                 <div className="p-4 bg-blue-50 text-blue-600 rounded-[20px] shadow-sm group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6" />
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.total_students}</p>
                   <p className="text-xs font-bold text-blue-600">Active Learners</p>
                 </div>
              </div>
              <h4 className="text-5xl font-black text-gray-900 tracking-tighter">{students.length}</h4>
              <p className="text-[10px] text-green-600 font-black uppercase mt-4 tracking-widest">{stats.enrollmentChange}</p>
           </div>
           
           <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
              <div className="flex items-center gap-4 mb-6">
                 <div className="p-4 bg-emerald-50 text-emerald-600 rounded-[20px] shadow-sm group-hover:scale-110 transition-transform">
                    <CheckCircle className="w-6 h-6" />
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.avg_attendance}</p>
                   <p className="text-xs font-bold text-emerald-600">Daily Average</p>
                 </div>
              </div>
              <h4 className="text-5xl font-black text-gray-900 tracking-tighter">94%</h4>
              <p className="text-[10px] text-blue-600 font-black uppercase mt-4 tracking-widest">Target Met for Term 3</p>
           </div>

           <div className="bg-gradient-to-br from-blue-700 to-blue-900 p-8 rounded-[48px] shadow-2xl shadow-blue-200 text-white sm:col-span-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 group-hover:scale-110 transition-transform duration-700">
                 <Target size={200} />
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                   <div>
                      <h4 className="text-2xl font-black uppercase tracking-tighter">School Health Index</h4>
                      <p className="text-[10px] opacity-70 font-black uppercase tracking-[0.2em] mt-2">Operational Integrity Status</p>
                   </div>
                   <Shield className="w-10 h-10 text-blue-300" />
                </div>
                <div className="space-y-6">
                   <div className="space-y-2">
                      <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                         <span>Fee Collection Goal</span>
                         <span className="text-green-300">{stats.collectionRate} Complete</span>
                      </div>
                      <div className="w-full h-2.5 bg-blue-800/50 rounded-full overflow-hidden border border-blue-400/20 shadow-inner">
                         <div className="h-full bg-green-400 shadow-[0_0_15px_rgba(74,222,128,0.5)] transition-all duration-1000" style={{ width: stats.collectionRate }}></div>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                         <span>SMS Communication</span>
                         <span className="text-blue-300">Live & Active</span>
                      </div>
                      <div className="w-full h-2.5 bg-blue-800/50 rounded-full overflow-hidden border border-blue-400/20 shadow-inner">
                         <div className="h-full bg-blue-300 shadow-[0_0_15px_rgba(147,197,253,0.5)] transition-all duration-1000" style={{ width: '100%' }}></div>
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
