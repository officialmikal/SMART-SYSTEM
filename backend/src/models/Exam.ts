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
  public id!: string;
  public title!: string;
  public term!: number;
  public year!: number;
  public type!: 'CAT' | 'End of Term' | 'Initial Assessment';
  public date!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Exam.init({
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