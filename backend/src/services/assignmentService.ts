import { PrismaClient, Assignment, AssignmentRole, AuditEntityType, AuditAction } from '@prisma/client';
import logger from '../utils/logger';
import AuditLogService from './auditLogService';
import config from '../config';

export interface CreateAssignmentInput {
  teamMemberId: string;
  role: AssignmentRole;
  workingPercentage: number;
  startDate: Date;
  endDate?: Date;
}

export interface GetTeamAllocationFilter {
  startDate?: string;
  endDate?: string;
  projectId?: string;
}

export interface TeamMemberAllocation {
  userId: string;
  userName: string;
  totalAllocation: number;
  isOverallocated: boolean;
  assignments: Array<{
    id: string;
    phaseId: string;
    projectName: string;
    role: AssignmentRole;
    workingPercentage: number;
    startDate: Date;
    endDate: Date | null;
  }>;
}

export interface TeamAllocationSummary {
  totalTeamMembers: number;
  allocatedMembers: number;
  overallocatedMembers: number;
  allocations: TeamMemberAllocation[];
}

class AssignmentService {
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

  async createAssignment(
    phaseId: string,
    input: CreateAssignmentInput,
    userId: string
  ): Promise<Assignment> {
    try {
      const assignment = await this.prisma.assignment.create({
        data: {
          phaseId,
          teamMemberId: input.teamMemberId,
          role: input.role,
          workingPercentage: input.workingPercentage,
          startDate: input.startDate,
          endDate: input.endDate,
          isActive: true,
        },
        include: {
          phase: {
            include: {
              project: true,
            },
          },
          teamMember: true,
        },
      });

      await AuditLogService.logCreate(
        AuditEntityType.ASSIGNMENT,
        assignment.id,
        userId,
        assignment
      );

      logger.info('Assignment created successfully', { assignmentId: assignment.id, phaseId });

      return assignment;
    } catch (error) {
      logger.error('Failed to create assignment', { error, input, phaseId });
      throw error;
    }
  }

  async getAssignmentsByPhase(phaseId: string, userId: string): Promise<Assignment[]> {
    try {
      const assignments = await this.prisma.assignment.findMany({
        where: { phaseId },
        include: {
          teamMember: true,
          phase: {
            include: {
              project: true,
            },
          },
        },
        orderBy: { startDate: 'asc' },
      });

      logger.info('Phase assignments retrieved successfully', { phaseId, count: assignments.length });

      return assignments;
    } catch (error) {
      logger.error('Failed to get phase assignments', { error, phaseId });
      throw error;
    }
  }

  async getAssignmentsByTeamMember(teamMemberId: string, userId: string): Promise<Assignment[]> {
    try {
      const assignments = await this.prisma.assignment.findMany({
        where: { teamMemberId, isActive: true },
        include: {
          phase: {
            include: {
              project: true,
            },
          },
        },
        orderBy: { startDate: 'asc' },
      });

      logger.info('Team member assignments retrieved successfully', { teamMemberId, count: assignments.length });

      return assignments;
    } catch (error) {
      logger.error('Failed to get team member assignments', { error, teamMemberId });
      throw error;
    }
  }

