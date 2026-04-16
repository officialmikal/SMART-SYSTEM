
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { User, Institution } from '../models';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      institutionId?: string; // Critical for cross-device institutional consistency
    }
  }
}

interface JwtPayload {
  id: string;
  institutionId: string;
}

/**
 * Protect middleware to verify JWT token and lock the request context to an institution.
 */
export const protect = async (req: any, res: any, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ message: 'Identity missing. Please log in.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
    
    // Multi-tenant check: Fetch user and their associated institution
    // Fix: Cast User to any for static findByPk method
    const user = await (User as any).findByPk(decoded.id, {
      include: [{ model: Institution, as: 'institution' }]
    });

    if (!user || !(user as any).institution?.active) {
      res.status(401).json({ message: 'Access revoked. Institution inactive or account deleted.' });
      return;
    }

    req.user = user;
    req.institutionId = user.institutionId; // Ensure all subsequent controller queries use this ID
    next();
  } catch (error) {
    res.status(401).json({ message: 'Session expired. Please re-authenticate.' });
  }
};

/**
 * Authorize middleware remains for role-based gating within the institution.
 */
export const authorize = (...roles: string[]) => {
  return (req: any, res: any, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: `Access Denied: Role ${req.user?.role || 'Guest'} insufficient for this operation.` });
      return;
    }
    next();
  };
};
