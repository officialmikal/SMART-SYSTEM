import { Sequelize } from 'sequelize';
import { config } from './env';

let sequelize: Sequelize;

if (process.env.DATABASE_URL) {
  // Production: PostgreSQL (Render DATABASE_URL)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false,
    define: {
      timestamps: true,
      underscored: true
    }
  });
} else if (config.DB.HOST) {
  // PostgreSQL (Manual Fields)
  sequelize = new Sequelize(config.DB.NAME, config.DB.USER, config.DB.PASSWORD, {
    host: config.DB.HOST,
    port: config.DB.PORT,
    dialect: 'postgres',
    dialectOptions: config.DB.HOST === 'localhost' || config.DB.HOST === '127.0.0.1' ? {} : {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false,
    define: {
      timestamps: true,
      underscored: true
    }
  });
} else {
  // Fail fast: No SQLite fallback allowed in production/stabilized environments
  throw new Error('DATABASE_URL or DB_HOST must be provided. PostgreSQL is the only supported database.');
}

export default sequelize;