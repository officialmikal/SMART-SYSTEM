
import React, { useState } from 'react';
import { Plus, Search, Filter, MoreVertical, Phone, Mail, X, Camera, Trash2, Edit2, User, Users } from 'lucide-react';
import { Student, KENYAN_CLASSES } from '../types';

const MOCK_STUDENTS: Student[] = [
  { id: '1', admissionNumber: 'ADM001', firstName: 'Kamau', lastName: 'Njoroge', class: 'Grade 7', stream: 'Oak', gender: 'Male', dob: '2011-04-12', guardianPhone: '0712345678', guardianName: 'Sarah Njoroge', feeBalance: 12500, photo: 'https://picsum.photos/100/100?random=10' },
  { id: '2', admissionNumber: 'ADM002', firstName: 'Amara', lastName: 'Kiprono', class: 'Grade 8', stream: 'Palm', gender: 'Female', dob: '2010-08-25', guardianPhone: '0722000111', guardianName: 'David Kiprono', feeBalance: 0, photo: 'https://picsum.photos/100/100?random=11' },
  { id: '3', admissionNumber: 'ADM003', firstName: 'Zuri', lastName: 'Achieng', class: 'Grade 7', stream: 'Oak', gender: 'Female', dob: '2011-01-05', guardianPhone: '0788999888', guardianName: 'Grace Achieng', feeBalance: 4500, photo: 'https://picsum.photos/100/100?random=12' },
  { id: '4', admissionNumber: 'ADM004', firstName: 'Sifa', lastName: 'Otieno', class: 'PP1', stream: 'Acacia', gender: 'Male', dob: '2019-02-15', guardianPhone: '0712121212', guardianName: 'Peter Otieno', feeBalance: 2000, photo: 'https://picsum.photos/100/100?random=13' },
  { id: '5', admissionNumber: 'ADM005', firstName: 'Neema', lastName: 'Wambui', class: 'Grade 4', stream: 'Willow', gender: 'Female', dob: '2014-06-10', guardianPhone: '0745454545', guardianName: 'Jane Wambui', feeBalance: 0, photo: 'https://picsum.photos/100/100?random=14' },
];

