import { AuditAction, AuditLog as AuditLogModel, AuditEntityType } from '@prisma/client';
import { prisma } from './prismaClient';

interface AuditLogData {
  entityType: string;
  entityId: string;
  action: AuditAction;
  changedBy: string;
  changes?: unknown;
}

interface AuditLogWithChanges {
  entityType: string;
  entityId: string;
  action: AuditAction;
  changedBy: string;
  changes?: unknown;
  before?: unknown;
  after?: unknown;
}

export const AuditLogService = {
  async createAuditLog(data: AuditLogData): Promise<AuditLogModel> {
    return prisma.auditLog.create({
      data: {
        entityType: data.entityType as AuditEntityType,
        entityId: data.entityId,
        action: data.action,
        changedBy: data.changedBy,
        changes: data.changes ? data.changes : undefined,
      },
    });
  },

  async logCreate(
    entityType: string,
    entityId: string,
    userId: string,
    _role: string,
    data: unknown
  ) {
    const changes = JSON.stringify({ after: data });
    return this.createAuditLog({
      entityType: entityType as AuditEntityType,
      entityId,
      action: AuditAction.CREATE,
      changedBy: userId,
      changes,
    });
  },

  async logUpdate(
    entityType: string,
    entityId: string,
    userId: string,
    _role: string,
    before: unknown,
    after: unknown
  ) {
    const changes = JSON.stringify({ before, after });
    return this.createAuditLog({
      entityType: entityType as AuditEntityType,
      entityId,
      action: AuditAction.UPDATE,
      changedBy: userId,
      changes,
    });
  },

  async logDelete(
    entityType: string,
    entityId: string,
    userId: string,
    _role: string,
    data: unknown
  ) {
    const changes = JSON.stringify({ before: data });
    return this.createAuditLog({
      entityType: entityType as AuditEntityType,
      entityId,
      action: AuditAction.DELETE,
      changedBy: userId,
      changes,
    });
  },

  async logStatusChange(
    entityType: string,
    entityId: string,
    userId: string,
    _role: string,
    oldStatus: string,
    newStatus: string
  ) {
    const changes = JSON.stringify({ oldStatus, newStatus });
    return this.createAuditLog({
      entityType: entityType as AuditEntityType,
      entityId,
      action: AuditAction.UPDATE,
      changedBy: userId,
      changes,
    });
  },

  async getAuditLogsByEntity(entityType: string, entityId: string): Promise<AuditLogModel[]> {
    return prisma.auditLog.findMany({
      where: {
        entityType: entityType as AuditEntityType,
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
  },

  async getAuditLogsByUser(userId: string, limit = 100): Promise<AuditLogModel[]> {
    return prisma.auditLog.findMany({
      where: {
        changedBy: userId,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });
  },

  async getRecentAuditLogs(limit = 50): Promise<AuditLogModel[]> {
    return prisma.auditLog.findMany({
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
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
  },
};

export default AuditLogService;
