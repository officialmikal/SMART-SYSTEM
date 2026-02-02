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
import { UserRole, User, Student, ClassFee, KENYAN_CLASSES, Expenditure, Staff, SMSProvider } from './types';
import { Language } from './services/localizationService';

// Utility to determine the current academic period in the Kenyan school system
const getCurrentAcademicCycle = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  let term = 1;
  if (month >= 4 && month <= 7) term = 2;
  else if (month >= 8) term = 3;
  return { year, term };
};

const INITIAL_STUDENTS: Student[] = [
  { id: '1', admissionNumber: 'ADM001', firstName: 'Kamau', lastName: 'Njoroge', class: 'Grade 7', stream: 'Oak', gender: 'Male', dob: '2011-04-12', guardianPhone: '0712345678', guardianName: 'Sarah Njoroge', totalFee: 45000, agreedFee: 42000, paidFee: 32500, feeBalance: 9500, prepaidFee: 0, photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kamau' },
  { id: '2', admissionNumber: 'ADM002', firstName: 'Amara', lastName: 'Kiprono', class: 'Grade 8', stream: 'Palm', gender: 'Female', dob: '2010-08-25', guardianPhone: '0722000111', guardianName: 'David Kiprono', totalFee: 45000, paidFee: 45000, feeBalance: 0, prepaidFee: 2500, photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amara' },
  { id: '3', admissionNumber: 'ADM003', firstName: 'Zuri', lastName: 'Achieng', class: 'Grade 7', stream: 'Oak', gender: 'Female', dob: '2011-11-02', guardianPhone: '0712345678', guardianName: 'Sarah Njoroge', totalFee: 45000, agreedFee: 45000, paidFee: 15000, feeBalance: 30000, prepaidFee: 0, photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zuri' },
  { id: '4', admissionNumber: 'ADM004', firstName: 'Jabari', lastName: 'Omondi', class: 'Grade 9', stream: 'Acacia', gender: 'Male', dob: '2009-03-15', guardianPhone: '0744999888', guardianName: 'Peter Omondi', totalFee: 48000, paidFee: 48000, feeBalance: 0, prepaidFee: 0, photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jabari' },
  { id: '5', admissionNumber: 'ADM005', firstName: 'Mwikali', lastName: 'Musyoka', class: 'Grade 8', stream: 'Willow', gender: 'Female', dob: '2010-05-20', guardianPhone: '0755666777', guardianName: 'Ruth Musyoka', totalFee: 45000, paidFee: 40000, feeBalance: 5000, prepaidFee: 0, photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mwikali' },
];

const INITIAL_STAFF: Staff[] = [
  { id: 't1', staffId: 'TS001', name: 'James Otieno', email: 'jotieno@elimusmart.co.ke', phone: '0711122233', role: 'Subject Teacher', subjects: ['Mathematics', 'Physics'], photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Otieno' },
  { id: 't2', staffId: 'TS002', name: 'Mary Wambui', email: 'mwambui@elimusmart.co.ke', phone: '0722233344', role: 'Class Teacher', subjects: ['Kiswahili', 'Social Studies'], photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wambui' },
];

const INITIAL_EXPENDITURES: Expenditure[] = [
  { id: 'exp1', amount: 120000, category: 'Salaries', date: '2024-05-01', description: 'Teacher Monthly Salaries' },
  { id: 'exp2', amount: 45000, category: 'Utilities', date: '2024-05-05', description: 'Electricity & Water' },
  { id: 'exp3', amount: 25000, category: 'Food/Supplies', date: '2024-05-10', description: 'Canteen Supplies' },
];

const INITIAL_USERS: User[] = [
  { id: 'u1', email: 'principal@school.ac.ke', password: 'password123', name: 'Principal Maina', role: UserRole.PRINCIPAL, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maina' },
  { id: 'u2', email: 'admin@school.ac.ke', password: 'adminpassword', name: 'Admin Kioko', role: UserRole.ADMIN, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kioko' },
  { id: 'u3', email: 'teacher@school.ac.ke', password: 'teacher123', name: 'Tr. Wambui', role: UserRole.CLASS_TEACHER, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wambui' },
];

const INITIAL_FEE_STRUCTURE: ClassFee[] = KENYAN_CLASSES.map(cls => ({ className: cls, amount: 45000 }));

const { year: autoYear, term: autoTerm } = getCurrentAcademicCycle();

const INITIAL_SCHOOL_CONFIG = {
  schoolName: 'ElimuSmart Academy',
  motto: 'Excellence in Knowledge and Character',
  registrationNo: 'MOE/P/2024/0981',
  year: autoYear,
  term: autoTerm,
  mpesaPaybill: '522522',
  mpesaTill: '',
  bankName: 'KCB Bank',
  bankAccountNumber: '1100223344',
  smsSettings: {
    provider: SMSProvider.AFRICAS_TALKING,
    username: 'elimusmart_admin',
    apiKey: '***',
    senderId: 'ELIMUSMART',
    enabled: true
  }
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [lang, setLang] = useState<Language>('en');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
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

  const [staff, setStaff] = useState<Staff[]>(() => {
    try {
      const saved = localStorage.getItem('elimusmart_staff');
      return saved ? JSON.parse(saved) : INITIAL_STAFF;
    } catch (e) {
      return INITIAL_STAFF;
    }
  });

  const [expenditures, setExpenditures] = useState<Expenditure[]>(() => {
    try {
      const saved = localStorage.getItem('elimusmart_expenditures');
      return saved ? JSON.parse(saved) : INITIAL_EXPENDITURES;
    } catch (e) {
      return INITIAL_EXPENDITURES;
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
      const savedStr = localStorage.getItem('elimusmart_config');
      if (!savedStr) return INITIAL_SCHOOL_CONFIG;
      
      const saved = JSON.parse(savedStr);
      const merged = {
        ...INITIAL_SCHOOL_CONFIG,
        ...saved,
        smsSettings: {
          ...INITIAL_SCHOOL_CONFIG.smsSettings,
          ...(saved.smsSettings || {})
        }
      };

      if (!merged.year || merged.year < autoYear) {
         return { ...merged, year: autoYear, term: autoTerm };
      }
      return merged;
    } catch (e) {
      return INITIAL_SCHOOL_CONFIG;
    }
  });

  // PWA Install Logic
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  useEffect(() => {
    localStorage.setItem('elimusmart_users', JSON.stringify(users));
    localStorage.setItem('elimusmart_students', JSON.stringify(students));
    localStorage.setItem('elimusmart_staff', JSON.stringify(staff));
    localStorage.setItem('elimusmart_expenditures', JSON.stringify(expenditures));
    localStorage.setItem('elimusmart_fees', JSON.stringify(feeStructure));
    localStorage.setItem('elimusmart_config', JSON.stringify(schoolConfig));
    if (schoolLogo) localStorage.setItem('elimusmart_logo', schoolLogo);
    else localStorage.removeItem('elimusmart_logo');
  }, [users, students, staff, expenditures, feeStructure, schoolConfig, schoolLogo]);

  const logout = () => setUser(null);
  
  const login = (email: string, pass: string) => {
    const found = users.find(u => u.email === email && u.password === pass);
    if (found) setUser(found);
    else alert('Invalid credentials. Hint: use admin@school.ac.ke / adminpassword');
  };

  const switchRole = (role: UserRole) => {
    const found = users.find(u => u.role === role);
    if (found) setUser(found);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-[40px] shadow-2xl max-w-md w-full border-2 border-gray-50">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">ElimuSmart</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Enterprise School Management</p>
          </div>
          <form onSubmit={(e: any) => {
            e.preventDefault();
            login(e.target.email.value, e.target.password.value);
          }} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
              <input name="email" type="email" defaultValue="admin@school.ac.ke" className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-blue-500" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
              <input name="password" type="password" defaultValue="adminpassword" className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-blue-500" />
            </div>
            <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100">Login to Portal</button>
          </form>
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
      logout={logout}
      lang={lang}
      setLang={setLang}
      switchRole={switchRole}
      installApp={deferredPrompt ? handleInstallClick : undefined}
    >
      <div className="p-4 md:p-8">
        {currentTab === 'dashboard' && <Dashboard user={user} lang={lang} students={students} />}
        {currentTab === 'students' && <StudentManagement students={students} setStudents={setStudents} feeStructure={feeStructure} />}
        {currentTab === 'staff' && <StaffManagement staffList={staff} setStaffList={setStaff} />}
        {currentTab === 'finance' && <FinanceModule lang={lang} students={students} setStudents={setStudents} expenditures={expenditures} setExpenditures={setExpenditures} feeStructure={feeStructure} setFeeStructure={setFeeStructure} schoolLogo={schoolLogo} schoolConfig={schoolConfig} />}
        {currentTab === 'attendance' && <AttendanceModule lang={lang} students={students} />}
        {currentTab === 'academics' && <AcademicsModule lang={lang} students={students} setStudents={setStudents} schoolConfig={schoolConfig} />}
        {currentTab === 'reports' && <ReportsModule lang={lang} students={students} users={users} schoolLogo={schoolLogo} schoolConfig={schoolConfig} />}
        {currentTab === 'timetable' && <TimetableModule lang={lang} />}
        {currentTab === 'messaging' && <MessagingModule lang={lang} user={user} students={students} schoolConfig={schoolConfig} setSchoolConfig={setSchoolConfig} />}
        {currentTab === 'settings' && <SettingsModule currentUser={user} users={users} setUsers={setUsers} schoolLogo={schoolLogo} setSchoolLogo={setSchoolLogo} schoolConfig={schoolConfig} setSchoolConfig={setSchoolConfig} />}
      </div>
    </Layout>
  );
};

export default App;