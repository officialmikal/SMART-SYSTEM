
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserSquare2,
  Wallet, 
  ClipboardCheck, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  X,
  Bell,
  Globe,
  BookOpen,
  ChevronDown,
  Shield,
  Calendar,
  MessageSquare,
  Smartphone,
  Search as SearchIcon,
  CheckCircle2,
  AlertCircle,
  Cloud,
  CloudOff,
  RefreshCw,
  Download
} from 'lucide-react';
import { User, UserRole } from '../types';
import { Language, translations } from '../services/localizationService';

interface LayoutProps {
  user: User;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  logout: () => void;
  lang: Language;
  setLang: (lang: Language) => void;
  isBackendLive?: boolean;
  isSyncing?: boolean;
  switchRole?: (role: UserRole) => void;
  installApp?: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ 
  user, 
  currentTab, 
  setCurrentTab, 
  isSidebarOpen, 
  setIsSidebarOpen, 
  logout,
  lang,
  setLang,
  isBackendLive,
  isSyncing,
  installApp,
  children 
}) => {
  const t = translations[lang];
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hasAccess = (role: UserRole, tabId: string): boolean => {
    switch (tabId) {
      case 'dashboard': return true;
      case 'students': return [UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.CLASS_TEACHER].includes(role);
      case 'staff': return [UserRole.ADMIN, UserRole.PRINCIPAL].includes(role);
      case 'academics': return [UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.CLASS_TEACHER, UserRole.SUBJECT_TEACHER, UserRole.STUDENT].includes(role);
      case 'timetable': return true;
      case 'attendance': return [UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.CLASS_TEACHER, UserRole.SUBJECT_TEACHER].includes(role);
      case 'messaging': return [UserRole.ADMIN, UserRole.PRINCIPAL].includes(role);
      case 'finance': return [UserRole.ADMIN, UserRole.PRINCIPAL].includes(role);
      case 'reports': return [UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.CLASS_TEACHER, UserRole.SUBJECT_TEACHER].includes(role);
      case 'settings': return true;
      default: return false;
    }
  };

  const menuItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'students', label: t.students, icon: Users },
    { id: 'staff', label: t.staff, icon: UserSquare2 },
    { id: 'academics', label: 'Academics', icon: BookOpen },
    { id: 'timetable', label: t.timetable, icon: Calendar },
    { id: 'attendance', label: t.attendance, icon: ClipboardCheck },
    { id: 'messaging', label: 'Messaging', icon: MessageSquare },
    { id: 'finance', label: t.finance, icon: Wallet },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ].filter(item => hasAccess(user.role, item.id));

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <aside className={`
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 shadow-lg md:shadow-none flex flex-col
      `}>
        <div className="p-6 border-b flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg shadow-md shadow-blue-200">
              <span className="text-white font-black text-xl leading-none">E</span>
            </div>
            <span className="text-xl font-black tracking-tighter text-gray-900">ElimuSmart</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => { setCurrentTab(item.id); setIsSidebarOpen(false); }}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${currentTab === item.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'}
                `}
              >
                <Icon className={`w-5 h-5 ${currentTab === item.id ? 'text-white' : 'text-gray-400'}`} />
                <span className="font-bold text-sm tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t bg-gray-50/50 shrink-0 space-y-3">
          {installApp && (
            <button 
              onClick={installApp}
              className="w-full flex items-center space-x-3 px-4 py-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest border border-indigo-100 shadow-sm"
            >
              <Smartphone className="w-4 h-4" />
              <span>Install Desktop App</span>
            </button>
          )}

          <div className="px-4 flex items-center justify-between">
             <div className="flex flex-col">
                <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Network</div>
                <div className="flex items-center gap-1.5 mt-1">
                   {isBackendLive ? (
                     <>
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-[9px] font-black text-green-600 uppercase">Cloud Live</span>
                     </>
                   ) : (
                     <>
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                        <span className="text-[9px] font-black text-amber-600 uppercase">Local Mode</span>
                     </>
                   )}
                </div>
             </div>
             {isSyncing && (
               <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
             )}
          </div>
          
          <button 
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold text-sm"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-white border-b flex items-center justify-between px-4 md:px-8 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 hover:bg-gray-100 rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="hidden lg:flex flex-col">
               <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Nairobi, Kenya</span>
               <span className="text-sm font-black text-gray-900 tracking-tighter">
                 {currentTime.toLocaleTimeString('en-KE', { hour12: true, hour: '2-digit', minute: '2-digit' })}
               </span>
            </div>
          </div>

          <div className="flex-1 px-8 max-w-xl hidden md:block" ref={searchRef}>
            <div className="relative group">
              <input 
                type="text" 
                placeholder={t.search} 
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-2.5 px-10 focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none transition-all shadow-inner"
              />
              <div className="absolute left-3.5 top-3 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                <SearchIcon className="w-5 h-5" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 lg:space-x-5">
            <button 
              onClick={() => setLang(lang === 'en' ? 'sw' : 'en')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full hover:bg-gray-200 transition text-[11px] font-black text-gray-700 uppercase"
            >
              <Globe className="w-4 h-4" />
              <span>{lang}</span>
            </button>

            <div className="flex items-center space-x-3 border-l pl-5">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-black text-gray-900 tracking-tight leading-none mb-1">{user.name}</div>
                <div className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{user.role.replace('_', ' ')}</div>
              </div>
              <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} className="w-10 h-10 rounded-full border-2 border-white shadow-md" alt="Profile" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-print scroll-smooth">
          {children}
        </div>
      </div>
    </div>
  );
};
