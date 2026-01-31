
import React, { useState } from 'react';
import { Plus, Search, Filter, Mail, Phone, X, Camera, Trash2, Edit2, UserSquare2, BookOpen, AlertTriangle } from 'lucide-react';
import { Staff } from '../types';

interface StaffManagementProps {
  staffList: Staff[];
  setStaffList: React.Dispatch<React.SetStateAction<Staff[]>>;
}

export const StaffManagement: React.FC<StaffManagementProps> = ({ staffList, setStaffList }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState<Partial<Staff>>({
    name: '',
    staffId: '',
    email: '',
    phone: '',
    role: 'Subject Teacher',
    subjects: []
  });

  const openModal = (staff?: Staff) => {
    if (staff) {
      setEditingStaff(staff);
      setFormData(staff);
    } else {
      setEditingStaff(null);
      setFormData({
        name: '',
        staffId: '',
        email: '',
        phone: '',
        role: 'Subject Teacher',
        subjects: []
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStaff) {
      setStaffList(staffList.map(s => s.id === editingStaff.id ? { ...s, ...formData } as Staff : s));
    } else {
      const newStaff = {
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
        photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}${Date.now()}`
      } as Staff;
      setStaffList([...staffList, newStaff]);
    }
    setIsModalOpen(false);
  };

  const openDeleteModal = (staff: Staff) => {
    setStaffToDelete(staff);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (staffToDelete) {
      setStaffList(prev => prev.filter(s => s.id !== staffToDelete.id));
      setIsDeleteModalOpen(false);
      setStaffToDelete(null);
    }
  };

  const filteredStaff = staffList.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.staffId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Staff Registry</h1>
          <p className="text-gray-500 font-medium">Manage {staffList.length} registered institutional faculty.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-8 py-3 rounded-2xl hover:bg-blue-700 transition-all font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Register Faculty</span>
        </button>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-md:w-full">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name or Staff ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none font-medium shadow-inner" 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b text-[10px] text-gray-400 uppercase font-black tracking-widest">
                <th className="px-8 py-6">Faculty Profile</th>
                <th className="px-8 py-6">ID / Designation</th>
                <th className="px-8 py-6">Learning Areas</th>
                <th className="px-8 py-6">Contact Channels</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-blue-50/10 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-4">
                      <img src={staff.photo} className="w-12 h-12 rounded-xl border border-gray-100 shadow-sm bg-blue-50 object-cover" alt={staff.name} />
                      <div>
                        <div className="font-black text-gray-900 group-hover:text-blue-600 transition-colors">{staff.name}</div>
                        <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">{staff.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="font-mono font-black text-blue-600 tracking-tighter text-sm uppercase">{staff.staffId}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-wrap gap-2">
                      {staff.subjects.map(sub => (
                        <span key={sub} className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-gray-200">{sub}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col text-xs space-y-1">
                      <div className="flex items-center gap-2 text-gray-600 font-bold">
                        <Mail className="w-3 h-3 text-blue-400" />
                        <span>{staff.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 font-medium">
                        <Phone className="w-3 h-3" />
                        <span>{staff.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => openModal(staff)} className="flex items-center gap-2 px-4 py-2.5 text-blue-600 bg-white hover:bg-blue-600 hover:text-white rounded-xl transition-all border-2 border-gray-50 hover:border-blue-600 active:scale-95 shadow-sm">
                        <Edit2 className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Edit</span>
                      </button>
                      <button onClick={() => openDeleteModal(staff)} className="flex items-center gap-2 px-4 py-2.5 text-red-600 bg-white hover:bg-red-600 hover:text-white rounded-xl transition-all border-2 border-gray-50 hover:border-red-600 active:scale-95 shadow-sm">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-gray-400">
                    <UserSquare2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="font-black uppercase text-xs tracking-widest">No faculty records detected.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl relative animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
            <div className="p-8 border-b bg-gray-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900 leading-none">{editingStaff ? 'Edit Profile' : 'Staff Enrollment'}</h2>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-3">Official Institutional Identity</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-full transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-8 overflow-y-auto">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative group">
                  <div className="w-28 h-28 rounded-[32px] bg-gray-50 flex items-center justify-center border-4 border-white shadow-xl overflow-hidden group-hover:ring-4 ring-blue-100 transition-all">
                    {formData.photo ? <img src={formData.photo} className="w-full h-full object-cover" /> : <Camera className="w-10 h-10 text-gray-300" />}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-3 rounded-2xl shadow-xl border-4 border-white">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Official Name</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-blue-500 shadow-inner" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Institutional ID</label>
                  <input required type="text" value={formData.staffId} onChange={e => setFormData({...formData, staffId: e.target.value.toUpperCase()})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-black text-blue-600 outline-none focus:border-blue-500 shadow-inner" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Digital Mail</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-blue-500 shadow-inner" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile Number</label>
                  <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-blue-500 shadow-inner" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Designation</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-black uppercase text-xs outline-none focus:border-blue-500 shadow-inner">
                    <option>Subject Teacher</option>
                    <option>Class Teacher</option>
                    <option>HOD</option>
                    <option>Principal</option>
                    <option>Admin Staff</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Specializations (Comma separated)</label>
                  <input 
                    type="text" 
                    placeholder="Math, English, etc."
                    value={formData.subjects?.join(', ')}
                    onChange={e => setFormData({...formData, subjects: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-blue-500 shadow-inner" 
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 text-gray-400 font-black uppercase tracking-widest hover:bg-gray-50 rounded-3xl transition-all">Discard</button>
                <button type="submit" className="flex-1 py-5 bg-blue-600 text-white font-black uppercase tracking-widest rounded-3xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95 border-b-4 border-blue-800">
                  {editingStaff ? 'Commit Updates' : 'Authorize Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && staffToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl p-10 animate-in zoom-in duration-300 text-center">
              <div className="w-24 h-24 bg-red-50 text-red-600 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-red-100">
                 <AlertTriangle size={48} />
              </div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-4 leading-none">Authorize Deletion?</h2>
              <p className="text-sm font-medium text-gray-500 leading-relaxed mb-8">
                You are about to permanently remove <strong className="text-gray-900">{staffToDelete.name}</strong> ({staffToDelete.staffId}) from the staff registry. This action cannot be undone.
              </p>
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => setIsDeleteModalOpen(false)} className="py-4 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-all">Cancel</button>
                 <button onClick={confirmDelete} className="py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-red-100 hover:bg-red-700 transition-all active:scale-95 border-b-4 border-red-800">Confirm Delete</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
