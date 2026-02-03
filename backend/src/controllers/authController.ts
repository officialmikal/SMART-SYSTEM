import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { config } from '../config/env';

const generateToken = (id: string): string => {
  return jwt.sign({ id }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

// Handle user login and JWT generation
export const login = async (req: any, res: any): Promise<void> => {
  const { email, password } = req.body;

  try {
    // Fix: Cast User to any to bypass missing static method findOne error
    const user = await (User as any).findOne({ where: { email } });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error during login', error });
  }
};

// Get currently logged in user profile using the attached user object
export const getMe = async (req: any, res: any): Promise<void> => {
  if (req.user) {
    const { id, name, email, role } = req.user;
    res.json({ id, name, email, role });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};