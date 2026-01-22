import { PrismaClient, AuditEntityType } from '@prisma/client';
import AuditLogService from './auditLogService';
import logger from '../utils/logger';

export interface CreateRequirementInput {
  description: string;
  sortOrder?: number;
}

export interface UpdateRequirementInput {
  description?: string;
  isCompleted?: boolean;
  sortOrder?: number;
}

class RequirementService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({});
  }

  async createRequirement(
    input: CreateRequirementInput,
    projectId: string,
    userId: string
  ) {
    try {
      const maxSortOrder = await this.prisma.projectRequirement.aggregate({
        where: { projectId },
        _max: { sortOrder: true },
      });

      const nextSortOrder = (maxSortOrder._max.sortOrder ?? 0) + 1;

      const requirement = await this.prisma.projectRequirement.create({
        data: {
          projectId,
          description: input.description,
          sortOrder: input.sortOrder ?? nextSortOrder,
          isCompleted: false,
        },
      });

      await AuditLogService.logCreate(
        AuditEntityType.PROJECT_REQUIREMENT,
        requirement.id,
        userId,
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
    userId: string
  ) {
    try {
      const existing = await this.prisma.projectRequirement.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error('Requirement not found');
      }

      const updateData: any = {};

      if (input.description !== undefined) {
        updateData.description = input.description;
      }

      if (input.sortOrder !== undefined) {
        updateData.sortOrder = input.sortOrder;
      }

      if (input.isCompleted !== undefined && input.isCompleted && !existing.isCompleted) {
        updateData.isCompleted = true;
        updateData.completedAt = new Date();
        updateData.completedBy = userId;
      }

      const requirement = await this.prisma.projectRequirement.update({
        where: { id },
        data: updateData,
      });

      await AuditLogService.logUpdate(
        AuditEntityType.PROJECT_REQUIREMENT,
        id,
        userId,
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

  async completeRequirement(id: string, isCompleted: boolean, userId: string) {
    try {
      const existing = await this.prisma.projectRequirement.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error('Requirement not found');
      }

      const updateData: any = {};

      if (isCompleted) {
        updateData.isCompleted = true;
        updateData.completedAt = new Date();
        updateData.completedBy = userId;
      } else {
        updateData.isCompleted = false;
        updateData.completedAt = null;
        updateData.completedBy = null;
      }

      const requirement = await this.prisma.projectRequirement.update({
        where: { id },
        data: updateData,
      });

      await AuditLogService.logUpdate(
        AuditEntityType.PROJECT_REQUIREMENT,
        id,
        userId,
        existing,
        requirement
      );

      logger.info('Requirement completion status updated', { requirementId: id, isCompleted });

      return requirement;
    } catch (error) {
      logger.error('Failed to update requirement completion', { error, id, isCompleted });
      throw error;
    }
  }

  async deleteRequirement(id: string, userId: string) {
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
        AuditEntityType.PROJECT_REQUIREMENT,
        id,
        userId,
        requirement
      );

      logger.info('Requirement deleted successfully', { requirementId: id });
    } catch (error) {
      logger.error('Failed to delete requirement', { error, id });
      throw error;
    }
  }

  async getProjectRequirements(projectId: string, userId: string) {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      const requirements = await this.prisma.projectRequirement.findMany({
        where: { projectId },
        include: {
          completedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { sortOrder: 'asc' },
      });

      logger.info('Project requirements retrieved successfully', { projectId, count: requirements.length });

      return requirements;
    } catch (error) {
      logger.error('Failed to get project requirements', { error, projectId });
      throw error;
    }
  }
}

export default RequirementService;
