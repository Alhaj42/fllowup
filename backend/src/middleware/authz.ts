import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export type UserRole = 'MANAGER' | 'TEAM_LEADER' | 'TEAM_MEMBER';

const roleHierarchy: Record<UserRole, number> = {
  MANAGER: 3,
  TEAM_LEADER: 2,
  TEAM_MEMBER: 1,
};

export const authorize = (allowedRoles: UserRole[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized: No user context' });
        return;
      }

      const userRole = req.user.role;

      if (!allowedRoles.includes(userRole)) {
        res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

export const authorizeRole = (minimumRole: UserRole) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized: No user context' });
        return;
      }

      const userRole = req.user.role;
      const userLevel = roleHierarchy[userRole] ?? 0;
      const requiredLevel = roleHierarchy[minimumRole] ?? 0;

      if (userLevel < requiredLevel) {
        res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

export const requireManager = authorizeRole('MANAGER');
export const requireTeamLeader = authorizeRole('TEAM_LEADER');
