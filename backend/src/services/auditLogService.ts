import { PrismaClient, AuditEntityType, AuditAction } from '@prisma/client';
import config from '../config';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: config.database.url,
    },
  },
});

interface AuditLogInput {
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  changedBy: string;
  changes?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

export const AuditLogService = {
  async log(input: AuditLogInput) {
    try {
      await prisma.auditLog.create({
        data: {
          entityType: input.entityType,
          entityId: input.entityId,
          action: input.action,
          changedBy: input.changedBy,
          changes: input.changes as any,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      throw error;
    }
  },

  async logCreate(
    entityType: AuditEntityType,
    entityId: string,
    changedBy: string,
    data: unknown
  ) {
    return this.log({
      entityType,
      entityId,
      action: AuditAction.CREATE,
      changedBy,
      changes: { after: data },
    });
  },

  async logUpdate(
    entityType: AuditEntityType,
    entityId: string,
    changedBy: string,
    before: unknown,
    after: unknown
  ) {
    return this.log({
      entityType,
      entityId,
      action: AuditAction.UPDATE,
      changedBy,
      changes: { before, after },
    });
  },

  async logDelete(
    entityType: AuditEntityType,
    entityId: string,
    changedBy: string,
    data: unknown
  ) {
    return this.log({
      entityType,
      entityId,
      action: AuditAction.DELETE,
      changedBy,
      changes: { before: data },
    });
  },

  async getHistory(entityType: AuditEntityType, entityId: string) {
    try {
      return await prisma.auditLog.findMany({
        where: {
          entityType,
          entityId,
        },
        orderBy: {
          timestamp: 'desc',
        },
        include: {
          changedByUser: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Failed to retrieve audit history:', error);
      throw error;
    }
  },
};

export default AuditLogService;
