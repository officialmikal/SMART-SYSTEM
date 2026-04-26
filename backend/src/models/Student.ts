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
  totalFee: number;
  feeBalance: number;
  paidFee: number;
  transportFee: number;
  isUsingTransport: boolean;
  paidTransportFee: number;
  prepaidFee: number;
  photo: string | null;
  institutionId: string;
}

export interface StudentCreationAttributes extends Optional<StudentAttributes, 'id' | 'stream' | 'agreedFee' | 'photo' | 'paidFee' | 'transportFee' | 'isUsingTransport' | 'paidTransportFee' | 'prepaidFee' | 'totalFee' | 'feeBalance'> {}

export class Student extends Model<StudentAttributes, StudentCreationAttributes> implements StudentAttributes {
  declare id: string;
  declare admissionNumber: string;
  declare firstName: string;
  declare lastName: string;
  declare classId: number;
  declare stream: string | null;
  declare gender: 'Male' | 'Female';
  declare dob: Date;
  declare guardianPhone: string;
  declare guardianName: string;
  declare agreedFee: number | null;
  declare totalFee: number;
  declare feeBalance: number;
  declare paidFee: number;
  declare transportFee: number;
  declare isUsingTransport: boolean;
  declare paidTransportFee: number;
  declare prepaidFee: number;
  declare photo: string | null;
  declare institutionId: string;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

// Fix: Cast Student to any to bypass static method check on subclass in this environment
(Student as any).init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  institutionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'institutions',
      key: 'id',
    },
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
    get(this: any) {
      const value = this.getDataValue('agreedFee');
      return value === null ? null : parseFloat(String(value));
    },
  },
  totalFee: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    get(this: any) {
      const value = this.getDataValue('totalFee');
      return value === null ? 0 : parseFloat(String(value));
    },
  },
  feeBalance: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    get(this: any) {
      const value = this.getDataValue('feeBalance');
      return value === null ? 0 : parseFloat(String(value));
    },
  },
  paidFee: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    get(this: any) {
      const value = this.getDataValue('paidFee');
      return value === null ? 0 : parseFloat(String(value));
    },
  },
  transportFee: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    get(this: any) {
      const value = this.getDataValue('transportFee');
      return value === null ? 0 : parseFloat(String(value));
    },
  },
  isUsingTransport: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  paidTransportFee: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    get(this: any) {
      const value = this.getDataValue('paidTransportFee');
      return value === null ? 0 : parseFloat(String(value));
    },
  },
  prepaidFee: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    get(this: any) {
      const value = this.getDataValue('prepaidFee');
      return value === null ? 0 : parseFloat(String(value));
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