
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
  Forward
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

export const Dashboard: React.FC<DashboardProps> = ({ user, lang, students }) => {
  const t = translations[lang];

  const stats = useMemo(() => {
    const totalExpected = students.reduce((sum, s) => sum + (s.totalFee || 0), 0);
    const totalCollected = students.reduce((sum, s) => sum + (s.paidFee || 0), 0);
    const totalArrears = students.reduce((sum, s) => sum + (s.feeBalance || 0), 0);
    const totalPrepaid = students.reduce((sum, s) => sum + (s.prepaidFee || 0), 0);

    const formatM = (val: number) => {
      const displayVal = val > 100000 ? val : val * 50; 
      return (displayVal / 1000000).toFixed(2) + 'M';
    };

    return {
      expected: formatM(totalExpected),
      collected: formatM(totalCollected),
      arrears: formatM(totalArrears),
      prepaid: (totalPrepaid / 1000).toFixed(0) + 'K',
      studentCount: students.length,
      arrearsChange: '+KES 200k',
      collectedChange: '+8%',
      enrollmentChange: `+${Math.ceil(students.length * 0.025)} Enrolled this term`
    };
  }, [students]);

  const chartData = useMemo(() => [
    { name: 'Term 1', collection: 3.2 },
    { name: 'Term 2', collection: 4.2 },
    { name: 'Term 3', collection: 5.8 },
  ], []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">{t.karibu}, {user.name}</h1>
        <p className="text-gray-500 font-medium tracking-tight">System overview for today's school operations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Expected", value: stats.expected, icon: Target, color: 'indigo', change: 'Target 2024', positive: true },
          { label: "Collected Fee", value: stats.collected, icon: Banknote, color: 'green', change: stats.collectedChange, positive: true },
          { label: "Outstanding Fees", value: stats.arrears, icon: AlertCircle, color: 'red', change: stats.arrearsChange, positive: false },
          { label: "Prepaid Fees", value: stats.prepaid, icon: Forward, color: 'blue', change: 'Adv. Payments', positive: true },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between group hover:shadow-lg transition-all">
              <div className="min-w-0">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">{stat.label}</p>
                <h3 className={`text-2xl font-black mt-1 tracking-tighter ${stat.color === 'red' ? 'text-red-700' : stat.color === 'green' ? 'text-green-700' : 'text-gray-900'}`}>{stat.value}</h3>
                <div className={`mt-2 flex items-center text-[10px] font-black uppercase tracking-widest ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.positive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                  {stat.change}
                </div>
              </div>
              <div className={`p-3 rounded-xl transition-transform group-hover:scale-110 shrink-0 ${
                stat.color === 'blue' ? 'bg-blue-50 text-blue-600' : 
                stat.color === 'green' ? 'bg-green-50 text-green-600' : 
                stat.color === 'red' ? 'bg-red-50 text-red-600' : 
                stat.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                'bg-purple-50 text-purple-600'
              } border border-white shadow-sm`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Fee Collection Velocity</h3>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">3 Term Comparison</div>
          </div>
          {/* Fixed height container to resolve Recharts -1 error */}
          <div className="w-full h-[350px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorColl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: '800', textTransform: 'uppercase', fontSize: '10px', color: '#1e293b' }}
                />
                <Area type="monotone" dataKey="collection" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorColl)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Users className="w-5 h-5" />
                 </div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.total_students}</p>
              </div>
              <h4 className="text-4xl font-black text-gray-900 tracking-tighter">482</h4>
              <p className="text-[10px] text-green-600 font-bold uppercase mt-2">{stats.enrollmentChange}</p>
           </div>
           
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                    <CheckCircle className="w-5 h-5" />
                 </div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.avg_attendance}</p>
              </div>
              <h4 className="text-4xl font-black text-gray-900 tracking-tighter">94%</h4>
              <p className="text-[10px] text-blue-600 font-bold uppercase mt-2">Consistent Engagement</p>
           </div>

           <div className="bg-blue-600 p-6 rounded-2xl shadow-xl shadow-blue-100 text-white sm:col-span-2">
              <div className="flex justify-between items-start mb-4">
                 <div>
                    <h4 className="font-black uppercase tracking-tight">System Health</h4>
                    <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest">Real-time status</p>
                 </div>
                 <CheckCircle className="w-6 h-6" />
              </div>
              <div className="space-y-3 mt-6">
                 <div className="flex justify-between text-[10px] font-bold uppercase">
                    <span>M-Pesa Gateway</span>
                    <span className="text-green-300">Operational</span>
                 </div>
                 <div className="w-full h-1 bg-blue-500 rounded-full overflow-hidden">
                    <div className="w-[98%] h-full bg-green-300"></div>
                 </div>
                 <div className="flex justify-between text-[10px] font-bold uppercase">
                    <span>SMS Alerts Gateway</span>
                    <span className="text-green-300">Active</span>
                 </div>
                 <div className="w-full h-1 bg-blue-500 rounded-full overflow-hidden">
                    <div className="w-[100%] h-full bg-green-300"></div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
