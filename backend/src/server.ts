import app from './app';
import bcrypt from 'bcryptjs';
import process from 'process';
import { config } from './config/env';
import sequelize from './config/database';
import { User } from './models';

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    await sequelize.sync({ force: false });
    console.log('Models synchronized.');

    // Fix: Cast User to any for static methods findOne and create
    const adminExists = await (User as any).findOne({ where: { role: 'ADMIN' } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('adminpassword', 10);
      await (User as any).create({
        name: 'System Admin',
        email: 'admin@school.ac.ke',
        password: hashedPassword,
        role: 'ADMIN',
      });
      console.log('Seed: Initial admin account created (admin@school.ac.ke / adminpassword)');
    }

    app.listen(config.PORT, () => {
      console.log(`ElimuSmart Server running in ${config.NODE_ENV} mode on port ${config.PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

start();