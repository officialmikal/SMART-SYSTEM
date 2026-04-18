
import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface UserAttributes {
  id: string;
  institutionId: string;
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'PRINCIPAL' | 'TEACHER' | 'FINANCE' | 'CLASS_TEACHER' | 'SUBJECT_TEACHER';
  active: boolean;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'active'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare institutionId: string;
  declare name: string;
  declare email: string;
  declare password: string;
  declare role: 'ADMIN' | 'PRINCIPAL' | 'TEACHER' | 'FINANCE' | 'CLASS_TEACHER' | 'SUBJECT_TEACHER';
  declare active: boolean;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

// Fix: Cast User to any to bypass static method check on subclass in this environment
(User as any).init({
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
      key: 'id'
    }
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
    type: DataTypes.ENUM('ADMIN', 'PRINCIPAL', 'TEACHER', 'FINANCE', 'CLASS_TEACHER', 'SUBJECT_TEACHER'),
    allowNull: false,
    defaultValue: 'SUBJECT_TEACHER',
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
});

export default User;
