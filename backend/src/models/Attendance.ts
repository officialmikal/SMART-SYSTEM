import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

interface AttendanceAttributes {
  id: number;
  studentId: string;
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent' | 'Late';
  remarks: string | null;
}

interface AttendanceCreationAttributes extends Optional<AttendanceAttributes, 'id' | 'remarks'> {}

export class Attendance extends Model<AttendanceAttributes, AttendanceCreationAttributes> implements AttendanceAttributes {
  public id!: number;
  public studentId!: string;
  public date!: string;
  public status!: 'Present' | 'Absent' | 'Late';
  public remarks!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Fix: Cast Attendance to any to bypass static method check on subclass in this environment
(Attendance as any).init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'students',
      key: 'id',
    },
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Present', 'Absent', 'Late'),
    allowNull: false,
    defaultValue: 'Present',
  },
  remarks: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'Attendance',
  tableName: 'attendance_records',
  indexes: [
    {
      unique: true,
      fields: ['student_id', 'date'],
    },
  ],
});

export default Attendance;