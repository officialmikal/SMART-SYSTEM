
export enum UserRole {
  ADMIN = 'ADMIN',
  PRINCIPAL = 'PRINCIPAL',
  TEACHER = 'TEACHER',
  FINANCE = 'FINANCE',
  CLASS_TEACHER = 'CLASS_TEACHER',
  SUBJECT_TEACHER = 'SUBJECT_TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT'
}

export interface CustomRole {
  id: string;
  name: string;
  description: string;
  baseRole: UserRole; // Maps to functional permissions
  isSystemRole?: boolean; // Protects core roles from deletion
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

export enum SMSProvider {
  AFRICAS_TALKING = 'AFRICAS_TALKING',
  TWILIO = 'TWILIO',
  Safaricom = 'SAFARICOM'
}

export interface SMSSettings {
  provider: SMSProvider;
  username: string;
  apiKey: string;
  senderId: string;
  enabled: boolean;
}

export interface ClassFee {
  className: string;
  amount: number;
}

export interface ExamResult {
  examId?: string;
  subject: string;
  score: number;
  grade: string;
  competency: string; // Changed from CBCGrade to string to hold levels like 'EE1'
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
  totalFee: number; // This is the Grade Default Fee
  agreedFee?: number; // Optional negotiated amount
  transportFee?: number; // Added: Transport specific fee
  isUsingTransport?: boolean; // Added: Transport toggle
  paidTransportFee?: number; // Added: Collected transport fees
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
  competency: string; // Changed from CBCGrade to string to hold levels like 'EE1'
  remarks: string;
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
  method: 'M-PESA' | 'CASH' | 'BANK';
  transactionId: string;
  description: string;
  studentId?: string;
  parentPhone?: string; // For multi-student payments
  allocations?: { studentId: string; amount: number }[];
}

export interface Expenditure {
  id: string;
  amount: number;
  category: 'Salaries' | 'Food/Supplies' | 'Utilities' | 'Maintenance' | 'Exams' | 'Other';
  date: string;
  description: string;
  approvedBy?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  avatar?: string;
  active: boolean;
  institutionId?: string;
  customRoleName?: string; // Added to display custom role labels
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

/**
 * Updated AuditLog interface to match backend model properties for consistency
 */
export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN';
  resource: string;
  resourceId: string;
  oldValue?: any;
  newValue?: any;
  createdAt: string;
  userAgent?: string | null;
  ipAddress?: string | null;
}
