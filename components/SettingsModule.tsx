
import React, { useState, useEffect } from 'react';
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
  Key
} from 'lucide-react';
import { UserRole, User as UserType } from '../types';

interface SettingsModuleProps {
  currentUser: UserType;
  users: UserType[];
  setUsers: React.Dispatch<React.SetStateAction<UserType[]>>;
  schoolLogo: string | null;
  setSchoolLogo: (logo: string | null) => void;
  schoolConfig: any;
  setSchoolConfig: React.Dispatch<React.SetStateAction<any>>;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({ 
  currentUser, 
  users, 
  setUsers, 
  schoolLogo, 
  setSchoolLogo,
  schoolConfig,
  setSchoolConfig
}) => {
  const [activeSection, setActiveSection] = useState<'profile' | 'school' | 'academic' | 'security' | 'users'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  
  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // School Edit State
  const [editableConfig, setEditableConfig] = useState(schoolConfig);

  // User Management State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState<Partial<UserType>>({
    name: '',
    email: '',
    role: UserRole.SUBJECT_TEACHER,
    password: ''
  });

  const isAdmin = currentUser.role === UserRole.ADMIN;
  const isAdminOrPrincipal = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.PRINCIPAL;

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) return;

    const userToAdd: UserType = {
      id: `u${Date.now()}`,
      name: newUser.name,
      email: newUser.email.toLowerCase(),
      role: newUser.role as UserRole,
      password: newUser.password,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newUser.name}`
    };

    setUsers(prev => [...prev, userToAdd]);
    setIsAddUserModalOpen(false);
    setNewUser({ name: '', email: '', role: UserRole.SUBJECT_TEACHER, password: '' });
  };

  const handleDeleteUser = (id: string) => {
    if (id === currentUser.id) {
      alert("Error: You cannot delete your own active session.");
      return;
    }
    if (window.confirm('Security Warning: Are you sure you want to permanently revoke this user\'s access?')) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  const handleSaveSchoolInfo = async (e: React.FormEvent) => {
    e.preventDefault();
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
            {isAdminOrPrincipal && (
              <>
                <NavItem icon={School} label="School Profile" active={activeSection === 'school'} onClick={() => setActiveSection('school')} />
                <NavItem icon={Calendar} label="Academic Term" active={activeSection === 'academic'} onClick={() => setActiveSection('academic')} />
              </>
            )}
            {isAdmin && (
              <NavItem icon={Users} label="User Accounts" active={activeSection === 'users'} onClick={() => setActiveSection('users')} />
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
                   <img src={currentUser.avatar} className="w-20 h-20 rounded-2xl border-4 border-white shadow-md" alt="Avatar" />
                   <div>
                      <p className="text-2xl font-black text-gray-900 leading-none">{currentUser.name}</p>
                      <p className="text-xs font-black text-blue-600 uppercase tracking-widest mt-2">{currentUser.role.replace('_', ' ')}</p>
                      <p className="text-[10px] text-gray-400 font-medium mt-1">{currentUser.email}</p>
                   </div>
                </div>
              </div>
            )}

            {activeSection === 'users' && isAdmin && (
              <div className="p-8 space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b pb-4">
                   <h3 className="text-lg font-black uppercase tracking-tight text-gray-800">Platform Users</h3>
                   <button onClick={() => setIsAddUserModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                     <Plus className="w-4 h-4" /> Add User
                   </button>
                </div>
                
                <div className="divide-y border rounded-2xl overflow-hidden">
                  {users.map(u => (
                    <div key={u.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                       <div className="flex items-center gap-4">
                          <img src={u.avatar} className="w-10 h-10 rounded-xl border bg-white" />
                          <div>
                            <p className="font-black text-gray-900 text-sm">{u.name}</p>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{u.role}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="text-right">
                             <p className="text-[10px] text-gray-400 font-medium">{u.email}</p>
                             <p className="text-[9px] font-mono text-gray-300">ID: {u.id}</p>
                          </div>
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Revoke Access"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
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
                   <button 
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200 disabled:opacity-50 flex items-center justify-center gap-3"
                   >
                     {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                     Commit Security Change
                   </button>
                </div>
              </form>
            )}

            {activeSection === 'school' && isAdminOrPrincipal && (
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
                    <div className="mt-6 flex gap-3">
                       <button type="button" onClick={() => setSchoolLogo(null)} className="text-[10px] font-black uppercase text-red-500 hover:text-red-700 transition-colors">Remove Custom Logo</button>
                    </div>
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
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">School Motto</label>
                    <input type="text" value={editableConfig?.motto} onChange={e => setEditableConfig({...editableConfig, motto: e.target.value})} className="w-full p-3 border rounded-xl font-bold outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div className="flex justify-end">
                   <button type="submit" disabled={isSaving} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-100 flex items-center gap-2">
                     {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                     Save Changes
                   </button>
                </div>
              </form>
            )}

            {activeSection === 'academic' && isAdminOrPrincipal && (
              <div className="p-8 space-y-6 animate-in fade-in duration-300">
                <h3 className="text-lg font-black border-b pb-4 text-indigo-900 uppercase tracking-tight">Active Session</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Current Year</p>
                      <p className="text-3xl font-black text-indigo-900 leading-none">{schoolConfig?.year || new Date().getFullYear()}</p>
                   </div>
                   <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Active Term</p>
                      <p className="text-3xl font-black text-indigo-900 leading-none">Term {schoolConfig?.term || 1}</p>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
              <div className="p-8 border-b bg-gray-50/50 flex items-center justify-between">
                 <div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">New Credentials</h2>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-2">Create Secure System Account</p>
                 </div>
                 <button onClick={() => setIsAddUserModalOpen(false)} className="p-4 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-full transition-all">
                    <Trash2 className="w-6 h-6" />
                 </button>
              </div>

              <form onSubmit={handleAddUser} className="p-8 space-y-6">
                 <div className="space-y-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                       <input required type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                       <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">System Role</label>
                       <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner">
                          {Object.values(UserRole).map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                       </select>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Initial Password</label>
                       <input required type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner" />
                    </div>
                 </div>

                 <div className="flex gap-4 pt-6">
                    <button type="button" onClick={() => setIsAddUserModalOpen(false)} className="flex-1 py-4 text-gray-400 font-black uppercase text-xs tracking-widest">Discard</button>
                    <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">Confirm Account</button>
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
