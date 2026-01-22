import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      res.status(500).json({ error: 'Internal server error: JWT secret not configured' });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as {
      id: string;
      email: string;
      role: 'MANAGER' | 'TEAM_LEADER' | 'TEAM_MEMBER';
    };

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Unauthorized: Invalid token' });
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Unauthorized: Token expired' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};
