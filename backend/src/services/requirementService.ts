import { UserRole, ProjectRequirement, PrismaClient } from '@prisma/client';
import logger from '../utils/logger';
import AuditLogService from './auditLogService';
import { prisma } from './prismaClient';

export interface CreateRequirementInput {
  description: string;
  sortOrder?: number;
}

export interface UpdateRequirementInput {
  description?: string;
  sortOrder?: number;
}

class RequirementService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async createRequirement(
    input: CreateRequirementInput,
    projectId: string,
    userId: string,
    userRole: UserRole
  ): Promise<ProjectRequirement> {
    try {
      const requirement = await this.prisma.projectRequirement.create({
        data: {
          projectId,
          description: input.description,
          sortOrder: input.sortOrder ?? 0,
        },
      });

      await AuditLogService.logCreate(
        'ProjectRequirement',
        requirement.id,
        userId,
        userRole,
        requirement
      );

      logger.info('Requirement created successfully', { requirementId: requirement.id, projectId });

      return requirement;
    } catch (error) {
      logger.error('Failed to create requirement', { error, input, projectId });
      throw error;
    }
  }

  async updateRequirement(
    id: string,
    input: UpdateRequirementInput,
    userId: string,
    userRole: UserRole
  ): Promise<ProjectRequirement> {
    try {
      const existing = await this.prisma.projectRequirement.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error('Requirement not found');
      }

      const requirement = await this.prisma.projectRequirement.update({
        where: { id },
        data: {
          description: input.description,
          sortOrder: input.sortOrder,
        },
      });

      await AuditLogService.logUpdate(
        'ProjectRequirement',
        id,
        userId,
        userRole,
        existing,
        requirement
      );

      logger.info('Requirement updated successfully', { requirementId: id });

      return requirement;
    } catch (error) {
      logger.error('Failed to update requirement', { error, id, input });
      throw error;
    }
  }

  async completeRequirement(
    id: string,
    isCompleted: boolean,
    userId: string,
    userRole: UserRole
  ): Promise<ProjectRequirement> {
    try {
      const existing = await this.prisma.projectRequirement.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error('Requirement not found');
      }

      const completedAt = isCompleted ? new Date() : null;
      const completedBy = isCompleted ? userId : null;

      const requirement = await this.prisma.projectRequirement.update({
        where: { id },
        data: {
          isCompleted,
          completedAt,
          completedBy,
        },
      });

      await AuditLogService.logStatusChange(
        'ProjectRequirement',
        id,
        userId,
        userRole,
        existing.isCompleted ? 'COMPLETED' : 'PENDING',
        isCompleted ? 'COMPLETED' : 'PENDING'
      );

      logger.info('Requirement completion status updated', { requirementId: id, isCompleted });

      return requirement;
    } catch (error) {
      logger.error('Failed to complete requirement', { error, id, isCompleted });
      throw error;
    }
  }

  async deleteRequirement(
    id: string,
    userId: string,
    userRole: UserRole
  ): Promise<void> {
    try {
      const requirement = await this.prisma.projectRequirement.findUnique({
        where: { id },
      });

      if (!requirement) {
        throw new Error('Requirement not found');
      }

      await this.prisma.projectRequirement.delete({
        where: { id },
      });

      await AuditLogService.logDelete(
        'ProjectRequirement',
        id,
        userId,
        userRole,
        requirement
      );

      logger.info('Requirement deleted successfully', { requirementId: id });
    } catch (error) {
      logger.error('Failed to delete requirement', { error, id });
      throw error;
    }
  }

  async getRequirementsByProject(projectId: string): Promise<ProjectRequirement[]> {
    try {
      const requirements = await this.prisma.projectRequirement.findMany({
        where: { projectId },
        orderBy: { sortOrder: 'asc' },
      });

      return requirements;
    } catch (error) {
      logger.error('Failed to get requirements', { error, projectId });
      throw error;
    }
  }
}

export default new RequirementService();
