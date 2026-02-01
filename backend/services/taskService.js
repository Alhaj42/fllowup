"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const auditLogService_1 = __importDefault(require("./auditLogService"));
const prismaClient_1 = require("./prismaClient");
class TaskService {
    prisma;
    constructor() {
        this.prisma = prismaClient_1.prisma;
    }
    async createTask(input, userId, role) {
        try {
            // Validate phase exists
            const phase = await this.prisma.phase.findUnique({
                where: { id: input.phaseId }
            });
            if (!phase) {
                throw new Error('Phase not found');
            }
            // Check for code uniqueness within phase
            const existingTask = await this.prisma.task.findUnique({
                where: {
                    phaseId_code: {
                        phaseId: input.phaseId,
                        code: input.code
                    }
                }
            });
            if (existingTask) {
                throw new Error('Task code already exists in this phase');
            }
            const task = await this.prisma.task.create({
                data: {
                    phaseId: input.phaseId,
                    code: input.code,
                    description: input.description,
                    duration: input.duration,
                    status: input.status,
                    assignedTeamMemberId: input.assignedTeamMemberId,
                    startDate: input.startDate,
                    endDate: input.endDate,
                },
                include: {
                    phase: true,
                    assignedTeamMember: true,
                },
            });
            // Validate assignment if assignedTeamMemberId is provided
            if (input.assignedTeamMemberId) {
                const assignment = await this.prisma.assignment.findFirst({
                    where: {
                        phaseId: input.phaseId,
                        teamMemberId: input.assignedTeamMemberId,
                        isActive: true
                    }
                });
                if (!assignment) {
                    // Rollback creation if assignment is invalid
                    await this.prisma.task.delete({ where: { id: task.id } });
                    throw new Error('Assigned user is not assigned to this phase');
                }
            }
            await auditLogService_1.default.logCreate('Task', task.id, userId, role, task);
            logger_1.default.info('Task created successfully', { taskId: task.id, code: task.code });
            return task;
        }
        catch (error) {
            logger_1.default.error('Failed to create task', { error, input });
            throw error;
        }
    }
    async updateTask(id, input, userId, role) {
        try {
            const existingTask = await this.prisma.task.findUnique({
                where: { id },
            });
            if (!existingTask) {
                throw new Error('Task not found');
            }
            if (existingTask.version !== input.version) {
                throw new Error('Version conflict');
            }
            if (input.assignedTeamMemberId) {
                const assignment = await this.prisma.assignment.findFirst({
                    where: {
                        phaseId: existingTask.phaseId,
                        teamMemberId: input.assignedTeamMemberId,
                        isActive: true
                    }
                });
                if (!assignment) {
                    throw new Error('Assigned user is not assigned to this phase');
                }
            }
            const task = await this.prisma.task.update({
                where: { id },
                data: {
                    code: input.code,
                    description: input.description,
                    duration: input.duration,
                    status: input.status,
                    assignedTeamMemberId: input.assignedTeamMemberId,
                    startDate: input.startDate,
                    endDate: input.endDate,
                    version: { increment: 1 },
                },
                include: {
                    phase: true,
                    assignedTeamMember: true,
                },
            });
            await auditLogService_1.default.logUpdate('Task', id, userId, role, existingTask, task);
            logger_1.default.info('Task updated successfully', { taskId: id });
            return task;
        }
        catch (error) {
            logger_1.default.error('Failed to update task', { error, id, input });
            throw error;
        }
    }
    async deleteTask(id, userId, role) {
        try {
            const task = await this.prisma.task.findUnique({
                where: { id },
            });
            if (!task) {
                throw new Error('Task not found');
            }
            await this.prisma.task.delete({
                where: { id },
            });
            await auditLogService_1.default.logDelete('Task', id, userId, role, task);
            logger_1.default.info('Task deleted successfully', { taskId: id });
        }
        catch (error) {
            logger_1.default.error('Failed to delete task', { error, id });
            throw error;
        }
    }
    async getTaskById(id) {
        try {
            return await this.prisma.task.findUnique({
                where: { id },
                include: {
                    phase: true,
                    assignedTeamMember: true,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Failed to get task', { error, id });
            throw error;
        }
    }
    async getTasksByPhase(phaseId) {
        try {
            const tasks = await this.prisma.task.findMany({
                where: { phaseId },
                include: {
                    assignedTeamMember: true,
                },
                orderBy: {
                    code: 'asc',
                },
            });
            return tasks;
        }
        catch (error) {
            logger_1.default.error('Failed to get tasks by phase', { error, phaseId });
            throw error;
        }
    }
}
exports.default = TaskService;
//# sourceMappingURL=taskService.js.map