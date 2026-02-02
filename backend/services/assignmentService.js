"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const auditLogService_1 = __importDefault(require("./auditLogService"));
const prismaClient_1 = require("./prismaClient");
class AssignmentService {
    prisma;
    constructor() {
        this.prisma = prismaClient_1.prisma;
    }
    async createAssignment(input, currentUserId, currentUserRole) {
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
            await auditLogService_1.default.logCreate('Assignment', assignment.id, currentUserId, currentUserRole, assignment);
            logger_1.default.info('Assignment created successfully', { assignmentId: assignment.id, phaseId: input.phaseId });
            return assignment;
        }
        catch (error) {
            logger_1.default.error('Failed to create assignment', { error, input });
            throw error;
        }
    }
    async getAssignmentsByPhase(phaseId) {
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
        }
        catch (error) {
            logger_1.default.error('Failed to get phase assignments', { error, phaseId });
            throw error;
        }
    }
    async getAssignmentsByTeamMember(userId) {
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
        }
        catch (error) {
            logger_1.default.error('Failed to get team member assignments', { error, userId });
            throw error;
        }
    }
    async updateAssignment(id, input, currentUserId, currentUserRole) {
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
            await auditLogService_1.default.logUpdate('Assignment', id, currentUserId, currentUserRole, existing, assignment);
            logger_1.default.info('Assignment updated successfully', { assignmentId: id });
            return assignment;
        }
        catch (error) {
            logger_1.default.error('Failed to update assignment', { error, id, input });
            throw error;
        }
    }
    async deleteAssignment(id, currentUserId, currentUserRole) {
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
            await auditLogService_1.default.logDelete('Assignment', id, currentUserId, currentUserRole, assignment);
            logger_1.default.info('Assignment deleted successfully', { assignmentId: id });
        }
        catch (error) {
            logger_1.default.error('Failed to delete assignment', { error, id });
            throw error;
        }
    }
    async getTeamAllocation(filter) {
        try {
            const startDate = filter.startDate ? new Date(filter.startDate) : undefined;
            const endDate = filter.endDate ? new Date(filter.endDate) : undefined;
            const whereClause = {};
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
            const allocationsMap = new Map();
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
            const allocations = Array.from(allocationsMap.values());
            const allocatedMembers = allocations.filter(a => a.totalAllocation > 0).length;
            const overallocatedMembers = allocations.filter(a => a.totalAllocation > 100).length;
            allocations.forEach(allocation => {
                allocation.isOverallocated = allocation.totalAllocation > 100;
            });
            const summary = {
                totalTeamMembers: teamMembers.length,
                allocatedMembers,
                overallocatedMembers,
                allocations,
            };
            return summary;
        }
        catch (error) {
            logger_1.default.error('Failed to calculate team allocation', { error, filter });
            throw error;
        }
    }
    async checkOverAllocation(userId, newWorkingPercent) {
        try {
            const currentAssignments = await this.prisma.assignment.findMany({
                where: {
                    userId,
                },
            });
            const currentAllocation = currentAssignments.reduce((sum, assignment) => sum + assignment.workingPercent, 0);
            const isOverallocated = (currentAllocation + newWorkingPercent) > 100;
            return {
                isOverallocated,
                currentAllocation,
            };
        }
        catch (error) {
            logger_1.default.error('Failed to check over-allocation', { error, userId });
            throw error;
        }
    }
}
exports.default = new AssignmentService();
//# sourceMappingURL=assignmentService.js.map