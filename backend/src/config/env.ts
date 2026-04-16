
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix: Construct __dirname manually as it is not globally available in ES Modules (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config();

export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '10000', 10), // Render default is 10000
  JWT_SECRET: process.env.JWT_SECRET || 'elimusmart_secret_key_2024_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  FRONTEND_URL: process.env.FRONTEND_URL || '*',
  DB: {
    HOST: process.env.DB_HOST || 'localhost',
    USER: process.env.DB_USER || 'postgres',
    PASSWORD: process.env.DB_PASSWORD || 'postgres',
    NAME: process.env.DB_NAME || 'elimusmart_db',
    PORT: parseInt(process.env.DB_PORT || '5432', 10),
  },
  MPESA: {
    SHORTCODE: process.env.MPESA_SHORTCODE || '',
    CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY || '',
    CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET || '',
    PASSKEY: process.env.MPESA_PASSKEY || '',
    CALLBACK_URL: process.env.MPESA_CALLBACK_URL || '',
  },
  SMS: {
    AT_USERNAME: process.env.AT_USERNAME || '',
    AT_API_KEY: process.env.AT_API_KEY || '',
  }
};
