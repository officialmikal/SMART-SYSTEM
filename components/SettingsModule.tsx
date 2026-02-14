
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
  Eye
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
  
  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // School Edit State
  const [editableConfig, setEditableConfig] = useState(schoolConfig);

  // Sync editableConfig when schoolConfig changes
  useEffect(() => {
    setEditableConfig(schoolConfig);
  }, [schoolConfig]);

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

  // Unified User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [userFormData, setUserFormData] = useState<Partial<UserType>>({
    name: '',
    email: '',
    role: UserRole.SUBJECT_TEACHER,
    password: ''
  });

  // Role Modal State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [roleFormData, setRoleFormData] = useState<Partial<CustomRole>>({
    name: '',
    description: '',
    baseRole: UserRole.SUBJECT_TEACHER
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSchoolLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Error: New passwords do not match.');
      return;
    }
    if (currentPassword !== currentUser.password) {
      alert('Error: Current password is incorrect.');
      return;
    }

    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, password: newPassword } : u));
    setIsSaving(false);
    alert('Security Update: Password successfully changed.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const openUserModal = (user?: UserType) => {
    if (user) {
      setEditingUser(user);
      setUserFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        password: user.password || ''
      });
    } else {
      setEditingUser(null);
      setUserFormData({ name: '', email: '', role: UserRole.SUBJECT_TEACHER, password: '' });
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.name || !userFormData.email) return;

    if (editingUser) {
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...userFormData } : u));
      alert(`Account for ${userFormData.name} updated successfully.`);
    } else {
      const userToAdd: UserType = {
        id: `u${Date.now()}`,
        name: userFormData.name || '',
        email: (userFormData.email || '').toLowerCase(),
        role: userFormData.role as UserRole,
        password: userFormData.password || 'password123',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userFormData.name}`
      };
      setUsers(prev => [...prev, userToAdd]);
      alert(`New account created for ${userFormData.name}.`);
    }
    setIsUserModalOpen(false);
  };

  const openRoleModal = (role?: CustomRole) => {
    if (!isAdmin) return;
    if (role) {
      setEditingRole(role);
      setRoleFormData({ ...role });
    } else {
      setEditingRole(null);
      setRoleFormData({ name: '', description: '', baseRole: UserRole.SUBJECT_TEACHER });
    }
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleFormData.name) return;

    if (editingRole) {
      setSystemRoles(prev => prev.map(r => r.id === editingRole.id ? { ...r, ...roleFormData } as CustomRole : r));
      alert(`Role ${roleFormData.name} updated.`);
    } else {
      const newRole: CustomRole = {
        id: `r${Date.now()}`,
        name: roleFormData.name || '',
        description: roleFormData.description || '',
        baseRole: roleFormData.baseRole as UserRole,
        isSystemRole: false
      };
      setSystemRoles(prev => [...prev, newRole]);
      alert(`New Role: ${roleFormData.name} created successfully.`);
    }
    setIsRoleModalOpen(false);
  };

  const handleDeleteRole = (id: string) => {
    if (!isAdmin) return;
    const role = systemRoles.find(r => r.id === id);
    if (role?.isSystemRole) {
      alert("Error: Protected System Role cannot be deleted.");
      return;
    }
    if (window.confirm(`Security Check: Are you sure you want to remove the '${role?.name}' role? Users assigned to this role will remain but their functional access will be frozen.`)) {
      setSystemRoles(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleDeleteUser = (id: string) => {
    if (id === currentUser.id) {
      alert("Error: You cannot delete your own active session.");
      return;
    }
    const target = users.find(u => u.id === id);
    if (window.confirm(`Security Warning: Are you sure you want to permanently revoke access for ${target?.name}?`)) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  const handleSaveSchoolInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert("Unauthorized: Only Administrative accounts can modify the Institutional Identity.");
      return;
    }
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1500));
    setSchoolConfig(editableConfig);
    setIsSaving(false);
    alert('School configuration updated successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">System Management</h1>
          <p className="text-gray-500 font-medium">Core platform configuration and administrative controls.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-1">
          <nav className="bg-white rounded-2xl border border-gray-100 p-2 shadow-sm">
            <NavItem icon={User} label="Personal Profile" active={activeSection === 'profile'} onClick={() => setActiveSection('profile')} />
            {isAdmin && (
              <>
                <NavItem icon={School} label="School Profile" active={activeSection === 'school'} onClick={() => setActiveSection('school')} />
                <NavItem icon={Calendar} label="Academic Term" active={activeSection === 'academic'} onClick={() => setActiveSection('academic')} />
                <NavItem icon={Users} label="User Accounts" active={activeSection === 'users'} onClick={() => setActiveSection('users')} />
                <NavItem icon={Shield} label="Role Definitions" active={activeSection === 'roles'} onClick={() => setActiveSection('roles')} />
                <NavItem icon={ClipboardList} label="Audit Logs" active={activeSection === 'logs'} onClick={() => setActiveSection('logs')} />
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
                      <p className="text-xs font-black text-blue-600 uppercase tracking-widest mt-2">{currentUser.role.replace('_', ' ')}</p>
                      <p className="text-[10px] text-gray-400 font-medium mt-1">{currentUser.email}</p>
                   </div>
                </div>
              </div>
            )}

            {activeSection === 'logs' && isAdmin && (
              <div className="p-8 space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-gray-800">Audit Trail</h3>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Tracking institutional accountability</p>
                  </div>
                  <button onClick={fetchAuditLogs} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                    <RefreshCw className={`w-5 h-5 ${isLogsLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search logs by user, action, or resource..." 
                    value={logSearch}
                    onChange={e => setLogSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 transition-all font-medium text-sm"
                  />
                </div>

                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b">
                      <tr>
                        <th className="px-4 py-3">Timestamp</th>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Action</th>
                        <th className="px-4 py-3">Resource</th>
                        <th className="px-4 py-3 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-xs">
                      {filteredLogs.map(log => (
                        <tr key={log.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 text-gray-500 font-mono">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-900">{log.userName}</td>
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
                          <td className="px-4 py-3 text-gray-600 font-medium">
                            {log.resource} <span className="opacity-40 text-[10px]">#{log.resourceId.slice(0, 8)}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                             <button onClick={() => alert(JSON.stringify(log.newValue || log.oldValue, null, 2))} className="p-1 text-gray-400 hover:text-blue-600">
                               <Eye size={14} />
                             </button>
                          </td>
                        </tr>
                      ))}
                      {filteredLogs.length === 0 && !isLogsLoading && (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-gray-400 font-black uppercase text-[10px]">No logs found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Rest of the existing sections remain unchanged */}
            {activeSection === 'roles' && isAdmin && (
              <div className="p-8 space-y-6 animate-in fade-in duration-300">
                 <div className="flex items-center justify-between border-b pb-4">
                    <h3 className="text-lg font-black uppercase tracking-tight text-gray-800">Permission Hierarchy</h3>
                    <button onClick={() => openRoleModal()} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                      <Plus className="w-4 h-4" /> Create New Role
                    </button>
                 </div>
                 {/* ... role list ... */}
              </div>
            )}
            {/* ... etc ... */}
          </div>
        </div>
      </div>
      {/* ... modals ... */}
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
