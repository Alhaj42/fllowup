import { UserRole, CostType, PrismaClient } from '@prisma/client';
import logger from '../utils/logger';
import AuditLogService from './auditLogService';
import { prisma } from './prismaClient';

export interface CreateCostEntryInput {
  projectId: string;
  phaseId: string;
  employeeId: string;
  period: Date;
  costAmount: number;
  costType: CostType;
  description?: string;
}

export interface UpdateCostEntryInput {
  costAmount?: number;
  costType?: CostType;
  description?: string;
}

export interface CostCategoryBreakdown {
  EMPLOYEE_COST: Array<any>;
  MATERIAL_COST: Array<any>;
  OTHER_COST: Array<any>;
}

export interface CostSummary {
  projectId: string;
  totalCost: number;
  employeeCostTotal: number;
  materialCostTotal: number;
  otherCostTotal: number;
  employeeCostCount: number;
  materialCostCount: number;
  otherCostCount: number;
  totalEntries: number;
}

class CostService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async createCostEntry(
    input: CreateCostEntryInput,
    currentUserId: string,
    currentUserRole: UserRole
  ): Promise<any> {
    try {
      // Check for duplicate cost entry
      const isDuplicate = await this.checkDuplicateCostEntry(
        input.projectId,
        input.phaseId,
        input.employeeId,
        input.period
      );

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

      await AuditLogService.logCreate(
        'COST_ENTRY',
        costEntry.id,
        currentUserId,
        currentUserRole,
        costEntry
      );

      logger.info('Cost entry created successfully', { costEntryId: costEntry.id, projectId: input.projectId });

      return costEntry;
    } catch (error) {
      logger.error('Failed to create cost entry', { error, input });
      throw error;
    }
  }

  async updateCostEntry(
    id: string,
    input: UpdateCostEntryInput,
    currentUserId: string,
    currentUserRole: UserRole
  ): Promise<any> {
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

      await AuditLogService.logUpdate(
        'COST_ENTRY',
        id,
        currentUserId,
        currentUserRole,
        existing,
        costEntry
      );

      logger.info('Cost entry updated successfully', { costEntryId: id });

      return costEntry;
    } catch (error) {
      logger.error('Failed to update cost entry', { error, id, input });
      throw error;
    }
  }

  async deleteCostEntry(
    id: string,
    currentUserId: string,
    currentUserRole: UserRole
  ): Promise<void> {
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

      await AuditLogService.logDelete(
        'COST_ENTRY',
        id,
        currentUserId,
        currentUserRole,
        costEntry
      );

      logger.info('Cost entry deleted successfully', { costEntryId: id });
    } catch (error) {
      logger.error('Failed to delete cost entry', { error, id });
      throw error;
    }
  }

  async getCostsByProject(projectId: string): Promise<any[]> {
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
    } catch (error) {
      logger.error('Failed to get project costs', { error, projectId });
      throw error;
    }
  }

  async getCostsByProjectAndCategory(projectId: string): Promise<CostCategoryBreakdown> {
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

      const breakdown: CostCategoryBreakdown = {
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
    } catch (error) {
      logger.error('Failed to get costs by category', { error, projectId });
      throw error;
    }
  }

  async getCostSummary(projectId: string): Promise<CostSummary> {
    try {
      const costEntries = await this.prisma.costEntry.findMany({
        where: { projectId },
      });

      const employeeCosts = costEntries.filter(c => c.costType === CostType.EMPLOYEE_COST);
      const materialCosts = costEntries.filter(c => c.costType === CostType.MATERIAL_COST);
      const otherCosts = costEntries.filter(c => c.costType === CostType.OTHER_COST);

      const employeeCostTotal = employeeCosts.reduce((sum, c) => sum + Number(c.costAmount), 0);
      const materialCostTotal = materialCosts.reduce((sum, c) => sum + Number(c.costAmount), 0);
      const otherCostTotal = otherCosts.reduce((sum, c) => sum + Number(c.costAmount), 0);
      const totalCost = employeeCostTotal + materialCostTotal + otherCostTotal;

      const summary: CostSummary = {
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
    } catch (error) {
      logger.error('Failed to get cost summary', { error, projectId });
      throw error;
    }
  }

  async checkDuplicateCostEntry(
    projectId: string,
    phaseId: string,
    employeeId: string,
    period: Date
  ): Promise<boolean> {
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
    } catch (error) {
      logger.error('Failed to check duplicate cost entry', { error, projectId, phaseId, employeeId, period });
      throw error;
    }
  }
}

export default new CostService();
