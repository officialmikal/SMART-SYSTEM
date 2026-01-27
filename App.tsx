
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
import { Smartphone, Check, X, Share, ShieldCheck, DownloadCloud } from 'lucide-react';

const INITIAL_STUDENTS: Student[] = [
  { id: '1', admissionNumber: 'ADM001', firstName: 'Kamau', lastName: 'Njoroge', class: 'Grade 7', stream: 'Oak', gender: 'Male', dob: '2011-04-12', guardianPhone: '0712345678', guardianName: 'Sarah Njoroge', totalFee: 45000, paidFee: 32500, feeBalance: 12500, prepaidFee: 0, photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kamau' },
  { id: '2', admissionNumber: 'ADM002', firstName: 'Amara', lastName: 'Kiprono', class: 'Grade 8', stream: 'Palm', gender: 'Female', dob: '2010-08-25', guardianPhone: '0722000111', guardianName: 'David Kiprono', totalFee: 45000, paidFee: 45000, feeBalance: 0, prepaidFee: 2500, photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amara' },
  { id: '3', admissionNumber: 'ADM003', firstName: 'Zuri', lastName: 'Achieng', class: 'Grade 7', stream: 'Oak', gender: 'Female', dob: '2011-11-02', guardianPhone: '0733111222', guardianName: 'Grace Achieng', totalFee: 45000, paidFee: 15000, feeBalance: 30000, prepaidFee: 0, photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zuri' },
  { id: '4', admissionNumber: 'ADM004', firstName: 'Jabari', lastName: 'Omondi', class: 'Grade 9', stream: 'Acacia', gender: 'Male', dob: '2009-03-15', guardianPhone: '0744999888', guardianName: 'Peter Omondi', totalFee: 48000, paidFee: 48000, feeBalance: 0, prepaidFee: 0, photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jabari' },
  { id: '5', admissionNumber: 'ADM005', firstName: 'Mwikali', lastName: 'Musyoka', class: 'Grade 8', stream: 'Willow', gender: 'Female', dob: '2010-05-20', guardianPhone: '0755666777', guardianName: 'Ruth Musyoka', totalFee: 45000, paidFee: 40000, feeBalance: 5000, prepaidFee: 0, photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mwikali' },
];

const INITIAL_USERS: User[] = [
  { id: 'u1', email: 'principal@school.ac.ke', password: 'password123', name: 'Principal Maina', role: UserRole.PRINCIPAL, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maina' },
  { id: 'u2', email: 'admin@school.ac.ke', password: 'adminpassword', name: 'Admin Kioko', role: UserRole.ADMIN, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kioko' },
  { id: 'u3', email: 'teacher@school.ac.ke', password: 'teacher123', name: 'Tr. Wambui', role: UserRole.CLASS_TEACHER, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wambui' },
];

const INITIAL_FEE_STRUCTURE: ClassFee[] = KENYAN_CLASSES.map(cls => ({ className: cls, amount: 45000 }));

const INITIAL_SCHOOL_CONFIG = {
  schoolName: 'ElimuSmart Academy',
  motto: 'Excellence in Knowledge and Character',
  registrationNo: 'MOE/P/2024/0981',
  year: 2024,
  term: 1,
  mpesaPaybill: '522522',
  mpesaTill: '',
  bankName: 'KCB Bank',
  bankAccountNumber: '1100223344'
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [lang, setLang] = useState<Language>('en');
  
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('elimusmart_users');
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch (e) {
      return INITIAL_USERS;
    }
  });

  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem('elimusmart_students');
      return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
    } catch (e) {
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

  const [schoolConfig, setSchoolConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('elimusmart_config');
      return saved ? JSON.parse(saved) : INITIAL_SCHOOL_CONFIG;
    } catch (e) {
      return INITIAL_SCHOOL_CONFIG;
    }
  });

  useEffect(() => {
    localStorage.setItem('elimusmart_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('elimusmart_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('elimusmart_fees', JSON.stringify(feeStructure));
  }, [feeStructure]);

  useEffect(() => {
    localStorage.setItem('elimusmart_config', JSON.stringify(schoolConfig));
  }, [schoolConfig]);

  useEffect(() => {
    if (schoolLogo) localStorage.setItem('elimusmart_logo', schoolLogo);
    else localStorage.removeItem('elimusmart_logo');
  }, [schoolLogo]);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPop, setShowInstallPop] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    if (ios && !isStandalone) {
      const timer = setTimeout(() => setShowInstallPop(true), 8000);
      return () => clearTimeout(timer);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isStandalone) {
        setTimeout(() => setShowInstallPop(true), 8000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallApp = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choice: any) => {
        if (choice.outcome === 'accepted') {
          console.log('ElimuSmart: User accepted install');
          setDeferredPrompt(null);
          setShowInstallPop(false);
        }
      });
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = users.find(u => u.email === username.toLowerCase() && u.password === password);
    if (foundUser) {
      setUser(foundUser);
      setCurrentTab('dashboard');
    } else {
      alert('Authentication Failed: Incorrect email or password.');
    }
  };

  const switchRole = (role: UserRole) => {
    const roleUser = users.find(u => u.role === role);
    if (roleUser) {
      setUser(roleUser);
      setCurrentTab('dashboard');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-700 p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full -mr-48 -mt-48 opacity-50 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-800 rounded-full -ml-32 -mb-32 opacity-50 blur-3xl"></div>
        
        <div className="bg-white rounded-[40px] shadow-2xl p-10 max-w-lg w-full relative z-10 animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-10">
            <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-100">
               <ShieldCheck className="text-white w-8 h-8" />
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter leading-none text-center">ElimuSmart</h1>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-2 leading-none text-center">Official System Portal</p>
          </div>
          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner" placeholder="name@school.ac.ke" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Secure Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner" placeholder="••••••••" />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">Enter System Portal</button>
          </form>
          
          <div className="mt-8 text-center">
             <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-relaxed">
               Authorized Personnel Only. System activity is encrypted.
             </p>
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
      installApp={(deferredPrompt || isIOS) ? () => setShowInstallPop(true) : undefined}
    >
      {showInstallPop && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-full max-w-md px-4 animate-in slide-in-from-top-4 duration-500 no-print">
          <div className="bg-white rounded-[32px] shadow-[0_25px_60px_rgba(0,0,0,0.3)] p-6 border-2 border-blue-50 flex items-center gap-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Smartphone size={100} />
             </div>
             <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-xl shadow-blue-100 shrink-0">
                <DownloadCloud size={24} />
             </div>
             <div className="flex-1">
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">{isIOS ? 'Install on iPhone' : 'Offline Access Ready'}</h4>
                <p className="text-[11px] font-bold text-gray-500 leading-tight mt-1">
                  {isIOS ? 'Tap "Share" and then "Add to Home Screen" to install ElimuSmart.' : 'Install the app for faster access and offline capabilities.'}
                </p>
                <div className="flex gap-2 mt-4">
                   {!isIOS && (
                     <button onClick={handleInstallApp} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 flex items-center gap-2">
                       <Check size={14} /> Install Now
                     </button>
                   )}
                   {isIOS && (
                     <div className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100">
                        <Share size={14} /> iOS Menu
                     </div>
                   )}
                   <button onClick={() => setShowInstallPop(false)} className="bg-gray-100 text-gray-500 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-colors">
                     Dismiss
                   </button>
                </div>
             </div>
             <button onClick={() => setShowInstallPop(false)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"><X size={18} /></button>
          </div>
        </div>
      )}

      <main className="p-4 md:p-8 max-w-[1600px] mx-auto">
        {currentTab === 'dashboard' && <Dashboard user={user} lang={lang} students={students} />}
        {currentTab === 'students' && <StudentManagement students={students} setStudents={setStudents} feeStructure={feeStructure} />}
        {currentTab === 'staff' && <StaffManagement />}
        {currentTab === 'academics' && <AcademicsModule lang={lang} students={students} setStudents={setStudents} />}
        {currentTab === 'timetable' && <TimetableModule lang={lang} />}
        {currentTab === 'finance' && <FinanceModule lang={lang} students={students} setStudents={setStudents} feeStructure={feeStructure} setFeeStructure={setFeeStructure} schoolLogo={schoolLogo} schoolConfig={schoolConfig} />}
        {currentTab === 'attendance' && <AttendanceModule lang={lang} />}
        {currentTab === 'messaging' && <MessagingModule lang={lang} students={students} />}
        {currentTab === 'reports' && <ReportsModule lang={lang} students={students} schoolLogo={schoolLogo} schoolConfig={schoolConfig} />}
        {currentTab === 'settings' && (
          <SettingsModule 
            currentUser={user} 
            users={users} 
            setUsers={setUsers} 
            schoolLogo={schoolLogo} 
            setSchoolLogo={setSchoolLogo} 
            schoolConfig={schoolConfig}
            setSchoolConfig={setSchoolConfig}
          />
        )}
      </main>
    </Layout>
  );
};

export default App;
