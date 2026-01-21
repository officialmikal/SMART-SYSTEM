
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
import { Loader2, Lock, Mail, Smartphone, ShieldCheck, AlertCircle } from 'lucide-react';

const INITIAL_STUDENTS: Student[] = [
  { id: '1', admissionNumber: 'ADM001', firstName: 'Kamau', lastName: 'Njoroge', class: 'Grade 7', stream: 'Oak', gender: 'Male', dob: '2011-04-12', guardianPhone: '0712345678', guardianName: 'Sarah Njoroge', totalFee: 45000, paidFee: 32500, feeBalance: 12500, prepaidFee: 0, photo: 'https://picsum.photos/100/100?random=10' },
  { id: '2', admissionNumber: 'ADM002', firstName: 'Amara', lastName: 'Kiprono', class: 'Grade 8', stream: 'Palm', gender: 'Female', dob: '2010-08-25', guardianPhone: '0722000111', guardianName: 'David Kiprono', totalFee: 45000, paidFee: 45000, feeBalance: 0, prepaidFee: 2500, photo: 'https://picsum.photos/100/100?random=11' },
  { id: '3', admissionNumber: 'ADM003', firstName: 'Zuri', lastName: 'Achieng', class: 'Grade 7', stream: 'Oak', gender: 'Female', dob: '2011-01-05', guardianPhone: '0788999888', guardianName: 'Grace Achieng', totalFee: 45000, paidFee: 40500, feeBalance: 4500, prepaidFee: 0, photo: 'https://picsum.photos/100/100?random=12' },
];

const INITIAL_FEE_STRUCTURE: ClassFee[] = KENYAN_CLASSES.map(cls => ({ className: cls, amount: 45000 }));

const AUTH_DB = [
  {
    id: 'u1',
    email: 'principal@school.ac.ke',
    password: 'password123',
    name: 'Principal Maina',
    role: UserRole.PRINCIPAL,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maina'
  },
  {
    id: 'u2',
    email: 'admin@school.ac.ke',
    password: 'adminpassword',
    name: 'Admin Kioko',
    role: UserRole.ADMIN,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kioko'
  },
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [lang, setLang] = useState<Language>('en');
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [feeStructure, setFeeStructure] = useState<ClassFee[]>(INITIAL_FEE_STRUCTURE);
  const [schoolLogo, setSchoolLogo] = useState<string | null>(null);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthenticating(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    const foundUser = AUTH_DB.find(u => u.email === username.toLowerCase() && u.password === password);
    if (foundUser) {
      const { password, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword as User);
      setCurrentTab('dashboard');
    } else {
      setAuthError('Invalid credentials.');
    }
    setIsAuthenticating(false);
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
      <div className="min-h-screen flex items-center justify-center bg-blue-700 p-4 relative overflow-hidden">
        <div className="bg-white rounded-[40px] shadow-2xl p-10 max-w-lg w-full relative z-10">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter">ElimuSmart</h1>
          </div>
          <form className="space-y-6" onSubmit={handleLogin}>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-4 bg-gray-50 border rounded-2xl" 
              placeholder="Email" 
            />
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-gray-50 border rounded-2xl" 
              placeholder="Password" 
            />
            <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl">Sign In</button>
          </form>
          <div className="mt-8 flex gap-2 justify-center">
            <button onClick={() => { setUsername('principal@school.ac.ke'); setPassword('password123'); }} className="text-[10px] bg-gray-100 p-2 rounded">Demo Principal</button>
            <button onClick={() => { setUsername('admin@school.ac.ke'); setPassword('adminpassword'); }} className="text-[10px] bg-gray-100 p-2 rounded">Demo Admin</button>
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
      <main className="p-4 md:p-8 max-w-[1600px] mx-auto">
        {currentTab === 'dashboard' && <Dashboard user={user} lang={lang} students={students} />}
        {currentTab === 'students' && <StudentManagement students={students} setStudents={setStudents} feeStructure={feeStructure} />}
        {currentTab === 'staff' && <StaffManagement />}
        {currentTab === 'academics' && <AcademicsModule lang={lang} />}
        {currentTab === 'timetable' && <TimetableModule lang={lang} />}
        {currentTab === 'finance' && <FinanceModule lang={lang} students={students} setStudents={setStudents} feeStructure={feeStructure} setFeeStructure={setFeeStructure} schoolLogo={schoolLogo} />}
        {currentTab === 'attendance' && <AttendanceModule lang={lang} />}
        {currentTab === 'messaging' && <MessagingModule lang={lang} />}
        {currentTab === 'reports' && <ReportsModule lang={lang} students={students} />}
        {currentTab === 'settings' && <SettingsModule userRole={user.role} schoolLogo={schoolLogo} setSchoolLogo={setSchoolLogo} />}
      </main>
    </Layout>
  );
};

export default App;
