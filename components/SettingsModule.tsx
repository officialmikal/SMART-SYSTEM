
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
  ArrowRight
} from 'lucide-react';
import { UserRole, User as UserType, CustomRole } from '../types';

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
  const [activeSection, setActiveSection] = useState<'profile' | 'school' | 'academic' | 'security' | 'users' | 'roles'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  
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

  const isAdmin = currentUser.role === UserRole.ADMIN;

  // Auto Term Calculation for Preview
  const sysTime = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    let term = 1;
    if (month >= 4 && month <= 7) term = 2;
    else if (month >= 8) term = 3;
    return { year, term };
  }, []);

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

  const syncAcademicClock = () => {
    if (!isAdmin) return;
    setEditableConfig({ ...editableConfig, year: sysTime.year, term: sysTime.term });
    alert(`System synchronized to: ${sysTime.year} Term ${sysTime.term}`);
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

            {activeSection === 'roles' && isAdmin && (
              <div className="p-8 space-y-6 animate-in fade-in duration-300">
                 <div className="flex items-center justify-between border-b pb-4">
                    <h3 className="text-lg font-black uppercase tracking-tight text-gray-800">Permission Hierarchy</h3>
                    <button onClick={() => openRoleModal()} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                      <Plus className="w-4 h-4" /> Create New Role
                    </button>
                 </div>

                 <div className="grid grid-cols-1 gap-4">
                    {systemRoles.map(role => (
                      <div key={role.id} className="p-5 border-2 rounded-[24px] border-gray-50 bg-white hover:border-indigo-100 transition-all group flex items-center justify-between">
                         <div className="flex items-center gap-5">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${role.isSystemRole ? 'bg-gray-100 text-gray-400' : 'bg-indigo-50 text-indigo-600'}`}>
                               {role.isSystemRole ? <ShieldCheck size={20} /> : <Shield size={20} />}
                            </div>
                            <div>
                               <div className="flex items-center gap-2">
                                  <p className="font-black text-gray-900 text-sm uppercase tracking-tight">{role.name}</p>
                                  {role.isSystemRole && <span className="text-[8px] font-black bg-gray-100 px-1.5 py-0.5 rounded text-gray-400 uppercase tracking-widest">System</span>}
                               </div>
                               <p className="text-[10px] text-gray-500 font-medium">{role.description}</p>
                               <div className="flex items-center gap-1.5 mt-2">
                                  <ShieldAlert size={10} className="text-indigo-400" />
                                  <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Base Permissions: {role.baseRole}</span>
                               </div>
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                            <button onClick={() => openRoleModal(role)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"><Edit3 size={16} /></button>
                            {!role.isSystemRole && (
                              <button onClick={() => handleDeleteRole(role.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                            )}
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {activeSection === 'users' && isAdmin && (
              <div className="p-8 space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b pb-4">
                   <h3 className="text-lg font-black uppercase tracking-tight text-gray-800">Platform Users</h3>
                   <button onClick={() => openUserModal()} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                     <UserPlus className="w-4 h-4" /> Create Account
                   </button>
                </div>
                
                <div className="divide-y border rounded-2xl overflow-hidden">
                  {users.map(u => (
                    <div key={u.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                       <div className="flex items-center gap-4">
                          <div className="relative">
                            <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} className="w-12 h-12 rounded-xl border bg-white" />
                            {u.id === currentUser.id && (
                              <div className="absolute -top-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div>
                            <p className="font-black text-gray-900 text-sm">{u.name} {u.id === currentUser.id && <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded ml-1 font-bold text-gray-400 tracking-normal">YOU</span>}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase tracking-wider">{u.role.replace('_', ' ')}</span>
                              <span className="text-[10px] text-gray-400 font-medium">{u.email}</span>
                            </div>
                          </div>
                       </div>
                       <div className="flex items-center gap-2">
                          <button onClick={() => openUserModal(u)} className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteUser(u.id)} className={`p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all ${u.id === currentUser.id ? 'opacity-20 cursor-not-allowed' : ''}`} disabled={u.id === currentUser.id}><Trash2 className="w-4 h-4" /></button>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <form onSubmit={handleUpdatePassword} className="p-8 space-y-8 animate-in fade-in duration-300">
                <div className="flex items-center gap-4 border-b pb-4">
                   <Key className="text-blue-600 w-6 h-6" />
                   <h3 className="text-lg font-black uppercase tracking-tight text-gray-800">Credentials Management</h3>
                </div>
                
                <div className="max-w-md space-y-6">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Password</label>
                      <input required type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner" />
                   </div>
                   <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                        <input required type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                        <input required type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner" />
                      </div>
                   </div>
                   <button type="submit" disabled={isSaving} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200 disabled:opacity-50 flex items-center justify-center gap-3">
                     {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Commit Security Change
                   </button>
                </div>
              </form>
            )}

            {activeSection === 'school' && isAdmin && (
              <form onSubmit={handleSaveSchoolInfo} className="p-8 space-y-8 animate-in fade-in duration-300">
                <h3 className="text-lg font-black border-b pb-4 text-blue-900 uppercase tracking-tight">Institutional Profile</h3>
                
                <div className="flex flex-col sm:flex-row gap-8 p-8 bg-blue-50/50 rounded-3xl border border-blue-100 relative">
                  <div className="relative group z-10">
                    <div className="w-40 h-40 rounded-3xl bg-white border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden">
                      <img src={schoolLogo || `https://api.dicebear.com/7.x/initials/svg?seed=${editableConfig?.schoolName || 'School'}&backgroundColor=1e3a8a&fontFamily=Inter&fontSize=45&bold=true`} alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <label className="absolute -bottom-3 -right-3 bg-blue-600 text-white p-3 rounded-2xl shadow-xl cursor-pointer hover:bg-blue-700 transition-all border-4 border-white">
                      <Camera className="w-5 h-5" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                    </label>
                  </div>

                  <div className="flex-1 flex flex-col justify-center">
                    <h4 className="text-xl font-black text-blue-900 uppercase tracking-tight">{editableConfig?.schoolName}</h4>
                    <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1 opacity-70">Main Digital Seal</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Official Name</label>
                    <input type="text" value={editableConfig?.schoolName} onChange={e => setEditableConfig({...editableConfig, schoolName: e.target.value})} className="w-full p-3 border rounded-xl font-bold outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reg No.</label>
                    <input type="text" value={editableConfig?.registrationNo} onChange={e => setEditableConfig({...editableConfig, registrationNo: e.target.value})} className="w-full p-3 border rounded-xl font-mono font-bold outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div className="flex justify-end pt-6">
                   <button type="submit" disabled={isSaving} className="bg-gray-900 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-black transition-all flex items-center gap-3 border-b-4 border-black">
                     {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Commit Profile Updates
                   </button>
                </div>
              </form>
            )}

            {activeSection === 'academic' && isAdmin && (
              <div className="p-8 space-y-10 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b pb-6">
                   <div>
                      <h3 className="text-xl font-black text-indigo-900 uppercase tracking-tight">Academic Timeline</h3>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Configure active year and term logic</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="p-8 bg-indigo-50/50 rounded-[40px] border-2 border-indigo-100 relative group overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform"><ClockIcon size={120} /></div>
                      <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6">Current Active Cycle</h4>
                      <div className="flex gap-10">
                         <div><p className="text-5xl font-black text-indigo-900 tracking-tighter leading-none">{editableConfig?.year}</p></div>
                         <div className="w-[2px] bg-indigo-200/50"></div>
                         <div><p className="text-5xl font-black text-indigo-900 tracking-tighter leading-none">Term {editableConfig?.term}</p></div>
                      </div>
                      <button onClick={syncAcademicClock} className="mt-10 w-full flex items-center justify-center gap-3 bg-white border-2 border-indigo-100 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all">
                         <RefreshCw size={14} /> Reset to System Clock
                      </button>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Role Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md animate-in fade-in">
           <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
              <div className="p-8 border-b bg-gray-50/50 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border-2 border-white">
                      <Shield size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">{editingRole ? 'Update Role' : 'New Role Definition'}</h2>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">Access Control Policy</p>
                    </div>
                 </div>
                 <button onClick={() => setIsRoleModalOpen(false)} className="p-4 hover:bg-red-50 text-gray-400 rounded-full transition-all"><X size={24} /></button>
              </div>

              <form onSubmit={handleSaveRole} className="p-8 space-y-6">
                 <div className="space-y-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Role Label</label>
                       <input required type="text" value={roleFormData.name} onChange={e => setRoleFormData({...roleFormData, name: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner" placeholder="e.g. Librarian" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Functional Base (Permissions)</label>
                       <select value={roleFormData.baseRole} onChange={e => setRoleFormData({...roleFormData, baseRole: e.target.value as UserRole})} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-black uppercase text-xs focus:border-indigo-500 outline-none">
                          {Object.values(UserRole).map(r => <option key={r} value={r}>{r.replace('_', ' ')} Level</option>)}
                       </select>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                       <textarea value={roleFormData.description} onChange={e => setRoleFormData({...roleFormData, description: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner h-24" placeholder="Describe scope of this role..." />
                    </div>
                 </div>

                 <div className="flex gap-4 pt-6">
                    <button type="button" onClick={() => setIsRoleModalOpen(false)} className="flex-1 py-5 text-gray-400 font-black uppercase text-[10px] tracking-widest">Discard</button>
                    <button type="submit" className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-indigo-700 transition-all active:scale-95 border-b-4 border-indigo-800 flex items-center justify-center gap-3">
                       <Save size={18} /> Confirm Role
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* User Modal (Updated to use dynamic roles) */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md animate-in fade-in">
           <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
              <div className="p-8 border-b bg-gray-50/50 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border-2 border-white">
                      {editingUser ? <Edit3 size={24} /> : <UserPlus size={24} />}
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">{editingUser ? 'Update Account' : 'New Credentials'}</h2>
                    </div>
                 </div>
                 <button onClick={() => setIsUserModalOpen(false)} className="p-4 hover:bg-red-50 text-gray-400 rounded-full transition-all"><X size={24} /></button>
              </div>

              <form onSubmit={handleSaveUser} className="p-8 space-y-6">
                 <div className="space-y-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                       <input required type="text" value={userFormData.name} onChange={e => setUserFormData({...userFormData, name: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                       <input required type="email" value={userFormData.email} onChange={e => setUserFormData({...userFormData, email: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Assigned Role</label>
                       <select value={userFormData.role} onChange={e => setUserFormData({...userFormData, role: e.target.value as UserRole})} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-black uppercase text-xs outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner">
                          {systemRoles.map(r => <option key={r.id} value={r.baseRole}>{r.name}</option>)}
                       </select>
                    </div>
                 </div>
                 <div className="flex gap-4 pt-6">
                    <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 py-5 text-gray-400 font-black uppercase text-[10px] tracking-widest">Discard</button>
                    <button type="submit" className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 border-b-4 border-blue-800">Save Changes</button>
                 </div>
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
    className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-sm font-black uppercase tracking-tighter transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
  >
    <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-400'}`} />
    <span>{label}</span>
  </button>
);
