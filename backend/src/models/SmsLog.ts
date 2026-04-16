
import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface SmsLogAttributes {
  id: string;
  institutionId: string;
  type: string;
  recipientsCount: number;
  message: string;
  status: 'Sent' | 'Delivered' | 'Failed' | 'Queued';
  cost: number;
  providerResponse: string | null;
  sentBy: string;
}

export interface SmsLogCreationAttributes extends Optional<SmsLogAttributes, 'id' | 'providerResponse'> {}

export class SmsLog extends Model<SmsLogAttributes, SmsLogCreationAttributes> implements SmsLogAttributes {
  declare id: string;
  declare institutionId: string;
  declare type: string;
  declare recipientsCount: number;
  declare message: string;
  declare status: 'Sent' | 'Delivered' | 'Failed' | 'Queued';
  declare cost: number;
  declare providerResponse: string | null;
  declare sentBy: string;

  declare readonly createdAt: Date;
}

// Fix: Cast SmsLog to any to bypass static method check on subclass in this environment
(SmsLog as any).init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  institutionId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  recipientsCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Sent', 'Delivered', 'Failed', 'Queued'),
    defaultValue: 'Sent',
  },
  cost: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  providerResponse: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  sentBy: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'SmsLog',
  tableName: 'sms_logs',
});

export default SmsLog;
