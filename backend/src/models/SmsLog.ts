
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
  public id!: string;
  public institutionId!: string;
  public type!: string;
  public recipientsCount!: number;
  public message!: string;
  public status!: 'Sent' | 'Delivered' | 'Failed' | 'Queued';
  public cost!: number;
  public providerResponse!: string | null;
  public sentBy!: string;

  public readonly createdAt!: Date;
}

SmsLog.init({
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
