import { prisma } from '../config/database';

export interface CostEntryInput {
  projectId: string;
  type: 'EMPLOYEE' | 'MATERIAL';
  description: string;
  amount: number;
  teamMemberId?: string;
  date?: string;
}

export interface CostEntryUpdate {
  type?: 'EMPLOYEE' | 'MATERIAL';
  description?: string;
  amount?: number;
}

export class CostEntryService {
  async createCostEntry(data: CostEntryInput, userId: string) {
    const costEntry = await prisma.costEntry.create({
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

  async updateCostEntry(costEntryId: string, data: CostEntryUpdate, userId: string) {
    const existingEntry = await prisma.costEntry.findUnique({
      where: { id: costEntryId }
    });

    if (!existingEntry) {
      throw new Error('Cost entry not found');
    }

    const updatedEntry = await prisma.costEntry.update({
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

  async deleteCostEntry(costEntryId: string, userId: string) {
    const existingEntry = await prisma.costEntry.findUnique({
      where: { id: costEntryId }
    });

    if (!existingEntry) {
      throw new Error('Cost entry not found');
    }

    await prisma.costEntry.delete({
      where: { id: costEntryId }
    });

    await this.logCostEntryDeletion(costEntryId, userId);

    return { message: 'Cost entry deleted successfully' };
  }

  async getCostsByProject(projectId: string) {
    const costEntries = await prisma.costEntry.findMany({
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

  async getCostSummary(projectId: string) {
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

  private async logCostEntryCreation(costEntryId: string, userId: string) {
    await prisma.auditLog.create({
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

  private async logCostEntryUpdate(costEntryId: string, userId: string) {
    await prisma.auditLog.create({
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

  private async logCostEntryDeletion(costEntryId: string, userId: string) {
    await prisma.auditLog.create({
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

export const costEntryService = new CostEntryService();
