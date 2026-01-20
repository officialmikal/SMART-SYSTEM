
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

// Mock Users for different roles
const MOCK_USERS: Record<UserRole, User> = {
  [UserRole.PRINCIPAL]: {
    id: 'u1',
    name: 'Principal Maina',
    email: 'maina@elimusmart.co.ke',
    role: UserRole.PRINCIPAL,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maina'
  },
  [UserRole.ADMIN]: {
    id: 'u2',
    name: 'Admin Kioko',
    email: 'kioko@elimusmart.co.ke',
    role: UserRole.ADMIN,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kioko'
  },
  [UserRole.CLASS_TEACHER]: {
    id: 'u3',
    name: 'Tr. Wanjiku',
    email: 'wanjiku@elimusmart.co.ke',
    role: UserRole.CLASS_TEACHER,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wanjiku'
  },
  [UserRole.SUBJECT_TEACHER]: {
    id: 'u4',
    name: 'Tr. Omari',
    email: 'omari@elimusmart.co.ke',
    role: UserRole.SUBJECT_TEACHER,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Omari'
  },
  [UserRole.STUDENT]: {
    id: 'u5',
    name: 'Juma Kipruto',
    email: 'juma@students.ac.ke',
    role: UserRole.STUDENT,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juma'
  },
  [UserRole.PARENT]: {
    id: 'u6',
    name: 'Robert Kipruto',
    email: 'robert@parents.ac.ke',
    role: UserRole.PARENT,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert'
  }
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(MOCK_USERS[UserRole.PRINCIPAL]);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [lang, setLang] = useState<Language>('en');

  const switchRole = (role: UserRole) => {
    setUser(MOCK_USERS[role]);
    setCurrentTab('dashboard'); // Reset to dashboard on role switch
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-600 p-4 font-sans">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full animate-in fade-in duration-500">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-blue-800 tracking-tighter">ElimuSmart</h1>
            <p className="text-gray-500 font-medium">Kenyan CBC & JSS Management</p>
          </div>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setUser(MOCK_USERS[UserRole.PRINCIPAL]); }}>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Email / Phone</label>
              <input type="text" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="admin@school.ac.ke" />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Password</label>
              <input type="password" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="••••••••" />
            </div>
            <button className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200">
              Sign In to Dashboard
            </button>
          </form>
          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">Demo Roles (Quick Access)</p>
            <div className="flex flex-wrap justify-center gap-2">
              {Object.keys(MOCK_USERS).map((role) => (
                <button 
                  key={role}
                  onClick={() => switchRole(role as UserRole)}
                  className="px-2 py-1 bg-gray-50 hover:bg-blue-50 text-[9px] font-black text-gray-500 hover:text-blue-600 rounded border border-gray-100 transition-all uppercase"
                >
                  {role.replace('_', ' ')}
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
      logout={() => setUser(null)}
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
