import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
interface VersionedRequest extends AuthRequest {
    body: {
        version?: number;
        [key: string]: unknown;
    };
}
export declare const checkVersionConflict: () => (req: VersionedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const incrementVersion: (data: Record<string, unknown>) => Record<string, unknown>;
export {};
//# sourceMappingURL=optimisticLock.d.ts.map