"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const auditLogService_1 = __importDefault(require("./auditLogService"));
const prismaClient_1 = require("./prismaClient");
class TeamService {
    prisma;
    constructor() {
        this.prisma = prismaClient_1.prisma;
    }
    /**
     * Assign a team member to a phase with allocation validation
     * @param input Assignment details
     * @param currentUserId ID of user making the change
     * @param currentUserRole UserRole of user making the change
     * @returns Created assignment
     */
    async assignTeamMember(input, currentUserId, currentUserRole) {
        try {
            // Validate dates
            if (input.endDate && input.startDate > input.endDate) {
                throw new Error('endDate must be after startDate');
            }
            // Check allocation before creating assignment
            const allocationCheck = await this.checkAllocation(input.teamMemberId, input.workingPercentage);
            if (allocationCheck.isOverallocated) {
                throw new Error(`Team member allocation would exceed 100% (${allocationCheck.proposedAllocation}%). Current: ${allocationCheck.currentAllocation}%`);
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
            await auditLogService_1.default.logCreate('Assignment', assignment.id, currentUserId, currentUserRole, assignment);
            logger_1.default.info('Team member assigned successfully', {
                assignmentId: assignment.id,
                phaseId: input.phaseId,
                teamMemberId: input.teamMemberId,
                projectId: phase.project.id,
            });
            return assignment;
        }
        catch (error) {
            logger_1.default.error('Failed to assign team member', { error, input });
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
    async updateAssignment(id, input, currentUserId, currentUserRole) {
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
                const otherAllocation = currentAssignments.reduce((sum, a) => sum + Number(a.workingPercentage), 0);
                const newTotalAllocation = otherAllocation + input.workingPercentage;
                if (newTotalAllocation > 100) {
                    throw new Error(`Team member allocation would exceed 100% (${newTotalAllocation}%). Other allocations: ${otherAllocation}%, proposed: ${input.workingPercentage}%`);
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
            await auditLogService_1.default.logUpdate('Assignment', id, currentUserId, currentUserRole, existing, assignment);
            logger_1.default.info('Assignment updated successfully', { assignmentId: id });
            return assignment;
        }
        catch (error) {
            logger_1.default.error('Failed to update assignment', { error, id, input });
            throw error;
        }
    }
    /**
     * Get all assignments for a specific team member
     * @param teamMemberId Team member ID
     * @returns Array of assignments with project details
     */
    async getTeamMemberAssignments(teamMemberId) {
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
        }
        catch (error) {
            logger_1.default.error('Failed to get team member assignments', { error, teamMemberId });
            throw error;
        }
    }
    /**
     * Get all assignments for a specific project across all phases
     * @param projectId Project ID
     * @returns Array of assignments with team member and phase details
     */
    async getProjectTeamAssignments(projectId) {
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
        }
        catch (error) {
            logger_1.default.error('Failed to get project team assignments', { error, projectId });
            throw error;
        }
    }
    /**
     * Check if adding a new allocation would exceed 100%
     * @param teamMemberId Team member ID
     * @param workingPercentage New allocation percentage
     * @returns Allocation check result with warning if overallocated
     */
    async checkAllocation(teamMemberId, workingPercentage) {
        try {
            const currentAssignments = await this.prisma.assignment.findMany({
                where: { teamMemberId },
            });
            const currentAllocation = currentAssignments.reduce((sum, assignment) => sum + Number(assignment.workingPercentage), 0);
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
        }
        catch (error) {
            logger_1.default.error('Failed to check allocation', { error, teamMemberId, workingPercentage });
            throw error;
        }
    }
    /**
     * Remove an assignment
     * @param id Assignment ID
     * @param currentUserId ID of user making the change
     * @param currentUserRole UserRole of user making the change
     */
    async removeAssignment(id, currentUserId, currentUserRole) {
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
            await auditLogService_1.default.logDelete('Assignment', id, currentUserId, currentUserRole, assignment);
            logger_1.default.info('Assignment removed successfully', { assignmentId: id });
        }
        catch (error) {
            logger_1.default.error('Failed to remove assignment', { error, id });
            throw error;
        }
    }
    /**
     * Get team workload summary for all team members
     * @param filter Optional filters (projectId, date range)
     * @returns Team workload summary with allocation percentages
     */
    async getTeamWorkload(filter) {
        try {
            let whereClause = {};
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
            const workloadMap = new Map();
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
            return Array.from(workloadMap.values()).sort((a, b) => a.teamMemberName.localeCompare(b.teamMemberName));
        }
        catch (error) {
            logger_1.default.error('Failed to get team workload', { error, filter });
            throw error;
        }
    }
}
exports.default = new TeamService();
//# sourceMappingURL=teamService.js.map