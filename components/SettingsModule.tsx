
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
  Trash2
} from 'lucide-react';
import { AcademicConfig, schoolService } from '../services/schoolService';
import { UserRole } from '../types';

interface SettingsModuleProps {
  userRole: UserRole;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({ userRole }) => {
  const [activeSection, setActiveSection] = useState<'profile' | 'school' | 'academic' | 'security'>('profile');
  const [config, setConfig] = useState<AcademicConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    schoolService.getAcademicConfig().then(setConfig);
  }, []);

  const isAdminOrPrincipal = userRole === UserRole.ADMIN || userRole === UserRole.PRINCIPAL;

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsSaving(false);
    alert('Settings updated successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">System Settings</h1>
          <p className="text-gray-500 font-medium">Configure your personal preferences and school-wide parameters.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="md:col-span-1 space-y-1">
          <nav className="bg-white rounded-2xl border border-gray-100 p-2 shadow-sm">
            <NavItem 
              icon={User} 
              label="My Profile" 
              active={activeSection === 'profile'} 
              onClick={() => setActiveSection('profile')} 
            />
            {isAdminOrPrincipal && (
              <>
                <NavItem 
                  icon={School} 
                  label="School Profile" 
                  active={activeSection === 'school'} 
                  onClick={() => setActiveSection('school')} 
                />
                <NavItem 
                  icon={Calendar} 
                  label="Academic Session" 
                  active={activeSection === 'academic'} 
                  onClick={() => setActiveSection('academic')} 
                />
              </>
            )}
            <NavItem 
              icon={Lock} 
              label="Security & Privacy" 
              active={activeSection === 'security'} 
              onClick={() => setActiveSection('security')} 
            />
            {userRole === UserRole.ADMIN && (
              <NavItem 
                icon={Database} 
                label="System Logs" 
                active={false} 
                onClick={() => {}} 
              />
            )}
          </nav>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <form onSubmit={handleSave} className="p-8 space-y-8">
              
              {activeSection === 'profile' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <h3 className="text-lg font-black border-b pb-4 uppercase tracking-tight text-gray-800">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Display Name</label>
                      <input type="text" defaultValue="Principal Maina" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                      <input type="email" defaultValue="maina@elimusmart.co.ke" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                      <input type="tel" defaultValue="+254 711 222 333" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 font-bold" />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'school' && isAdminOrPrincipal && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <h3 className="text-lg font-black border-b pb-4 text-blue-900 uppercase tracking-tight">School Identity & Branding</h3>
                  
                  {/* Logo Upload Section */}
                  <div className="flex flex-col items-center sm:flex-row gap-8 p-8 bg-blue-50/50 rounded-3xl border border-blue-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
                      <School className="w-32 h-32 text-blue-900" />
                    </div>
                    
                    <div className="relative group z-10">
                      <div className="w-40 h-40 rounded-3xl bg-white border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden transition-transform group-hover:scale-[1.02]">
                        {logoPreview || config?.schoolName ? (
                          <img 
                            src={logoPreview || `https://api.dicebear.com/7.x/initials/svg?seed=${config?.schoolName || 'School'}&backgroundColor=1e3a8a&fontFamily=Inter&fontSize=45&bold=true`} 
                            alt="Logo Preview" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Upload className="w-10 h-10 text-blue-200" />
                        )}
                      </div>
                      <label className="absolute -bottom-3 -right-3 bg-blue-600 text-white p-3 rounded-2xl shadow-xl cursor-pointer hover:bg-blue-700 transition-all border-4 border-white">
                        <Camera className="w-5 h-5" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                      </label>
                    </div>

                    <div className="text-center sm:text-left z-10 flex-1">
                      <h4 className="text-xl font-black text-blue-900 uppercase tracking-tight">Institutional Seal</h4>
                      <p className="text-xs text-blue-600 font-bold uppercase tracking-widest mt-1 opacity-70">Appears on all official documents</p>
                      
                      <div className="mt-4 flex flex-wrap gap-3 justify-center sm:justify-start">
                        <label className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-100 cursor-pointer hover:bg-blue-700 transition-all">
                          Upload New Logo
                          <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                        </label>
                        {logoPreview && (
                          <button 
                            type="button" 
                            onClick={() => setLogoPreview(null)}
                            className="px-4 py-2 border-2 border-red-100 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-50 transition-all"
                          >
                            Reset to Default
                          </button>
                        )}
                      </div>
                      <p className="mt-4 text-[9px] text-gray-400 font-bold uppercase tracking-widest">Recommended: Square PNG/SVG, transparent background, max 2MB</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Official School Name</label>
                      <input type="text" defaultValue={config?.schoolName} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Registration Number</label>
                      <input type="text" defaultValue={config?.registrationNo} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 font-bold font-mono" />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">School Motto</label>
                      <input type="text" defaultValue={config?.motto} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 font-bold" />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'academic' && isAdminOrPrincipal && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <h3 className="text-lg font-black border-b pb-4 text-indigo-900 uppercase tracking-tight">Active Academic Session</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Year</label>
                      <input type="number" defaultValue={2024} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 font-black text-lg" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Term</label>
                      <select className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 font-black">
                        <option value="1">Term 1</option>
                        <option value="2">Term 2</option>
                        <option value="3">Term 3</option>
                      </select>
                    </div>
                  </div>
                  <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                    <p className="text-xs text-indigo-700 flex gap-3 font-bold">
                      <Shield className="w-5 h-5 flex-shrink-0" />
                      <span>IMPORTANT: Changing the current year or term will dynamically update all student mark entries, finance collections, and transcript generation school-wide.</span>
                    </p>
                  </div>
                </div>
              )}

              {activeSection === 'security' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <h3 className="text-lg font-black border-b pb-4 uppercase tracking-tight">Security & Privacy</h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Password</label>
                        <input type="password" placeholder="••••••••" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                          <input type="password" placeholder="••••••••" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                          <input type="password" placeholder="••••••••" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-100 transition-all">
                      <div>
                        <p className="font-black text-sm uppercase tracking-tight text-gray-800">Two-Factor Authentication (2FA)</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Verify logins via Africa's Talking SMS Gateway</p>
                      </div>
                      <div className="w-14 h-7 bg-blue-600 rounded-full relative shadow-inner cursor-pointer">
                        <div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full shadow-md"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-8 border-t flex justify-end">
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-10 py-4 rounded-xl hover:bg-blue-700 font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-xl shadow-blue-100"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  <span>Save Configuration</span>
                </button>
              </div>
            </form>
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
