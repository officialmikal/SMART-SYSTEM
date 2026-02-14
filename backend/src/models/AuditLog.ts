
import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface AuditLogAttributes {
  id: string;
  institutionId: string; // Critical for multi-tenant isolation
  userId: string;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN';
  resource: string;
  resourceId: string;
  oldValue: any | null;
  newValue: any | null;
  ipAddress: string | null;
  userAgent: string | null; // Identifies the device/browser
}

export interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'id' | 'ipAddress' | 'userAgent'> {}

export class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
  public id!: string;
  public institutionId!: string;
  public userId!: string;
  public userName!: string;
  public action!: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN';
  public resource!: string;
  public resourceId!: string;
  public oldValue!: any | null;
  public newValue!: any | null;
  public ipAddress!: string | null;
  public userAgent!: string | null;

  public readonly createdAt!: Date;
}

AuditLog.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  institutionId: {
    type: DataTypes.UUID,
    allowNull: false,
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
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  userAgent: {
    type: DataTypes.TEXT,
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
