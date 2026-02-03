import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface FeeAttributes {
  id: number;
  classId: number;
  amount: number;
}

export interface FeeCreationAttributes extends Optional<FeeAttributes, 'id'> {}

export class Fee extends Model<FeeAttributes, FeeCreationAttributes> implements FeeAttributes {
  public id!: number;
  public classId!: number;
  public amount!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Fix: Cast Fee to any to bypass static method check on subclass in this environment
(Fee as any).init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  classId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'classes',
      key: 'id',
    },
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    get() {
      const value = this.getDataValue('amount');
      return value === null ? 0 : parseFloat(String(value));
    },
  },
}, {
  sequelize,
  modelName: 'Fee',
  tableName: 'fees',
});

export default Fee;