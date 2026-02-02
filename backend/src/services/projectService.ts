import { UserRole, ProjectStatus, PhaseStatus, Project, PrismaClient } from '@prisma/client';
import logger from '../utils/logger';
import AuditLogService from './auditLogService';
import { prisma } from './prismaClient';

export interface CreateProjectInput {
  clientId: string;
  name: string;
  contractCode: string;
  startDate: Date;
  estimatedEndDate: Date;
  builtUpArea?: number;
  licenseType?: string;
  projectType?: string;
  description?: string;
  managerId?: string;
}

export interface UpdateProjectInput {
  name?: string;
  builtUpArea?: number;
  licenseType?: string;
  projectType?: string;
  description?: string;
  startDate?: Date;
  estimatedEndDate?: Date;
  actualEndDate?: Date;
  status?: ProjectStatus;
  version: number;
}

export interface GetProjectsFilter {
  status?: ProjectStatus;
  currentPhase?: string;
  page?: number;
  limit?: number;
  search?: string;
  clientId?: string;
}

export interface ProjectsResponse {
  projects: Array<Project & {
    clientName: string;
    progress: number;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class ProjectService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async createProject(
    input: CreateProjectInput,
    userId: string,
    role: Role
  ): Promise<Project> {
    try {
      const project = await this.prisma.project.create({
        data: {
          clientId: input.clientId,
          name: input.name,
          contractCode: input.contractCode,
          builtUpArea: input.builtUpArea,
          licenseType: input.licenseType,
          projectType: input.projectType,
          description: input.description,
          startDate: input.startDate,
          estimatedEndDate: input.estimatedEndDate,
          status: 'PLANNED',
          managerId: input.managerId || userId,
        },
        include: {
          client: true,
          phases: true,
        },
      });

      await this.createPhases(project.id, ['Studies', 'Design', 'Technical'], userId, role);

      // Try to log audit, but don't fail if it errors
      try {
        await AuditLogService.logCreate(
          'Project',
          project.id,
          userId,
          role,
          project
        );
      } catch (auditError) {
        logger.warn('Failed to create audit log, but project was created', { auditError, projectId: project.id });
      }

      logger.info('Project created successfully', { projectId: project.id, contractCode: project.contractCode });

      return project;
    } catch (error) {
      logger.error('Failed to create project', { error, input });
      throw error;
    }
  }

  async updateProject(
    id: string,
    input: UpdateProjectInput,
    userId: string,
    role: Role
  ): Promise<Project> {
    try {
      const existingProject = await this.prisma.project.findUnique({
        where: { id },
      });

      if (!existingProject) {
        throw new Error('Project not found');
      }

      if (existingProject.version !== input.version) {
        throw new Error('Version conflict');
      }

      const project = await this.prisma.project.update({
        where: { id },
        data: {
          ...input,
          version: { increment: 1 },
        },
        include: {
          client: true,
          phases: true,
        },
      });

      await AuditLogService.logUpdate(
        'Project',
        id,
        userId,
        role,
        existingProject,
        project
      );

      logger.info('Project updated successfully', { projectId: id });

      return project;
    } catch (error) {
      logger.error('Failed to update project', { error, id, input });
      throw error;
    }
  }

  async getProjectById(id: string, userId: string): Promise<Project | null> {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id },
        include: {
          client: true,
          phases: {
            include: {
              tasks: true,
            },
          },
          requirements: true,
        },
      });

      return project;
    } catch (error) {
      logger.error('Failed to get project', { error, id });
      throw error;
    }
  }

  async getProjects(
    filter: GetProjectsFilter,
    userId: string
  ): Promise<ProjectsResponse> {
    try {
      const page = filter.page ?? 1;
      const limit = filter.limit ?? 50;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (filter.status) {
        where.status = filter.status;
      }

      if (filter.currentPhase) {
        where.currentPhase = filter.currentPhase;
      }

      if (filter.clientId) {
        where.clientId = filter.clientId;
      }

      if (filter.search) {
        where.OR = [
          { name: { contains: filter.search, mode: 'insensitive' } },
          { contractCode: { contains: filter.search, mode: 'insensitive' } },
        ];
      }

      const [projects, total] = await Promise.all([
        this.prisma.project.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            startDate: 'desc',
          },
          include: {
            client: true,
            phases: {
              select: {
                id: true,
                name: true,
                status: true,
                tasks: {
                  select: {
                    status: true,
                  }
                }
              },
            },
          },
        }),
        this.prisma.project.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        projects: projects.map(project => ({
          ...project,
          clientName: project.client?.name ?? '',
          progress: this.calculateProjectProgress(project.phases),
        })),
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error('Failed to get projects', { error, filter });
      throw error;
    }
  }

  async getProjectDashboard(id: string, userId: string) {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id },
        include: {
          client: true,
          phases: {
            include: {
              tasks: true,
              assignments: {
                include: {
                  user: true,
                },
              },
            },
          },
          requirements: true,
        },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      const phasesData = project.phases.map(phase => ({
        id: phase.id,
        name: phase.name,
        status: phase.status,
        progress: this.calculatePhaseProgress(phase),
        taskCount: phase.tasks.length,
        completedTasks: phase.tasks.filter(t => t.status === 'COMPLETE').length,
        teamCount: new Set(phase.assignments.map(a => a.userId)).size,
        totalCost: 0, // Costs are now tracked at project level only
      }));

      const totalTasks = project.phases.reduce((sum, p) => sum + p.tasks.length, 0);
      const completedTasks = project.phases.reduce(
        (sum, p) => sum + p.tasks.filter(t => t.status === 'COMPLETE').length,
        0
      );

      return {
        project: {
          ...project,
          clientName: project.client?.name ?? '',
          progress: this.calculateProjectProgress(project.phases),
        },
        phases: phasesData,
        summary: {
          totalPhases: project.phases.length,
          totalTasks,
          completedTasks,
          overallProgress: this.calculateProjectProgress(project.phases),
        },
      };
    } catch (error) {
      logger.error('Failed to get project dashboard', { error, id });
      throw error;
    }
  }

  async deleteProject(id: string, userId: string, role: Role): Promise<void> {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      await this.prisma.project.delete({
        where: { id },
      });

      await AuditLogService.logDelete(
        'Project',
        id,
        userId,
        role,
        project
      );

      logger.info('Project deleted successfully', { projectId: id });
    } catch (error) {
      logger.error('Failed to delete project', { error, id });
      throw error;
    }
  }

  private calculatePhaseProgress(phase: any): number {
    if (!phase.tasks || phase.tasks.length === 0) return 0;
    const completed = phase.tasks.filter((t: any) => t.status === 'COMPLETE').length;
    return Math.round((completed / phase.tasks.length) * 100);
  }

  private calculateProjectProgress(phases: any[]): number {
    if (phases.length === 0) return 0;
    const totalProgress = phases.reduce((sum, phase) => sum + this.calculatePhaseProgress(phase), 0);
    return Math.round(totalProgress / phases.length);
  }

  async createPhases(projectId: string, phaseNames: string[], userId: string, role: Role): Promise<any[]> {
    try {
      const phases = await Promise.all(
        phaseNames.map(async (name, index) => {
          return await this.prisma.phase.create({
            data: {
              projectId,
              name,
              phaseOrder: index + 1,
              status: 'PLANNED',
            },
          });
        })
      );

      await AuditLogService.logCreate(
        'Phase',
        `batch-${projectId}`,
        userId,
        role,
        { projectId, count: phaseNames.length }
      );

      logger.info('Phases created successfully', { projectId, count: phaseNames.length });

      return phases;
    } catch (error) {
      logger.error('Failed to create phases', { error, projectId, phaseNames });
      throw error;
    }
  }

  async updatePhase(
    phaseId: string,
    updates: { name?: string; status?: PhaseStatus; teamLeaderId?: string | null },
    userId: string,
    role: Role
  ): Promise<any> {
    try {
      const phase = await this.prisma.phase.findUnique({ where: { id: phaseId } });

      if (!phase) {
        throw new Error('Phase not found');
      }

      const updatedPhase = await this.prisma.phase.update({
        where: { id: phaseId },
        data: {
          ...updates,
          version: { increment: 1 },
        },
      });

      await AuditLogService.logUpdate(
        'Phase',
        phaseId,
        userId,
        role,
        phase,
        updatedPhase
      );

      logger.info('Phase updated successfully', { phaseId });

      return updatedPhase;
    } catch (error) {
      logger.error('Failed to update phase', { error, phaseId });
      throw error;
    }
  }

  async deletePhase(phaseId: string, userId: string, role: Role): Promise<void> {
    try {
      const phase = await this.prisma.phase.findUnique({ where: { id: phaseId } });

      if (!phase) {
        throw new Error('Phase not found');
      }

      await this.prisma.phase.delete({ where: { id: phaseId } });

      await AuditLogService.logDelete('Phase', phaseId, userId, role, phase);

      logger.info('Phase deleted successfully', { phaseId });
    } catch (error) {
      logger.error('Failed to delete phase', { error, phaseId });
      throw error;
    }
  }

  async assignTeamLeader(phaseId: string, teamLeaderId: string, userId: string, role: Role): Promise<any> {
    try {
      const phase = await this.prisma.phase.update({
        where: { id: phaseId },
        data: { teamLeaderId },
      });

      await AuditLogService.logUpdate(
        'Phase',
        phaseId,
        userId,
        role,
        { phaseId },
        { teamLeaderId }
      );

      logger.info('Team leader assigned to phase', { phaseId, teamLeaderId });

      return phase;
    } catch (error) {
      logger.error('Failed to assign team leader', { error, phaseId, teamLeaderId });
      throw error;
    }
  }

  async removeTeamLeader(phaseId: string, userId: string, role: Role): Promise<any> {
    try {
      const phase = await this.prisma.phase.update({
        where: { id: phaseId },
        data: { teamLeaderId: null },
      });

      await AuditLogService.logUpdate(
        'Phase',
        phaseId,
        userId,
        role,
        { phaseId, teamLeaderId: 'existing' },
        { teamLeaderId: null }
      );

      logger.info('Team leader removed from phase', { phaseId });

      return phase;
    } catch (error) {
      logger.error('Failed to remove team leader', { error, phaseId });
      throw error;
    }
  }
  async checkPhaseCompletion(phaseId: string): Promise<boolean> {
    try {
      const phase = await this.prisma.phase.findUnique({
        where: { id: phaseId },
        include: { tasks: true },
      });

      if (!phase) {
        throw new Error('Phase not found');
      }

      if (phase.tasks.length === 0) {
        return false; // Cannot complete empty phase automatically
      }

      return phase.tasks.every(t => t.status === 'COMPLETED');
    } catch (error) {
      logger.error('Failed to check phase completion', { error, phaseId });
      throw error;
    }
  }

  async completePhase(phaseId: string, userId: string, role: Role): Promise<void> {
    try {
      const canComplete = await this.checkPhaseCompletion(phaseId);
      if (!canComplete) {
        throw new Error('Cannot complete phase: Not all tasks are completed');
      }

      const phase = await this.prisma.phase.update({
        where: { id: phaseId },
        data: {
          status: 'COMPLETED',
          actualEndDate: new Date(),
          progress: 100
        },
      });

      await AuditLogService.logUpdate(
        'Phase',
        phaseId,
        userId,
        role,
        { status: 'IN_PROGRESS' }, // Assuming it was in progress
        { status: 'COMPLETED' }
      );

      // Trigger next phase if available?
      // Logic for transition could be added here or strictly manual via next updatePhase call.
      // For now, just completing the current phase.

      logger.info('Phase completed successfully', { phaseId });
    } catch (error) {
      logger.error('Failed to complete phase', { error, phaseId });
      throw error;
    }
  }
}

export default ProjectService;
