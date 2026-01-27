d/import { UserRole } from '@prisma/client';
import logger from '../utils/logger';
import AuditLogService from './auditLogService';
import { prisma } from './prismaClient';

export interface CreateTaskInput {
    phaseId: string;
    code: string;
    description: string;
    duration: number;
    assignedTeamMemberId?: string;
    startDate?: Date;
    endDate?: Date;
    status?: TaskStatus;
}

export interface UpdateTaskInput {
    code?: string;
    description?: string;
    duration?: number;
    status?: TaskStatus;
    assignedTeamMemberId?: string | null; // Allow null to unassign
    startDate?: Date | null;
    endDate?: Date | null;
    version: number;
}

class TaskService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = prisma;
    }

    async createTask(
        input: CreateTaskInput,
        userId: string,
        role: UserRole
    ): Promise<Task> {
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

            await AuditLogService.logCreate(
                'Task',
                task.id,
                userId,
                role,
                task
            );

            logger.info('Task created successfully', { taskId: task.id, code: task.code });

            return task;
        } catch (error) {
            logger.error('Failed to create task', { error, input });
            throw error;
        }
    }

    async updateTask(
        id: string,
        input: UpdateTaskInput,
        userId: string,
        role: UserRole
    ): Promise<Task> {
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

            await AuditLogService.logUpdate(
                'Task',
                id,
                userId,
                role,
                existingTask,
                task
            );

            logger.info('Task updated successfully', { taskId: id });

            return task;
        } catch (error) {
            logger.error('Failed to update task', { error, id, input });
            throw error;
        }
    }

    async deleteTask(
        id: string,
        userId: string,
        role: UserRole
    ): Promise<void> {
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

            await AuditLogService.logDelete(
                'Task',
                id,
                userId,
                role,
                task
            );

            logger.info('Task deleted successfully', { taskId: id });
        } catch (error) {
            logger.error('Failed to delete task', { error, id });
            throw error;
        }
    }

    async getTaskById(id: string): Promise<Task | null> {
        try {
            return await this.prisma.task.findUnique({
                where: { id },
                include: {
                    phase: true,
                    assignedTeamMember: true,
                },
            });
        } catch (error) {
            logger.error('Failed to get task', { error, id });
            throw error;
        }
    }

    async getTasksByPhase(phaseId: string): Promise<Task[]> {
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
        } catch (error) {
            logger.error('Failed to get tasks by phase', { error, phaseId });
            throw error;
        }
    }
}

export default TaskService;
