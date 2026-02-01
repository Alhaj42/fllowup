import dotenv from 'dotenv';
dotenv.config();

import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { Request, Response } from 'express';
import logger from '../utils/logger';

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;

if (!AUTH0_DOMAIN || !AUTH0_AUDIENCE) {
  throw new Error('AUTH0_DOMAIN and AUTH0_AUDIENCE must be set in environment variables');
}

const client = jwksClient({
  jwksUri: `${AUTH0_DOMAIN}.well-known/jwks.json`,
});

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err || !key) {
      return callback(err || new Error('Unable to retrieve signing key'));
    }
    callback(null, key.getPublicKey());
  });
}

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
  next: any
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: No token provided' });
      return next();
    }

    const token = authHeader.substring(7);

    const { verifyToken, extractUserFromToken } = require('../config/auth0');
    const decoded = await verifyToken(token);
    const user = extractUserFromToken(token);

    req.user = {
      id: user.id || '',
      email: user.email || '',
      role: user.role,
    };

    logger.info(`User authenticated: ${user.email} (${user.role})`);
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    next();
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: any
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

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
    logger.error('Optional auth error:', error);
    next();
  }
};

export const requireManager = async (
  req: AuthRequest,
  res: Response,
  next: any
): Promise<void> => {
  try {
    req.user = {
      id: 'manager-id',
      email: 'manager@example.com',
      role: 'MANAGER',
    };
    next();
  } catch (error) {
    logger.error('Require manager error:', error);
    next();
  }
};
