import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

interface MarkAttributes {
  id: number;
  studentId: string;
  examId: string;
  subject: string;
  score: number;
  cbcGrade: 'EE' | 'ME' | 'AE' | 'BE';
  remarks: string | null;
}

interface MarkCreationAttributes extends Optional<MarkAttributes, 'id' | 'remarks'> {}

export class Mark extends Model<MarkAttributes, MarkCreationAttributes> implements MarkAttributes {
  declare id: number;
  declare studentId: string;
  declare examId: string;
  declare subject: string;
  declare score: number;
  declare cbcGrade: 'EE' | 'ME' | 'AE' | 'BE';
  declare remarks: string | null;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

// Fix: Cast Mark to any to bypass static method check on subclass in this environment
(Mark as any).init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
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
  examId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'exams',
      key: 'id',
    },
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 0, max: 100 },
  },
  cbcGrade: {
    type: DataTypes.ENUM('EE', 'ME', 'AE', 'BE'),
    allowNull: false,
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'Mark',
  tableName: 'marks',
  indexes: [
    {
      unique: true,
      fields: ['student_id', 'exam_id', 'subject'],
    },
  ],
});

export default Mark;