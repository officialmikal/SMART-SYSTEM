import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface PaymentAttributes {
  id: string;
  studentId: string;
  amount: number;
  date: Date;
  method: 'M-PESA' | 'BANK' | 'CASH';
  transactionId: string;
  description: string | null;
}

export interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id' | 'date' | 'description'> {}

export class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  declare id: string;
  declare studentId: string;
  declare amount: number;
  declare date: Date;
  declare method: 'M-PESA' | 'BANK' | 'CASH';
  declare transactionId: string;
  declare description: string | null;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

// Fix: Cast Payment to any to bypass static method check on subclass in this environment
(Payment as any).init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'students',
      key: 'id',
    },
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    get(this: any) {
      const value = this.getDataValue('amount');
      return value === null ? 0 : parseFloat(String(value));
    },
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  method: {
    type: DataTypes.ENUM('M-PESA', 'BANK', 'CASH'),
    allowNull: false,
  },
  transactionId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'Payment',
  tableName: 'payments',
});

export default Payment;