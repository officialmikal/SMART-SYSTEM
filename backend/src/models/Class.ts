import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface ClassAttributes {
  id: number;
  name: string;
}

export interface ClassCreationAttributes extends Optional<ClassAttributes, 'id'> {}

export class Class extends Model<ClassAttributes, ClassCreationAttributes> implements ClassAttributes {
  public id!: number;
  public name!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Fix: Cast Class to any to bypass static method check on subclass in this environment
(Class as any).init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
}, {
  sequelize,
  modelName: 'Class',
  tableName: 'classes',
});

export default Class;