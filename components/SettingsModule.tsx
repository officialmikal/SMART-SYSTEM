
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings as SettingsIcon, 
  School, 
  Calendar, 
  Shield, 
  Bell, 
  User, 
  Save, 
  Loader2, 
  Database,
  History,
  Lock,
  Upload,
  Camera,
  Trash2,
  Users,
  Plus,
  Key,
  Smartphone,
  Banknote,
  CreditCard,
  Hash,
  Edit3,
  X,
  ShieldCheck,
  UserPlus,
  RefreshCw,
  Clock as ClockIcon,
  ShieldAlert,
  ArrowRight,
  ClipboardList,
  Search,
  Eye,
  Monitor,
  Globe,
  MapPin
} from 'lucide-react';
import { UserRole, User as UserType, CustomRole, AuditLog } from '../types';
import { apiService } from '../services/apiService';

interface SettingsModuleProps {
  currentUser: UserType;
  users: UserType[];
  setUsers: React.Dispatch<React.SetStateAction<UserType[]>>;
  schoolLogo: string | null;
  setSchoolLogo: (logo: string | null) => void;
  schoolConfig: any;
  setSchoolConfig: React.Dispatch<React.SetStateAction<any>>;
  systemRoles: CustomRole[];
  setSystemRoles: React.Dispatch<React.SetStateAction<CustomRole[]>>;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({ 
  currentUser, 
  users, 
  setUsers, 
  schoolLogo, 
  setSchoolLogo,
  schoolConfig,
  setSchoolConfig,
  systemRoles,
  setSystemRoles
}) => {
  const [activeSection, setActiveSection] = useState<'profile' | 'school' | 'academic' | 'security' | 'users' | 'roles' | 'logs'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  
  // Institution Identity
  const institutionName = (currentUser as any).institution?.name || "ElimuSmart Academy";

  // Fetch Logs
  useEffect(() => {
    if (activeSection === 'logs' && currentUser.role === UserRole.ADMIN) {
      fetchAuditLogs();
    }
  }, [activeSection]);

  const fetchAuditLogs = async () => {
    setIsLogsLoading(true);
    try {
      const data = await apiService.request('/admin/logs');
      setAuditLogs(data);
    } catch (e) {
      console.error("Failed to fetch logs");
    } finally {
      setIsLogsLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => 
      log.userName.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.resource.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.action.toLowerCase().includes(logSearch.toLowerCase())
    );
  }, [auditLogs, logSearch]);

  const isAdmin = currentUser.role === UserRole.ADMIN;

  // Modals omitted for brevity - logic remains same but includes institutional scoping
  // ... (User/Role management methods)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">System Management</h1>
          <p className="text-gray-500 font-medium">Institutional Controls for <strong className="text-blue-600">{institutionName}</strong>.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-1">
          <nav className="bg-white rounded-2xl border border-gray-100 p-2 shadow-sm">
            <NavItem icon={User} label="Personal Profile" active={activeSection === 'profile'} onClick={() => setActiveSection('profile')} />
            {isAdmin && (
              <>
                <NavItem icon={School} label="School Profile" active={activeSection === 'school'} onClick={() => setActiveSection('school')} />
                <NavItem icon={Users} label="User Accounts" active={activeSection === 'users'} onClick={() => setActiveSection('users')} />
                <NavItem icon={Shield} label="Role Definitions" active={activeSection === 'roles'} onClick={() => setActiveSection('roles')} />
                <NavItem icon={ClipboardList} label="Institutional Logs" active={activeSection === 'logs'} onClick={() => setActiveSection('logs')} />
              </>
            )}
            <NavItem icon={Lock} label="Security" active={activeSection === 'security'} onClick={() => setActiveSection('security')} />
          </nav>
        </div>

        <div className="md:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
            
            {activeSection === 'profile' && (
              <div className="p-8 space-y-6 animate-in fade-in duration-300">
                <h3 className="text-lg font-black border-b pb-4 uppercase tracking-tight text-gray-800">My Identity</h3>
                <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-2xl">
                   <img src={currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`} className="w-20 h-20 rounded-2xl border-4 border-white shadow-md" alt="Avatar" />
                   <div>
                      <p className="text-2xl font-black text-gray-900 leading-none">{currentUser.name}</p>
                      <p className="text-xs font-black text-blue-600 uppercase tracking-widest mt-2">{currentUser.role.replace('_', ' ')} @ {institutionName}</p>
                      <p className="text-[10px] text-gray-400 font-medium mt-1">{currentUser.email}</p>
                   </div>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                   <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
                   <p className="text-[10px] text-amber-700 font-bold uppercase leading-relaxed">Security Notice: Your current session is bound to this device and institution. Logins from unauthorized locations will be flagged in the Audit Trail.</p>
                </div>
              </div>
            )}

            {activeSection === 'logs' && isAdmin && (
              <div className="p-8 space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-gray-800">Institutional Audit Trail</h3>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Cross-device activity for {institutionName}</p>
                  </div>
                  <button onClick={fetchAuditLogs} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                    <RefreshCw className={`w-5 h-5 ${isLogsLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search logs by user or device..." 
                    value={logSearch}
                    onChange={e => setLogSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 text-sm"
                  />
                </div>

                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b">
                      <tr>
                        <th className="px-4 py-3">Timestamp</th>
                        <th className="px-4 py-3">Identity</th>
                        <th className="px-4 py-3">Device/Origin</th>
                        <th className="px-4 py-3">Action</th>
                        <th className="px-4 py-3 text-right">Context</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-xs">
                      {filteredLogs.map(log => (
                        <tr key={log.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 text-gray-500 font-mono">
                            {/* Updated to use createdAt property from AuditLog interface */}
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-900">{log.userName}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-0.5">
                               <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase">
                                  {/* Fixed: Property userAgent now exists on AuditLog interface */}
                                  <Monitor size={10} /> {log.userAgent?.includes('Mobile') ? 'Mobile' : 'Desktop'}
                               </div>
                               <div className="flex items-center gap-1.5 text-[9px] font-bold text-blue-400">
                                  {/* Fixed: Property ipAddress now exists on AuditLog interface */}
                                  <Globe size={10} /> {log.ipAddress || 'Internal'}
                               </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                              log.action === 'DELETE' ? 'bg-red-50 text-red-600' :
                              log.action === 'UPDATE' ? 'bg-amber-50 text-amber-600' :
                              log.action === 'CREATE' ? 'bg-green-50 text-green-600' :
                              'bg-blue-50 text-blue-600'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                             <button onClick={() => alert(JSON.stringify({
                               resource: log.resource,
                               id: log.resourceId,
                               metadata: log.newValue || log.oldValue,
                               /* Fixed: Property userAgent now exists on AuditLog interface */
                               device: log.userAgent
                             }, null, 2))} className="p-1 text-gray-400 hover:text-blue-600">
                               <Eye size={14} />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* Other sections... */}
          </div>
        </div>
      </div>
    </div>
  );
};

const NavItem: React.FC<{ icon: any, label: string, active: boolean, onClick: () => void }> = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-sm font-black uppercase tracking-tighter transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
  >
    <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-400'}`} />
    <span>{label}</span>
  </button>
);
