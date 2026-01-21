
import React, { useState, useRef } from 'react';
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
  Banknote
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student, KENYAN_CLASSES, ClassFee } from '../types';

interface Props {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  feeStructure: ClassFee[];
}

export const StudentManagement: React.FC<Props> = ({ students, setStudents, feeStructure }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
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
      setFormData(student);
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

  const handleClassChange = (newClass: string) => {
    const fee = feeStructure.find(f => f.className === newClass)?.amount || 0;
    const currentPaid = formData.paidFee || 0;
    const newBalance = Math.max(0, fee - currentPaid);
    const newPrepaid = currentPaid > fee ? currentPaid - fee : 0;
    
    setFormData({ 
      ...formData, 
      class: newClass, 
      totalFee: fee, 
      feeBalance: newBalance,
      prepaidFee: newPrepaid
    });
  };

  const handleInitialPaymentChange = (val: string) => {
    const paid = parseFloat(val) || 0;
    const total = formData.totalFee || 0;
    const newBalance = Math.max(0, total - paid);
    const newPrepaid = paid > total ? paid - total : 0;
    
    setFormData({ 
      ...formData, 
      paidFee: paid, 
      feeBalance: newBalance,
      prepaidFee: newPrepaid
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudent) {
      setStudents(prev => prev.map(s => s.id === editingStudent.id ? { ...s, ...formData } as Student : s));
    } else {
      const newStudent = {
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
        photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.firstName}${formData.lastName}${Date.now()}`,
      } as Student;
      setStudents(prev => [...prev, newStudent]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you absolutely sure you want to delete this student record? This action cannot be undone.')) {
      setStudents(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleExportExcel = () => {
    const exportData = students.map(({ id, photo, ...rest }) => ({
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

  const filteredStudents = students.filter(s => 
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Student Directory</h1>
          <p className="text-gray-500 font-medium">Manage {students.length} enrolled learners.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportExcel} 
            className="hidden" 
            accept=".xlsx, .xls, .csv" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center gap-2 bg-white border-2 border-gray-100 px-6 py-3 rounded-2xl hover:bg-gray-50 transition-all font-black uppercase tracking-widest text-xs"
          >
            {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
            <span>{isImporting ? 'Importing...' : 'Import'}</span>
          </button>
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-white border-2 border-gray-100 px-6 py-3 rounded-2xl hover:bg-gray-50 transition-all font-black uppercase tracking-widest text-xs"
          >
            <FileDown className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button 
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-2xl hover:bg-blue-700 transition-all font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll Learner</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-md:w-full">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name or ADM..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-medium" 
            />
          </div>
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl text-blue-700 font-black uppercase text-[10px] tracking-widest border border-blue-100 shadow-sm">
             <Users className="w-4 h-4" />
             {filteredStudents.length} Result{filteredStudents.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b text-[10px] text-gray-400 uppercase font-black tracking-widest">
                <th className="px-8 py-5">Learner Profile</th>
                <th className="px-8 py-5 text-center">ADM No</th>
                <th className="px-8 py-5 text-center">Grade/Stream</th>
                <th className="px-8 py-5 text-center">Fee Balance</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-blue-50/20 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center space-x-4">
                      <img src={student.photo} className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-100 shadow-sm" alt="Student" />
                      <div>
                        <div className="font-black text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">{student.firstName} {student.lastName}</div>
                        <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-0.5">{student.gender}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center font-mono font-black text-blue-600">{student.admissionNumber}</td>
                  <td className="px-8 py-5 text-center">
                    <span className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-black uppercase tracking-widest">{student.class} {student.stream && `• ${student.stream}`}</span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className={`font-black ${student.feeBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {student.prepaidFee > 0 ? `+KES ${student.prepaidFee.toLocaleString()}` : `KES ${student.feeBalance.toLocaleString()}`}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openModal(student)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={(e) => handleDelete(student.id, e)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                   <td colSpan={5} className="py-20 text-center">
                      <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest italic">No matching student records found.</p>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
            <div className="p-8 border-b bg-gray-50/50 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-2xl font-black text-gray-900 uppercase leading-none">{editingStudent ? 'Edit Profile' : 'Enrollment Detail'}</h2>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">Personal & Academic Record</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-full transition-all"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8">
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">First Name</label>
                     <input required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none transition-all font-bold" placeholder="First Name" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Last Name</label>
                     <input required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none transition-all font-bold" placeholder="Last Name" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Admission Number</label>
                     <input required value={formData.admissionNumber} onChange={e => setFormData({...formData, admissionNumber: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none transition-all font-mono font-black text-blue-600" placeholder="ADM001" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Gender</label>
                     <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none transition-all font-black uppercase">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Grade</label>
                     <select value={formData.class} onChange={e => handleClassChange(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none transition-all font-black uppercase">
                      {KENYAN_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Stream</label>
                     <input 
                       required 
                       value={formData.stream} 
                       onChange={e => setFormData({...formData, stream: e.target.value})} 
                       className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none transition-all font-bold uppercase" 
                       placeholder="e.g. Oak, Palm, Eagle" 
                     />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Guardian Identity</label>
                     <input required value={formData.guardianName} onChange={e => setFormData({...formData, guardianName: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none transition-all font-bold" placeholder="Guardian Name" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Contact</label>
                     <input required value={formData.guardianPhone} onChange={e => setFormData({...formData, guardianPhone: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none transition-all font-bold" placeholder="0700..." />
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b pb-2">Financial Setup</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Initial Payment Received</label>
                      <div className="relative">
                        <Banknote className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
                        <input 
                          type="number" 
                          value={formData.paidFee} 
                          onChange={e => handleInitialPaymentChange(e.target.value)} 
                          className="w-full pl-12 p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none transition-all font-bold" 
                          placeholder="0.00" 
                        />
                      </div>
                    </div>
                    <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col justify-center">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Total Invoice</span>
                        <span className="text-sm font-black text-blue-900">KES {formData.totalFee?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{formData.prepaidFee! > 0 ? 'Prepaid Credit' : 'Balance Due'}</span>
                        <span className={`text-sm font-black ${formData.prepaidFee! > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          KES {formData.prepaidFee! > 0 ? formData.prepaidFee?.toLocaleString() : formData.feeBalance?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-[24px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-100 hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.99] transition-all">
                  {editingStudent ? 'Update Profile' : 'Confirm Enrollment'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
