import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface UserAttributes {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'PRINCIPAL' | 'CLASS_TEACHER' | 'SUBJECT_TEACHER';
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public name!: string;
  public email!: string;
  public password!: string;
  public role!: 'ADMIN' | 'PRINCIPAL' | 'CLASS_TEACHER' | 'SUBJECT_TEACHER';

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Fix: Cast User to any to bypass static method check on subclass in this environment
(User as any).init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('ADMIN', 'PRINCIPAL', 'CLASS_TEACHER', 'SUBJECT_TEACHER'),
    allowNull: false,
    defaultValue: 'SUBJECT_TEACHER',
  },
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
});

export default User;