import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
export declare const auditMiddleware: (entityType: string) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auditMiddleware.d.ts.map