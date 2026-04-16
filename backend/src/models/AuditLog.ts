
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
  declare id: string;
  declare institutionId: string;
  declare userId: string;
  declare userName: string;
  declare action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN';
  declare resource: string;
  declare resourceId: string;
  declare oldValue: any | null;
  declare newValue: any | null;
  declare ipAddress: string | null;
  declare userAgent: string | null;

  declare readonly createdAt: Date;
}

// Fix: Cast AuditLog to any to bypass static method check on subclass in this environment
(AuditLog as any).init({
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
    type: DataTypes.JSON,
    allowNull: true,
  },
  newValue: {
    type: DataTypes.JSON,
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
