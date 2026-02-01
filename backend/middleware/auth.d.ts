import { Request, Response } from 'express';
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: 'MANAGER' | 'TEAM_LEADER' | 'TEAM_MEMBER';
    };
}
export declare const authenticate: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const optionalAuth: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const requireManager: (req: AuthRequest, res: Response, next: any) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map