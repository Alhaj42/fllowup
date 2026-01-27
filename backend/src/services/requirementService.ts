d/import { UserRole } from '@prisma/client';
import logger from '../utils/logger';
import AuditLogService from './auditLogService';
import { prisma } from './prismaClient';

export interface CreateRequirementInput {
  title: string;
  description?: string;
  priority: string;
}

export interface UpdateRequirementInput {
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
  metAt?: Date | null;
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
          title: input.title,
          description: input.description,
          priority: input.priority,
          status: 'PENDING',
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
        data: input,
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

      const status = isCompleted ? 'COMPLETED' : 'PENDING';
      const metAt = isCompleted ? new Date() : null;

      const requirement = await this.prisma.projectRequirement.update({
        where: { id },
        data: {
          status,
          metAt,
        },
      });

      await AuditLogService.logStatusChange(
        'ProjectRequirement',
        id,
        userId,
        userRole,
        existing.status,
        status
      );

      logger.info('Requirement completion status updated', { requirementId: id, status });

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
        orderBy: { title: 'asc' },
      });

      return requirements;
    } catch (error) {
      logger.error('Failed to get requirements', { error, projectId });
      throw error;
    }
  }
}

export default new RequirementService();