export const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState<Partial<Student>>({
    firstName: '',
    lastName: '',
    admissionNumber: '',
    class: 'Grade 7',
    stream: '',
    gender: 'Male',
    dob: '',
    guardianName: '',
    guardianPhone: '',
    feeBalance: 0
  });

  const openModal = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setFormData(student);
    } else {
      setEditingStudent(null);
      setFormData({
        firstName: '',
        lastName: '',
        admissionNumber: '',
        class: 'Grade 7',
        stream: '',
        gender: 'Male',
        dob: '',
        guardianName: '',
        guardianPhone: '',
        feeBalance: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudent) {
      setStudents(students.map(s => s.id === editingStudent.id ? { ...s, ...formData } as Student : s));
    } else {
      const newStudent = {
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
        photo: `https://picsum.photos/100/100?random=${Math.floor(Math.random() * 100)}`
      } as Student;
      setStudents([...students, newStudent]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this student record?')) {
      setStudents(students.filter(s => s.id !== id));
    }
  };

  const filteredStudents = students.filter(s => 
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Student Directory</h1>
          <p className="text-gray-500 font-medium tracking-tight">Manage {students.length} currently enrolled learners.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-8 py-4 rounded-2xl hover:bg-blue-700 transition-all font-black uppercase tracking-widest shadow-xl shadow-blue-100"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Learner</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name or ADM..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-medium" 
            />
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-6 py-3 border-2 border-gray-100 rounded-2xl hover:bg-white hover:border-blue-100 transition-all font-black text-xs uppercase tracking-widest text-gray-500">
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
            <button className="px-6 py-3 border-2 border-gray-100 rounded-2xl hover:bg-white hover:border-blue-100 transition-all font-black text-xs uppercase tracking-widest text-gray-500">Export</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b text-[10px] text-gray-400 uppercase font-black tracking-widest">
                <th className="px-8 py-5">Learner Profile</th>
                <th className="px-8 py-5">ADM No</th>
                <th className="px-8 py-5">Grade/Stream</th>
                <th className="px-8 py-5">Guardian Info</th>
                <th className="px-8 py-5">Fee Ledger</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-blue-50/20 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <img src={student.photo} className="w-12 h-12 rounded-2xl border-2 border-white shadow-sm bg-blue-50 object-cover" alt={student.firstName} />
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${student.gender === 'Male' ? 'bg-blue-500' : 'bg-pink-500'}`}>
                           <span className="text-[8px] text-white font-black">{student.gender[0]}</span>
                        </div>
                      </div>
                      <div>
                        <div className="font-black text-gray-900 text-lg tracking-tight">{student.firstName} {student.lastName}</div>
                        <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest flex items-center gap-1.5">
                           {student.gender} • <span className="text-blue-500">{new Date(student.dob).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 font-mono font-black text-blue-600 text-sm">{student.admissionNumber}</td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-600">{student.class} • {student.stream}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-gray-800">{student.guardianName}</span>
                      <div className="flex items-center space-x-1.5 text-gray-400 text-[10px] font-bold">
                        <Phone className="w-3 h-3" />
                        <span>{student.guardianPhone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`text-sm font-black tracking-tight ${student.feeBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      KES {student.feeBalance.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => openModal(student)} className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(student.id)} className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <Users className="w-16 h-16 text-gray-100 mb-4" />
                      <p className="text-gray-400 font-bold italic">No students matching your search criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl relative animate-in zoom-in duration-300 overflow-hidden">
            <div className="p-8 border-b bg-gray-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{editingStudent ? 'Edit Learner Profile' : 'Enroll New Learner'}</h2>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">Official CBC Student Registration</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white rounded-full transition-all shadow-sm border border-transparent hover:border-gray-100">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-8">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-3xl bg-gray-100 flex items-center justify-center border-4 border-white shadow-xl overflow-hidden group-hover:scale-[1.02] transition-transform">
                    {formData.photo ? <img src={formData.photo} className="w-full h-full object-cover" /> : <Camera className="w-10 h-10 text-gray-300" />}
                  </div>
                  <button type="button" className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-3 rounded-2xl shadow-xl hover:bg-blue-700 transition-all border-4 border-white">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Upload Profile Passport</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">First Name</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.firstName}
                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all outline-none font-bold text-gray-800" 
                    placeholder="e.g. Kamau"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Last Name</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.lastName}
                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all outline-none font-bold text-gray-800" 
                    placeholder="e.g. Njoroge"
                  />
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Gender Selection</label>
                   <div className="grid grid-cols-2 gap-3 p-1.5 bg-gray-100 rounded-2xl">
                      <button 
                         type="button"
                         onClick={() => setFormData({...formData, gender: 'Male'})}
                         className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.gender === 'Male' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                         Male
                      </button>
                      <button 
                         type="button"
                         onClick={() => setFormData({...formData, gender: 'Female'})}
                         className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.gender === 'Female' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                         Female
                      </button>
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Admission No.</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. ADM001"
                    value={formData.admissionNumber}
                    onChange={e => setFormData({...formData, admissionNumber: e.target.value})}
                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all outline-none font-mono font-black text-blue-600" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date of Birth</label>
                  <input 
                    required 
                    type="date" 
                    value={formData.dob}
                    onChange={e => setFormData({...formData, dob: e.target.value})}
                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all outline-none font-bold text-gray-800" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Class</label>
                    <select 
                      value={formData.class}
                      onChange={e => setFormData({...formData, class: e.target.value})}
                      className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-bold text-gray-800 appearance-none"
                    >
                      {KENYAN_CLASSES.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Stream</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="e.g. Oak"
                      value={formData.stream}
                      onChange={e => setFormData({...formData, stream: e.target.value})}
                      className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all outline-none font-bold text-gray-800" 
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/50 p-8 rounded-3xl border-2 border-blue-100 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-[0.05] pointer-events-none">
                   <ShieldCheck className="w-24 h-24 text-blue-900" />
                </div>
                <h3 className="font-black text-xs text-blue-900 uppercase tracking-[0.25em] flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Primary Guardian Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">Guardian Full Name</label>
                    <input 
                      required 
                      type="text" 
                      value={formData.guardianName}
                      onChange={e => setFormData({...formData, guardianName: e.target.value})}
                      className="w-full p-4 bg-white border-2 border-blue-100 rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all outline-none font-bold text-gray-800 shadow-sm" 
                      placeholder="Enter Full Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">Mobile Contact</label>
                    <input 
                      required 
                      type="tel" 
                      placeholder="e.g. 0711 000 000"
                      value={formData.guardianPhone}
                      onChange={e => setFormData({...formData, guardianPhone: e.target.value})}
                      className="w-full p-4 bg-white border-2 border-blue-100 rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all outline-none font-bold text-gray-800 shadow-sm" 
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 text-gray-400 font-black uppercase tracking-widest hover:bg-gray-50 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-blue-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
                >
                  {editingStudent ? 'Update Profile' : 'Complete Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const ShieldCheck = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
  </svg>
);
