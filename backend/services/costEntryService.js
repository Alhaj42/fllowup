"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.costEntryService = exports.CostEntryService = void 0;
// @ts-nocheck
const prismaClient_1 = require("./prismaClient");
class CostEntryService {
    async createCostEntry(data, userId) {
        const costEntry = await prismaClient_1.prisma.costEntry.create({
            data: {
                projectId: data.projectId,
                type: data.type,
                description: data.description,
                amount: data.amount,
                teamMemberId: data.teamMemberId,
                date: data.date ? new Date(data.date) : new Date(),
                createdBy: userId
            },
            include: {
                project: {
                    include: {
                        phases: true
                    }
                },
                teamMember: true
            }
        });
        await this.logCostEntryCreation(costEntry.id, userId);
        return costEntry;
    }
    async updateCostEntry(costEntryId, data, userId) {
        const existingEntry = await prismaClient_1.prisma.costEntry.findUnique({
            where: { id: costEntryId }
        });
        if (!existingEntry) {
            throw new Error('Cost entry not found');
        }
        const updatedEntry = await prismaClient_1.prisma.costEntry.update({
            where: { id: costEntryId },
            data: {
                ...data,
                updatedBy: userId,
                updatedAt: new Date()
            }
        });
        await this.logCostEntryUpdate(costEntryId, userId);
        return updatedEntry;
    }
    async deleteCostEntry(costEntryId, userId) {
        const existingEntry = await prismaClient_1.prisma.costEntry.findUnique({
            where: { id: costEntryId }
        });
        if (!existingEntry) {
            throw new Error('Cost entry not found');
        }
        await prismaClient_1.prisma.costEntry.delete({
            where: { id: costEntryId }
        });
        await this.logCostEntryDeletion(costEntryId, userId);
        return { message: 'Cost entry deleted successfully' };
    }
    async getCostsByProject(projectId) {
        const costEntries = await prismaClient_1.prisma.costEntry.findMany({
            where: { projectId },
            include: {
                teamMember: true
            },
            orderBy: {
                date: 'desc'
            }
        });
        return costEntries;
    }
    async getCostSummary(projectId) {
        const costEntries = await this.getCostsByProject(projectId);
        const employeeCosts = costEntries.filter(c => c.type === 'EMPLOYEE');
        const materialCosts = costEntries.filter(c => c.type === 'MATERIAL');
        const totalEmployeeCost = employeeCosts.reduce((sum, c) => sum + c.amount, 0);
        const totalMaterialCost = materialCosts.reduce((sum, c) => sum + c.amount, 0);
        const grandTotal = totalEmployeeCost + totalMaterialCost;
        return {
            projectId,
            totalCost: grandTotal,
            employeeCostTotal: totalEmployeeCost,
            materialCostTotal: totalMaterialCost,
            employeeCostCount: employeeCosts.length,
            materialCostCount: materialCosts.length,
            totalEntries: costEntries.length
        };
    }
    async logCostEntryCreation(costEntryId, userId) {
        await prismaClient_1.prisma.auditLog.create({
            data: {
                entityType: 'CostEntry',
                entityId: costEntryId,
                action: 'create',
                userId,
                details: JSON.stringify({ costEntryId }),
                timestamp: new Date()
            }
        });
    }
    async logCostEntryUpdate(costEntryId, userId) {
        await prismaClient_1.prisma.auditLog.create({
            data: {
                entityType: 'CostEntry',
                entityId: costEntryId,
                action: 'update',
                userId,
                details: JSON.stringify({ costEntryId, changes: 'cost updated' }),
                timestamp: new Date()
            }
        });
    }
    async logCostEntryDeletion(costEntryId, userId) {
        await prismaClient_1.prisma.auditLog.create({
            data: {
                entityType: 'CostEntry',
                entityId: costEntryId,
                action: 'delete',
                userId,
                details: JSON.stringify({ costEntryId }),
                timestamp: new Date()
            }
        });
    }
}
exports.CostEntryService = CostEntryService;
exports.costEntryService = new CostEntryService();
//# sourceMappingURL=costEntryService.js.map