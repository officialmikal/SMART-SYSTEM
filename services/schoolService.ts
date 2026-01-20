
import { CBCGrade, Exam, MarkEntry, TimetableEntry } from '../types';

export interface AcademicConfig {
  year: number;
  term: number;
  schoolName: string;
  registrationNo: string;
  motto: string;
}

export interface AttendanceRecord {
  date: string;
  status: 'Present' | 'Absent' | 'Late';
  remarks?: string;
}

export interface FeeTransaction {
  date: string;
  description: string;
  reference: string;
  amount: number;
  type: 'Credit' | 'Debit';
  balance: number;
}

export const schoolService = {
  async getAcademicConfig(): Promise<AcademicConfig> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const now = new Date();
    const month = now.getMonth();
    let term = 3;
    if (month <= 3) term = 1;
    else if (month <= 7) term = 2;

    return {
      year: now.getFullYear(),
      term: term,
      schoolName: 'ElimuSmart Academy',
      registrationNo: 'MOE/P/2024/0981',
      motto: 'Excellence in Knowledge and Character'
    };
  },

  async getExams(): Promise<Exam[]> {
    return [
      { id: 'ex1', title: 'Term 2 CAT 1', term: 2, year: 2024, type: 'CAT', date: '2024-05-15' },
      { id: 'ex2', title: 'Term 2 End of Term', term: 2, year: 2024, type: 'End of Term', date: '2024-07-20' },
    ];
  },

  async getMarkEntries(examId: string, subject: string, className: string): Promise<MarkEntry[]> {
    return [
      { studentId: '1', studentName: 'Kamau Njoroge', admissionNumber: 'ADM001', score: 85, competency: CBCGrade.EE, remarks: '' },
      { studentId: '2', studentName: 'Amara Kiprono', admissionNumber: 'ADM002', score: 72, competency: CBCGrade.ME, remarks: '' },
      { studentId: '3', studentName: 'Zuri Achieng', admissionNumber: 'ADM003', score: 58, competency: CBCGrade.AE, remarks: '' },
      { studentId: '4', studentName: 'Sifa Otieno', admissionNumber: 'ADM004', score: 91, competency: CBCGrade.EE, remarks: '' },
    ];
  },

  calculateCBCGrade(score: number): CBCGrade {
    if (score >= 80) return CBCGrade.EE;
    if (score >= 60) return CBCGrade.ME;
    if (score >= 40) return CBCGrade.AE;
    return CBCGrade.BE;
  },

  async saveAttendance(classId: string, records: any[]) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Saved attendance for ${classId}`, records);
    return { success: true };
  },

  async getStudentTranscript(studentId: string) {
    return {
      studentId,
      results: [
        { subject: 'Mathematics', score: 85, grade: 'A', competency: CBCGrade.EE, remarks: 'Excellent logical reasoning.' },
        { subject: 'English Language', score: 78, grade: 'B+', competency: CBCGrade.ME, remarks: 'Strong creative writing skills.' },
        { subject: 'Integrated Science', score: 82, grade: 'A-', competency: CBCGrade.EE, remarks: 'Very inquisitive in lab experiments.' },
        { subject: 'Social Studies', score: 70, grade: 'B', competency: CBCGrade.ME, remarks: 'Good grasp of civic duties.' },
        { subject: 'Kiswahili', score: 92, grade: 'A', competency: CBCGrade.EE, remarks: 'Lugha sanifu na fasaha.' },
        { subject: 'Creative Arts & Sports', score: 88, grade: 'A', competency: CBCGrade.EE, remarks: 'Exceptional athletic performance.' },
      ]
    };
  },

  async getTimetable(classId: string): Promise<TimetableEntry[]> {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const times = ['08:00', '08:40', '09:20', '10:00', '10:30', '11:10', '11:50', '12:30', '13:30', '14:10', '14:50'];
    const entries: TimetableEntry[] = [];

    days.forEach(day => {
      times.forEach((time, i) => {
        if (time === '10:00') {
          entries.push({ id: `${day}-${time}`, day, time, subject: 'Short Break', teacher: '-', category: 'Break' });
        } else if (time === '12:30') {
          entries.push({ id: `${day}-${time}`, day, time, subject: 'Lunch Break', teacher: '-', category: 'Break' });
        } else {
          const subjects = ['Mathematics', 'English', 'Kiswahili', 'Integrated Science', 'Pre-Technical', 'Creative Arts', 'Social Studies'];
          const cats: any[] = ['STEM', 'Languages', 'Languages', 'STEM', 'Technical', 'Arts', 'Social'];
          const idx = (day.length + i) % subjects.length;
          entries.push({
            id: `${day}-${time}`,
            day,
            time,
            subject: subjects[idx],
            teacher: 'Tr. ' + ['Maina', 'Wambui', 'Otieno', 'Achieng'][idx % 4],
            category: cats[idx]
          });
        }
      });
    });
    return entries;
  },

  async getAttendanceHistory(studentId: string): Promise<AttendanceRecord[]> {
    return [
      { date: '2024-05-01', status: 'Present' },
      { date: '2024-05-02', status: 'Present' },
      { date: '2024-05-03', status: 'Absent', remarks: 'Medical - Flu' },
      { date: '2024-05-04', status: 'Present' },
      { date: '2024-05-05', status: 'Present' },
      { date: '2024-05-08', status: 'Late', remarks: 'Heavy Traffic' },
    ];
  },

  async getFeeStatement(studentId: string): Promise<FeeTransaction[]> {
    return [
      { date: '2024-01-05', description: 'Opening Balance', reference: 'SYS-OB', amount: 0, type: 'Debit', balance: 0 },
      { date: '2024-01-10', description: 'Term 1 Tuition Fees', reference: 'INV-T1-001', amount: 45000, type: 'Debit', balance: 45000 },
      { date: '2024-01-15', description: 'M-Pesa Payment', reference: 'SBR12345GH', amount: 30000, type: 'Credit', balance: 15000 },
      { date: '2024-05-02', description: 'Term 2 Tuition Fees', reference: 'INV-T2-001', amount: 45000, type: 'Debit', balance: 60000 },
      { date: '2024-05-10', description: 'Bank Deposit - Coop Bank', reference: 'DEP-77889', amount: 60000, type: 'Credit', balance: 0 },
    ];
  }
};
