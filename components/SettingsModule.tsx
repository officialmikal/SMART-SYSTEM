
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  MapPin,
  LockKeyhole,
  CheckCircle2,
  Mail,
  Building2,
  Fingerprint,
  ImagePlus,
  ShieldQuestion
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
  isBackendLive?: boolean;
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
  setSystemRoles,
  isBackendLive = false
}) => {
  const [activeSection, setActiveSection] = useState<'profile' | 'school' | 'users' | 'roles' | 'logs' | 'security'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Password Change States
  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' });
  const [resetPwForm, setResetPwForm] = useState({ id: '', name: '', password: '', confirm: '' });
  const [isResetPwModalOpen, setIsResetPwModalOpen] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  // User Management States
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [userFormData, setUserFormData] = useState({ 
    name: '', 
    email: '', 
    role: UserRole.SUBJECT_TEACHER, 
    password: '',
    active: true 
  });

  // Role Management States
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [roleFormData, setRoleFormData] = useState({ name: '', description: '', baseRole: UserRole.SUBJECT_TEACHER });
  
  const institution = (currentUser as any).institution || { name: schoolConfig.schoolName, motto: schoolConfig.motto, registrationNumber: schoolConfig.registrationNo };

  useEffect(() => {
    if (activeSection === 'logs' && isBackendLive) fetchAuditLogs();
    // In demo mode or live mode, we might want to fetch users
    if (activeSection === 'users' && isBackendLive) fetchUsers();
  }, [activeSection, isBackendLive]);

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

  const fetchUsers = async () => {
    try {
      if (isBackendLive) {
        const data = await apiService.request('/users');
        setUsers(data);
      } else {
        // Mock data ONLY if the list is currently empty in demo mode
        if (users.length === 0) {
          const mockUsers: UserType[] = [
            { id: 'u1', name: 'Principal Jane', email: 'principal@school.ac.ke', role: UserRole.PRINCIPAL, active: true },
            { id: 'u2', name: 'Finance Mgr John', email: 'finance@school.ac.ke', role: UserRole.FINANCE, active: true },
            { id: 'u3', name: 'Teacher Sarah', email: 'teacher@school.ac.ke', role: UserRole.TEACHER, active: false }
          ];
          setUsers(mockUsers);
        }
      }
    } catch (e) {
      console.error("Failed to fetch users");
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (isBackendLive) {
        if (editingUser) {
          const updated = await apiService.request(`/users/${editingUser.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              name: userFormData.name,
              email: userFormData.email,
              role: userFormData.role,
              active: userFormData.active
            })
          });
          setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
        } else {
          const created = await apiService.request('/users', {
            method: 'POST',
            body: JSON.stringify(userFormData)
          });
          setUsers(prev => [...prev, created]);
        }
      } else {
        // Mock logic
        const mockUser = {
          id: editingUser?.id || 'u-' + Date.now(),
          ...userFormData,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userFormData.name}`
        };
        if (editingUser) {
          setUsers(prev => prev.map(u => u.id === editingUser.id ? mockUser : u));
        } else {
          setUsers(prev => [...prev, mockUser]);
        }
      }
      setIsUserModalOpen(false);
      setEditingUser(null);
    } catch (err: any) {
      alert(err.message || "Failed to persist identity.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleUserStatus = async (user: UserType) => {
    if (!confirm(`Are you sure you want to ${user.active ? 'deactivate' : 'activate'} ${user.name}?`)) return;
    
    try {
      if (isBackendLive) {
        const updated = await apiService.request(`/users/${user.id}`, {
          method: 'PUT',
          body: JSON.stringify({ ...user, active: !user.active })
        });
        setUsers(prev => prev.map(u => u.id === user.id ? updated : u));
      } else {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: !u.active } : u));
      }
    } catch (err: any) {
      alert(err.message || "Status transition failed.");
    }
  };

  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetPwForm.password !== resetPwForm.confirm) {
      alert("Passwords do not match.");
      return;
    }

    setIsSaving(true);
    try {
      if (isBackendLive) {
        await apiService.request(`/users/${resetPwForm.id}/password`, {
          method: 'PATCH',
          body: JSON.stringify({ newPassword: resetPwForm.password })
        });
      }
      setIsResetPwModalOpen(false);
      setResetPwForm({ id: '', name: '', password: '', confirm: '' });
      alert("User credentials rotated successfully.");
    } catch (err: any) {
      alert(err.message || "Failed to rotate credentials.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure? This will permanently purge the identity records.")) return;
    try {
      if (isBackendLive) {
        await apiService.request(`/users/${id}`, { method: 'DELETE' });
      }
      setUsers(prev => prev.map(u => u.id === id ? { ...u, active: false } : u)); // Soft delete visual
      if (isBackendLive) fetchUsers();
    } catch (err: any) {
      alert(err.message || "Purge failed.");
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setSchoolLogo(base64String);
        triggerSyncNotice("Institutional Branding Updated");
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerSyncNotice = (msg: string) => {
    alert(msg + ". Changes will be reflected on all receipts and reports immediately.");
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (pwForm.new !== pwForm.confirm) {
      setPwError('New passwords do not match.');
      return;
    }
    if (pwForm.new.length < 6) {
      setPwError('Password must be at least 6 characters.');
      return;
    }

    setIsSaving(true);
    try {
      if (isBackendLive) {
        await apiService.request('/auth/change-password', {
          method: 'PUT',
          body: JSON.stringify({
            currentPassword: pwForm.current,
            newPassword: pwForm.new
          })
        });
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      setPwSuccess('Credentials updated successfully. Security tokens refreshed.');
      setPwForm({ current: '', new: '', confirm: '' });
    } catch (err: any) {
      setPwError(err.message || 'Failed to update password. Verify current credentials.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRole) {
      setSystemRoles(prev => prev.map(r => r.id === editingRole.id ? { ...r, ...roleFormData } : r));
    } else {
      const newRole: CustomRole = {
        id: 'role-' + Date.now(),
        ...roleFormData,
        isSystemRole: false
      };
      setSystemRoles(prev => [...prev, newRole]);
    }
    setIsRoleModalOpen(false);
    setEditingRole(null);
  };

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => 
      log.userName.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.resource.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.action.toLowerCase().includes(logSearch.toLowerCase())
    );
  }, [auditLogs, logSearch]);

  const isAdmin = currentUser.role === UserRole.ADMIN;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">System Core</h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-3 flex items-center gap-3">
             <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
             {schoolConfig.schoolName} • Administration
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-2">
          <nav className="bg-white rounded-[32px] border-2 border-gray-50 p-3 shadow-xl space-y-1">
            <NavItem icon={User} label="My Identity" active={activeSection === 'profile'} onClick={() => setActiveSection('profile')} />
            {isAdmin && (
              <>
                <NavItem icon={School} label="School Profile" active={activeSection === 'school'} onClick={() => setActiveSection('school')} />
                <NavItem icon={Users} label="User Accounts" active={activeSection === 'users'} onClick={() => setActiveSection('users')} />
                <NavItem icon={Shield} label="Role Definitions" active={activeSection === 'roles'} onClick={() => setActiveSection('roles')} />
                <NavItem icon={ClipboardList} label="Audit Trail" active={activeSection === 'logs'} onClick={() => setActiveSection('logs')} />
              </>
            )}
            <NavItem icon={Lock} label="Access Keys" active={activeSection === 'security'} onClick={() => setActiveSection('security')} />
          </nav>
        </div>

        <div className="md:col-span-3">
          <div className="bg-white rounded-[48px] border-2 border-gray-50 shadow-2xl overflow-hidden min-h-[600px] animate-in slide-in-from-bottom-4 duration-500">
            
            {/* SCHOOL PROFILE & LOGO UPLOAD */}
            {activeSection === 'school' && isAdmin && (
              <div className="p-10 space-y-12">
                <div className="flex items-center justify-between border-b pb-8">
                   <div>
                      <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">Institutional Identity</h3>
                      <p className="text-[10px] text-gray-400 font-black uppercase mt-3">Visual Branding & Legal Metadata</p>
                   </div>
                   <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white"><Building2 size={32} /></div>
                </div>

                <div className="flex flex-col md:flex-row items-start gap-10">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Official School Logo</label>
                      <div className="relative group">
                         <div className="w-48 h-48 bg-gray-50 rounded-[40px] border-4 border-dashed border-gray-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-500 group-hover:bg-blue-50/30">
                            {schoolLogo ? (
                              <img src={schoolLogo} className="w-full h-full object-cover" alt="School Logo" />
                            ) : (
                              <div className="text-center p-6">
                                <ImagePlus size={40} className="text-gray-300 mx-auto mb-2" />
                                <p className="text-[8px] font-black text-gray-400 uppercase leading-tight">PNG/JPG Preferred</p>
                              </div>
                            )}
                         </div>
                         <button 
                           onClick={() => logoInputRef.current?.click()}
                           className="absolute -bottom-4 -right-4 bg-gray-900 text-white p-5 rounded-[24px] shadow-2xl border-4 border-white hover:bg-black transition-all active:scale-95"
                         >
                           <Camera size={20} />
                         </button>
                         <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                      </div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase italic mt-4 max-w-[200px]">This logo will be visible on all report forms, financial receipts, and the main portal header.</p>
                   </div>

                   <form className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8" onSubmit={(e) => { e.preventDefault(); alert("Profile metadata synchronized."); }}>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Official School Name</label>
                        <input type="text" value={schoolConfig.schoolName} onChange={e => setSchoolConfig({...schoolConfig, schoolName: e.target.value})} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl font-black uppercase italic outline-none focus:border-blue-500 shadow-inner" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">MOE Registration No</label>
                        <input type="text" value={schoolConfig.registrationNo} onChange={e => setSchoolConfig({...schoolConfig, registrationNo: e.target.value})} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl font-bold font-mono outline-none focus:border-blue-500 shadow-inner" />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">School Motto / Vision</label>
                        <input type="text" value={schoolConfig.motto} onChange={e => setSchoolConfig({...schoolConfig, motto: e.target.value})} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl font-bold italic outline-none focus:border-blue-500 shadow-inner" />
                      </div>
                      
                      {/* ADDED: SIGNATORY CONFIGURATION */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-red-600">Principal Name (Signatory)</label>
                        <input type="text" value={schoolConfig.principalName || ''} onChange={e => setSchoolConfig({...schoolConfig, principalName: e.target.value})} placeholder="e.g. Principal Maina" className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl font-black uppercase italic outline-none focus:border-red-500 shadow-inner" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-red-600">Default Class Teacher</label>
                        <input type="text" value={schoolConfig.defaultClassTeacher || ''} onChange={e => setSchoolConfig({...schoolConfig, defaultClassTeacher: e.target.value})} placeholder="e.g. Tr. Sarah Wambui" className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl font-black uppercase italic outline-none focus:border-red-500 shadow-inner" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-red-600">Examination Officer</label>
                        <input type="text" value={schoolConfig.examinationOfficer || ''} onChange={e => setSchoolConfig({...schoolConfig, examinationOfficer: e.target.value})} placeholder="e.g. Mr. John Koech" className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl font-black uppercase italic outline-none focus:border-red-500 shadow-inner" />
                      </div>

                      <div className="md:col-span-2 pt-4">
                        <button type="submit" className="w-full py-6 bg-gray-900 text-white rounded-[32px] font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3">
                           <Save size={20} /> Update Metadata Records
                        </button>
                      </div>
                   </form>
                </div>
              </div>
            )}

            {/* USER ACCOUNTS */}
            {activeSection === 'users' && isAdmin && (
              <div className="p-10 space-y-10">
                <div className="flex items-center justify-between border-b pb-8">
                   <div>
                      <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">Access Control</h3>
                      <p className="text-[10px] text-gray-400 font-black uppercase mt-3">Authorized Personnel Directory</p>
                   </div>
                   <button onClick={() => setIsUserModalOpen(true)} className="flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all border-b-4 border-blue-800">
                     <UserPlus size={16} /> Create Account
                   </button>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] border-b">
                        <tr>
                           <th className="pb-6">Profile</th>
                           <th className="pb-6">Functional Role</th>
                           <th className="pb-6">Security Level</th>
                           <th className="pb-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-gray-50">
                         {users.map(u => (
                           <tr key={u.id} className="group hover:bg-gray-50/50 transition-colors">
                              <td className="py-6">
                                 <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 bg-gray-100 rounded-xl overflow-hidden border-2 border-white shadow-sm ${!u.active ? 'grayscale opacity-50' : ''}`}>
                                       <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} alt="" />
                                    </div>
                                    <div>
                                       <p className={`font-black uppercase italic leading-none ${u.active ? 'text-gray-900' : 'text-gray-400 line-through'}`}>{u.name}</p>
                                       <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">{u.email}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="py-6">
                                 <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border ${u.active ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                                   {u.customRoleName || u.role}
                                 </span>
                              </td>
                              <td className="py-6">
                                 <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${!u.active ? 'bg-gray-300' : u.role === UserRole.ADMIN ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${u.active ? 'text-gray-400' : 'text-gray-300'}`}>
                                      {u.active ? (u.role === UserRole.ADMIN ? 'SUPERVISOR' : 'AUTHORIZED') : 'DISABLED'}
                                    </span>
                                 </div>
                              </td>
                              <td className="py-6 text-right">
                                 <div className="flex items-center justify-end gap-2">
                                    <button 
                                      onClick={() => {
                                        setEditingUser(u);
                                        setUserFormData({ name: u.name, email: u.email, role: u.role, active: u.active, password: '' });
                                        setIsUserModalOpen(true);
                                      }} 
                                      className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                    >
                                      <Edit3 size={16} />
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setResetPwForm({ id: u.id, name: u.name, password: '', confirm: '' });
                                        setIsResetPwModalOpen(true);
                                      }}
                                      className="p-3 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                                    >
                                      <LockKeyhole size={16} />
                                    </button>
                                    <button 
                                      onClick={() => handleToggleUserStatus(u)} 
                                      className={`p-3 transition-all rounded-xl ${u.active ? 'text-amber-400 hover:text-amber-600 hover:bg-amber-50' : 'text-green-400 hover:text-green-600 hover:bg-green-50'}`}
                                    >
                                      <Smartphone size={16} />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteUser(u.id)}
                                      className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                 </div>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
              </div>
            )}

            {/* ROLE DEFINITIONS */}
            {activeSection === 'roles' && isAdmin && (
              <div className="p-10 space-y-10">
                <div className="flex items-center justify-between border-b pb-8">
                   <div>
                      <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">Role Architect</h3>
                      <p className="text-[10px] text-gray-400 font-black uppercase mt-3">Custom Institutional Permissions</p>
                   </div>
                   <button onClick={() => { setEditingRole(null); setRoleFormData({ name: '', description: '', baseRole: UserRole.SUBJECT_TEACHER }); setIsRoleModalOpen(true); }} className="flex items-center gap-3 bg-purple-600 text-white px-8 py-4 rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-purple-100 hover:bg-purple-700 transition-all border-b-4 border-purple-800">
                     <Plus size={16} /> Define Role
                   </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {systemRoles.map(role => (
                     <div key={role.id} className="p-8 bg-gray-50 border-2 border-gray-100 rounded-[32px] hover:border-purple-300 transition-all group relative">
                        <div className="flex justify-between items-start mb-4">
                           <div className={`p-3 rounded-2xl ${role.isSystemRole ? 'bg-gray-900 text-white' : 'bg-purple-600 text-white'}`}>
                              <Shield size={20} />
                           </div>
                           {!role.isSystemRole && (
                             <button onClick={() => { setEditingRole(role); setRoleFormData({ name: role.name, description: role.description, baseRole: role.baseRole }); setIsRoleModalOpen(true); }} className="p-2 text-gray-400 hover:text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"><Edit3 size={16} /></button>
                           )}
                        </div>
                        <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter italic">{role.name}</h4>
                        <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mt-2">Perm Level: {role.baseRole}</p>
                        <p className="text-xs text-gray-500 font-medium mt-4 leading-relaxed">{role.description}</p>
                        {role.isSystemRole && (
                          <div className="absolute top-4 right-4 px-3 py-1 bg-white border border-gray-200 rounded-full text-[8px] font-black uppercase text-gray-300 tracking-widest">Protected</div>
                        )}
                     </div>
                   ))}
                </div>
              </div>
            )}

            {/* AUDIT TRAIL */}
            {activeSection === 'logs' && isAdmin && (
              <div className="p-10 space-y-8">
                <div className="flex items-center justify-between border-b pb-8">
                  <div>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">Security Feed</h3>
                    <p className="text-[10px] text-gray-400 font-black uppercase mt-3">Live Multi-Device Event Ledger</p>
                  </div>
                  <button onClick={fetchAuditLogs} className="p-4 bg-gray-50 text-blue-600 hover:bg-blue-100 rounded-2xl transition-all">
                    <RefreshCw className={`w-5 h-5 ${isLogsLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-5 top-5 w-5 h-5 text-gray-400" />
                  <input type="text" placeholder="Filter audit trail..." value={logSearch} onChange={e => setLogSearch(e.target.value)} className="w-full pl-14 pr-4 py-5 bg-gray-50 border-2 border-gray-100 rounded-[32px] outline-none focus:border-blue-500 font-bold shadow-inner" />
                </div>
                <div className="overflow-x-auto rounded-[32px] border-2 border-gray-50 shadow-xl">
                  <table className="w-full text-left">
                    <thead className="bg-gray-900 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                      <tr>
                        <th className="px-8 py-6">Timestamp</th>
                        <th className="px-8 py-6">Actor</th>
                        <th className="px-8 py-6">Origin</th>
                        <th className="px-8 py-6">Action</th>
                        <th className="px-8 py-6 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-gray-50 text-xs">
                      {filteredLogs.map(log => (
                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-8 py-6 text-gray-400 font-mono text-[10px] whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                          <td className="px-8 py-6 font-black text-gray-900 uppercase italic">{log.userName}</td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                               <span className="text-[9px] font-black uppercase text-gray-400 flex items-center gap-1"><Monitor size={10} /> {log.userAgent?.includes('Mobile') ? 'Phone' : 'PC'}</span>
                               <span className="text-[8px] text-blue-400 font-bold">{log.ipAddress || 'Internal'}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${log.action === 'DELETE' ? 'bg-red-50 text-red-600' : log.action === 'UPDATE' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>{log.action}</span>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <button onClick={() => alert(JSON.stringify(log, null, 2))} className="p-3 bg-white text-gray-400 hover:text-blue-600 rounded-xl border border-gray-100 shadow-sm"><Eye size={16} /></button>
                          </td>
                        </tr>
                      ))}
                      {filteredLogs.length === 0 && (
                        <tr><td colSpan={5} className="py-24 text-center text-gray-300 font-black uppercase tracking-[0.4em] italic">No security events found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SECURITY */}
            {activeSection === 'security' && (
              <div className="p-10 space-y-10">
                <div className="flex items-center gap-6 border-b pb-8">
                   <div className="p-6 bg-gray-900 text-white rounded-[24px] shadow-2xl"><LockKeyhole size={32} /></div>
                   <div>
                      <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">Master Credentials</h3>
                      <p className="text-[10px] text-gray-400 font-black uppercase mt-3">Rotate Security Tokens</p>
                   </div>
                </div>
                <form onSubmit={handlePasswordChange} className="max-w-xl space-y-8">
                   {pwError && <div className="p-6 bg-red-50 text-red-600 rounded-[32px] border-2 border-red-100 flex items-center gap-4 animate-pulse"><ShieldAlert size={24} /><p className="text-xs font-black uppercase tracking-widest">{pwError}</p></div>}
                   {pwSuccess && <div className="p-6 bg-green-50 text-green-700 rounded-[32px] border-2 border-green-100 flex items-center gap-4"><CheckCircle2 size={24} /><p className="text-xs font-black uppercase tracking-widest">{pwSuccess}</p></div>}
                   
                   <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Password Entry</label>
                        <input required type="password" value={pwForm.current} onChange={e => setPwForm({...pwForm, current: e.target.value})} className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-[32px] outline-none focus:border-blue-500 font-bold" />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Key</label>
                          <input required type="password" value={pwForm.new} onChange={e => setPwForm({...pwForm, new: e.target.value})} className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-[32px] outline-none focus:border-blue-500 font-bold" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Repeat Key</label>
                          <input required type="password" value={pwForm.confirm} onChange={e => setPwForm({...pwForm, confirm: e.target.value})} className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-[32px] outline-none focus:border-blue-500 font-bold" />
                        </div>
                      </div>
                   </div>
                   <button type="submit" disabled={isSaving} className="w-full py-6 bg-gray-900 text-white rounded-[32px] font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-4">
                     {isSaving ? <Loader2 className="animate-spin" /> : <ShieldCheck size={24} />} Update Security Handshake
                   </button>
                </form>
              </div>
            )}

            {/* PROFILE */}
            {activeSection === 'profile' && (
              <div className="p-10 space-y-10">
                <div className="flex items-center gap-8 p-10 bg-gray-50/50 rounded-[40px] border-2 border-white shadow-inner">
                   <div className="relative">
                      <img src={currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`} className="w-32 h-32 rounded-[40px] border-4 border-white shadow-2xl object-cover" alt="Avatar" />
                   </div>
                   <div className="space-y-2">
                      <p className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">{currentUser.name}</p>
                      <div className="flex items-center gap-3">
                         <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-blue-100">{currentUser.role}</span>
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">@{schoolConfig.schoolName}</span>
                      </div>
                      <p className="text-xs font-bold text-gray-400 flex items-center gap-2 mt-2"><Mail size={12} /> {currentUser.email}</p>
                   </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* USER MODAL */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white rounded-[56px] w-full max-w-xl shadow-2xl relative overflow-hidden animate-in zoom-in duration-500 max-h-[90vh] flex flex-col border-8 border-gray-50">
              <div className="p-12 border-b bg-gray-50/50 flex items-center justify-between">
                 <div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none italic">{editingUser ? 'Sync Identity' : 'Commission Account'}</h2>
                    <p className="text-[10px] text-gray-400 font-black uppercase mt-4">Authorized Personnel Registry</p>
                 </div>
                 <button onClick={() => { setIsUserModalOpen(false); setEditingUser(null); }} className="p-5 hover:bg-red-50 text-gray-400 rounded-full transition-all"><X size={28} /></button>
              </div>
              <form onSubmit={handleSaveUser} className="p-12 space-y-8 overflow-y-auto">
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Legal Name</label>
                       <input 
                         required 
                         type="text" 
                         value={userFormData.name} 
                         onChange={e => setUserFormData({...userFormData, name: e.target.value})} 
                         className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl font-black uppercase" 
                         placeholder="E.G. PROF. ALBERT MAINA" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Official School Email</label>
                       <input 
                         required 
                         type="email" 
                         value={userFormData.email} 
                         onChange={e => setUserFormData({...userFormData, email: e.target.value.toLowerCase()})} 
                         className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl font-bold" 
                         placeholder="name@school.ac.ke" 
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Functional Rank</label>
                          <select 
                            value={userFormData.role} 
                            onChange={e => setUserFormData({...userFormData, role: e.target.value as UserRole})} 
                            className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl font-black uppercase text-xs"
                          >
                              {Object.values(UserRole).map(r => (
                                <option key={r} value={r}>{r.replace('_', ' ')}</option>
                              ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Status</label>
                           <div className="flex bg-gray-50 p-1 rounded-3xl border-2 border-gray-100 h-[68px]">
                              <button 
                                type="button"
                                onClick={() => setUserFormData({...userFormData, active: true})}
                                className={`flex-1 rounded-2xl text-[9px] font-black uppercase transition-all ${userFormData.active ? 'bg-green-500 text-white shadow-lg' : 'text-gray-400'}`}
                              >Active</button>
                              <button 
                                type="button"
                                onClick={() => setUserFormData({...userFormData, active: false})}
                                className={`flex-1 rounded-2xl text-[9px] font-black uppercase transition-all ${!userFormData.active ? 'bg-red-500 text-white shadow-lg' : 'text-gray-400'}`}
                              >Suspended</button>
                           </div>
                        </div>
                    </div>
                    {!editingUser && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-blue-600">Initial Access Token</label>
                        <input 
                          required 
                          type="password" 
                          value={userFormData.password} 
                          onChange={e => setUserFormData({...userFormData, password: e.target.value})} 
                          className="w-full p-5 bg-blue-50/30 border-2 border-blue-100 rounded-3xl font-bold" 
                          placeholder="Assign a temporary password" 
                        />
                      </div>
                    )}
                 </div>
                 <button 
                   type="submit" 
                   disabled={isSaving}
                   className="w-full py-6 bg-blue-600 text-white rounded-[32px] font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-blue-700 transition-all border-b-8 border-blue-800 flex items-center justify-center gap-3 disabled:opacity-50"
                 >
                    {isSaving ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} />} 
                    {editingUser ? 'Sync Identity Pattern' : 'Register Secure Identity'}
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* ADMIN RESET PASSWORD MODAL */}
      {isResetPwModalOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white rounded-[56px] w-full max-w-md shadow-2xl relative overflow-hidden animate-in zoom-in duration-500 border-8 border-amber-50">
              <div className="p-10 border-b bg-amber-50/50 flex items-center justify-between">
                 <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none italic">Force Key Rotation</h2>
                    <p className="text-[10px] text-amber-600 font-black uppercase mt-3">Resetting: {resetPwForm.name}</p>
                 </div>
                 <button onClick={() => setIsResetPwModalOpen(false)} className="p-4 hover:bg-amber-100 text-amber-600 rounded-full transition-all"><X size={24} /></button>
              </div>
              <form onSubmit={handleAdminResetPassword} className="p-10 space-y-6">
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Administrative Key</label>
                       <input 
                         required 
                         type="password" 
                         value={resetPwForm.password} 
                         onChange={e => setResetPwForm({ ...resetPwForm, password: e.target.value })} 
                         className="w-full p-5 bg-gray-50 border-2 border-amber-100 rounded-[24px] font-bold" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm Identity Key</label>
                       <input 
                         required 
                         type="password" 
                         value={resetPwForm.confirm} 
                         onChange={e => setResetPwForm({ ...resetPwForm, confirm: e.target.value })} 
                         className="w-full p-5 bg-gray-50 border-2 border-amber-100 rounded-[24px] font-bold" 
                       />
                    </div>
                 </div>
                 <button 
                   type="submit" 
                   disabled={isSaving}
                   className="w-full py-5 bg-amber-500 text-white rounded-[24px] font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-amber-600 transition-all border-b-4 border-amber-700 disabled:opacity-50"
                 >
                    {isSaving ? 'Processing...' : 'Rotate Security Token'}
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* ROLE MODAL */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white rounded-[56px] w-full max-w-xl shadow-2xl relative overflow-hidden animate-in zoom-in duration-500 max-h-[90vh] flex flex-col border-8 border-gray-50">
              <div className="p-12 border-b bg-gray-50/50 flex items-center justify-between">
                 <div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none italic">{editingRole ? 'Edit Role' : 'New Role Architect'}</h2>
                    <p className="text-[10px] text-gray-400 font-black uppercase mt-4">Permission Definition Engine</p>
                 </div>
                 <button onClick={() => setIsRoleModalOpen(false)} className="p-5 hover:bg-red-50 text-gray-400 rounded-full transition-all"><X size={28} /></button>
              </div>
              <form onSubmit={handleSaveRole} className="p-12 space-y-8 overflow-y-auto">
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Role Title</label>
                       <input required type="text" value={roleFormData.name} onChange={e => setRoleFormData({...roleFormData, name: e.target.value})} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl font-black uppercase" placeholder="E.G. CHIEF LIBRARIAN" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Functional Permission Level</label>
                       <select value={roleFormData.baseRole} onChange={e => setRoleFormData({...roleFormData, baseRole: e.target.value as UserRole})} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl font-black uppercase text-xs">
                          {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Role Description</label>
                       <textarea required value={roleFormData.description} onChange={e => setRoleFormData({...roleFormData, description: e.target.value})} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl font-medium text-xs h-32" placeholder="Define the responsibilities and scope of this role..." />
                    </div>
                 </div>
                 <button type="submit" className="w-full py-6 bg-purple-600 text-white rounded-[32px] font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-purple-700 transition-all border-b-8 border-purple-800">
                    <ShieldCheck size={20} className="inline mr-2" /> Commit Role Schema
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

const NavItem: React.FC<{ icon: any, label: string, active: boolean, onClick: () => void }> = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-5 px-8 py-5 rounded-[24px] text-[11px] font-black uppercase tracking-widest transition-all ${active ? 'bg-blue-600 text-white shadow-2xl shadow-blue-200 border-b-4 border-blue-800' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'}`}
  >
    <Icon className={`w-6 h-6 ${active ? 'text-white' : 'text-gray-300'}`} />
    <span>{label}</span>
  </button>
);
