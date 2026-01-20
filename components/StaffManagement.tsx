
import React, { useState } from 'react';
import { Plus, Search, Filter, Mail, Phone, X, Camera, Trash2, Edit2, UserSquare2, BookOpen } from 'lucide-react';
import { Staff } from '../types';

const MOCK_STAFF: Staff[] = [
  { id: 't1', staffId: 'TS001', name: 'James Otieno', email: 'jotieno@elimusmart.co.ke', phone: '0711122233', role: 'Subject Teacher', subjects: ['Mathematics', 'Physics'], photo: 'https://picsum.photos/100/100?random=20' },
  { id: 't2', staffId: 'TS002', name: 'Mary Wambui', email: 'mwambui@elimusmart.co.ke', phone: '0722233344', role: 'Class Teacher', subjects: ['Kiswahili', 'Social Studies'], photo: 'https://picsum.photos/100/100?random=21' },
];

export const StaffManagement: React.FC = () => {
  const [staffList, setStaffList] = useState<Staff[]>(MOCK_STAFF);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
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
        photo: `https://picsum.photos/100/100?random=${Math.floor(Math.random() * 100)}`
      } as Staff;
      setStaffList([...staffList, newStaff]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Remove this staff member from the records?')) {
      setStaffList(staffList.filter(s => s.id !== id));
    }
  };

  const filteredStaff = staffList.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.staffId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Staff Management</h1>
          <p className="text-gray-500">View and manage {staffList.length} faculty members.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-bold"
        >
          <Plus className="w-5 h-5" />
          <span>Add Staff Member</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name or Staff ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-100">
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b text-sm text-gray-500 uppercase font-medium">
                <th className="px-6 py-4">Staff Member</th>
                <th className="px-6 py-4">ID / Role</th>
                <th className="px-6 py-4">Subjects</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <img src={staff.photo} className="w-10 h-10 rounded-full border bg-blue-50" alt={staff.name} />
                      <div>
                        <div className="font-bold text-gray-800">{staff.name}</div>
                        <div className="text-xs text-blue-600 font-medium">{staff.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono text-sm">{staff.staffId}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {staff.subjects.map(sub => (
                        <span key={sub} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase tracking-wider">{sub}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col text-xs space-y-1">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Mail className="w-3 h-3" />
                        <span>{staff.email}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Phone className="w-3 h-3" />
                        <span>{staff.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => openModal(staff)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(staff.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No staff records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingStaff ? 'Edit Staff Profile' : 'New Staff Registration'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                    {formData.photo ? <img src={formData.photo} className="w-full h-full rounded-full object-cover" /> : <Camera className="w-8 h-8 text-gray-400" />}
                  </div>
                  <button type="button" className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Full Name</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Staff ID</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.staffId}
                    onChange={e => setFormData({...formData, staffId: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Work Email</label>
                  <input 
                    required 
                    type="email" 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Phone Number</label>
                  <input 
                    required 
                    type="tel" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Role</label>
                  <select 
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option>Subject Teacher</option>
                    <option>Class Teacher</option>
                    <option>HOD</option>
                    <option>Principal</option>
                    <option>Admin Staff</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Subjects (Comma separated)</label>
                  <input 
                    type="text" 
                    placeholder="Math, English, etc."
                    value={formData.subjects?.join(', ')}
                    onChange={e => setFormData({...formData, subjects: e.target.value.split(',').map(s => s.trim())})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
                >
                  {editingStaff ? 'Update Profile' : 'Register Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
