// @ts-nocheck
import { PrismaClient, AuditLog, AuditAction, AuditAction as AuditActionType } from '@prisma/client';
import logger from '../utils/logger';
import { prisma } from './prismaClient';

export interface ModificationRecord {
  id: string;
  projectId: string;
  modificationNumber: number;
  description: string;
  createdAt: Date;
  createdBy: string | null;
}

export interface ModificationStats {
  projectId: string;
  totalAllowed: number;
  totalUsed: number;
  remaining: number;
  daysPerTime: number;
  daysUsed: number;
  canModify: boolean;
  modifications: ModificationRecord[];
}

export interface CreateModificationParams {
  projectId: string;
  userId: string;
  modificationNumber: number;
  description: string;
  daysUsed?: number;
}

class ModificationTrackingService {
  async createModification(params: CreateModificationParams): Promise<ModificationRecord> {
    try {
      const auditLog = await prisma.auditLog.create({
        data: {
          entityType: 'Project',
          entityId: params.projectId,
          action: 'UPDATE',
          userId: params.userId,
          role: 'MANAGER', // Defaulting to manager for system actions
          details: JSON.stringify({
            modificationNumber: params.modificationNumber,
            description: params.description,
            daysUsed: params.daysUsed,
          }),
          timestamp: new Date(),
        },
      });

      logger.info(`Created modification record ${auditLog.id} for project ${params.projectId}`);

      return {
        id: auditLog.id,
        projectId: auditLog.entityId,
        modificationNumber: params.modificationNumber,
        description: params.description,
        createdAt: auditLog.timestamp,
        createdBy: auditLog.userId,
      };
    } catch (error) {
      logger.error('Failed to create modification record:', error);
      throw new Error('Failed to create modification record');
    }
  }

  async getModifications(projectId: string): Promise<ModificationRecord[]> {
    try {
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          entityType: 'Project',
          entityId: projectId,
          action: 'UPDATE',
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      return auditLogs.map((log, index) => {
        let details: any = {};
        try {
          details = JSON.parse(log.details || '{}');
        } catch (e) {
          details = {};
        }

        return {
          id: log.id,
          projectId: log.entityId,
          modificationNumber: details.modificationNumber || index + 1,
          description: details.description || 'Modification',
          createdAt: log.timestamp,
          createdBy: log.userId,
        };
      });
    } catch (error) {
      logger.error(`Failed to get modifications for project ${projectId}:`, error);
      throw new Error('Failed to get modifications');
    }
  }

  async getModificationStats(projectId: string): Promise<ModificationStats> {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          modificationAllowedTimes: true,
          modificationDaysPerTime: true,
        },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      const modifications = await this.getModifications(projectId);

      const totalAllowed = project.modificationAllowedTimes ?? 3;
      const totalUsed = modifications.length;
      const remaining = Math.max(0, totalAllowed - totalUsed);
      const daysPerTime = project.modificationDaysPerTime ?? 5;

      const daysUsed = modifications.reduce((sum, mod) => {
        return sum + ((mod as any).daysUsed ?? 0);
      }, 0);

      return {
        projectId: project.id,
        totalAllowed,
        totalUsed,
        remaining,
        daysPerTime,
        daysUsed,
        canModify: remaining > 0,
        modifications,
      };
    } catch (error) {
      logger.error(`Failed to get modification stats for project ${projectId}:`, error);
      throw new Error('Failed to get modification stats');
    }
  }

  async checkModificationLimit(projectId: string): Promise<{ canModify: boolean; remaining: number }> {
    try {
      const stats = await this.getModificationStats(projectId);

      return {
        canModify: stats.canModify,
        remaining: stats.remaining,
      };
    } catch (error) {
      logger.error(`Failed to check modification limit for project ${projectId}:`, error);
      throw new Error('Failed to check modification limit');
    }
  }

  async recordModification(
    projectId: string,
    userId: string,
    description: string,
    daysUsed?: number
  ): Promise<ModificationRecord> {
    const stats = await this.getModificationStats(projectId);

    if (!stats.canModify) {
      throw new Error(
        `Modification limit reached. You have used ${stats.totalUsed} of ${stats.totalAllowed} allowed modifications.`
      );
    }

    return this.createModification({
      projectId,
      userId,
      modificationNumber: stats.totalUsed + 1,
      description,
      daysUsed,
    });
  }
}

export default new ModificationTrackingService();
