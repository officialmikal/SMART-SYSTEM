
import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface AuditLogAttributes {
  id: string;
  userId: string;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN';
  resource: string;
  resourceId: string;
  oldValue: any | null;
  newValue: any | null;
}

export interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'id'> {}

export class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
  public id!: string;
  public userId!: string;
  public userName!: string;
  public action!: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN';
  public resource!: string;
  public resourceId!: string;
  public oldValue!: any | null;
  public newValue!: any | null;

  public readonly createdAt!: Date;
}

AuditLog.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  action: {
    type: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN'),
    allowNull: false,
  },
  resource: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  resourceId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  oldValue: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  newValue: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'AuditLog',
  tableName: 'audit_logs',
  timestamps: true,
  updatedAt: false,
});

export default AuditLog;
