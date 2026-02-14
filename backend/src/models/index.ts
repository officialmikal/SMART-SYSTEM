
import Institution from './Institution';
import User from './User';
import Student from './Student';
import Class from './Class';
import Fee from './Fee';
import Payment from './Payment';
import Staff from './Staff';
import Attendance from './Attendance';
import Exam from './Exam';
import Mark from './Mark';
import AuditLog from './AuditLog';

// Tenant-level Associations
Institution.hasMany(User, { foreignKey: 'institutionId', as: 'users' });
User.belongsTo(Institution, { foreignKey: 'institutionId', as: 'institution' });

Institution.hasMany(Student, { foreignKey: 'institutionId', as: 'students' });
Student.belongsTo(Institution, { foreignKey: 'institutionId' });

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
  AuditLog
};
