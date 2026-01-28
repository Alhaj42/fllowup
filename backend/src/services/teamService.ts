import { UserRole } from '@prisma/client';
import logger from '../utils/logger';
import AuditLogService from './auditLogService';
import { prisma } from './prismaClient';

export interface AssignTeamMemberInput {
  phaseId: string;
  teamMemberId: string;
  role: AssignmentRole;
  workingPercentage: number;
  startDate: Date;
  endDate?: Date;
}

export interface UpdateAssignmentInput {
  role?: AssignmentRole;
  workingPercentage?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface AllocationCheckResult {
  isOverallocated: boolean;
  currentAllocation: number;
  proposedAllocation: number;
  warning: string | null;
}

class TeamService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Assign a team member to a phase with allocation validation
   * @param input Assignment details
   * @param currentUserId ID of user making the change
   * @param currentUserRole UserRole of user making the change
   * @returns Created assignment
   */
  async assignTeamMember(
    input: AssignTeamMemberInput,
    currentUserId: string,
    currentUserRole: UserRole
  ): Promise<Assignment> {
    try {
      // Validate dates
      if (input.endDate && input.startDate > input.endDate) {
        throw new Error('endDate must be after startDate');
      }

      // Check allocation before creating assignment
      const allocationCheck = await this.checkAllocation(
        input.teamMemberId,
        input.workingPercentage
      );

      if (allocationCheck.isOverallocated) {
        throw new Error(
          `Team member allocation would exceed 100% (${allocationCheck.proposedAllocation}%). Current: ${allocationCheck.currentAllocation}%`
        );
      }

      // Verify phase exists
      const phase = await this.prisma.phase.findUnique({
        where: { id: input.phaseId },
        include: { project: true },
      });

      if (!phase) {
        throw new Error('Phase not found');
      }

      // Verify team member exists
      const teamMember = await this.prisma.user.findUnique({
        where: { id: input.teamMemberId },
      });

      if (!teamMember) {
        throw new Error('Team member not found');
      }

      // Create assignment
      const assignment = await this.prisma.assignment.create({
        data: {
          phaseId: input.phaseId,
          teamMemberId: input.teamMemberId,
          role: input.role,
          workingPercentage: input.workingPercentage,
          startDate: input.startDate,
          endDate: input.endDate,
        },
        include: {
          teamMember: {
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
      });

      // Log audit
      await AuditLogService.logCreate(
        'Assignment',
        assignment.id,
        currentUserId,
        currentUserRole,
        assignment
      );

      logger.info('Team member assigned successfully', {
        assignmentId: assignment.id,
        phaseId: input.phaseId,
        teamMemberId: input.teamMemberId,
        projectId: phase.project.id,
      });

      return assignment;
    } catch (error) {
      logger.error('Failed to assign team member', { error, input });
      throw error;
    }
  }

  /**
   * Update an existing assignment with allocation validation
   * @param id Assignment ID
   * @param input Fields to update
   * @param currentUserId ID of user making the change
   * @param currentUserRole UserRole of user making the change
   * @returns Updated assignment
   */
  async updateAssignment(
    id: string,
    input: UpdateAssignmentInput,
    currentUserId: string,
    currentUserRole: UserRole
  ): Promise<Assignment> {
    try {
      // Validate dates if both are provided
      if (input.startDate && input.endDate && input.startDate > input.endDate) {
        throw new Error('endDate must be after startDate');
      }

      // Get existing assignment
      const existing = await this.prisma.assignment.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error('Assignment not found');
      }

      // If updating working percentage, check allocation
      if (input.workingPercentage !== undefined) {
        // Calculate new allocation by excluding current assignment's percentage
        const currentAssignments = await this.prisma.assignment.findMany({
          where: {
            teamMemberId: existing.teamMemberId,
            id: { not: id }, // Exclude current assignment
          },
        });

        const otherAllocation = currentAssignments.reduce(
          (sum, a) => sum + Number(a.workingPercentage),
          0
        );

        const newTotalAllocation = otherAllocation + input.workingPercentage;

        if (newTotalAllocation > 100) {
          throw new Error(
            `Team member allocation would exceed 100% (${newTotalAllocation}%). Other allocations: ${otherAllocation}%, proposed: ${input.workingPercentage}%`
          );
        }
      }

      // Update assignment
      const assignment = await this.prisma.assignment.update({
        where: { id },
        data: input,
        include: {
          teamMember: {
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
      });

      // Log audit
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

  /**
   * Get all assignments for a specific team member
   * @param teamMemberId Team member ID
   * @returns Array of assignments with project details
   */
  async getTeamMemberAssignments(teamMemberId: string): Promise<Assignment[]> {
    try {
      const assignments = await this.prisma.assignment.findMany({
        where: { teamMemberId },
        include: {
          teamMember: {
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
      logger.error('Failed to get team member assignments', { error, teamMemberId });
      throw error;
    }
  }

  /**
   * Get all assignments for a specific project across all phases
   * @param projectId Project ID
   * @returns Array of assignments with team member and phase details
   */
  async getProjectTeamAssignments(projectId: string): Promise<Assignment[]> {
    try {
      const assignments = await this.prisma.assignment.findMany({
        where: {
          phase: {
            projectId,
          },
        },
        include: {
          teamMember: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              grade: true,
            },
          },
          phase: {
            include: {
              project: true,
            },
          },
        },
        orderBy: [{ phase: { startDate: 'asc' } }, { teamMember: { name: 'asc' } }],
      });

      return assignments;
    } catch (error) {
      logger.error('Failed to get project team assignments', { error, projectId });
      throw error;
    }
  }

  /**
   * Check if adding a new allocation would exceed 100%
   * @param teamMemberId Team member ID
   * @param workingPercentage New allocation percentage
   * @returns Allocation check result with warning if overallocated
   */
  async checkAllocation(
    teamMemberId: string,
    workingPercentage: number
  ): Promise<AllocationCheckResult> {
    try {
      const currentAssignments = await this.prisma.assignment.findMany({
        where: { teamMemberId },
      });

      const currentAllocation = currentAssignments.reduce(
        (sum, assignment) => sum + Number(assignment.workingPercentage),
        0
      );

      const proposedAllocation = currentAllocation + workingPercentage;
      const isOverallocated = proposedAllocation > 100;

      const warning = isOverallocated
        ? `Team member allocation would exceed 100% (${proposedAllocation}%). Current: ${currentAllocation}%, proposed addition: ${workingPercentage}%`
        : null;

      return {
        isOverallocated,
        currentAllocation,
        proposedAllocation,
        warning,
      };
    } catch (error) {
      logger.error('Failed to check allocation', { error, teamMemberId, workingPercentage });
      throw error;
    }
  }

  /**
   * Remove an assignment
   * @param id Assignment ID
   * @param currentUserId ID of user making the change
   * @param currentUserRole UserRole of user making the change
   */
  async removeAssignment(
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

      // Log audit
      await AuditLogService.logDelete(
        'Assignment',
        id,
        currentUserId,
        currentUserRole,
        assignment
      );

      logger.info('Assignment removed successfully', { assignmentId: id });
    } catch (error) {
      logger.error('Failed to remove assignment', { error, id });
      throw error;
    }
  }

  /**
   * Get team workload summary for all team members
   * @param filter Optional filters (projectId, date range)
   * @returns Team workload summary with allocation percentages
   */
  async getTeamWorkload(filter?: {
    projectId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<
    Array<{
      teamMemberId: string;
      teamMemberName: string;
      teamMemberEmail: string;
      totalAllocation: number;
      isOverallocated: boolean;
      assignments: Array<{
        id: string;
        projectName: string;
        phaseName: string;
        role: AssignmentRole;
        workingPercentage: number;
        startDate: Date;
        endDate: Date | null;
      }>;
    }>
  > {
    try {
      let whereClause: any = {};

      if (filter?.projectId) {
        whereClause.phase = {
          projectId: filter.projectId,
        };
      }

      const assignments = await this.prisma.assignment.findMany({
        where: whereClause,
        include: {
          teamMember: true,
          phase: {
            include: {
              project: true,
            },
          },
        },
      });

      const teamMembers = await this.prisma.user.findMany({
        where: {
          role: { in: ['MANAGER', 'TEAM_LEADER', 'TEAM_MEMBER'] },
          isActive: true,
        },
      });

      const workloadMap = new Map<
        string,
        {
          teamMemberId: string;
          teamMemberName: string;
          teamMemberEmail: string;
          totalAllocation: number;
          isOverallocated: boolean;
          assignments: any[];
        }
      >();

      teamMembers.forEach(member => {
        workloadMap.set(member.id, {
          teamMemberId: member.id,
          teamMemberName: member.name,
          teamMemberEmail: member.email,
          totalAllocation: 0,
          isOverallocated: false,
          assignments: [],
        });
      });

      assignments.forEach(assignment => {
        const workload = workloadMap.get(assignment.teamMemberId);
        if (workload) {
          const percentage = Number(assignment.workingPercentage);
          workload.totalAllocation += percentage;
          workload.isOverallocated = workload.totalAllocation > 100;
          workload.assignments.push({
            id: assignment.id,
            projectName: assignment.phase.project.name,
            phaseName: assignment.phase.name,
            role: assignment.role,
            workingPercentage: percentage,
            startDate: assignment.startDate,
            endDate: assignment.endDate,
          });
        }
      });

      return Array.from(workloadMap.values()).sort((a, b) =>
        a.teamMemberName.localeCompare(b.teamMemberName)
      );
    } catch (error) {
      logger.error('Failed to get team workload', { error, filter });
      throw error;
    }
  }
}

export default new TeamService();