  async updateAssignment(
    id: string,
    input: Partial<CreateAssignmentInput>,
    userId: string
  ): Promise<Assignment> {
    try {
      const existing = await this.prisma.assignment.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error('Assignment not found');
      }

      const assignment = await this.prisma.assignment.update({
        where: { id },
        data: {
          ...(input.teamMemberId && { teamMemberId: input.teamMemberId }),
          ...(input.role && { role: input.role }),
          ...(input.workingPercentage !== undefined && { workingPercentage: input.workingPercentage }),
          ...(input.startDate && { startDate: input.startDate }),
          ...(input.endDate !== undefined && { endDate: input.endDate }),
          version: { increment: 1 },
        },
        include: {
          phase: true,
          teamMember: true,
        },
      });

      await AuditLogService.logUpdate(
        AuditEntityType.ASSIGNMENT,
        id,
        userId,
        existing,
        assignment
      );

      logger.info('Assignment updated successfully', { assignmentId: id });

      return assignment;
    } catch (error) {
      logger.error('Failed to update assignment', { error, id, input });
      throw error;
    }
  }

  async deleteAssignment(id: string, userId: string): Promise<void> {
    try {
      const assignment = await this.prisma.assignment.findUnique({
        where: { id },
      });

      if (!assignment) {
        throw new Error('Assignment not found');
      }

      await this.prisma.assignment.delete({
        where: { id },
      });

      await AuditLogService.logDelete(
        AuditEntityType.ASSIGNMENT,
        id,
        userId,
        assignment
      );

      logger.info('Assignment deleted successfully', { assignmentId: id });
    } catch (error) {
      logger.error('Failed to delete assignment', { error, id });
      throw error;
    }
  }

  async getTeamAllocation(
    filter: GetTeamAllocationFilter,
    userId: string
  ): Promise<TeamAllocationSummary> {
    try {
      const startDate = filter.startDate ? new Date(filter.startDate) : undefined;
      const endDate = filter.endDate ? new Date(filter.endDate) : undefined;

      let whereClause: any = {
        isActive: true,
      };

      if (startDate || endDate) {
        whereClause.OR = [
          { startDate: { lte: endDate || new Date() }, endDate: { gte: startDate || new Date() } },
          { startDate: { lte: endDate || new Date() }, endDate: null },
          { startDate: { gte: startDate || new Date() }, endDate: { gte: endDate || new Date() } },
        ];
      }

      if (filter.projectId) {
        whereClause.phase = {
          projectId: filter.projectId,
        };
      }

      const assignments = await this.prisma.assignment.findMany({
        where: whereClause,
        include: {
          phase: {
            include: {
              project: true,
            },
          },
          teamMember: true,
        },
      });

      const teamMembers = await this.prisma.user.findMany({
        where: {
          role: { in: ['MANAGER', 'TEAM_LEADER', 'TEAM_MEMBER'] },
          isActive: true,
        },
      });

      const allocationsMap = new Map<string, TeamMemberAllocation>();

      teamMembers.forEach(member => {
        allocationsMap.set(member.id, {
          userId: member.id,
          userName: member.name,
          totalAllocation: 0,
          isOverallocated: false,
          assignments: [],
        });
      });

      assignments.forEach(assignment => {
        const memberAllocation = allocationsMap.get(assignment.teamMemberId);
        if (memberAllocation) {
          const percentage = Number(assignment.workingPercentage);
          memberAllocation.totalAllocation += percentage;
          memberAllocation.assignments.push({
            id: assignment.id,
            phaseId: assignment.phaseId,
            projectName: assignment.phase.project.name,
            role: assignment.role,
            workingPercentage: percentage,
            startDate: assignment.startDate,
            endDate: assignment.endDate,
          });
        }
      });

      const allocations: TeamMemberAllocation[] = Array.from(allocationsMap.values());

      const allocatedMembers = allocations.filter(a => a.totalAllocation > 0).length;
      const overallocatedMembers = allocations.filter(a => a.totalAllocation > 100).length;

      allocations.forEach(allocation => {
        allocation.isOverallocated = allocation.totalAllocation > 100;
      });

      const summary: TeamAllocationSummary = {
        totalTeamMembers: teamMembers.length,
        allocatedMembers,
        overallocatedMembers,
        allocations,
      };

      logger.info('Team allocation calculated successfully', {
        totalTeamMembers: summary.totalTeamMembers,
        allocatedMembers: summary.allocatedMembers,
        overallocatedMembers: summary.overallocatedMembers,
      });

      return summary;
    } catch (error) {
      logger.error('Failed to calculate team allocation', { error, filter });
      throw error;
    }
  }

  async checkOverAllocation(
    teamMemberId: string,
    newWorkingPercentage: number,
    userId: string
  ): Promise<{ isOverallocated: boolean; currentAllocation: number }> {
    try {
      const currentAssignments = await this.prisma.assignment.findMany({
        where: {
          teamMemberId,
          isActive: true,
        },
      });

      const currentAllocation = currentAssignments.reduce(
        (sum, assignment) => sum + Number(assignment.workingPercentage),
        0
      );

      const isOverallocated = (currentAllocation + newWorkingPercentage) > 100;

      logger.info('Over-allocation check completed', {
        teamMemberId,
        currentAllocation,
        newAllocation: newWorkingPercentage,
        totalAllocation: currentAllocation + newWorkingPercentage,
        isOverallocated,
      });

      return {
        isOverallocated,
        currentAllocation,
      };
    } catch (error) {
      logger.error('Failed to check over-allocation', { error, teamMemberId });
      throw error;
    }
  }
}

export default AssignmentService;
