import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface StudentAttributes {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  classId: number;
  stream: string | null;
  gender: 'Male' | 'Female';
  dob: Date;
  guardianPhone: string;
  guardianName: string;
  agreedFee: number | null;
  photo: string | null;
}

export interface StudentCreationAttributes extends Optional<StudentAttributes, 'id' | 'stream' | 'agreedFee' | 'photo'> {}

export class Student extends Model<StudentAttributes, StudentCreationAttributes> implements StudentAttributes {
  public id!: string;
  public admissionNumber!: string;
  public firstName!: string;
  public lastName!: string;
  public classId!: number;
  public stream!: string | null;
  public gender!: 'Male' | 'Female';
  public dob!: Date;
  public guardianPhone!: string;
  public guardianName!: string;
  public agreedFee!: number | null;
  public photo!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Student.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  admissionNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  classId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'classes',
      key: 'id',
    },
  },
  stream: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  gender: {
    type: DataTypes.ENUM('Male', 'Female'),
    allowNull: false,
  },
  dob: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  guardianPhone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  guardianName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  agreedFee: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    get() {
      const value = this.getDataValue('agreedFee');
      return value === null ? null : parseFloat(String(value));
    },
  },
  photo: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'Student',
  tableName: 'students',
});

export default Student;