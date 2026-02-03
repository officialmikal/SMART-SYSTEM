import { Sequelize } from 'sequelize';
import { config } from './env';

// Render provides a DATABASE_URL environment variable in some tiers
const dbUrl = process.env.DATABASE_URL;

const sequelize = dbUrl 
  ? new Sequelize(dbUrl, {
      dialect: 'postgres',
      logging: config.NODE_ENV === 'development' ? console.log : false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false // Required for Render/Heroku Postgres
        }
      }
    })
  : new Sequelize(
      config.DB.NAME,
      config.DB.USER,
      config.DB.PASSWORD,
      {
        host: config.DB.HOST,
        port: config.DB.PORT,
        dialect: 'postgres',
        logging: config.NODE_ENV === 'development' ? console.log : false,
        dialectOptions: {
          ssl: config.NODE_ENV === 'production' ? {
            require: true,
            rejectUnauthorized: false
          } : false
        },
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        define: {
          timestamps: true,
          underscored: true
        }
      }
    );

export default sequelize;