import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient, CostType, PhaseName } from '@prisma/client';

const prisma = new PrismaClient();

describe('CostEntry Model', () => {
  let testClient: { id: string };
  let testProject: { id: string };
  let testPhase: { id: string };
  let testUser: { id: string };

  beforeAll(async () => {
    await prisma.costEntry.deleteMany({});
    await prisma.phase.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.client.deleteMany({});

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
        contractCode: `COST-${Date.now()}-${Math.random()}`,
        name: 'Cost Test Project',
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

    const user = await prisma.user.create({
      data: {
        email: 'cost-test@example.com',
        name: 'Cost Test User',
        role: 'TEAM_MEMBER',
      },
    });
    testUser = user;
  });

  afterAll(async () => {
    await prisma.costEntry.deleteMany({});
    await prisma.phase.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.$disconnect();
  });

  describe('CostEntry Creation', () => {
    beforeEach(async () => {
      await prisma.costEntry.deleteMany({});
    });

    it('should create cost entry with valid data', async () => {
      const period = new Date('2025-01-15');
      
      const costEntry = await prisma.costEntry.create({
        data: {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 1000.50,
          costType: CostType.EMPLOYEE_COST,
          description: 'Test cost entry',
        },
      });

      expect(costEntry).toHaveProperty('id');
      expect(costEntry.projectId).toBe(testProject.id);
      expect(costEntry.phaseId).toBe(testPhase.id);
      expect(costEntry.employeeId).toBe(testUser.id);
      expect(Number(costEntry.costAmount)).toBe(1000.50);
      expect(costEntry.costType).toBe(CostType.EMPLOYEE_COST);
      expect(costEntry.description).toBe('Test cost entry');
    });

    it('should create employee cost entry', async () => {
      const period = new Date('2025-01-15');
      
      const costEntry = await prisma.costEntry.create({
        data: {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 2500.00,
          costType: CostType.EMPLOYEE_COST,
          description: 'Employee labor cost',
        },
      });

      expect(costEntry.costType).toBe(CostType.EMPLOYEE_COST);
      expect(Number(costEntry.costAmount)).toBe(2500.00);
    });

    it('should create material cost entry', async () => {
      const period = new Date('2025-01-15');
      
      const costEntry = await prisma.costEntry.create({
        data: {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 5000.00,
          costType: CostType.MATERIAL_COST,
          description: 'Building materials',
        },
      });

      expect(costEntry.costType).toBe(CostType.MATERIAL_COST);
      expect(Number(costEntry.costAmount)).toBe(5000.00);
    });

    it('should create other cost entry', async () => {
      const period = new Date('2025-01-15');
      
      const costEntry = await prisma.costEntry.create({
        data: {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 750.00,
          costType: CostType.OTHER_COST,
          description: 'Transportation costs',
        },
      });

      expect(costEntry.costType).toBe(CostType.OTHER_COST);
      expect(Number(costEntry.costAmount)).toBe(750.00);
    });

    it('should create cost entry with optional description', async () => {
      const period = new Date('2025-01-15');
      
      const costEntry = await prisma.costEntry.create({
        data: {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 1500.00,
          costType: CostType.MATERIAL_COST,
        },
      });

      expect(costEntry.description).toBeNull();
      expect(Number(costEntry.costAmount)).toBe(1500.00);
    });

    it('should enforce unique constraint on projectId + phaseId + employeeId + period', async () => {
      const period = new Date('2025-01-15');
      
      await prisma.costEntry.create({
        data: {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 1000.00,
          costType: CostType.EMPLOYEE_COST,
        },
      });

      await expect(
        prisma.costEntry.create({
          data: {
            projectId: testProject.id,
            phaseId: testPhase.id,
            employeeId: testUser.id,
            period,
            costAmount: 2000.00,
            costType: CostType.MATERIAL_COST,
          },
        })
      ).rejects.toThrow();
    });

    it('should allow same employee with different periods', async () => {
      const period1 = new Date('2025-01-15');
      const period2 = new Date('2025-02-15');
      
      const costEntry1 = await prisma.costEntry.create({
        data: {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period: period1,
          costAmount: 1000.00,
          costType: CostType.EMPLOYEE_COST,
        },
      });

      const costEntry2 = await prisma.costEntry.create({
        data: {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period: period2,
          costAmount: 2000.00,
          costType: CostType.EMPLOYEE_COST,
        },
      });

      expect(costEntry1.period.getTime()).toBe(period1.getTime());
      expect(costEntry2.period.getTime()).toBe(period2.getTime());
      expect(costEntry1.id).not.toBe(costEntry2.id);
    });
  });

  describe('CostEntry Queries', () => {
    beforeEach(async () => {
      await prisma.costEntry.deleteMany({});
    });

    it('should find cost entries by project', async () => {
      const period = new Date('2025-01-15');
      
      await prisma.costEntry.create({
        data: {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 1000.00,
          costType: CostType.EMPLOYEE_COST,
        },
      });

      const costEntries = await prisma.costEntry.findMany({
        where: { projectId: testProject.id },
      });

      expect(costEntries).toHaveLength(1);
      expect(costEntries[0].projectId).toBe(testProject.id);
    });

    it('should find cost entries by phase', async () => {
      const period = new Date('2025-01-15');
      
      await prisma.costEntry.create({
        data: {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 1000.00,
          costType: CostType.EMPLOYEE_COST,
        },
      });

      const costEntries = await prisma.costEntry.findMany({
        where: { phaseId: testPhase.id },
      });

      expect(costEntries).toHaveLength(1);
      expect(costEntries[0].phaseId).toBe(testPhase.id);
    });

    it('should find cost entries by employee', async () => {
      const period = new Date('2025-01-15');
      
      await prisma.costEntry.create({
        data: {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 1000.00,
          costType: CostType.EMPLOYEE_COST,
        },
      });

      const costEntries = await prisma.costEntry.findMany({
        where: { employeeId: testUser.id },
      });

      expect(costEntries).toHaveLength(1);
      expect(costEntries[0].employeeId).toBe(testUser.id);
    });

    it('should find cost entries by cost type', async () => {
      const period = new Date('2025-01-15');
      
      await prisma.costEntry.create({
        data: {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 1000.00,
          costType: CostType.EMPLOYEE_COST,
        },
      });

      await prisma.costEntry.create({
        data: {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period: new Date('2025-02-15'),
          costAmount: 2000.00,
          costType: CostType.MATERIAL_COST,
        },
      });

      const employeeCosts = await prisma.costEntry.findMany({
        where: { costType: CostType.EMPLOYEE_COST },
      });

      const materialCosts = await prisma.costEntry.findMany({
        where: { costType: CostType.MATERIAL_COST },
      });

      expect(employeeCosts).toHaveLength(1);
      expect(materialCosts).toHaveLength(1);
      expect(employeeCosts[0].costType).toBe(CostType.EMPLOYEE_COST);
      expect(materialCosts[0].costType).toBe(CostType.MATERIAL_COST);
    });

    it('should include related data', async () => {
      const period = new Date('2025-01-15');
      
      await prisma.costEntry.create({
        data: {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 1000.00,
          costType: CostType.EMPLOYEE_COST,
          description: 'Test cost',
        },
      });

      const costEntries = await prisma.costEntry.findMany({
        where: { projectId: testProject.id },
        include: {
          project: true,
          phase: true,
          employee: true,
        },
      });

      expect(costEntries).toHaveLength(1);
      expect(costEntries[0].project).toBeDefined();
      expect(costEntries[0].phase).toBeDefined();
      expect(costEntries[0].employee).toBeDefined();
      expect(costEntries[0].employee.email).toBe('cost-test@example.com');
    });
  });

  describe('CostEntry Updates', () => {
    beforeEach(async () => {
      await prisma.costEntry.deleteMany({});
    });

    it('should update cost amount', async () => {
      const period = new Date('2025-01-15');
      
      const costEntry = await prisma.costEntry.create({
        data: {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 1000.00,
          costType: CostType.EMPLOYEE_COST,
        },
      });

      const updated = await prisma.costEntry.update({
        where: { id: costEntry.id },
        data: { costAmount: 1500.00 },
      });

      expect(Number(updated.costAmount)).toBe(1500.00);
    });

    it('should update cost type', async () => {
      const period = new Date('2025-01-15');
      
      const costEntry = await prisma.costEntry.create({
        data: {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 1000.00,
          costType: CostType.EMPLOYEE_COST,
        },
      });

      const updated = await prisma.costEntry.update({
        where: { id: costEntry.id },
        data: { costType: CostType.OTHER_COST },
      });

      expect(updated.costType).toBe(CostType.OTHER_COST);
    });

    it('should update description', async () => {
      const period = new Date('2025-01-15');
      
      const costEntry = await prisma.costEntry.create({
        data: {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 1000.00,
          costType: CostType.EMPLOYEE_COST,
          description: 'Original description',
        },
      });

      const updated = await prisma.costEntry.update({
        where: { id: costEntry.id },
        data: { description: 'Updated description' },
      });

      expect(updated.description).toBe('Updated description');
    });

    it('should track updatedAt timestamp', async () => {
      const period = new Date('2025-01-15');
      
      const costEntry = await prisma.costEntry.create({
        data: {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 1000.00,
          costType: CostType.EMPLOYEE_COST,
        },
      });

      const originalUpdatedAt = costEntry.updatedAt;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = await prisma.costEntry.update({
        where: { id: costEntry.id },
        data: { description: 'Updated' },
      });

      expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('CostEntry Deletion', () => {
    beforeEach(async () => {
      await prisma.costEntry.deleteMany({});
    });

    it('should delete cost entry', async () => {
      const period = new Date('2025-01-15');
      
      const costEntry = await prisma.costEntry.create({
        data: {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 1000.00,
          costType: CostType.EMPLOYEE_COST,
        },
      });

      await prisma.costEntry.delete({
        where: { id: costEntry.id },
      });

      const deleted = await prisma.costEntry.findUnique({
        where: { id: costEntry.id },
      });

      expect(deleted).toBeNull();
    });

    it('should cascade delete when project is deleted', async () => {
      const period = new Date('2025-01-15');
      
      await prisma.costEntry.create({
        data: {
          projectId: testProject.id,
          phaseId: testPhase.id,
          employeeId: testUser.id,
          period,
          costAmount: 1000.00,
          costType: CostType.EMPLOYEE_COST,
        },
      });

      await prisma.project.delete({
        where: { id: testProject.id },
      });

      const costEntries = await prisma.costEntry.findMany({
        where: { projectId: testProject.id },
      });

      expect(costEntries).toHaveLength(0);
    });
  });
});
