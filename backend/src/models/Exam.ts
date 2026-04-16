import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ExamAttributes {
  id: string;
  title: string;
  term: number;
  year: number;
  type: 'CAT' | 'End of Term' | 'Initial Assessment';
  date: string;
}

interface ExamCreationAttributes extends Optional<ExamAttributes, 'id'> {}

export class Exam extends Model<ExamAttributes, ExamCreationAttributes> implements ExamAttributes {
  declare id: string;
  declare title: string;
  declare term: number;
  declare year: number;
  declare type: 'CAT' | 'End of Term' | 'Initial Assessment';
  declare date: string;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

// Fix: Cast Exam to any to bypass static method check on subclass in this environment
(Exam as any).init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  term: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('CAT', 'End of Term', 'Initial Assessment'),
    allowNull: false,
    defaultValue: 'CAT',
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'Exam',
  tableName: 'exams',
});

export default Exam;