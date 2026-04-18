
import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface InstitutionAttributes {
  id: string;
  name: string;
  motto: string | null;
  registrationNumber: string | null;
  logo: string | null;
  subdomain: string | null; // e.g., 'kilimani' for kilimani.elimusmart.com
  atUsername: string | null;
  atApiKey: string | null;
  senderId: string | null;
  active: boolean;
}

export interface InstitutionCreationAttributes extends Optional<InstitutionAttributes, 'id' | 'logo' | 'subdomain' | 'atUsername' | 'atApiKey' | 'senderId' | 'active'> {}

export class Institution extends Model<InstitutionAttributes, InstitutionCreationAttributes> implements InstitutionAttributes {
  declare id: string;
  declare name: string;
  declare motto: string | null;
  declare registrationNumber: string | null;
  declare logo: string | null;
  declare subdomain: string | null;
  declare atUsername: string | null;
  declare atApiKey: string | null;
  declare senderId: string | null;
  declare active: boolean;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

// Fix: Cast Institution to any to bypass static method check on subclass in this environment
(Institution as any).init({
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
  atUsername: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  atApiKey: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  senderId: {
    type: DataTypes.STRING,
    allowNull: true,
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
