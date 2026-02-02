// @ts-nocheck
import { UserRole, AssignmentRole, Assignment, PrismaClient } from '@prisma/client';
import logger from '../utils/logger';
import AuditLogService from './auditLogService';
import { prisma } from './prismaClient';

export interface CreateAssignmentInput {
  phaseId: string;
  userId: string;
  role: AssignmentRole;
  workingPercent: number;
  startDate: Date;
  endDate?: Date;
}

export interface UpdateAssignmentInput {
  role?: AssignmentRole;
  workingPercent?: number;
  startDate?: Date;
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
  userEmail: string;
  totalAllocation: number;
  isOverallocated: boolean;
  assignments: Array<{
    id: string;
    phaseId: string;
    projectName: string;
    role: AssignmentRole;
    workingPercent: number;
    startDate: Date;
    endDate: Date | null;
    userEmail: string;
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
    this.prisma = prisma;
  }

  async createAssignment(
    input: CreateAssignmentInput,
    currentUserId: string,
    currentUserRole: UserRole
  ): Promise<Assignment> {
    try {
      const assignment = await this.prisma.assignment.create({
        data: {
          phaseId: input.phaseId,
          userId: input.userId,
          role: input.role,
          workingPercent: input.workingPercent,
          startDate: input.startDate,
          endDate: input.endDate,
        },
        include: {
          user: true,
          phase: true,
        },
      });

      await AuditLogService.logCreate(
        'Assignment',
        assignment.id,
        currentUserId,
        currentUserRole,
        assignment
      );

      logger.info('Assignment created successfully', { assignmentId: assignment.id, phaseId: input.phaseId });

      return assignment;
    } catch (error) {
      logger.error('Failed to create assignment', { error, input });
      throw error;
    }
  }

  async getAssignmentsByPhase(phaseId: string): Promise<Assignment[]> {
    try {
      const assignments = await this.prisma.assignment.findMany({
        where: { phaseId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          phase: {
            include: {
              project: true,
            },
          },
        },
        orderBy: { startDate: 'asc' },
      });

      return assignments;
    } catch (error) {
      logger.error('Failed to get phase assignments', { error, phaseId });
      throw error;
    }
  }

  async getAssignmentsByTeamMember(userId: string): Promise<Assignment[]> {
    try {
      const assignments = await this.prisma.assignment.findMany({
        where: { userId },
        include: {
          phase: {
            include: {
              project: true,
            },
          },
        },
        orderBy: { startDate: 'asc' },
      });

      return assignments;
    } catch (error) {
      logger.error('Failed to get team member assignments', { error, userId });
      throw error;
    }
  }

  async updateAssignment(
    id: string,
    input: UpdateAssignmentInput,
    currentUserId: string,
    currentUserRole: UserRole
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
        data: input,
        include: {
          phase: true,
          user: true,
        },
      });

      await AuditLogService.logUpdate(
        'Assignment',
        id,
        currentUserId,
        currentUserRole,
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

  async deleteAssignment(
    id: string,
    currentUserId: string,
    currentUserRole: UserRole
  ): Promise<void> {
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
        'Assignment',
        id,
        currentUserId,
        currentUserRole,
        assignment
      );

      logger.info('Assignment deleted successfully', { assignmentId: id });
    } catch (error) {
      logger.error('Failed to delete assignment', { error, id });
      throw error;
    }
  }

  async getTeamAllocation(
    filter: GetTeamAllocationFilter
  ): Promise<TeamAllocationSummary> {
    try {
      const startDate = filter.startDate ? new Date(filter.startDate) : undefined;
      const endDate = filter.endDate ? new Date(filter.endDate) : undefined;

      const whereClause: any = {};

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
          user: true,
        },
      });

      const teamMembers = await this.prisma.user.findMany({
        where: {
          role: { in: ['MANAGER', 'TEAM_LEADER', 'TEAM_MEMBER'] },
        },
      });

      const allocationsMap = new Map<string, TeamMemberAllocation>();

      teamMembers.forEach(member => {
        allocationsMap.set(member.id, {
          userId: member.id,
          userName: member.name,
          userEmail: member.email,
          totalAllocation: 0,
          isOverallocated: false,
          assignments: [],
        });
      });

      assignments.forEach(assignment => {
        const memberAllocation = allocationsMap.get(assignment.userId);
        if (memberAllocation) {
          const percentage = assignment.workingPercent;
          memberAllocation.totalAllocation += percentage;
          memberAllocation.assignments.push({
            id: assignment.id,
            phaseId: assignment.phaseId,
            projectName: assignment.phase.project.name,
            role: assignment.role,
            workingPercent: percentage,
            startDate: assignment.startDate,
            endDate: assignment.endDate,
            userEmail: assignment.user.email,
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

      return summary;
    } catch (error) {
      logger.error('Failed to calculate team allocation', { error, filter });
      throw error;
    }
  }

  async checkOverAllocation(
    userId: string,
    newWorkingPercent: number
  ): Promise<{ isOverallocated: boolean; currentAllocation: number }> {
    try {
      const currentAssignments = await this.prisma.assignment.findMany({
        where: {
          userId,
        },
      });

      const currentAllocation = currentAssignments.reduce(
        (sum, assignment) => sum + assignment.workingPercent,
        0
      );

      const isOverallocated = (currentAllocation + newWorkingPercent) > 100;

      return {
        isOverallocated,
        currentAllocation,
      };
    } catch (error) {
      logger.error('Failed to check over-allocation', { error, userId });
      throw error;
    }
  }
}

export default new AssignmentService();
