import { AuditAction, Role, AuditLog as AuditLogModel } from '@prisma/client';
import { prisma } from './prismaClient';

interface AuditLogData {
  entityType: string;
  entityId: string;
  action: AuditAction;
  userId: string;
  role: Role;
  details?: string;
}

interface AuditLogWithChanges {
  entityType: string;
  entityId: string;
  action: AuditAction;
  userId: string;
  role: Role;
  details?: string;
  before?: unknown;
  after?: unknown;
}

export const AuditLogService = {
  async createAuditLog(data: AuditLogData): Promise<AuditLogModel> {
    return prisma.auditLog.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        userId: data.userId,
        role: data.role,
        details: data.details,
      },
    });
  },

  async logCreate(
    entityType: string,
    entityId: string,
    userId: string,
    role: Role,
    data: unknown
  ) {
    const details = JSON.stringify({ after: data });
    return this.createAuditLog({
      entityType,
      entityId,
      action: AuditAction.CREATE,
      userId,
      role,
      details,
    });
  },

  async logUpdate(
    entityType: string,
    entityId: string,
    userId: string,
    role: Role,
    before: unknown,
    after: unknown
  ) {
    const details = JSON.stringify({ before, after });
    return this.createAuditLog({
      entityType,
      entityId,
      action: AuditAction.UPDATE,
      userId,
      role,
      details,
    });
  },

  async logDelete(
    entityType: string,
    entityId: string,
    userId: string,
    role: Role,
    data: unknown
  ) {
    const details = JSON.stringify({ before: data });
    return this.createAuditLog({
      entityType,
      entityId,
      action: AuditAction.DELETE,
      userId,
      role,
      details,
    });
  },

  async logStatusChange(
    entityType: string,
    entityId: string,
    userId: string,
    role: Role,
    oldStatus: string,
    newStatus: string
  ) {
    const details = JSON.stringify({ oldStatus, newStatus });
    return this.createAuditLog({
      entityType,
      entityId,
      action: AuditAction.STATUS_CHANGE,
      userId,
      role,
      details,
    });
  },

  async getAuditLogsByEntity(
    entityType: string,
    entityId: string,
  ): Promise<AuditLogModel[]> {
    return prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: {
        timestamp: 'desc',
      },
      include: {
        user: {
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
        userId,
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
        user: {
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
