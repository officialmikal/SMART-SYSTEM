
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
  AlertCircle
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
  switchRole,
  installApp,
  children 
}) => {
  const t = translations[lang];
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
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

  // Mock Notifications
  const notifications = [
    { id: 1, text: 'Tuition payment received for ADM001', time: '2 mins ago', type: 'success' },
    { id: 2, text: 'Term 3 attendance report finalized', time: '1 hour ago', type: 'info' },
    { id: 3, text: 'Low SMS balance alert: 4,250 left', time: '3 hours ago', type: 'warning' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={`
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 shadow-lg md:shadow-none
      `}>
        <div className="p-6 border-b flex items-center justify-between">
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

        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-280px)]">
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

        <div className="absolute bottom-0 w-full p-4 border-t bg-gray-50/50">
          {installApp && !window.matchMedia('(display-mode: standalone)').matches && (
            <div className="mb-4 p-4 bg-blue-600 rounded-2xl shadow-xl shadow-blue-200 text-white relative overflow-hidden group">
               <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-16 h-16" />
               </div>
               <div className="relative z-10">
                 <h4 className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Get the App</h4>
                 <p className="text-[11px] font-bold leading-tight mb-3">Install ElimuSmart for the best experience.</p>
                 <button 
                  onClick={installApp}
                  className="w-full py-2 bg-white text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-colors shadow-sm"
                 >
                   Install Now
                 </button>
               </div>
            </div>
          )}

          <div className="mb-4 px-4">
             <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">School Version</div>
             <div className="text-[10px] font-bold text-gray-600">v2.5.0 Enterprise</div>
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b flex items-center justify-between px-4 md:px-8 z-30">
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-2.5 px-10 focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none transition-all shadow-inner"
              />
              <div className="absolute left-3.5 top-3 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                <SearchIcon className="w-5 h-5" strokeWidth={2.5} />
              </div>
              
              {/* Search Results Mockup */}
              {searchTerm.length > 1 && (
                <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-3xl shadow-2xl border border-gray-100 p-4 animate-in slide-in-from-top-2 duration-300 z-50">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 mb-3">Quick Search Results</p>
                   <div className="space-y-2">
                      <div className="p-3 hover:bg-blue-50 rounded-2xl transition-colors cursor-pointer flex items-center gap-4 group">
                         <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold">K</div>
                         <div>
                            <p className="font-black text-sm text-gray-900 group-hover:text-blue-700 transition-colors">Kamau Njoroge</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">ADM001 • Grade 7 Oak</p>
                         </div>
                      </div>
                      <div className="p-3 hover:bg-blue-50 rounded-2xl transition-colors cursor-pointer flex items-center gap-4 group">
                         <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold">J</div>
                         <div>
                            <p className="font-black text-sm text-gray-900 group-hover:text-indigo-700 transition-colors">James Otieno</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">TS001 • Staff • Mathematics</p>
                         </div>
                      </div>
                   </div>
                   <button 
                    onClick={() => { setCurrentTab('students'); setSearchTerm(''); }}
                    className="w-full mt-4 py-3 bg-gray-50 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-colors"
                   >
                     Show all results
                   </button>
                </div>
              )}
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
            
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2.5 rounded-full relative transition-all ${showNotifications ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                <Bell className="w-6 h-6" />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              
              {/* Notifications Drawer */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in duration-300">
                   <div className="p-5 border-b flex items-center justify-between">
                      <h4 className="font-black text-gray-900 uppercase tracking-tighter">Notifications</h4>
                      <span className="text-[9px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase">3 New</span>
                   </div>
                   <div className="divide-y max-h-96 overflow-y-auto">
                      {notifications.map(n => (
                        <div key={n.id} className="p-4 hover:bg-gray-50 transition-colors flex gap-4">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.type === 'success' ? 'bg-green-50 text-green-600' : n.type === 'warning' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                              {n.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                           </div>
                           <div>
                              <p className="text-xs font-bold text-gray-800 leading-snug">{n.text}</p>
                              <p className="text-[10px] font-medium text-gray-400 mt-1">{n.time}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                   <button className="w-full py-4 text-[10px] font-black text-blue-600 uppercase bg-blue-50/50 hover:bg-blue-50 transition-colors border-t border-blue-50">
                     Clear All Notifications
                   </button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3 border-l pl-5">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-black text-gray-900 tracking-tight leading-none mb-1">{user.name}</div>
                <div className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{user.role.replace('_', ' ')}</div>
              </div>
              <div className="relative group">
                <img src={user.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-md cursor-pointer hover:ring-4 hover:ring-blue-100 transition-all" alt="Profile" />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-2 z-50">
                  <div className="px-4 py-2 border-b mb-1">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Portal Role</p>
                     <p className="text-xs font-black text-blue-600">{user.role}</p>
                  </div>
                  {Object.values(UserRole).map(role => (
                    <button 
                      key={role}
                      onClick={() => switchRole?.(role)}
                      className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase hover:bg-blue-50 rounded-xl transition-colors text-gray-600"
                    >
                      Login as {role.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <div className="flex-1 overflow-y-auto no-print scroll-smooth">
          {children}
        </div>
      </div>
    </div>
  );
};
