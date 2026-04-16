
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, Institution, AuditLog } from '../models';
import { config } from '../config/env';

const generateToken = (id: string, institutionId: string): string => {
  return jwt.sign({ id, institutionId }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

/**
 * Handle user login and JWT generation with Institutional Scoping.
 */
export const login = async (req: any, res: any): Promise<void> => {
  const { email, password } = req.body;

  try {
    // Fix: Cast User to any for static findOne method
    const user = await (User as any).findOne({ 
      where: { email },
      include: [{ model: Institution, as: 'institution' }]
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = generateToken(user.id, user.institutionId);

      // SECURITY: Log the successful login attempt and device metadata
      // Fix: Cast AuditLog to any for static create method
      await (AuditLog as any).create({
        institutionId: user.institutionId,
        userId: user.id,
        userName: user.name,
        action: 'LOGIN',
        resource: 'Session',
        resourceId: 'current',
        oldValue: null,
        newValue: { device: req.headers['user-agent'] },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        institution: (user as any).institution,
        token: token,
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials. Please verify your school email and password.' });
    }
  } catch (error: any) {
    console.error('Login Error:', error);
    const isDbError = error.name === 'SequelizeConnectionError' || error.name === 'SequelizeConnectionRefusedError' || error.message?.includes('terminated unexpectedly');
    res.status(500).json({ 
      message: isDbError ? 'Database Connection Error. Please check if the database is online and accessible.' : 'Security Engine Error during login', 
      error: config.NODE_ENV === 'development' ? error : undefined 
    });
  }
};

/**
 * Change authenticated user's password.
 */
export const changePassword = async (req: any, res: any): Promise<void> => {
  const { currentPassword, newPassword } = req.body;

  try {
    // Fix: Cast User to any for static findByPk method
    const user = await (User as any).findByPk(req.user.id);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'The current password you entered is incorrect.' });
      return;
    }

    // Hash and Save new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Log the security event
    // Fix: Cast AuditLog to any for static create method
    await (AuditLog as any).create({
      institutionId: user.institutionId,
      userId: user.id,
      userName: user.name,
      action: 'UPDATE',
      resource: 'Credentials',
      resourceId: user.id,
      oldValue: { status: 'password_changed_requested' },
      newValue: { status: 'password_changed_success' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ message: 'Password updated successfully across all devices.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update credentials.', error });
  }
};

/**
 * Get profile data restricted to the user's institution.
 */
export const getMe = async (req: any, res: any): Promise<void> => {
  if (req.user) {
    const { id, name, email, role, institutionId } = req.user;
    res.json({ id, name, email, role, institutionId });
  } else {
    res.status(404).json({ message: 'Identity not found.' });
  }
};
