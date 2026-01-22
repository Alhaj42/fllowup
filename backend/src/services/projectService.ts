import { PrismaClient, Project, ProjectStatus, ProjectPhase, UserRole, AuditEntityType, AuditAction } from '@prisma/client';
import logger from '../utils/logger';
import AuditLogService from './auditLogService';
import config from '../config';

export interface CreateProjectInput {
  clientId: string;
  name: string;
  contractCode: string;
  contractSigningDate: Date;
  builtUpArea: number;
  licenseType?: string;
  projectType?: string;
  requirements?: string;
  startDate: Date;
  estimatedEndDate: Date;
  modificationAllowedTimes?: number;
  modificationDaysPerTime?: number;
}

export interface UpdateProjectInput {
  name?: string;
  builtUpArea?: number;
  licenseType?: string;
  projectType?: string;
  requirements?: string;
  startDate?: Date;
  estimatedEndDate?: Date;
  actualEndDate?: Date;
  currentPhase?: ProjectPhase;
  status?: ProjectStatus;
  modificationAllowedTimes?: number;
  modificationDaysPerTime?: number;
  version?: number;
}

export interface GetProjectsFilter {
  status?: ProjectStatus;
  currentPhase?: ProjectPhase;
  page?: number;
  limit?: number;
  search?: string;
  clientId?: string;
}

export interface ProjectsResponse {
  projects: Array<{
    id: string;
    name: string;
    contractCode: string;
    clientId: string;
    clientName: string;
    currentPhase: ProjectPhase;
    status: ProjectStatus;
    startDate: Date;
    estimatedEndDate: Date;
    actualEndDate?: Date;
    builtUpArea: number;
    totalCost: number;
    progress: number;
    version: number;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class ProjectService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: config.database.url,
        },
      },
    });
  }

  async createProject(
    input: CreateProjectInput,
    userId: string
  ): Promise<Project> {
    try {
      const project = await this.prisma.project.create({
        data: {
          clientId: input.clientId,
          name: input.name,
          contractCode: input.contractCode,
          contractSigningDate: input.contractSigningDate,
          builtUpArea: input.builtUpArea,
          licenseType: input.licenseType,
          projectType: input.projectType,
          requirements: input.requirements,
          startDate: input.startDate,
          estimatedEndDate: input.estimatedEndDate,
          currentPhase: 'STUDIES',
          status: 'PLANNED',
          modificationAllowedTimes: input.modificationAllowedTimes ?? 3,
          modificationDaysPerTime: input.modificationDaysPerTime ?? 5,
        },
        include: {
          client: true,
          phases: true,
        },
      });

      await AuditLogService.logCreate(
        AuditEntityType.PROJECT,
        project.id,
        userId,
        project
      );

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
    userId: string
  ): Promise<Project> {
    try {
      const existingProject = await this.prisma.project.findUnique({
        where: { id },
      });

      if (!existingProject) {
        throw new Error('Project not found');
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
        AuditEntityType.PROJECT,
        id,
        userId,
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
          projectRequirements: true,
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

      const where: Record<string, unknown> = {};

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
            startDate: 'desc' as const,
          },
          include: {
            client: true,
            phases: {
              select: {
                id: true,
                name: true,
                status: true,
                progress: true,
              },
            },
          },
        }),
        this.prisma.project.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info('Projects retrieved successfully', {
        userId,
        filter,
        count: projects.length,
        total,
        page,
      });

      return {
        projects: projects.map(project => ({
          id: project.id,
          name: project.name,
          contractCode: project.contractCode,
          clientId: project.clientId,
          clientName: project.client?.name ?? '',
          currentPhase: project.currentPhase,
          status: project.status,
          startDate: project.startDate,
          estimatedEndDate: project.estimatedEndDate,
          actualEndDate: project.actualEndDate ?? undefined,
          builtUpArea: Number(project.builtUpArea),
          totalCost: Number(project.totalCost),
          progress: this.calculateProjectProgress(project.phases.map(p => ({ ...p, progress: Number(p.progress) }))),
          version: project.version,
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
                  teamMember: true,
                },
              },
              costEntries: {
                include: {
                  employee: true,
                },
              },
            },
          },
          projectRequirements: true,
        },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      const phasesData = project.phases.map(phase => ({
        id: phase.id,
        name: phase.name,
        status: phase.status,
        progress: Number(phase.progress),
        taskCount: phase.tasks.length,
        completedTasks: phase.tasks.filter(t => t.status === 'COMPLETED').length,
        teamCount: new Set(phase.assignments.map(a => a.teamMemberId)).size,
        totalCost: phase.costEntries.reduce((sum, ce) => sum + Number(ce.costAmount), 0),
      }));

      const totalTeamMembers = new Set(
        project.phases.flatMap(p => p.assignments.map(a => a.teamMemberId))
      ).size;

      const totalTasks = project.phases.reduce((sum, p) => sum + p.tasks.length, 0);
      const completedTasks = project.phases.reduce(
        (sum, p) => sum + p.tasks.filter(t => t.status === 'COMPLETED').length,
        0
      );

      return {
        project: {
          id: project.id,
          name: project.name,
          contractCode: project.contractCode,
          clientId: project.clientId,
          clientName: project.client?.name ?? '',
          currentPhase: project.currentPhase,
          status: project.status,
          startDate: project.startDate,
          estimatedEndDate: project.estimatedEndDate,
          actualEndDate: project.actualEndDate ?? undefined,
          builtUpArea: Number(project.builtUpArea),
          totalCost: Number(project.totalCost),
          progress: this.calculateProjectProgress(project.phases.map(p => ({ ...p, progress: Number(p.progress) }))),
          version: project.version,
          modificationAllowedTimes: project.modificationAllowedTimes,
          modificationDaysPerTime: project.modificationDaysPerTime,
          requirements: project.projectRequirements,
        },
        phases: phasesData,
        summary: {
          totalPhases: project.phases.length,
          totalTasks,
          completedTasks,
          totalTeamMembers,
          overallProgress: this.calculateProjectProgress(project.phases.map(p => ({ ...p, progress: Number(p.progress) }))),
        },
      };
    } catch (error) {
      logger.error('Failed to get project dashboard', { error, id });
      throw error;
    }
  }

  async deleteProject(id: string, userId: string): Promise<void> {
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
        AuditEntityType.PROJECT,
        id,
        userId,
        project
      );

      logger.info('Project deleted successfully', { projectId: id });
    } catch (error) {
      logger.error('Failed to delete project', { error, id });
      throw error;
    }
  }

  private calculateProjectProgress(phases: Array<{ progress: number; status: string }>): number {
    if (phases.length === 0) return 0;

    const totalProgress = phases.reduce((sum, phase) => sum + phase.progress, 0);
    const completedPhases = phases.filter(p => p.status === 'COMPLETED').length;
    const phaseProgress = (completedPhases / phases.length) * 100;

    return Math.round((totalProgress / phases.length + phaseProgress) / 2);
  }
}

export default ProjectService;
