
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
import { UserRole, User, Student, ClassFee, KENYAN_CLASSES } from './types';
import { Language, translations } from './services/localizationService';
import { Smartphone, Check, X } from 'lucide-react';

const INITIAL_STUDENTS: Student[] = [
  { id: '1', admissionNumber: 'ADM001', firstName: 'Kamau', lastName: 'Njoroge', class: 'Grade 7', stream: 'Oak', gender: 'Male', dob: '2011-04-12', guardianPhone: '0712345678', guardianName: 'Sarah Njoroge', totalFee: 45000, paidFee: 32500, feeBalance: 12500, prepaidFee: 0, photo: 'https://picsum.photos/100/100?random=1' },
  { id: '2', admissionNumber: 'ADM002', firstName: 'Amara', lastName: 'Kiprono', class: 'Grade 8', stream: 'Palm', gender: 'Female', dob: '2010-08-25', guardianPhone: '0722000111', guardianName: 'David Kiprono', totalFee: 45000, paidFee: 45000, feeBalance: 0, prepaidFee: 2500, photo: 'https://picsum.photos/100/100?random=2' },
];

const INITIAL_FEE_STRUCTURE: ClassFee[] = KENYAN_CLASSES.map(cls => ({ className: cls, amount: 45000 }));

const AUTH_DB = [
  { id: 'u1', email: 'principal@school.ac.ke', password: 'password123', name: 'Principal Maina', role: UserRole.PRINCIPAL, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maina' },
  { id: 'u2', email: 'admin@school.ac.ke', password: 'adminpassword', name: 'Admin Kioko', role: UserRole.ADMIN, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kioko' },
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [lang, setLang] = useState<Language>('en');
  
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem('elimusmart_students');
      return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
    } catch (e) {
      console.error("Failed to parse students from localStorage", e);
      return INITIAL_STUDENTS;
    }
  });

  const [feeStructure, setFeeStructure] = useState<ClassFee[]>(() => {
    try {
      const saved = localStorage.getItem('elimusmart_fees');
      return saved ? JSON.parse(saved) : INITIAL_FEE_STRUCTURE;
    } catch (e) {
      return INITIAL_FEE_STRUCTURE;
    }
  });

  const [schoolLogo, setSchoolLogo] = useState<string | null>(() => {
    return localStorage.getItem('elimusmart_logo');
  });

  useEffect(() => {
    localStorage.setItem('elimusmart_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('elimusmart_fees', JSON.stringify(feeStructure));
  }, [feeStructure]);

  useEffect(() => {
    if (schoolLogo) localStorage.setItem('elimusmart_logo', schoolLogo);
    else localStorage.removeItem('elimusmart_logo');
  }, [schoolLogo]);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPop, setShowInstallPop] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowInstallPop(true), 4000);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallApp = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        setDeferredPrompt(null);
        setShowInstallPop(false);
      });
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = AUTH_DB.find(u => u.email === username.toLowerCase() && u.password === password);
    if (foundUser) {
      const { password, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword as User);
      setCurrentTab('dashboard');
    } else {
      alert('Invalid credentials.');
    }
  };

  const switchRole = (role: UserRole) => {
    const roleUser = AUTH_DB.find(u => u.role === role);
    if (roleUser) {
      const { password, ...userWithoutPassword } = roleUser;
      setUser(userWithoutPassword as User);
      setCurrentTab('dashboard');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-700 p-4">
        <div className="bg-white rounded-[40px] shadow-2xl p-10 max-w-lg w-full">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter leading-none">ElimuSmart</h1>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-2 leading-none">Management ERP System</p>
          </div>
          <form className="space-y-6" onSubmit={handleLogin}>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-4 bg-gray-50 border rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="Email" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 bg-gray-50 border rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="Password" />
            <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">Sign In</button>
          </form>
          <div className="mt-8 flex gap-2 justify-center">
            <button onClick={() => { setUsername('principal@school.ac.ke'); setPassword('password123'); }} className="text-[9px] bg-gray-100 px-3 py-2 rounded-xl font-black uppercase text-gray-500 hover:bg-gray-200 transition-all">Principal Demo</button>
            <button onClick={() => { setUsername('admin@school.ac.ke'); setPassword('adminpassword'); }} className="text-[9px] bg-gray-100 px-3 py-2 rounded-xl font-black uppercase text-gray-500 hover:bg-gray-200 transition-all">Admin Demo</button>
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
      logout={() => setUser(null)}
      lang={lang}
      setLang={setLang}
      switchRole={switchRole}
      installApp={deferredPrompt ? handleInstallApp : undefined}
    >
      {showInstallPop && deferredPrompt && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-full max-w-md px-4 animate-in slide-in-from-top-4 duration-500">
          <div className="bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] p-6 border-2 border-blue-50 flex items-center gap-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Smartphone size={100} />
             </div>
             <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-xl shadow-blue-100 shrink-0">
                <Smartphone size={24} />
             </div>
             <div className="flex-1">
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Offline Access Ready</h4>
                <p className="text-[11px] font-bold text-gray-500 leading-tight mt-1">Install ElimuSmart for the best experience.</p>
                <div className="flex gap-2 mt-4">
                   <button onClick={handleInstallApp} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 flex items-center gap-2">
                     <Check size={14} /> Install Now
                   </button>
                   <button onClick={() => setShowInstallPop(false)} className="bg-gray-100 text-gray-500 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                     Later
                   </button>
                </div>
             </div>
             <button onClick={() => setShowInstallPop(false)} className="absolute top-4 right-4 text-gray-300 hover:text-gray-500"><X size={18} /></button>
          </div>
        </div>
      )}

      <main className="p-4 md:p-8 max-w-[1600px] mx-auto">
        {currentTab === 'dashboard' && <Dashboard user={user} lang={lang} students={students} />}
        {currentTab === 'students' && <StudentManagement students={students} setStudents={setStudents} feeStructure={feeStructure} />}
        {currentTab === 'staff' && <StaffManagement />}
        {currentTab === 'academics' && <AcademicsModule lang={lang} students={students} setStudents={setStudents} />}
        {currentTab === 'timetable' && <TimetableModule lang={lang} />}
        {currentTab === 'finance' && <FinanceModule lang={lang} students={students} setStudents={setStudents} feeStructure={feeStructure} setFeeStructure={setFeeStructure} schoolLogo={schoolLogo} />}
        {currentTab === 'attendance' && <AttendanceModule lang={lang} />}
        {currentTab === 'messaging' && <MessagingModule lang={lang} students={students} />}
        {currentTab === 'reports' && <ReportsModule lang={lang} students={students} />}
        {currentTab === 'settings' && <SettingsModule userRole={user.role} schoolLogo={schoolLogo} setSchoolLogo={setSchoolLogo} />}
      </main>
    </Layout>
  );
};

export default App;
