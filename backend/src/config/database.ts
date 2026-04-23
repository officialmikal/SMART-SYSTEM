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
} else if (config.DB.HOST && config.DB.HOST !== 'localhost' && config.DB.HOST !== '127.0.0.1') {
  // Production/Cloud: PostgreSQL (Manual Fields)
  sequelize = new Sequelize(config.DB.NAME, config.DB.USER, config.DB.PASSWORD, {
    host: config.DB.HOST,
    port: config.DB.PORT,
    dialect: 'postgres',
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
} else {
  // Local/Development: SQLite
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: config.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true
    }
  });
}

export default sequelize;