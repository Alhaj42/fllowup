import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'MANAGER' | 'TEAM_LEADER' | 'TEAM_MEMBER';
  };
}

// Simple middleware that accepts any request in development/test mode
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const isDevOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  const authHeader = req.headers.authorization;

  // In development/test mode, skip JWT verification and set mock user
  if (isDevOrTest) {
    req.user = {
      id: 'dev-user-id',
      email: 'dev@example.com',
      role: 'MANAGER' as 'MANAGER' | 'TEAM_LEADER' | 'TEAM_MEMBER',
    };
    return next();
  }

  // Production mode: require valid JWT token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }

  const token = authHeader.substring(7);

  try {
    // For development, create a fake JWT if needed
    const jwt = require('jsonwebtoken');
    let decoded: any;

    if (isDevOrTest) {
      decoded = {
        sub: 'dev-user-id',
        email: 'dev@example.com',
        'https://your-tenant.auth0.com/roles': ['MANAGER'],
        name: 'Dev User',
      };
    } else {
      const { verifyToken, extractUserFromToken } = require('../config/auth0');
      decoded = await verifyToken(token);
    }

    req.user = {
      id: decoded.sub || '',
      email: decoded.email || '',
      role: decoded['https://your-tenant.auth0.com/roles']?.[0] || 'TEAM_MEMBER',
    };

    next();
  } catch (error) {
    if (isDevOrTest) {
      req.user = {
        id: 'dev-user-id',
        email: 'dev@example.com',
        role: 'MANAGER' as 'MANAGER' | 'TEAM_LEADER' | 'TEAM_MEMBER',
      };
      return next();
    }
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const isDevOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

  if (!isDevOrTest) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    try {
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
      next();
    }
  } else {
    // Development mode: allow all requests
    return next();
  }
};
