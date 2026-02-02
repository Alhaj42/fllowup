"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const auditLogService_1 = __importDefault(require("./auditLogService"));
const prismaClient_1 = require("./prismaClient");
class RequirementService {
    prisma;
    constructor() {
        this.prisma = prismaClient_1.prisma;
    }
    async createRequirement(input, projectId, userId, userRole) {
        try {
            const requirement = await this.prisma.projectRequirement.create({
                data: {
                    projectId,
                    description: input.description,
                    sortOrder: input.sortOrder ?? 0,
                },
            });
            await auditLogService_1.default.logCreate('ProjectRequirement', requirement.id, userId, userRole, requirement);
            logger_1.default.info('Requirement created successfully', { requirementId: requirement.id, projectId });
            return requirement;
        }
        catch (error) {
            logger_1.default.error('Failed to create requirement', { error, input, projectId });
            throw error;
        }
    }
    async updateRequirement(id, input, userId, userRole) {
        try {
            const existing = await this.prisma.projectRequirement.findUnique({
                where: { id },
            });
            if (!existing) {
                throw new Error('Requirement not found');
            }
            const requirement = await this.prisma.projectRequirement.update({
                where: { id },
                data: {
                    description: input.description,
                    sortOrder: input.sortOrder,
                },
            });
            await auditLogService_1.default.logUpdate('ProjectRequirement', id, userId, userRole, existing, requirement);
            logger_1.default.info('Requirement updated successfully', { requirementId: id });
            return requirement;
        }
        catch (error) {
            logger_1.default.error('Failed to update requirement', { error, id, input });
            throw error;
        }
    }
    async completeRequirement(id, isCompleted, userId, userRole) {
        try {
            const existing = await this.prisma.projectRequirement.findUnique({
                where: { id },
            });
            if (!existing) {
                throw new Error('Requirement not found');
            }
            const completedAt = isCompleted ? new Date() : null;
            const completedBy = isCompleted ? userId : null;
            const requirement = await this.prisma.projectRequirement.update({
                where: { id },
                data: {
                    isCompleted,
                    completedAt,
                    completedBy,
                },
            });
            await auditLogService_1.default.logStatusChange('ProjectRequirement', id, userId, userRole, existing.isCompleted ? 'COMPLETED' : 'PENDING', isCompleted ? 'COMPLETED' : 'PENDING');
            logger_1.default.info('Requirement completion status updated', { requirementId: id, isCompleted });
            return requirement;
        }
        catch (error) {
            logger_1.default.error('Failed to complete requirement', { error, id, isCompleted });
            throw error;
        }
    }
    async deleteRequirement(id, userId, userRole) {
        try {
            const requirement = await this.prisma.projectRequirement.findUnique({
                where: { id },
            });
            if (!requirement) {
                throw new Error('Requirement not found');
            }
            await this.prisma.projectRequirement.delete({
                where: { id },
            });
            await auditLogService_1.default.logDelete('ProjectRequirement', id, userId, userRole, requirement);
            logger_1.default.info('Requirement deleted successfully', { requirementId: id });
        }
        catch (error) {
            logger_1.default.error('Failed to delete requirement', { error, id });
            throw error;
        }
    }
    async getRequirementsByProject(projectId) {
        try {
            const requirements = await this.prisma.projectRequirement.findMany({
                where: { projectId },
                orderBy: { sortOrder: 'asc' },
            });
            return requirements;
        }
        catch (error) {
            logger_1.default.error('Failed to get requirements', { error, projectId });
            throw error;
        }
    }
}
exports.default = new RequirementService();
//# sourceMappingURL=requirementService.js.map