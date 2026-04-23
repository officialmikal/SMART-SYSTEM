
import Institution from './Institution.ts';
import User from './User.ts';
import Student from './Student.ts';
import Class from './Class.ts';
import Fee from './Fee.ts';
import Payment from './Payment.ts';
import Staff from './Staff.ts';
import Attendance from './Attendance.ts';
import Exam from './Exam.ts';
import Mark from './Mark.ts';
import AuditLog from './AuditLog.ts';
import SmsLog from './SmsLog.ts';
import Expenditure from './Expenditure.ts';

// Tenant-level Associations
// Fix: Cast models to any for static association methods
(Institution as any).hasMany(User, { foreignKey: 'institutionId', as: 'users' });
(User as any).belongsTo(Institution, { foreignKey: 'institutionId', as: 'institution' });

(Institution as any).hasMany(Student, { foreignKey: 'institutionId', as: 'students' });
(Student as any).belongsTo(Institution, { foreignKey: 'institutionId' });

(Institution as any).hasMany(SmsLog, { foreignKey: 'institutionId', as: 'smsLogs' });
(SmsLog as any).belongsTo(Institution, { foreignKey: 'institutionId' });

(Institution as any).hasMany(Expenditure, { foreignKey: 'institutionId', as: 'expenditures' });
(Expenditure as any).belongsTo(Institution, { foreignKey: 'institutionId' });

// Module Associations
(Class as any).hasMany(Student, { foreignKey: 'classId', as: 'students' });
(Student as any).belongsTo(Class, { foreignKey: 'classId', as: 'class' });

(Class as any).hasOne(Fee, { foreignKey: 'classId', as: 'feeStructure' });
(Fee as any).belongsTo(Class, { foreignKey: 'classId' });

(Student as any).hasMany(Payment, { foreignKey: 'studentId', as: 'payments' });
(Payment as any).belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

(Student as any).hasMany(Attendance, { foreignKey: 'studentId', as: 'attendance' });
(Attendance as any).belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

(Student as any).hasMany(Mark, { foreignKey: 'studentId', as: 'marks' });
(Mark as any).belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

(Exam as any).hasMany(Mark, { foreignKey: 'examId', as: 'marks' });
(Mark as any).belongsTo(Exam, { foreignKey: 'examId', as: 'exam' });

export {
  Institution,
  User,
  Student,
  Class,
  Fee,
  Payment,
  Staff,
  Attendance,
  Exam,
  Mark,
  AuditLog,
  SmsLog,
  Expenditure
};
