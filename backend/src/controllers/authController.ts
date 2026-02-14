
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
    const user = await User.findOne({ 
      where: { email },
      include: [{ model: Institution, as: 'institution' }]
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = generateToken(user.id, user.institutionId);

      // SECURITY: Log the successful login attempt and device metadata
      await AuditLog.create({
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
  } catch (error) {
    res.status(500).json({ message: 'Security Engine Error during login', error });
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
