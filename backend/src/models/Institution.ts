
import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface InstitutionAttributes {
  id: string;
  name: string;
  motto: string | null;
  registrationNumber: string | null;
  logo: string | null;
  subdomain: string | null; // e.g., 'kilimani' for kilimani.elimusmart.com
  active: boolean;
}

export interface InstitutionCreationAttributes extends Optional<InstitutionAttributes, 'id' | 'logo' | 'subdomain'> {}

export class Institution extends Model<InstitutionAttributes, InstitutionCreationAttributes> implements InstitutionAttributes {
  public id!: string;
  public name!: string;
  public motto!: string | null;
  public registrationNumber!: string | null;
  public logo!: string | null;
  public subdomain!: string | null;
  public active!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Institution.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  motto: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  registrationNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  logo: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  subdomain: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  sequelize,
  modelName: 'Institution',
  tableName: 'institutions',
});

export default Institution;
