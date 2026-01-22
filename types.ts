
export enum UserRole {
  ADMIN = 'ADMIN',
  PRINCIPAL = 'PRINCIPAL',
  CLASS_TEACHER = 'CLASS_TEACHER',
  SUBJECT_TEACHER = 'SUBJECT_TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT'
}

export enum CBCGrade {
  EE = 'EE', // Exceeding Expectations
  ME = 'ME', // Meeting Expectations
  AE = 'AE', // Approaching Expectations
  BE = 'BE'  // Below Expectations
}

export const KENYAN_CLASSES = [
  'PP1',
  'PP2',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9'
];

export const SCHOOL_STREAMS = ['Oak', 'Palm', 'Eagle', 'Willow', 'Acacia'];

export interface ClassFee {
  className: string;
  amount: number;
}

export interface ExamResult {
  examId?: string;
  subject: string;
  score: number;
  grade: string;
  competency: CBCGrade;
  remarks: string;
}

export interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  class: string;
  stream: string;
  gender: 'Male' | 'Female';
  dob: string;
  guardianPhone: string;
  guardianName: string;
  feeBalance: number;
  totalFee: number;
  paidFee: number;
  prepaidFee: number;
  photo?: string;
  results?: ExamResult[];
}

export interface Staff {
  id: string;
  staffId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  subjects: string[];
  photo?: string;
}

export interface Exam {
  id: string;
  title: string;
  term: number;
  year: number;
  type: 'CAT' | 'End of Term' | 'Initial Assessment';
  date: string;
}

export interface MarkEntry {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  score: number;
  competency: CBCGrade;
  remarks: string;
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
  method: 'M-PESA' | 'CASH' | 'BANK';
  transactionId: string;
  description: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface TimetableEntry {
  id: string;
  day: string;
  time: string;
  subject: string;
  teacher: string;
  room?: string;
  category: 'STEM' | 'Languages' | 'Arts' | 'Break' | 'Technical' | 'Social';
}
