
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
  ArrowRight,
  Upload
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
    agreedFee: undefined,
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
        agreedFee: undefined,
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

  const calculateBalances = (data: Partial<Student>) => {
    const total = data.agreedFee !== undefined ? data.agreedFee : (data.totalFee || 0);
    const paid = data.paidFee || 0;
    const balance = Math.max(0, total - paid);
    const prepaid = paid > total ? paid - total : 0;
    return { balance, prepaid };
  };

  const handleClassChange = (newClass: string) => {
    const fee = feeStructure.find(f => f.className === newClass)?.amount || 0;
    const currentAgreed = formData.agreedFee;
    const currentPaid = formData.paidFee || 0;
    
    const target = currentAgreed !== undefined ? currentAgreed : fee;
    const balance = Math.max(0, target - currentPaid);
    const prepaid = currentPaid > target ? currentPaid - target : 0;
    
    setFormData(prev => ({ 
      ...prev, 
      class: newClass, 
      totalFee: fee, 
      feeBalance: balance,
      prepaidFee: prepaid
    }));
  };

  const handleFeeFieldChange = (field: 'agreedFee' | 'paidFee', val: string) => {
    const value = val === '' ? undefined : parseFloat(val);
    const nextData = { ...formData, [field]: value };
    const { balance, prepaid } = calculateBalances(nextData);
    setFormData({ ...nextData, feeBalance: balance, prepaidFee: prepaid });
  };

  const confirmDelete = () => {
    if (studentToDelete) {
      setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));
      setIsDeleteModalOpen(false);
      setStudentToDelete(null);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const { balance, prepaid } = calculateBalances(formData);

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
      'Guardian Name': rest.guardianName,
      'Guardian Phone': rest.guardianPhone,
      'Grade Fee': rest.totalFee,
      'Agreed Fee': rest.agreedFee ?? rest.totalFee,
      'Paid Fee': rest.paidFee,
      'Balance': rest.feeBalance,
      'Prepaid': rest.prepaidFee
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    XLSX.writeFile(workbook, `Students_Finance_${new Date().toISOString().split('T')[0]}.xlsx`);
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

        const newStudents: Student[] = data.map((row: any) => {
          const className = row['Class'] || 'Grade 7';
          const totalFee = feeStructure.find(f => f.className === className)?.amount || 45000;
          const paidFee = parseFloat(row['Paid Fee']) || 0;
          const agreedFee = row['Agreed Fee'] ? parseFloat(row['Agreed Fee']) : undefined;
          
          const effectiveTarget = agreedFee !== undefined ? agreedFee : totalFee;
          const feeBalance = Math.max(0, effectiveTarget - paidFee);
          const prepaidFee = paidFee > effectiveTarget ? paidFee - effectiveTarget : 0;

          return {
            id: Math.random().toString(36).substr(2, 9),
            admissionNumber: String(row['Adm Number'] || row['Admission Number'] || ''),
            firstName: String(row['First Name'] || ''),
            lastName: String(row['Last Name'] || ''),
            class: className,
            stream: String(row['Stream'] || ''),
            gender: (row['Gender'] === 'Female' ? 'Female' : 'Male') as 'Male' | 'Female',
            dob: String(row['DOB'] || ''),
            guardianName: String(row['Guardian Name'] || ''),
            guardianPhone: String(row['Guardian Phone'] || ''),
            totalFee,
            agreedFee,
            paidFee,
            feeBalance,
            prepaidFee,
            photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${row['First Name']}${Date.now()}`
          };
        });

        setStudents(prev => [...prev, ...newStudents]);
        alert(`Success: ${newStudents.length} students imported.`);
      } catch (error) {
        console.error(error);
        alert('Failed to parse Excel file. Ensure it follows the required format.');
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
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportExcel} 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isImporting}
            className="flex items-center gap-2 bg-white border-2 border-gray-100 px-6 py-3 rounded-2xl hover:bg-gray-50 transition-all font-black uppercase tracking-widest text-xs shadow-sm active:scale-95 disabled:opacity-50"
          >
            {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 text-emerald-600" />}
            <span>Import via Excel</span>
          </button>
          <button type="button" onClick={handleExportExcel} className="flex items-center gap-2 bg-white border-2 border-gray-100 px-6 py-3 rounded-2xl hover:bg-gray-50 transition-all font-black uppercase tracking-widest text-xs shadow-sm active:scale-95">
            <FileDown className="w-4 h-4" /> <span>Export Directory</span>
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
                <th className="px-8 py-6 text-center">Fee Status</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.map((student) => {
                const effectiveExpected = student.agreedFee ?? student.totalFee;
                return (
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
                      <div className="text-[8px] font-black uppercase text-gray-300 tracking-tighter">Expected: KES {effectiveExpected.toLocaleString()}</div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-3">
                        <button 
                          type="button" 
                          onClick={() => openModal(student)} 
                          className="flex items-center gap-2 px-4 py-2.5 text-blue-600 bg-white hover:bg-blue-600 hover:text-white rounded-xl transition-all border-2 border-gray-50 hover:border-blue-600 active:scale-95 shadow-sm"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Edit</span>
                        </button>
                        <button 
                          type="button" 
                          onClick={() => openDeleteModal(student)} 
                          className="flex items-center gap-2 px-4 py-2.5 text-red-600 bg-white hover:bg-red-600 hover:text-white transition-all border-2 border-gray-50 hover:border-red-600 shadow-sm active:scale-95"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

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
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Class Level</label>
                          <select value={formData.class} onChange={e => handleClassChange(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-bold">
                             {KENYAN_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Stream (Custom)</label>
                          <input 
                            type="text" 
                            placeholder="e.g. West" 
                            value={formData.stream} 
                            onChange={e => setFormData({...formData, stream: e.target.value})} 
                            className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-bold" 
                          />
                       </div>
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
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                          <input required type="tel" value={formData.guardianPhone} onChange={e => setFormData({...formData, guardianPhone: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-blue-500" placeholder="07XX..." />
                       </div>
                    </div>
                 </div>

                 <div className="pt-6 border-t space-y-6">
                    <div className="flex items-center justify-between">
                       <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Negotiated Fees (Institutional)</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Default Grade Fee</label>
                        <div className="w-full p-4 bg-gray-100 border-2 border-gray-200 rounded-2xl font-black text-gray-500">KES {(formData.totalFee || 0).toLocaleString()}</div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Agreed Fee Override</label>
                        <input type="number" value={formData.agreedFee ?? ''} onChange={e => handleFeeFieldChange('agreedFee', e.target.value)} placeholder="Same as Grade Fee if empty" className="w-full p-4 bg-blue-50 border-2 border-blue-100 rounded-2xl font-black outline-none focus:border-blue-500 shadow-inner" />
                      </div>
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Actual Amount Paid (To Date)</label>
                       <input type="number" value={formData.paidFee} onChange={e => handleFeeFieldChange('paidFee', e.target.value)} className="w-full p-5 bg-green-50/50 border-2 border-green-100 rounded-[24px] text-2xl font-black text-green-700 outline-none focus:border-green-500 transition-all shadow-inner" placeholder="0.00" />
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
                       <CheckCircle2 className="w-6 h-6" /> {editingStudent ? 'Update Account' : 'Confirm Enrollment'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && studentToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl p-10 animate-in zoom-in duration-300 text-center">
              <div className="w-24 h-24 bg-red-50 text-red-600 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-red-100">
                 <AlertTriangle size={48} />
              </div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-4 leading-tight">Authorize Deletion?</h2>
              <p className="text-sm font-medium text-gray-500 leading-relaxed mb-8">
                You are about to permanently remove <strong className="text-gray-900">{studentToDelete.firstName} {studentToDelete.lastName}</strong> ({studentToDelete.admissionNumber}) from the school registry. This action cannot be undone.
              </p>
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => setIsDeleteModalOpen(false)} className="py-4 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-all">Cancel</button>
                 <button onClick={confirmDelete} className="py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-red-100 hover:bg-red-700 transition-all">Confirm Delete</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
