"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const auditLogService_1 = __importDefault(require("./auditLogService"));
const prismaClient_1 = require("./prismaClient");
class ProjectService {
    prisma;
    constructor() {
        this.prisma = prismaClient_1.prisma;
    }
    async createProject(input, userId, role) {
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
            await auditLogService_1.default.logCreate('Project', project.id, userId, role, project);
            logger_1.default.info('Project created successfully', { projectId: project.id, contractCode: project.contractCode });
            return project;
        }
        catch (error) {
            logger_1.default.error('Failed to create project', { error, input });
            throw error;
        }
    }
    async updateProject(id, input, userId, role) {
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
            await auditLogService_1.default.logUpdate('Project', id, userId, role, existingProject, project);
            logger_1.default.info('Project updated successfully', { projectId: id });
            return project;
        }
        catch (error) {
            logger_1.default.error('Failed to update project', { error, id, input });
            throw error;
        }
    }
    async getProjectById(id, userId) {
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
        }
        catch (error) {
            logger_1.default.error('Failed to get project', { error, id });
            throw error;
        }
    }
    async getProjects(filter, userId) {
        try {
            const page = filter.page ?? 1;
            const limit = filter.limit ?? 50;
            const skip = (page - 1) * limit;
            const where = {};
            if (filter.status) {
                where.status = filter.status;
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
        }
        catch (error) {
            logger_1.default.error('Failed to get projects', { error, filter });
            throw error;
        }
    }
    async getProjectDashboard(id, userId) {
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
            const completedTasks = project.phases.reduce((sum, p) => sum + p.tasks.filter(t => t.status === 'COMPLETE').length, 0);
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
        }
        catch (error) {
            logger_1.default.error('Failed to get project dashboard', { error, id });
            throw error;
        }
    }
    async deleteProject(id, userId, role) {
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
            await auditLogService_1.default.logDelete('Project', id, userId, role, project);
            logger_1.default.info('Project deleted successfully', { projectId: id });
        }
        catch (error) {
            logger_1.default.error('Failed to delete project', { error, id });
            throw error;
        }
    }
    calculatePhaseProgress(phase) {
        if (!phase.tasks || phase.tasks.length === 0)
            return 0;
        const completed = phase.tasks.filter((t) => t.status === 'COMPLETE').length;
        return Math.round((completed / phase.tasks.length) * 100);
    }
    calculateProjectProgress(phases) {
        if (phases.length === 0)
            return 0;
        const totalProgress = phases.reduce((sum, phase) => sum + this.calculatePhaseProgress(phase), 0);
        return Math.round(totalProgress / phases.length);
    }
    async createPhases(projectId, phaseNames, userId, role) {
        try {
            const phases = await Promise.all(phaseNames.map(async (name, index) => {
                return await this.prisma.phase.create({
                    data: {
                        projectId,
                        name,
                        phaseOrder: index + 1,
                        status: 'PLANNED',
                    },
                });
            }));
            await auditLogService_1.default.logCreate('Phase', `batch-${projectId}`, userId, role, { projectId, count: phaseNames.length });
            logger_1.default.info('Phases created successfully', { projectId, count: phaseNames.length });
            return phases;
        }
        catch (error) {
            logger_1.default.error('Failed to create phases', { error, projectId, phaseNames });
            throw error;
        }
    }
    async updatePhase(phaseId, updates, userId, role) {
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
            await auditLogService_1.default.logUpdate('Phase', phaseId, userId, role, phase, updatedPhase);
            logger_1.default.info('Phase updated successfully', { phaseId });
            return updatedPhase;
        }
        catch (error) {
            logger_1.default.error('Failed to update phase', { error, phaseId });
            throw error;
        }
    }
    async deletePhase(phaseId, userId, role) {
        try {
            const phase = await this.prisma.phase.findUnique({ where: { id: phaseId } });
            if (!phase) {
                throw new Error('Phase not found');
            }
            await this.prisma.phase.delete({ where: { id: phaseId } });
            await auditLogService_1.default.logDelete('Phase', phaseId, userId, role, phase);
            logger_1.default.info('Phase deleted successfully', { phaseId });
        }
        catch (error) {
            logger_1.default.error('Failed to delete phase', { error, phaseId });
            throw error;
        }
    }
    async assignTeamLeader(phaseId, teamLeaderId, userId, role) {
        try {
            const phase = await this.prisma.phase.update({
                where: { id: phaseId },
                data: { teamLeaderId },
            });
            await auditLogService_1.default.logUpdate('Phase', phaseId, userId, role, { phaseId }, { teamLeaderId });
            logger_1.default.info('Team leader assigned to phase', { phaseId, teamLeaderId });
            return phase;
        }
        catch (error) {
            logger_1.default.error('Failed to assign team leader', { error, phaseId, teamLeaderId });
            throw error;
        }
    }
    async removeTeamLeader(phaseId, userId, role) {
        try {
            const phase = await this.prisma.phase.update({
                where: { id: phaseId },
                data: { teamLeaderId: null },
            });
            await auditLogService_1.default.logUpdate('Phase', phaseId, userId, role, { phaseId, teamLeaderId: 'existing' }, { teamLeaderId: null });
            logger_1.default.info('Team leader removed from phase', { phaseId });
            return phase;
        }
        catch (error) {
            logger_1.default.error('Failed to remove team leader', { error, phaseId });
            throw error;
        }
    }
    async checkPhaseCompletion(phaseId) {
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
        }
        catch (error) {
            logger_1.default.error('Failed to check phase completion', { error, phaseId });
            throw error;
        }
    }
    async completePhase(phaseId, userId, role) {
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
            await auditLogService_1.default.logUpdate('Phase', phaseId, userId, role, { status: 'IN_PROGRESS' }, // Assuming it was in progress
            { status: 'COMPLETED' });
            // Trigger next phase if available?
            // Logic for transition could be added here or strictly manual via next updatePhase call.
            // For now, just completing the current phase.
            logger_1.default.info('Phase completed successfully', { phaseId });
        }
        catch (error) {
            logger_1.default.error('Failed to complete phase', { error, phaseId });
            throw error;
        }
    }
}
exports.default = ProjectService;
//# sourceMappingURL=projectService.js.map