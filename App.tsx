
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
import { apiService } from './services/apiService';

const getCurrentAcademicCycle = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  let term = 1;
  if (month >= 4 && month <= 7) term = 2;
  else if (month >= 8) term = 3;
  return { year, term };
};

const INITIAL_SCHOOL_CONFIG = {
  schoolName: 'ElimuSmart Academy',
  motto: 'Excellence in Knowledge and Character',
  registrationNo: 'MOE/P/2024/0981',
  year: getCurrentAcademicCycle().year,
  term: getCurrentAcademicCycle().term,
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
  const [isBackendLive, setIsBackendLive] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Core Data States
  const [students, setStudents] = useState<Student[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [feeStructure, setFeeStructure] = useState<ClassFee[]>([]);
  const [schoolConfig, setSchoolConfig] = useState(INITIAL_SCHOOL_CONFIG);
  const [schoolLogo, setSchoolLogo] = useState<string | null>(null);

  // Initialize and check connection
  useEffect(() => {
    const checkConnection = async () => {
      const isLive = await apiService.checkHealth();
      setIsBackendLive(isLive);
      
      if (isLive && localStorage.getItem('elimusmart_token')) {
        try {
          const profile = await apiService.request('/auth/me');
          setUser(profile);
          fetchCloudData();
        } catch (e) {
          console.debug("Auth session expired");
        }
      } else {
        // Fallback to local storage for prototype/offline
        loadLocalData();
      }
    };
    checkConnection();

    window.addEventListener('unauthorized', () => {
      setUser(null);
    });
  }, []);

  const loadLocalData = () => {
    try {
      const s = localStorage.getItem('elimusmart_students');
      if (s) setStudents(JSON.parse(s));
      const st = localStorage.getItem('elimusmart_staff');
      if (st) setStaff(JSON.parse(st));
      const f = localStorage.getItem('elimusmart_fees');
      if (f) setFeeStructure(JSON.parse(f));
      const c = localStorage.getItem('elimusmart_config');
      if (c) setSchoolConfig(JSON.parse(c));
      setSchoolLogo(localStorage.getItem('elimusmart_logo'));
    } catch (e) {
      console.error("Local load failed");
    }
  };

  const fetchCloudData = async () => {
    setIsSyncing(true);
    try {
      const [cloudStudents, cloudStaff, cloudClasses] = await Promise.all([
        apiService.request('/students'),
        apiService.request('/staff'),
        apiService.request('/classes')
      ]);
      if (cloudStudents) setStudents(cloudStudents);
      if (cloudStaff) setStaff(cloudStaff);
      // Map cloud fees back to ClassFee format
      if (cloudClasses) {
        const fees = cloudClasses.map((c: any) => ({
          className: c.name,
          amount: c.feeStructure?.amount || 0
        }));
        setFeeStructure(fees);
      }
    } catch (e) {
      console.error("Cloud sync failed, using local cache");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = (e.target as any).email.value;
    const password = (e.target as any).password.value;

    if (isBackendLive) {
      try {
        const res = await apiService.request('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        localStorage.setItem('elimusmart_token', res.token);
        setUser(res);
        fetchCloudData();
      } catch (err: any) {
        alert(err.message || "Invalid credentials");
      }
    } else {
      // Mock login for offline prototype
      if (email === 'admin@school.ac.ke' && password === 'adminpassword') {
        setUser({ id: 'local-1', name: 'Admin (Offline)', email, role: UserRole.ADMIN });
        loadLocalData();
      } else {
        alert("Incorrect login. Note: System is currently in OFFLINE mode.");
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('elimusmart_token');
    setUser(null);
  };

  // Sync state to local storage for persistence
  useEffect(() => {
    if (students.length > 0) localStorage.setItem('elimusmart_students', JSON.stringify(students));
    if (staff.length > 0) localStorage.setItem('elimusmart_staff', JSON.stringify(staff));
    if (feeStructure.length > 0) localStorage.setItem('elimusmart_fees', JSON.stringify(feeStructure));
    localStorage.setItem('elimusmart_config', JSON.stringify(schoolConfig));
    if (schoolLogo) localStorage.setItem('elimusmart_logo', schoolLogo);
  }, [students, staff, feeStructure, schoolConfig, schoolLogo]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[48px] shadow-2xl max-w-md w-full border-2 border-gray-50">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">ElimuSmart</h1>
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className={`w-2 h-2 rounded-full ${isBackendLive ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {isBackendLive ? 'Cloud Database Ready' : 'Database Offline - Local Mode'}
              </p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
              <input name="email" type="email" required defaultValue="admin@school.ac.ke" className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-blue-500" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
              <input name="password" type="password" required defaultValue="adminpassword" className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-blue-500" />
            </div>
            <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95">
              Authorize Access
            </button>
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
      isBackendLive={isBackendLive}
      isSyncing={isSyncing}
    >
      <div className="p-4 md:p-8">
        {currentTab === 'dashboard' && <Dashboard user={user} lang={lang} students={students} />}
        {currentTab === 'students' && <StudentManagement students={students} setStudents={setStudents} feeStructure={feeStructure} />}
        {currentTab === 'staff' && <StaffManagement staffList={staff} setStaffList={setStaff} />}
        {currentTab === 'finance' && <FinanceModule lang={lang} students={students} setStudents={setStudents} expenditures={expenditures} setExpenditures={setExpenditures} feeStructure={feeStructure} setFeeStructure={setFeeStructure} schoolLogo={schoolLogo} schoolConfig={schoolConfig} isBackendLive={isBackendLive} />}
        {currentTab === 'attendance' && <AttendanceModule lang={lang} students={students} />}
        {currentTab === 'academics' && <AcademicsModule lang={lang} students={students} setStudents={setStudents} schoolConfig={schoolConfig} />}
        {currentTab === 'reports' && <ReportsModule lang={lang} students={students} users={[]} schoolLogo={schoolLogo} schoolConfig={schoolConfig} />}
        {currentTab === 'timetable' && <TimetableModule lang={lang} />}
        {currentTab === 'messaging' && <MessagingModule lang={lang} user={user} students={students} schoolConfig={schoolConfig} setSchoolConfig={setSchoolConfig} />}
        {currentTab === 'settings' && <SettingsModule currentUser={user} users={[]} setUsers={() => {}} schoolLogo={schoolLogo} setSchoolLogo={setSchoolLogo} schoolConfig={schoolConfig} setSchoolConfig={setSchoolConfig} />}
      </div>
    </Layout>
  );
};

export default App;
