import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

interface StaffAttributes {
  id: string;
  staffId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  subjects: string[];
  photo: string | null;
}

interface StaffCreationAttributes extends Optional<StaffAttributes, 'id' | 'photo'> {}

export class Staff extends Model<StaffAttributes, StaffCreationAttributes> implements StaffAttributes {
  public id!: string;
  public staffId!: string;
  public name!: string;
  public email!: string;
  public phone!: string;
  public role!: string;
  public subjects!: string[];
  public photo!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Fix: Cast Staff to any to bypass static method check on subclass in this environment
(Staff as any).init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  staffId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  subjects: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  photo: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'Staff',
  tableName: 'staff_members',
});

export default Staff;