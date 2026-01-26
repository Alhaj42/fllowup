import dotenv from 'dotenv';
dotenv.config();

import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'MANAGER' | 'TEAM_LEADER' | 'TEAM_MEMBER';
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const isDevOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (!isDevOrTest) {
      res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    return next();
  }

  const token = authHeader.substring(7);

  try {
    if (isDevOrTest) {
      req.user = {
        id: 'dev-user-id',
        email: 'dev@example.com',
        role: 'MANAGER' as 'MANAGER' | 'TEAM_LEADER' | 'TEAM_MEMBER',
      };
      return next();
    }

    const { verifyToken, extractUserFromToken } = require('../config/auth0');
    const decoded = await verifyToken(token);
    const user = extractUserFromToken(token);

    req.user = {
      id: user.id || '',
      email: user.email || '',
      role: user.role as 'MANAGER' | 'TEAM_LEADER' | 'TEAM_MEMBER',
    };

    next();
  } catch (error) {
    if (!isDevOrTest) {
      res.status(401).json({ error: 'Unauthorized: Invalid token' });
      return;
    }
    req.user = {
      id: 'dev-user-id',
      email: 'dev@example.com',
      role: 'MANAGER' as 'MANAGER' | 'TEAM_LEADER' | 'TEAM_MEMBER',
    };
    return next();
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const isDevOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    if (isDevOrTest) {
      req.user = {
        id: 'dev-user-id',
        email: 'dev@example.com',
        role: 'MANAGER' as 'MANAGER' | 'TEAM_LEADER' | 'TEAM_MEMBER',
      };
      return next();
    }

    const { verifyToken, extractUserFromToken } = require('../config/auth0');
    const decoded = await verifyToken(token);
    const user = extractUserFromToken(token);

    req.user = {
      id: user.id || '',
      email: user.email || '',
      role: user.role as 'MANAGER' | 'TEAM_LEADER' | 'TEAM_MEMBER',
    };

    next();
  } catch (error) {
    if (!isDevOrTest) {
      return next();
    }
    req.user = {
      id: 'dev-user-id',
      email: 'dev@example.com',
      role: 'MANAGER' as 'MANAGER' | 'TEAM_LEADER' | 'TEAM_MEMBER',
    };
    return next();
  }
};
