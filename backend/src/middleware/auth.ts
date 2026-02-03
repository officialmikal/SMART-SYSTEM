import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { User } from '../models/User';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

interface JwtPayload {
  id: string;
}

// Protect middleware to verify JWT token and attach user to request
// Fix: Using any for req and res to resolve reported errors for headers, status, and user properties
export const protect = async (req: any, res: any, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    // Fix: Explicitly use res as any if status property is not detected
    res.status(401).json({ message: 'Not authorized, no token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
    // Fix: Cast User to any to bypass missing static method findByPk error
    const user = await (User as any).findByPk(decoded.id);

    if (!user) {
      // Fix: Explicitly use res as any if status property is not detected
      res.status(401).json({ message: 'User no longer exists' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    // Fix: Explicitly use res as any if status property is not detected
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Authorize middleware to check user roles against the authenticated user
export const authorize = (...roles: string[]) => {
  // Fix: Using any for req and res to resolve reported errors for user and status properties
  return (req: any, res: any, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      // Fix: Explicitly use res as any if status property is not detected
      res.status(403).json({ message: `Role ${req.user?.role} is not authorized to access this route` });
      return;
    }
    next();
  };
};