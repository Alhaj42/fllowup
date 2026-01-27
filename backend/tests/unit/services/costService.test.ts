import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { PrismaClient, CostType, PhaseName, UserRole } from '@prisma/client';
import CostService from '../../../src/services/costService';

const prisma = new PrismaClient();

describe('CostService', () => {
  let testClient: { id: string };
  let testProject: { id: string };
  let testPhase: { id: string };
  let testPhase2: { id: string };
  let testUser: { id: string; role: UserRole };
  let testUser2: { id: string; role: UserRole };
  let managerUser: { id: string; role: UserRole };

  beforeAll(async () => {
    await prisma.costEntry.deleteMany({});
    await prisma.phase.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.auditLog.deleteMany({});

    const client = await prisma.client.create({
      data: {
        name: 'Test Client',
        contactEmail: 'test@example.com',
      },
    });
    testClient = client;

    const project = await prisma.project.create({
      data: {
        clientId: client.id,
        contractCode: `COSTSVC-${Date.now()}-${Math.random()}`,
        name: 'Cost Service Test Project',
        contractSigningDate: new Date('2025-01-01'),
        startDate: new Date('2025-01-01'),
        estimatedEndDate: new Date('2025-03-01'),
        builtUpArea: 1000,
      },
    });
    testProject = project;

    const phase = await prisma.phase.create({
      data: {
        projectId: project.id,
        name: PhaseName.STUDIES,
        startDate: new Date('2025-01-01'),
        duration: 60,
        estimatedEndDate: new Date('2025-03-01'),
        status: 'PLANNED',
      },
    });
    testPhase = phase;

    const phase2 = await prisma.phase.create({
      data: {
        projectId: project.id,
        name: PhaseName.DESIGN,
        startDate: new Date('2025-03-02'),
        duration: 30,
        estimatedEndDate: new Date('2025-04-01'),
        status: 'PLANNED',
      },
    });
    testPhase2 = phase2;

    const user = await prisma.user.create({
      data: {
        email: 'costsvc-test@example.com',
        name: 'Cost Service Test User',
        role: 'TEAM_MEMBER',
      },
    });
    testUser = user;

    const user2 = await prisma.user.create({
      data: {
        email: 'costsvc-test2@example.com',
        name: 'Cost Service Test User 2',
        role: 'TEAM_MEMBER',
      },
    });
    testUser2 = user2;

    const manager = await prisma.user.create({
      data: {
        email: 'costsvc-manager@example.com',
        name: 'Cost Service Manager',
        role: 'MANAGER',
      },
    });
    managerUser = manager;
  });

  afterAll(async () => {
    await prisma.costEntry.deleteMany({});
    await prisma.phase.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.$disconnect();
  });

  describe('createCostEntry', () => {
    beforeEach(async () => {
      await prisma.costEntry.deleteMany({});
      await prisma.auditLog.deleteMany({});
    });

    it('should create cost entry with valid data', async () => {
      const period = new Date('2025-01-15');

      const costEntry = await CostService.createCostEntry(
        {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 1000.00,
          costType: CostType.EMPLOYEE_COST,
          description: 'Test cost entry',
        },
        managerUser.id,
        managerUser.role
      );

      expect(costEntry).toBeDefined();
      expect(costEntry.id).toBeDefined();
      expect(costEntry.projectId).toBe(testProject.id);
      expect(costEntry.phaseId).toBe(testPhase.id);
      expect(costEntry.employeeId).toBe(testUser.id);
      expect(Number(costEntry.costAmount)).toBe(1000.00);
      expect(costEntry.costType).toBe(CostType.EMPLOYEE_COST);
      expect(costEntry.description).toBe('Test cost entry');
    });

    it('should create employee cost entry', async () => {
      const period = new Date('2025-01-15');

      const costEntry = await CostService.createCostEntry(
        {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 2500.00,
          costType: CostType.EMPLOYEE_COST,
          description: 'Employee labor costs',
        },
        managerUser.id,
        managerUser.role
      );

      expect(costEntry.costType).toBe(CostType.EMPLOYEE_COST);
      expect(Number(costEntry.costAmount)).toBe(2500.00);
    });

    it('should create material cost entry', async () => {
      const period = new Date('2025-01-15');

      const costEntry = await CostService.createCostEntry(
        {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 5000.00,
          costType: CostType.MATERIAL_COST,
          description: 'Building materials',
        },
        managerUser.id,
        managerUser.role
      );

      expect(costEntry.costType).toBe(CostType.MATERIAL_COST);
      expect(Number(costEntry.costAmount)).toBe(5000.00);
    });

    it('should create other cost entry', async () => {
      const period = new Date('2025-01-15');

      const costEntry = await CostService.createCostEntry(
        {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 750.00,
          costType: CostType.OTHER_COST,
          description: 'Transportation and misc',
        },
        managerUser.id,
        managerUser.role
      );

      expect(costEntry.costType).toBe(CostType.OTHER_COST);
      expect(Number(costEntry.costAmount)).toBe(750.00);
    });

    it('should create cost entry without description', async () => {
      const period = new Date('2025-01-15');

      const costEntry = await CostService.createCostEntry(
        {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 1500.00,
          costType: CostType.MATERIAL_COST,
        },
        managerUser.id,
        managerUser.role
      );

      expect(costEntry.description).toBeNull();
      expect(Number(costEntry.costAmount)).toBe(1500.00);
    });

    it('should reject duplicate cost entry (same project, phase, employee, period)', async () => {
      const period = new Date('2025-01-15');

      await CostService.createCostEntry(
        {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 1000.00,
          costType: CostType.EMPLOYEE_COST,
        },
        managerUser.id,
        managerUser.role
      );

      await expect(
        CostService.createCostEntry(
          {
            projectId: testProject.id,
            phaseId: testPhase.id,
            employeeId: testUser.id,
            period,
            costAmount: 2000.00,
            costType: CostType.MATERIAL_COST,
          },
          managerUser.id,
          managerUser.role
        )
      ).rejects.toThrow('duplicate cost entry');
    });

    it('should log audit entry on creation', async () => {
      const period = new Date('2025-01-15');

      await CostService.createCostEntry(
        {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 1000.00,
          costType: CostType.EMPLOYEE_COST,
        },
        managerUser.id,
        managerUser.role
      );

      const auditLogs = await prisma.auditLog.findMany({
        where: {
          entityType: 'COST_ENTRY',
          action: 'CREATE',
        },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].changedBy).toBe(managerUser.id);
    });
  });

  describe('updateCostEntry', () => {
    beforeEach(async () => {
      await prisma.costEntry.deleteMany({});
      await prisma.auditLog.deleteMany({});
    });

    it('should update cost amount', async () => {
      const period = new Date('2025-01-15');

      const costEntry = await CostService.createCostEntry(
        {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 1000.00,
          costType: CostType.EMPLOYEE_COST,
        },
        managerUser.id,
        managerUser.role
      );

      const updated = await CostService.updateCostEntry(
        costEntry.id,
        { costAmount: 1500.00 },
        managerUser.id,
        managerUser.role
      );

      expect(Number(updated.costAmount)).toBe(1500.00);
    });

    it('should update cost type', async () => {
      const period = new Date('2025-01-15');

      const costEntry = await CostService.createCostEntry(
        {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 1000.00,
          costType: CostType.EMPLOYEE_COST,
        },
        managerUser.id,
        managerUser.role
      );

      const updated = await CostService.updateCostEntry(
        costEntry.id,
        { costType: CostType.OTHER_COST },
        managerUser.id,
        managerUser.role
      );

      expect(updated.costType).toBe(CostType.OTHER_COST);
    });

    it('should update description', async () => {
      const period = new Date('2025-01-15');

      const costEntry = await CostService.createCostEntry(
        {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 1000.00,
          costType: CostType.EMPLOYEE_COST,
          description: 'Original',
        },
        managerUser.id,
        managerUser.role
      );

      const updated = await CostService.updateCostEntry(
        costEntry.id,
        { description: 'Updated description' },
        managerUser.id,
        managerUser.role
      );

      expect(updated.description).toBe('Updated description');
    });

    it('should update multiple fields', async () => {
      const period = new Date('2025-01-15');

      const costEntry = await CostService.createCostEntry(
        {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 1000.00,
          costType: CostType.EMPLOYEE_COST,
          description: 'Original',
        },
        managerUser.id,
        managerUser.role
      );

      const updated = await CostService.updateCostEntry(
        costEntry.id,
        {
          costAmount: 2000.00,
          costType: CostType.MATERIAL_COST,
          description: 'Updated cost entry',
        },
        managerUser.id,
        managerUser.role
      );

      expect(Number(updated.costAmount)).toBe(2000.00);
      expect(updated.costType).toBe(CostType.MATERIAL_COST);
      expect(updated.description).toBe('Updated cost entry');
    });

    it('should throw error if cost entry not found', async () => {
      await expect(
        CostService.updateCostEntry(
          'non-existent-id',
          { costAmount: 1500.00 },
          managerUser.id,
          managerUser.role
        )
      ).rejects.toThrow('Cost entry not found');
    });

    it('should log audit entry on update', async () => {
      const period = new Date('2025-01-15');

      const costEntry = await CostService.createCostEntry(
        {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 1000.00,
          costType: CostType.EMPLOYEE_COST,
        },
        managerUser.id,
        managerUser.role
      );

      await CostService.updateCostEntry(
        costEntry.id,
        { costAmount: 1500.00 },
        managerUser.id,
        managerUser.role
      );

      const auditLogs = await prisma.auditLog.findMany({
        where: {
          entityType: 'COST_ENTRY',
          action: 'UPDATE',
          entityId: costEntry.id,
        },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].changedBy).toBe(managerUser.id);
    });
  });

  describe('deleteCostEntry', () => {
    beforeEach(async () => {
      await prisma.costEntry.deleteMany({});
      await prisma.auditLog.deleteMany({});
    });

    it('should delete cost entry', async () => {
      const period = new Date('2025-01-15');

      const costEntry = await CostService.createCostEntry(
        {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 1000.00,
          costType: CostType.EMPLOYEE_COST,
        },
        managerUser.id,
        managerUser.role
      );

      await CostService.deleteCostEntry(
        costEntry.id,
        managerUser.id,
        managerUser.role
      );

      const deleted = await prisma.costEntry.findUnique({
        where: { id: costEntry.id },
      });

      expect(deleted).toBeNull();
    });

    it('should throw error if cost entry not found', async () => {
      await expect(
        CostService.deleteCostEntry(
          'non-existent-id',
          managerUser.id,
          managerUser.role
        )
      ).rejects.toThrow('Cost entry not found');
    });

    it('should log audit entry on deletion', async () => {
      const period = new Date('2025-01-15');

      const costEntry = await CostService.createCostEntry(
        {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 1000.00,
          costType: CostType.EMPLOYEE_COST,
        },
        managerUser.id,
        managerUser.role
      );

      await CostService.deleteCostEntry(
        costEntry.id,
        managerUser.id,
        managerUser.role
      );

      const auditLogs = await prisma.auditLog.findMany({
        where: {
          entityType: 'COST_ENTRY',
          action: 'DELETE',
          entityId: costEntry.id,
        },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].changedBy).toBe(managerUser.id);
    });
  });

  describe('getCostsByProject', () => {
    beforeEach(async () => {
      await prisma.costEntry.deleteMany({});
    });

    it('should get all cost entries for a project', async () => {
      const period1 = new Date('2025-01-15');
      const period2 = new Date('2025-02-15');

      await CostService.createCostEntry(
        {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period: period1,
          costAmount: 1000.00,
          costType: CostType.EMPLOYEE_COST,
        },
        managerUser.id,
        managerUser.role
      );

      await CostService.createCostEntry(
        {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period: period2,
          costAmount: 2000.00,
          costType: CostType.MATERIAL_COST,
        },
        managerUser.id,
        managerUser.role
      );

      const costs = await CostService.getCostsByProject(testProject.id);

      expect(costs).toHaveLength(2);
      expect(costs[0].projectId).toBe(testProject.id);
    });

    it('should include related data', async () => {
      const period = new Date('2025-01-15');

      await CostService.createCostEntry(
        {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 1000.00,
          costType: CostType.EMPLOYEE_COST,
          description: 'Test cost',
        },
        managerUser.id,
        managerUser.role
      );

      const costs = await CostService.getCostsByProject(testProject.id);

      expect(costs).toHaveLength(1);
      expect(costs[0].project).toBeDefined();
      expect(costs[0].phase).toBeDefined();
      expect(costs[0].employee).toBeDefined();
      expect(costs[0].employee.email).toBe('costsvc-test@example.com');
    });

    it('should return empty array for project with no costs', async () => {
      const costs = await CostService.getCostsByProject(testProject.id);

      expect(costs).toHaveLength(0);
      expect(costs).toEqual([]);
    });
  });

  describe('getCostsByProjectAndCategory', () => {
    beforeEach(async () => {
      await prisma.costEntry.deleteMany({});
    });

    it('should group costs by category', async () => {
      const period = new Date('2025-01-15');

      await CostService.createCostEntry(
        {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 1000.00,
          costType: CostType.EMPLOYEE_COST,
        },
        managerUser.id,
        managerUser.role
      );

      await CostService.createCostEntry(
        {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period: new Date('2025-02-15'),
          costAmount: 2000.00,
          costType: CostType.EMPLOYEE_COST,
        },
        managerUser.id,
        managerUser.role
      );

      await CostService.createCostEntry(
        {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period: new Date('2025-03-15'),
          costAmount: 5000.00,
          costType: CostType.MATERIAL_COST,
        },
        managerUser.id,
        managerUser.role
      );

      await CostService.createCostEntry(
        {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period: new Date('2025-04-15'),
          costAmount: 750.00,
          costType: CostType.OTHER_COST,
        },
        managerUser.id,
        managerUser.role
      );

      const categorizedCosts = await CostService.getCostsByProjectAndCategory(testProject.id);

      expect(categorizedCosts).toHaveProperty('EMPLOYEE_COST');
      expect(categorizedCosts).toHaveProperty('MATERIAL_COST');
      expect(categorizedCosts).toHaveProperty('OTHER_COST');
      expect(categorizedCosts.EMPLOYEE_COST.length).toBe(2);
      expect(categorizedCosts.MATERIAL_COST.length).toBe(1);
      expect(categorizedCosts.OTHER_COST.length).toBe(1);
    });

    it('should calculate totals for each category', async () => {
      const period = new Date('2025-01-15');

      await CostService.createCostEntry(
        {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 1000.00,
          costType: CostType.EMPLOYEE_COST,
        },
        managerUser.id,
        managerUser.role
      );

      await CostService.createCostEntry(
        {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period: new Date('2025-02-15'),
          costAmount: 2000.00,
          costType: CostType.EMPLOYEE_COST,
        },
        managerUser.id,
        managerUser.role
      );

      const categorizedCosts = await CostService.getCostsByProjectAndCategory(testProject.id);

      expect(categorizedCosts.EMPLOYEE_COST).toBeDefined();
      expect(categorizedCosts.EMPLOYEE_COST).toHaveLength(2);
    });
  });

  describe('getCostSummary', () => {
    beforeEach(async () => {
      await prisma.costEntry.deleteMany({});
    });

    it('should generate cost summary for project', async () => {
      const period = new Date('2025-01-15');

      await CostService.createCostEntry(
        {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 1000.00,
          costType: CostType.EMPLOYEE_COST,
        },
        managerUser.id,
        managerUser.role
      );

      await CostService.createCostEntry(
        {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period: new Date('2025-02-15'),
          costAmount: 2000.00,
          costType: CostType.EMPLOYEE_COST,
        },
        managerUser.id,
        managerUser.role
      );

      await CostService.createCostEntry(
        {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period: new Date('2025-03-15'),
          costAmount: 5000.00,
          costType: CostType.MATERIAL_COST,
        },
        managerUser.id,
        managerUser.role
      );

      await CostService.createCostEntry(
        {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period: new Date('2025-04-15'),
          costAmount: 750.00,
          costType: CostType.OTHER_COST,
        },
        managerUser.id,
        managerUser.role
      );

      const summary = await CostService.getCostSummary(testProject.id);

      expect(summary).toHaveProperty('projectId', testProject.id);
      expect(summary).toHaveProperty('totalCost');
      expect(summary).toHaveProperty('employeeCostTotal');
      expect(summary).toHaveProperty('materialCostTotal');
      expect(summary).toHaveProperty('otherCostTotal');
      expect(summary).toHaveProperty('employeeCostCount');
      expect(summary).toHaveProperty('materialCostCount');
      expect(summary).toHaveProperty('otherCostCount');
      expect(summary).toHaveProperty('totalEntries');

      expect(Number(summary.employeeCostTotal)).toBe(3000.00);
      expect(Number(summary.materialCostTotal)).toBe(5000.00);
      expect(Number(summary.otherCostTotal)).toBe(750.00);
      expect(Number(summary.totalCost)).toBe(8750.00);
      expect(summary.employeeCostCount).toBe(2);
      expect(summary.materialCostCount).toBe(1);
      expect(summary.otherCostCount).toBe(1);
      expect(summary.totalEntries).toBe(4);
    });

    it('should return zero totals for project with no costs', async () => {
      const summary = await CostService.getCostSummary(testProject.id);

      expect(summary.projectId).toBe(testProject.id);
      expect(Number(summary.totalCost)).toBe(0);
      expect(Number(summary.employeeCostTotal)).toBe(0);
      expect(Number(summary.materialCostTotal)).toBe(0);
      expect(Number(summary.otherCostTotal)).toBe(0);
      expect(summary.totalEntries).toBe(0);
    });
  });

  describe('checkDuplicateCostEntry', () => {
    beforeEach(async () => {
      await prisma.costEntry.deleteMany({});
    });

    it('should detect duplicate cost entry', async () => {
      const period = new Date('2025-01-15');

      await CostService.createCostEntry(
        {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 1000.00,
          costType: CostType.EMPLOYEE_COST,
        },
        managerUser.id,
        managerUser.role
      );

      const isDuplicate = await CostService.checkDuplicateCostEntry(
        testProject.id,
        testPhase.id,
        testUser.id,
        period
      );

      expect(isDuplicate).toBe(true);
    });

    it('should not detect duplicate for different period', async () => {
      const period1 = new Date('2025-01-15');
      const period2 = new Date('2025-02-15');

      await CostService.createCostEntry(
        {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period: period1,
          costAmount: 1000.00,
          costType: CostType.EMPLOYEE_COST,
        },
        managerUser.id,
        managerUser.role
      );

      const isDuplicate = await CostService.checkDuplicateCostEntry(
        testProject.id,
        testPhase.id,
        testUser.id,
        period2
      );

      expect(isDuplicate).toBe(false);
    });

    it('should not detect duplicate for different employee', async () => {
      const period = new Date('2025-01-15');

      await CostService.createCostEntry(
        {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 1000.00,
          costType: CostType.EMPLOYEE_COST,
        },
        managerUser.id,
        managerUser.role
      );

      const isDuplicate = await CostService.checkDuplicateCostEntry(
        testProject.id,
        testPhase.id,
        testUser2.id,
        period
      );

      expect(isDuplicate).toBe(false);
    });

    it('should not detect duplicate for different phase', async () => {
      const period = new Date('2025-01-15');

      await CostService.createCostEntry(
        {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 1000.00,
          costType: CostType.EMPLOYEE_COST,
        },
        managerUser.id,
        managerUser.role
      );

      const isDuplicate = await CostService.checkDuplicateCostEntry(
        testProject.id,
        testPhase2.id,
        testUser.id,
        period
      );

      expect(isDuplicate).toBe(false);
    });

    it('should return false for no existing entries', async () => {
      const period = new Date('2025-01-15');

      const isDuplicate = await CostService.checkDuplicateCostEntry(
        testProject.id,
        testPhase.id,
        testUser.id,
        period
      );

      expect(isDuplicate).toBe(false);
    });
  });
});
