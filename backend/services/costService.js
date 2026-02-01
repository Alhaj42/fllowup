"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../utils/logger"));
const auditLogService_1 = __importDefault(require("./auditLogService"));
const prismaClient_1 = require("./prismaClient");
class CostService {
    prisma;
    constructor() {
        this.prisma = prismaClient_1.prisma;
    }
    async createCostEntry(input, currentUserId, currentUserRole) {
        try {
            // Check for duplicate cost entry
            const isDuplicate = await this.checkDuplicateCostEntry(input.projectId, input.phaseId, input.employeeId, input.period);
            if (isDuplicate) {
                throw new Error('Duplicate cost entry: a cost entry with the same project, phase, employee, and period already exists');
            }
            const costEntry = await this.prisma.costEntry.create({
                data: {
                    projectId: input.projectId,
                    phaseId: input.phaseId,
                    employeeId: input.employeeId,
                    period: input.period,
                    costAmount: input.costAmount,
                    costType: input.costType,
                    description: input.description,
                },
                include: {
                    project: true,
                    phase: true,
                    employee: true,
                },
            });
            await auditLogService_1.default.logCreate('COST_ENTRY', costEntry.id, currentUserId, currentUserRole, costEntry);
            logger_1.default.info('Cost entry created successfully', { costEntryId: costEntry.id, projectId: input.projectId });
            return costEntry;
        }
        catch (error) {
            logger_1.default.error('Failed to create cost entry', { error, input });
            throw error;
        }
    }
    async updateCostEntry(id, input, currentUserId, currentUserRole) {
        try {
            const existing = await this.prisma.costEntry.findUnique({
                where: { id },
            });
            if (!existing) {
                throw new Error('Cost entry not found');
            }
            const costEntry = await this.prisma.costEntry.update({
                where: { id },
                data: input,
                include: {
                    project: true,
                    phase: true,
                    employee: true,
                },
            });
            await auditLogService_1.default.logUpdate('COST_ENTRY', id, currentUserId, currentUserRole, existing, costEntry);
            logger_1.default.info('Cost entry updated successfully', { costEntryId: id });
            return costEntry;
        }
        catch (error) {
            logger_1.default.error('Failed to update cost entry', { error, id, input });
            throw error;
        }
    }
    async deleteCostEntry(id, currentUserId, currentUserRole) {
        try {
            const costEntry = await this.prisma.costEntry.findUnique({
                where: { id },
            });
            if (!costEntry) {
                throw new Error('Cost entry not found');
            }
            await this.prisma.costEntry.delete({
                where: { id },
            });
            await auditLogService_1.default.logDelete('COST_ENTRY', id, currentUserId, currentUserRole, costEntry);
            logger_1.default.info('Cost entry deleted successfully', { costEntryId: id });
        }
        catch (error) {
            logger_1.default.error('Failed to delete cost entry', { error, id });
            throw error;
        }
    }
    async getCostsByProject(projectId) {
        try {
            const costEntries = await this.prisma.costEntry.findMany({
                where: { projectId },
                include: {
                    project: true,
                    phase: true,
                    employee: true,
                },
                orderBy: { period: 'desc' },
            });
            return costEntries;
        }
        catch (error) {
            logger_1.default.error('Failed to get project costs', { error, projectId });
            throw error;
        }
    }
    async getCostsByProjectAndCategory(projectId) {
        try {
            const costEntries = await this.prisma.costEntry.findMany({
                where: { projectId },
                include: {
                    project: true,
                    phase: true,
                    employee: true,
                },
                orderBy: { period: 'desc' },
            });
            const breakdown = {
                EMPLOYEE_COST: [],
                MATERIAL_COST: [],
                OTHER_COST: [],
            };
            costEntries.forEach(entry => {
                if (breakdown[entry.costType]) {
                    breakdown[entry.costType].push(entry);
                }
            });
            return breakdown;
        }
        catch (error) {
            logger_1.default.error('Failed to get costs by category', { error, projectId });
            throw error;
        }
    }
    async getCostSummary(projectId) {
        try {
            const costEntries = await this.prisma.costEntry.findMany({
                where: { projectId },
            });
            const employeeCosts = costEntries.filter(c => c.costType === client_1.CostType.EMPLOYEE_COST);
            const materialCosts = costEntries.filter(c => c.costType === client_1.CostType.MATERIAL_COST);
            const otherCosts = costEntries.filter(c => c.costType === client_1.CostType.OTHER_COST);
            const employeeCostTotal = employeeCosts.reduce((sum, c) => sum + Number(c.costAmount), 0);
            const materialCostTotal = materialCosts.reduce((sum, c) => sum + Number(c.costAmount), 0);
            const otherCostTotal = otherCosts.reduce((sum, c) => sum + Number(c.costAmount), 0);
            const totalCost = employeeCostTotal + materialCostTotal + otherCostTotal;
            const summary = {
                projectId,
                totalCost,
                employeeCostTotal,
                materialCostTotal,
                otherCostTotal,
                employeeCostCount: employeeCosts.length,
                materialCostCount: materialCosts.length,
                otherCostCount: otherCosts.length,
                totalEntries: costEntries.length,
            };
            return summary;
        }
        catch (error) {
            logger_1.default.error('Failed to get cost summary', { error, projectId });
            throw error;
        }
    }
    async checkDuplicateCostEntry(projectId, phaseId, employeeId, period) {
        try {
            // Normalize the period to date-only for comparison
            const periodDate = new Date(period);
            periodDate.setHours(0, 0, 0, 0);
            const startOfDay = new Date(periodDate);
            const endOfDay = new Date(periodDate);
            endOfDay.setHours(23, 59, 59, 999);
            const existingEntry = await this.prisma.costEntry.findFirst({
                where: {
                    projectId,
                    phaseId,
                    employeeId,
                    period: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                },
            });
            return !!existingEntry;
        }
        catch (error) {
            logger_1.default.error('Failed to check duplicate cost entry', { error, projectId, phaseId, employeeId, period });
            throw error;
        }
    }
}
exports.default = new CostService();
//# sourceMappingURL=costService.js.map