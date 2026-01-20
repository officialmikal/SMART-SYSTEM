
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { StudentManagement } from './components/StudentManagement';
import { StaffManagement } from './components/StaffManagement';
import { FinanceModule } from './components/FinanceModule';
import { AttendanceModule } from './components/AttendanceModule';
import { ReportsModule } from './components/ReportsModule';
import { AcademicsModule } from './components/AcademicsModule';
import { SettingsModule } from './components/SettingsModule';
import { TimetableModule } from './components/TimetableModule';
import { MessagingModule } from './components/MessagingModule';
import { UserRole, User } from './types';
import { Language, translations } from './services/localizationService';
import { Loader2, Lock, Mail, Smartphone, ShieldCheck, AlertCircle } from 'lucide-react';

// Enhanced Mock Users with Credentials for Auth Simulation
const AUTH_DB = [
  {
    id: 'u1',
    // Renamed username to email to match User interface
    email: 'principal@school.ac.ke',
    password: 'password123',
    name: 'Principal Maina',
    role: UserRole.PRINCIPAL,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maina'
  },
  {
    id: 'u2',
    // Renamed username to email to match User interface
    email: 'admin@school.ac.ke',
    password: 'adminpassword',
    name: 'Admin Kioko',
    role: UserRole.ADMIN,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kioko'
  },
  {
    id: 'u3',
    // Renamed username to email to match User interface
    email: 'teacher@school.ac.ke',
    password: 'teacherpassword',
    name: 'Tr. Wanjiku',
    role: UserRole.CLASS_TEACHER,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wanjiku'
  },
  {
    id: 'u4',
    // Renamed username to email to match User interface
    email: 'student@school.ac.ke',
    password: 'studentpassword',
    name: 'Juma Kipruto',
    role: UserRole.STUDENT,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juma'
  },
  {
    id: 'u5',
    // Renamed username to email to match User interface
    email: 'parent@school.ac.ke',
    password: 'parentpassword',
    name: 'Robert Kipruto',
    role: UserRole.PARENT,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert'
  }
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [lang, setLang] = useState<Language>('en');
  
  // Auth Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthenticating(true);

    // Simulate Network Latency
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Updated to lookup via email property
    const foundUser = AUTH_DB.find(u => u.email === username.toLowerCase() && u.password === password);

    if (foundUser) {
      const { password, ...userWithoutPassword } = foundUser;
      // Fixed: Casting is now valid because email property is present
      setUser(userWithoutPassword as User);
      setCurrentTab('dashboard');
    } else {
      setAuthError('Invalid username or password. Please try again.');
    }
    setIsAuthenticating(false);
  };

  const switchRole = (role: UserRole) => {
    const roleUser = AUTH_DB.find(u => u.role === role);
    if (roleUser) {
      const { password, ...userWithoutPassword } = roleUser;
      // Fixed: Casting is now valid because email property is present
      setUser(userWithoutPassword as User);
      setCurrentTab('dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setUsername('');
    setPassword('');
    setAuthError(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-700 p-4 font-sans relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px] opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px] opacity-50"></div>
        
        <div className="bg-white rounded-[40px] shadow-2xl p-10 max-w-lg w-full animate-in fade-in zoom-in duration-500 relative z-10 border border-white/20">
          <div className="text-center mb-10">
            <div className="inline-flex p-4 bg-blue-50 rounded-3xl mb-4 border border-blue-100">
              <ShieldCheck className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter leading-none">ElimuSmart</h1>
            <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-3">School Management Portal</p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {authError && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-in shake duration-300">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-xs font-black uppercase tracking-tight">{authError}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Username (Email/Phone)</label>
              <div className="relative group">
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-[20px] focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-gray-800" 
                  placeholder="admin@school.ac.ke" 
                />
                <Mail className="absolute left-4 top-4.5 w-5 h-5 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Secure Password</label>
              <div className="relative group">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-[20px] focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-gray-800" 
                  placeholder="••••••••" 
                />
                <Lock className="absolute left-4 top-4.5 w-5 h-5 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-xs font-bold text-gray-500 group-hover:text-gray-700">Remember Me</span>
              </label>
              <button type="button" className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline">Forgot Access?</button>
            </div>

            <button 
              type="submit"
              disabled={isAuthenticating}
              className="w-full bg-blue-600 text-white font-black py-5 rounded-[20px] hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3 disabled:opacity-70 group"
            >
              {isAuthenticating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Lock className="w-5 h-5 group-hover:scale-110 transition-transform" />}
              <span className="uppercase tracking-widest text-sm">Secure Sign In</span>
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-gray-100">
            <div className="text-center mb-4">
              <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.3em]">Quick Access for Evaluation</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { role: UserRole.PRINCIPAL, label: 'Principal', user: 'principal@school.ac.ke', pass: 'password123' },
                { role: UserRole.ADMIN, label: 'Admin', user: 'admin@school.ac.ke', pass: 'adminpassword' },
                { role: UserRole.CLASS_TEACHER, label: 'Teacher', user: 'teacher@school.ac.ke', pass: 'teacherpassword' },
                { role: UserRole.STUDENT, label: 'Student', user: 'student@school.ac.ke', pass: 'studentpassword' },
                { role: UserRole.PARENT, label: 'Parent', user: 'parent@school.ac.ke', pass: 'parentpassword' }
              ].map((item) => (
                <button 
                  key={item.role}
                  onClick={() => {
                    setUsername(item.user);
                    setPassword(item.pass);
                  }}
                  className="px-3 py-1.5 bg-gray-50 hover:bg-blue-50 text-[9px] font-black text-gray-400 hover:text-blue-600 rounded-xl border border-gray-100 transition-all uppercase tracking-tight"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      user={user} 
      currentTab={currentTab} 
      setCurrentTab={setCurrentTab}
      isSidebarOpen={isSidebarOpen}
      setIsSidebarOpen={setIsSidebarOpen}
      logout={handleLogout}
      lang={lang}
      setLang={setLang}
      switchRole={switchRole}
    >
      <main className="p-4 md:p-8 max-w-[1600px] mx-auto">
        {currentTab === 'dashboard' && <Dashboard user={user} lang={lang} />}
        {currentTab === 'students' && <StudentManagement />}
        {currentTab === 'staff' && <StaffManagement />}
        {currentTab === 'academics' && <AcademicsModule lang={lang} />}
        {currentTab === 'timetable' && <TimetableModule lang={lang} />}
        {currentTab === 'finance' && <FinanceModule lang={lang} />}
        {currentTab === 'attendance' && <AttendanceModule lang={lang} />}
        {currentTab === 'messaging' && <MessagingModule lang={lang} />}
        {currentTab === 'reports' && <ReportsModule lang={lang} />}
        {currentTab === 'settings' && <SettingsModule userRole={user.role} />}
      </main>
    </Layout>
  );
};

export default App;
