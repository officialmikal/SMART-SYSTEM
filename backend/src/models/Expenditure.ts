import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ExpenditureAttributes {
  id: string;
  amount: number;
  category: 'Salaries' | 'Food/Supplies' | 'Utilities' | 'Maintenance' | 'Exams' | 'Other';
  date: string;
  description: string;
  approvedBy?: string;
  institutionId?: string;
}

interface ExpenditureCreationAttributes extends Optional<ExpenditureAttributes, 'id' | 'approvedBy' | 'institutionId'> {}

export class Expenditure extends Model<ExpenditureAttributes, ExpenditureCreationAttributes> implements ExpenditureAttributes {
  declare id: string;
  declare amount: number;
  declare category: 'Salaries' | 'Food/Supplies' | 'Utilities' | 'Maintenance' | 'Exams' | 'Other';
  declare date: string;
  declare description: string;
  declare approvedBy?: string;
  declare institutionId?: string;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

(Expenditure as any).init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM('Salaries', 'Food/Supplies', 'Utilities', 'Maintenance', 'Exams', 'Other'),
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  approvedBy: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  institutionId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'Expenditure',
  tableName: 'expenditures',
});

export default Expenditure;
