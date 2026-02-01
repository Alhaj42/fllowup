import { AuditAction, AuditLog as AuditLogModel } from '@prisma/client';
interface AuditLogData {
    entityType: string;
    entityId: string;
    action: AuditAction;
    changedBy: string;
    changes?: unknown;
}
export declare const AuditLogService: {
    createAuditLog(data: AuditLogData): Promise<AuditLogModel>;
    logCreate(entityType: string, entityId: string, userId: string, _role: string, data: unknown): Promise<any>;
    logUpdate(entityType: string, entityId: string, userId: string, _role: string, before: unknown, after: unknown): Promise<any>;
    logDelete(entityType: string, entityId: string, userId: string, _role: string, data: unknown): Promise<any>;
    logStatusChange(entityType: string, entityId: string, userId: string, _role: string, oldStatus: string, newStatus: string): Promise<any>;
    getAuditLogsByEntity(entityType: string, entityId: string): Promise<AuditLogModel[]>;
    getAuditLogsByUser(userId: string, limit?: number): Promise<AuditLogModel[]>;
    getRecentAuditLogs(limit?: number): Promise<AuditLogModel[]>;
};
export default AuditLogService;
//# sourceMappingURL=auditLogService.d.ts.map