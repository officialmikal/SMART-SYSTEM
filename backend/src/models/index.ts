import User from './User';
import Student from './Student';
import Class from './Class';
import Fee from './Fee';
import Payment from './Payment';
import Staff from './Staff';
import Attendance from './Attendance';
import Exam from './Exam';
import Mark from './Mark';

// Associations
Class.hasMany(Student, { foreignKey: 'classId', as: 'students' });
Student.belongsTo(Class, { foreignKey: 'classId', as: 'class' });

Class.hasOne(Fee, { foreignKey: 'classId', as: 'feeStructure' });
Fee.belongsTo(Class, { foreignKey: 'classId' });

Student.hasMany(Payment, { foreignKey: 'studentId', as: 'payments' });
Payment.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

Student.hasMany(Attendance, { foreignKey: 'studentId', as: 'attendance' });
Attendance.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

Student.hasMany(Mark, { foreignKey: 'studentId', as: 'marks' });
Mark.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

Exam.hasMany(Mark, { foreignKey: 'examId', as: 'marks' });
Mark.belongsTo(Exam, { foreignKey: 'examId', as: 'exam' });

export {
  User,
  Student,
  Class,
  Fee,
  Payment,
  Staff,
  Attendance,
  Exam,
  Mark
};