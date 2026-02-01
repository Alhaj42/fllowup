"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const prismaClient_1 = require("./prismaClient");
class ModificationTrackingService {
    async createModification(params) {
        try {
            const auditLog = await prismaClient_1.prisma.auditLog.create({
                data: {
                    entityType: 'Project',
                    entityId: params.projectId,
                    action: 'UPDATE',
                    userId: params.userId,
                    role: 'MANAGER', // Defaulting to manager for system actions
                    details: JSON.stringify({
                        modificationNumber: params.modificationNumber,
                        description: params.description,
                        daysUsed: params.daysUsed,
                    }),
                    timestamp: new Date(),
                },
            });
            logger_1.default.info(`Created modification record ${auditLog.id} for project ${params.projectId}`);
            return {
                id: auditLog.id,
                projectId: auditLog.entityId,
                modificationNumber: params.modificationNumber,
                description: params.description,
                createdAt: auditLog.timestamp,
                createdBy: auditLog.userId,
            };
        }
        catch (error) {
            logger_1.default.error('Failed to create modification record:', error);
            throw new Error('Failed to create modification record');
        }
    }
    async getModifications(projectId) {
        try {
            const auditLogs = await prismaClient_1.prisma.auditLog.findMany({
                where: {
                    entityType: 'Project',
                    entityId: projectId,
                    action: 'UPDATE',
                },
                orderBy: {
                    timestamp: 'asc',
                },
            });
            return auditLogs.map((log, index) => {
                let details = {};
                try {
                    details = JSON.parse(log.details || '{}');
                }
                catch (e) {
                    details = {};
                }
                return {
                    id: log.id,
                    projectId: log.entityId,
                    modificationNumber: details.modificationNumber || index + 1,
                    description: details.description || 'Modification',
                    createdAt: log.timestamp,
                    createdBy: log.userId,
                };
            });
        }
        catch (error) {
            logger_1.default.error(`Failed to get modifications for project ${projectId}:`, error);
            throw new Error('Failed to get modifications');
        }
    }
    async getModificationStats(projectId) {
        try {
            const project = await prismaClient_1.prisma.project.findUnique({
                where: { id: projectId },
                select: {
                    id: true,
                    modificationAllowedTimes: true,
                    modificationDaysPerTime: true,
                },
            });
            if (!project) {
                throw new Error('Project not found');
            }
            const modifications = await this.getModifications(projectId);
            const totalAllowed = project.modificationAllowedTimes ?? 3;
            const totalUsed = modifications.length;
            const remaining = Math.max(0, totalAllowed - totalUsed);
            const daysPerTime = project.modificationDaysPerTime ?? 5;
            const daysUsed = modifications.reduce((sum, mod) => {
                return sum + (mod.daysUsed ?? 0);
            }, 0);
            return {
                projectId: project.id,
                totalAllowed,
                totalUsed,
                remaining,
                daysPerTime,
                daysUsed,
                canModify: remaining > 0,
                modifications,
            };
        }
        catch (error) {
            logger_1.default.error(`Failed to get modification stats for project ${projectId}:`, error);
            throw new Error('Failed to get modification stats');
        }
    }
    async checkModificationLimit(projectId) {
        try {
            const stats = await this.getModificationStats(projectId);
            return {
                canModify: stats.canModify,
                remaining: stats.remaining,
            };
        }
        catch (error) {
            logger_1.default.error(`Failed to check modification limit for project ${projectId}:`, error);
            throw new Error('Failed to check modification limit');
        }
    }
    async recordModification(projectId, userId, description, daysUsed) {
        const stats = await this.getModificationStats(projectId);
        if (!stats.canModify) {
            throw new Error(`Modification limit reached. You have used ${stats.totalUsed} of ${stats.totalAllowed} allowed modifications.`);
        }
        return this.createModification({
            projectId,
            userId,
            modificationNumber: stats.totalUsed + 1,
            description,
            daysUsed,
        });
    }
}
exports.default = new ModificationTrackingService();
//# sourceMappingURL=modificationTrackingService.js.map