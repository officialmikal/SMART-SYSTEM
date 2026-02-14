
import app from './app';
import bcrypt from 'bcryptjs';
import process from 'process';
import { config } from './config/env';
import sequelize from './config/database';
import { User, Institution } from './models';

/**
 * Start Server with Multi-Tenant Seed logic.
 */
const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL: Connected successfully.');

    await sequelize.sync({ force: false });
    console.log('PostgreSQL: Models Scoped and Synced.');

    // Seed: Ensure at least one institution exists
    let defaultInst = await Institution.findOne({ where: { subdomain: 'demo' } });
    if (!defaultInst) {
      defaultInst = await Institution.create({
        name: 'ElimuSmart Demo Academy',
        motto: 'Excellence Through Innovation',
        registrationNumber: 'MOE/DEMO/001',
        subdomain: 'demo'
      });
      console.log('Seed: Demo Institution created.');
    }

    // Seed: Ensure initial admin account exists for this institution
    const adminExists = await User.findOne({ where: { role: 'ADMIN', institutionId: defaultInst.id } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('adminpassword', 10);
      await User.create({
        name: 'Master Admin',
        email: 'admin@school.ac.ke',
        password: hashedPassword,
        role: 'ADMIN',
        institutionId: defaultInst.id
      });
      console.log('Seed: Master Admin assigned to Demo Institution.');
    }

    app.listen(config.PORT, () => {
      console.log(`ElimuSmart: Multi-Tenant Core Running on port ${config.PORT}`);
    });
  } catch (error) {
    console.error('CRITICAL: Database initialization failed:', error);
    process.exit(1);
  }
};

start();
