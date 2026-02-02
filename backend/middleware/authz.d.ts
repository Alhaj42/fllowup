import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
export type UserRole = 'MANAGER' | 'TEAM_LEADER' | 'TEAM_MEMBER';
export declare const authorize: (allowedRoles: UserRole[]) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const authorizeRole: (minimumRole: UserRole) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireManager: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireTeamLeader: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=authz.d.ts.map