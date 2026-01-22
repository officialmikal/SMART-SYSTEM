
import React, { useState, useRef, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Phone, 
  X, 
  Camera, 
  Trash2, 
  Edit2, 
  User, 
  Users, 
  FileUp, 
  FileDown, 
  Loader2,
  ShieldCheck,
  AlertCircle,
  Banknote,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student, KENYAN_CLASSES, ClassFee, SCHOOL_STREAMS } from '../types';

interface Props {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  feeStructure: ClassFee[];
}

export const StudentManagement: React.FC<Props> = ({ students = [], setStudents, feeStructure }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    totalFee: 45000,
    paidFee: 0,
    prepaidFee: 0,
    feeBalance: 45000
  });

  const openModal = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setFormData({ ...student });
    } else {
      setEditingStudent(null);
      const defaultClass = 'Grade 7';
      const defaultFee = feeStructure.find(f => f.className === defaultClass)?.amount || 45000;
      setFormData({
        firstName: '',
        lastName: '',
        admissionNumber: '',
        class: defaultClass,
        stream: '',
        gender: 'Male',
        dob: '',
        guardianName: '',
        guardianPhone: '',
        totalFee: defaultFee,
        paidFee: 0,
        prepaidFee: 0,
        feeBalance: defaultFee
      });
    }
    setIsModalOpen(true);
  };

  const openDeleteModal = (student: Student) => {
    setStudentToDelete(student);
    setIsDeleteModalOpen(true);
  };

  const handleClassChange = (newClass: string) => {
    const fee = feeStructure.find(f => f.className === newClass)?.amount || 0;
    const currentPaid = formData.paidFee || 0;
    const newBalance = Math.max(0, fee - currentPaid);
    const newPrepaid = currentPaid > fee ? currentPaid - fee : 0;
    
    setFormData(prev => ({ 
      ...prev, 
      class: newClass, 
      totalFee: fee, 
      feeBalance: newBalance,
      prepaidFee: newPrepaid
    }));
  };

  const handleInitialPaymentChange = (value: string) => {
    const paid = parseFloat(value) || 0;
    const total = formData.totalFee || 0;
    const newBalance = Math.max(0, total - paid);
    const newPrepaid = paid > total ? paid - total : 0;
    
    setFormData(prev => ({ 
      ...prev, 
      paidFee: paid, 
      feeBalance: newBalance,
      prepaidFee: newPrepaid
    }));
  };

  const confirmDelete = () => {
    if (studentToDelete) {
      // Direct functional update ensures state consistency and UI sync
      setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));
      setIsDeleteModalOpen(false);
      setStudentToDelete(null);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    const total = formData.totalFee || 0;
    const paid = formData.paidFee || 0;
    const balance = Math.max(0, total - paid);
    const prepaid = paid > total ? paid - total : 0;

    const finalStudentData: Student = {
      ...(formData as Student),
      feeBalance: balance,
      prepaidFee: prepaid,
      photo: formData.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.firstName}${formData.admissionNumber}${Date.now()}`
    };

    if (editingStudent) {
      setStudents(prev => prev.map(s => s.id === editingStudent.id ? { ...finalStudentData, id: s.id } : s));
    } else {
      const newStudent: Student = {
        ...finalStudentData,
        id: Math.random().toString(36).substr(2, 9),
      };
      setStudents(prev => [...prev, newStudent]);
    }
    setIsModalOpen(false);
  };

  const handleExportExcel = () => {
    const exportData = (students || []).map(({ id, photo, ...rest }) => ({
      'Adm Number': rest.admissionNumber,
      'First Name': rest.firstName,
      'Last Name': rest.lastName,
      'Class': rest.class,
      'Stream': rest.stream,
      'Gender': rest.gender,
      'Guardian Name': rest.guardianName,
      'Guardian Phone': rest.guardianPhone,
      'Total Fee': rest.totalFee,
      'Paid Fee': rest.paidFee,
      'Balance': rest.feeBalance,
      'Prepaid': rest.prepaidFee
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    XLSX.writeFile(workbook, `Students_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const importedStudents: Student[] = data.map((row: any) => {
          const className = row['Class'] || 'Grade 7';
          const classFee = feeStructure.find(f => f.className === className)?.amount || 45000;
          const paid = parseFloat(row['Paid Fee']) || 0;
          const total = parseFloat(row['Total Fee']) || classFee;
          
          return {
            id: Math.random().toString(36).substr(2, 9),
            admissionNumber: String(row['Adm Number'] || row['Admission Number'] || ''),
            firstName: row['First Name'] || row['Name']?.split(' ')[0] || '',
            lastName: row['Last Name'] || row['Name']?.split(' ').slice(1).join(' ') || '',
            class: className,
            stream: row['Stream'] || '',
            gender: row['Gender'] || 'Male',
            dob: row['DOB'] || '2012-01-01',
            guardianName: row['Guardian Name'] || '',
            guardianPhone: String(row['Guardian Phone'] || ''),
            totalFee: total,
            paidFee: paid,
            feeBalance: Math.max(0, total - paid),
            prepaidFee: paid > total ? paid - total : 0,
            photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${row['First Name']}${row['Adm Number']}`
          };
        });

        setStudents(prev => [...prev, ...importedStudents]);
        alert(`Successfully imported ${importedStudents.length} students.`);
      } catch (error) {
        console.error("Import Error:", error);
        alert("Failed to parse file. Please ensure it follows the correct format.");
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const filteredStudents = useMemo(() => {
    return (students || []).filter(s => 
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Student Directory</h1>
          <p className="text-gray-500 font-medium">Manage {(students || []).length} enrolled learners.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input type="file" ref={fileInputRef} onChange={handleImportExcel} className="hidden" accept=".xlsx, .xls, .csv" />
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="flex items-center gap-2 bg-white border-2 border-gray-100 px-6 py-3 rounded-2xl hover:bg-gray-50 transition-all font-black uppercase tracking-widest text-xs shadow-sm active:scale-95">
            {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
            <span>{isImporting ? 'Importing...' : 'Import'}</span>
          </button>
          <button type="button" onClick={handleExportExcel} className="flex items-center gap-2 bg-white border-2 border-gray-100 px-6 py-3 rounded-2xl hover:bg-gray-50 transition-all font-black uppercase tracking-widest text-xs shadow-sm active:scale-95">
            <FileDown className="w-4 h-4" /> <span>Export</span>
          </button>
          <button type="button" onClick={() => openModal()} className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-2xl hover:bg-blue-700 transition-all font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100 active:scale-95">
            <Plus className="w-4 h-4" /> <span>Enroll Learner</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-md:w-full">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search by name or ADM..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-medium shadow-inner" />
          </div>
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl text-blue-700 font-black uppercase text-[10px] tracking-widest border border-blue-100 shadow-sm">
             <Users className="w-4 h-4" /> {filteredStudents.length} Result{filteredStudents.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b text-[10px] text-gray-400 uppercase font-black tracking-widest">
                <th className="px-8 py-6">Learner Profile</th>
                <th className="px-8 py-6 text-center">ADM No</th>
                <th className="px-8 py-6 text-center">Grade/Stream</th>
                <th className="px-8 py-6 text-center">Fee Balance</th>
                <th className="px-8 py-6 text-right">Operational Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-blue-50/20 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-4">
                      <img src={student.photo} className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-100 shadow-sm object-cover" alt="Student" />
                      <div>
                        <div className="font-black text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">{student.firstName} {student.lastName}</div>
                        <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-0.5">{student.gender}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center font-mono font-black text-blue-600 tracking-tighter">{student.admissionNumber}</td>
                  <td className="px-8 py-6 text-center">
                    <span className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-black uppercase tracking-widest border border-gray-200">{student.class} {student.stream && `• ${student.stream}`}</span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className={`font-black ${student.feeBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {student.prepaidFee > 0 ? `+KES ${student.prepaidFee.toLocaleString()}` : `KES ${student.feeBalance.toLocaleString()}`}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-3">
                      <button 
                        type="button" 
                        onClick={() => openModal(student)} 
                        className="flex items-center gap-2 px-4 py-2.5 text-blue-600 bg-white hover:bg-blue-600 hover:text-white rounded-xl transition-all border-2 border-gray-50 hover:border-blue-600 active:scale-95 shadow-sm"
                        title="Edit Student Record"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Edit</span>
                      </button>
                      <button 
                        type="button" 
                        onClick={() => openDeleteModal(student)} 
                        className="flex items-center gap-2 px-4 py-2.5 text-red-600 bg-white hover:bg-red-600 hover:text-white transition-all border-2 border-gray-50 hover:border-red-600 shadow-sm active:scale-95"
                        title="Permanently Delete Student"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                   <td colSpan={5} className="py-24 text-center">
                      <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">No student records matching your search.</p>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ENROLLMENT / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl relative overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
              <div className="p-8 border-b bg-gray-50/50 flex items-center justify-between">
                 <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900 leading-none">{editingStudent ? 'Edit Learner' : 'Enroll New Learner'}</h2>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-3">Official Student Registration</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-full transition-all border border-transparent hover:border-red-100">
                    <X className="w-6 h-6" />
                 </button>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-8 overflow-y-auto">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">First Name</label>
                       <input required type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-bold" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Last Name</label>
                       <input required type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-bold" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Admission Number</label>
                       <input required type="text" value={formData.admissionNumber} onChange={e => setFormData({...formData, admissionNumber: e.target.value.toUpperCase()})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-black text-blue-600" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Gender</label>
                       <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-bold">
                          <option>Male</option>
                          <option>Female</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Class Level</label>
                       <select value={formData.class} onChange={e => handleClassChange(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-bold">
                          {KENYAN_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Stream</label>
                       <input 
                         required
                         type="text" 
                         placeholder="e.g. Oak, North, etc."
                         value={formData.stream} 
                         onChange={e => setFormData({...formData, stream: e.target.value})} 
                         className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-bold" 
                       />
                    </div>
                 </div>

                 <div className="pt-6 border-t space-y-6">
                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Guardian Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                          <input required type="text" value={formData.guardianName} onChange={e => setFormData({...formData, guardianName: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-blue-500" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number (Safaricom)</label>
                          <input required type="tel" value={formData.guardianPhone} onChange={e => setFormData({...formData, guardianPhone: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-blue-500" placeholder="07XX..." />
                       </div>
                    </div>
                 </div>

                 <div className="pt-6 border-t space-y-6">
                    <div className="flex items-center justify-between">
                       <h4 className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em]">Initial Billing</h4>
                       <div className="bg-green-50 px-3 py-1 rounded-full text-green-700 text-[10px] font-black">Termly: KES {(formData.totalFee || 0).toLocaleString()}</div>
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Initial Deposit Paid (KES)</label>
                       <input type="number" value={formData.paidFee} onChange={e => handleInitialPaymentChange(e.target.value)} className="w-full p-5 bg-green-50/50 border-2 border-green-100 rounded-[24px] text-2xl font-black text-green-700 outline-none focus:border-green-500 transition-all shadow-inner" placeholder="0.00" />
                       <div className="flex justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          <div>
                             <p className="text-[9px] font-black text-gray-400 uppercase">Closing Balance</p>
                             <p className="text-sm font-black text-red-600">KES {(formData.feeBalance || 0).toLocaleString()}</p>
                          </div>
                          {formData.prepaidFee! > 0 && (
                            <div className="text-right">
                               <p className="text-[9px] font-black text-gray-400 uppercase">Prepaid Credit</p>
                               <p className="text-sm font-black text-green-600">KES {(formData.prepaidFee || 0).toLocaleString()}</p>
                            </div>
                          )}
                       </div>
                    </div>
                 </div>

                 <div className="flex gap-4 pt-10">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 text-gray-400 font-black uppercase tracking-widest hover:bg-gray-50 rounded-3xl transition-all">Discard</button>
                    <button type="submit" className="flex-1 py-5 bg-blue-600 text-white font-black uppercase tracking-widest rounded-3xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3">
                       <CheckCircle2 className="w-6 h-6" /> {editingStudent ? 'Update Profile' : 'Confirm Enrollment'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL - Identical in behavior to the edit modal */}
      {isDeleteModalOpen && studentToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
              <div className="p-10 text-center">
                 <div className="w-24 h-24 bg-red-50 text-red-600 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-red-100 border-4 border-white rotate-3 group-hover:rotate-0 transition-transform">
                    <Trash2 className="w-10 h-10" />
                 </div>
                 
                 <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none">Confirm Deletion</h2>
                 <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-4 mb-8">Permanently remove learner record</p>
                 
                 <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 mb-10">
                    <div className="flex items-center gap-4">
                       <img src={studentToDelete.photo} className="w-16 h-16 rounded-2xl border-4 border-white shadow-md bg-white object-cover" alt="Student" />
                       <div className="text-left">
                          <p className="font-black text-gray-900 text-xl leading-tight">{studentToDelete.firstName} {studentToDelete.lastName}</p>
                          <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mt-1">ADM: {studentToDelete.admissionNumber}</p>
                       </div>
                    </div>
                 </div>

                 <p className="text-sm font-medium text-gray-500 leading-relaxed px-4 mb-10">
                    Are you certain? All academic achievements, fee history, and attendance data for this learner will be <strong>permanently purged</strong>.
                 </p>

                 <div className="flex gap-4">
                    <button 
                      type="button" 
                      onClick={() => setIsDeleteModalOpen(false)} 
                      className="flex-1 py-5 bg-gray-100 text-gray-400 font-black uppercase tracking-widest rounded-3xl hover:bg-gray-200 transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      onClick={confirmDelete}
                      className="flex-1 py-5 bg-red-600 text-white font-black uppercase tracking-widest rounded-3xl hover:bg-red-700 transition-all shadow-xl shadow-red-100 active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-5 h-5" /> Confirm Purge
                    </button>
                 </div>
              </div>
              <button onClick={() => setIsDeleteModalOpen(false)} className="absolute top-6 right-6 p-4 text-gray-300 hover:text-red-500 transition-colors">
                 <X className="w-8 h-8" />
              </button>
           </div>
        </div>
      )}
    </div>
  );
};
