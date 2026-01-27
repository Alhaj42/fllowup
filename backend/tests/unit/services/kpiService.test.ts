import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from '@jest/globals';
import { PrismaClient, PhaseName, Role } from '@prisma/client';
import KPIService from '../../../src/services/kpiService';

// Mock logger
vi.mock('../../../src/utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock AuditLogService
vi.mock('../../../src/services/auditLogService', () => ({
  default: {
    logCreate: vi.fn().mockResolvedValue(undefined),
    logUpdate: vi.fn().mockResolvedValue(undefined),
    logDelete: vi.fn().mockResolvedValue(undefined),
  },
}));

const prisma = new PrismaClient();

describe('KPIService', () => {
  let testProject: { id: string };
  let testUser: { id: string; email: string };
  let testPhase: { id: string };
  let managerUser: { id: string; role: Role };

  beforeAll(async () => {
    await prisma.kPIEntry.deleteMany({});
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

    testProject = await prisma.project.create({
      data: {
        clientId: client.id,
        contractCode: `KPI-${Date.now()}-${Math.random()}`,
        name: 'KPI Test Project',
        contractSigningDate: new Date('2025-01-01'),
        startDate: new Date('2025-01-01'),
        estimatedEndDate: new Date('2025-12-31'),
        builtUpArea: 1000,
      },
    });

    testPhase = await prisma.phase.create({
      data: {
        projectId: testProject.id,
        name: PhaseName.STUDIES,
        startDate: new Date('2025-01-01'),
        duration: 90,
        estimatedEndDate: new Date('2025-04-01'),
        status: 'IN_PROGRESS',
      },
    });

    testUser = await prisma.user.create({
      data: {
        email: 'kpi-team@example.com',
        name: 'KPI Team Member',
        role: 'TEAM_MEMBER',
      },
    });

    managerUser = await prisma.user.create({
      data: {
        email: 'kpi-manager@example.com',
        name: 'KPI Manager',
        role: 'MANAGER',
      },
    });
  });

  afterAll(async () => {
    await prisma.kPIEntry.deleteMany({});
    await prisma.phase.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.$disconnect();
  });

  describe('createKPIEntry', () => {
    beforeEach(async () => {
      await prisma.kPIEntry.deleteMany({});
    });

    it('should create KPI entry with valid data', async () => {
      const kpiEntry = await KPIService.createKPIEntry(
        {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
          clientModifications: 2,
          technicalMistakes: 1,
          period: new Date('2025-01-01'),
        },
        managerUser.id,
        managerUser.role
      );

      expect(kpiEntry).toHaveProperty('id');
      expect(kpiEntry.employeeId).toBe(testUser.id);
      expect(kpiEntry.projectId).toBe(testProject.id);
      expect(kpiEntry.phaseId).toBe(testPhase.id);
      expect(kpiEntry.delayedDays).toBe(5);
      expect(kpiEntry.clientModifications).toBe(2);
      expect(kpiEntry.technicalMistakes).toBe(1);
    });

    it('should calculate score automatically when not provided', async () => {
      const kpiEntry = await KPIService.createKPIEntry(
        {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 3,
          clientModifications: 1,
          technicalMistakes: 0,
          period: new Date('2025-01-01'),
        },
        managerUser.id,
        managerUser.role
      );

      // Score calculation: base 100 - (delayedDays * 2) - (clientModifications * 3) - (technicalMistakes * 5)
      // 100 - (3 * 2) - (1 * 3) - (0 * 5) = 100 - 6 - 3 - 0 = 91
      expect(kpiEntry.score).toBe(91);
    });

    it('should throw error for non-existent employee', async () => {
      await expect(
        KPIService.createKPIEntry(
          {
            employeeId: 'non-existent-user-id',
            projectId: testProject.id,
            phaseId: testPhase.id,
            delayedDays: 5,
          },
          managerUser.id,
          managerUser.role
        )
      ).rejects.toThrow('Employee not found');
    });

    it('should throw error for non-existent project', async () => {
      await expect(
        KPIService.createKPIEntry(
          {
            employeeId: testUser.id,
            projectId: 'non-existent-project-id',
            phaseId: testPhase.id,
            delayedDays: 5,
          },
          managerUser.id,
          managerUser.role
        )
      ).rejects.toThrow('Project not found');
    });

    it('should throw error for non-existent phase', async () => {
      await expect(
        KPIService.createKPIEntry(
          {
            employeeId: testUser.id,
            projectId: testProject.id,
            phaseId: 'non-existent-phase-id',
            delayedDays: 5,
          },
          managerUser.id,
          managerUser.role
        )
      ).rejects.toThrow('Phase not found');
    });

    it('should throw error for negative values', async () => {
      await expect(
        KPIService.createKPIEntry(
          {
            employeeId: testUser.id,
            projectId: testProject.id,
            phaseId: testPhase.id,
            delayedDays: -5,
          },
          managerUser.id,
          managerUser.role
        )
      ).rejects.toThrow('delayedDays cannot be negative');
    });

    it('should create KPI entry with zero values', async () => {
      const kpiEntry = await KPIService.createKPIEntry(
        {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 0,
          clientModifications: 0,
          technicalMistakes: 0,
          period: new Date('2025-01-01'),
        },
        managerUser.id,
        managerUser.role
      );

      expect(kpiEntry.delayedDays).toBe(0);
      expect(kpiEntry.clientModifications).toBe(0);
      expect(kpiEntry.technicalMistakes).toBe(0);
      expect(kpiEntry.score).toBe(100);
    });
  });

  describe('getEmployeeKPIs', () => {
    beforeEach(async () => {
      await prisma.kPIEntry.deleteMany({});
    });

    it('should return empty array for employee with no KPIs', async () => {
      const kpis = await KPIService.getEmployeeKPIs(testUser.id);

      expect(kpis).toHaveLength(0);
    });

    it('should return all KPIs for employee', async () => {
      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
          period: new Date('2025-01-01'),
        },
      });

      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 3,
          period: new Date('2025-02-01'),
        },
      });

      const kpis = await KPIService.getEmployeeKPIs(testUser.id);

      expect(kpis).toHaveLength(2);
      expect(kpis[0].employeeId).toBe(testUser.id);
      expect(kpis[1].employeeId).toBe(testUser.id);
    });

    it('should filter by projectId when provided', async () => {
      const client2 = await prisma.client.create({
        data: {
          name: 'Test Client 2',
          contactEmail: 'test2@example.com',
        },
      });

      const project2 = await prisma.project.create({
        data: {
          clientId: client2.id,
          contractCode: `KPI2-${Date.now()}`,
          name: 'KPI Test Project 2',
          contractSigningDate: new Date('2025-01-01'),
          startDate: new Date('2025-01-01'),
          estimatedEndDate: new Date('2025-12-31'),
          builtUpArea: 1000,
        },
      });

      const phase2 = await prisma.phase.create({
        data: {
          projectId: project2.id,
          name: PhaseName.DESIGN,
          startDate: new Date('2025-01-01'),
          duration: 90,
          estimatedEndDate: new Date('2025-04-01'),
          status: 'PLANNED',
        },
      });

      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
        },
      });

      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: project2.id,
          phaseId: phase2.id,
          delayedDays: 3,
        },
      });

      const kpis = await KPIService.getEmployeeKPIs(testUser.id, { projectId: testProject.id });

      expect(kpis).toHaveLength(1);
      expect(kpis[0].projectId).toBe(testProject.id);
    });

    it('should filter by phaseId when provided', async () => {
      const phase2 = await prisma.phase.create({
        data: {
          projectId: testProject.id,
          name: PhaseName.DESIGN,
          startDate: new Date('2025-01-01'),
          duration: 90,
          estimatedEndDate: new Date('2025-04-01'),
          status: 'PLANNED',
        },
      });

      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
        },
      });

      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: phase2.id,
          delayedDays: 3,
        },
      });

      const kpis = await KPIService.getEmployeeKPIs(testUser.id, { phaseId: testPhase.id });

      expect(kpis).toHaveLength(1);
      expect(kpis[0].phaseId).toBe(testPhase.id);
    });

    it('should filter by startDate and endDate when provided', async () => {
      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
          period: new Date('2025-01-15'),
        },
      });

      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 3,
          period: new Date('2025-02-15'),
        },
      });

      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 2,
          period: new Date('2025-03-15'),
        },
      });

      const kpis = await KPIService.getEmployeeKPIs(testUser.id, {
        startDate: '2025-01-01',
        endDate: '2025-02-28',
      });

      expect(kpis).toHaveLength(2);
    });

    it('should include employee, project, and phase relations', async () => {
      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
        },
      });

      const kpis = await KPIService.getEmployeeKPIs(testUser.id);

      expect(kpis[0].employee).toBeDefined();
      expect(kpis[0].project).toBeDefined();
      expect(kpis[0].phase).toBeDefined();
      expect(kpis[0].employee.name).toBe('KPI Team Member');
      expect(kpis[0].project.name).toBe('KPI Test Project');
      expect(kpis[0].phase.name).toBe(PhaseName.STUDIES);
    });
  });

  describe('updateKPIEntry', () => {
    let existingKPIEntry: any;

    beforeEach(async () => {
      await prisma.kPIEntry.deleteMany({});
      existingKPIEntry = await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
          clientModifications: 2,
          technicalMistakes: 1,
        },
      });
    });

    it('should update delayedDays', async () => {
      const updated = await KPIService.updateKPIEntry(
        existingKPIEntry.id,
        { delayedDays: 10 },
        managerUser.id,
        managerUser.role
      );

      expect(updated.delayedDays).toBe(10);
    });

    it('should update clientModifications', async () => {
      const updated = await KPIService.updateKPIEntry(
        existingKPIEntry.id,
        { clientModifications: 5 },
        managerUser.id,
        managerUser.role
      );

      expect(updated.clientModifications).toBe(5);
    });

    it('should update technicalMistakes', async () => {
      const updated = await KPIService.updateKPIEntry(
        existingKPIEntry.id,
        { technicalMistakes: 3 },
        managerUser.id,
        managerUser.role
      );

      expect(updated.technicalMistakes).toBe(3);
    });

    it('should update multiple fields', async () => {
      const updated = await KPIService.updateKPIEntry(
        existingKPIEntry.id,
        {
          delayedDays: 8,
          clientModifications: 3,
          technicalMistakes: 2,
        },
        managerUser.id,
        managerUser.role
      );

      expect(updated.delayedDays).toBe(8);
      expect(updated.clientModifications).toBe(3);
      expect(updated.technicalMistakes).toBe(2);
    });

    it('should recalculate score on update', async () => {
      const updated = await KPIService.updateKPIEntry(
        existingKPIEntry.id,
        {
          delayedDays: 2,
          clientModifications: 0,
          technicalMistakes: 0,
        },
        managerUser.id,
        managerUser.role
      );

      // 100 - (2 * 2) - (0 * 3) - (0 * 5) = 100 - 4 = 96
      expect(updated.score).toBe(96);
    });

    it('should throw error for non-existent KPI entry', async () => {
      await expect(
        KPIService.updateKPIEntry(
          'non-existent-kpi-id',
          { delayedDays: 10 },
          managerUser.id,
          managerUser.role
        )
      ).rejects.toThrow('KPI entry not found');
    });

    it('should throw error for negative values on update', async () => {
      await expect(
        KPIService.updateKPIEntry(
          existingKPIEntry.id,
          { delayedDays: -5 },
          managerUser.id,
          managerUser.role
        )
      ).rejects.toThrow('delayedDays cannot be negative');
    });
  });

  describe('deleteKPIEntry', () => {
    let kpiEntry: any;

    beforeEach(async () => {
      await prisma.kPIEntry.deleteMany({});
      kpiEntry = await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
        },
      });
    });

    it('should delete KPI entry successfully', async () => {
      await KPIService.deleteKPIEntry(kpiEntry.id, managerUser.id, managerUser.role);

      const deleted = await prisma.kPIEntry.findUnique({
        where: { id: kpiEntry.id },
      });

      expect(deleted).toBeNull();
    });

    it('should throw error for non-existent KPI entry', async () => {
      await expect(
        KPIService.deleteKPIEntry(
          'non-existent-kpi-id',
          managerUser.id,
          managerUser.role
        )
      ).rejects.toThrow('KPI entry not found');
    });
  });

  describe('getKPISummary', () => {
    beforeEach(async () => {
      await prisma.kPIEntry.deleteMany({});
    });

    it('should return summary for employee with no KPIs', async () => {
      const summary = await KPIService.getKPISummary(testUser.id);

      expect(summary.employeeId).toBe(testUser.id);
      expect(summary.totalKPIs).toBe(0);
      expect(summary.averageScore).toBeNull();
      expect(summary.totalDelayedDays).toBe(0);
      expect(summary.totalClientModifications).toBe(0);
      expect(summary.totalTechnicalMistakes).toBe(0);
    });

    it('should calculate summary for employee with KPIs', async () => {
      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
          clientModifications: 2,
          technicalMistakes: 1,
          score: 90,
        },
      });

      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 3,
          clientModifications: 1,
          technicalMistakes: 0,
          score: 95,
        },
      });

      const summary = await KPIService.getKPISummary(testUser.id);

      expect(summary.employeeId).toBe(testUser.id);
      expect(summary.totalKPIs).toBe(2);
      expect(summary.averageScore).toBe(92.5);
      expect(summary.totalDelayedDays).toBe(8);
      expect(summary.totalClientModifications).toBe(3);
      expect(summary.totalTechnicalMistakes).toBe(1);
    });

    it('should filter by date range', async () => {
      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
          period: new Date('2025-01-15'),
        },
      });

      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 3,
          period: new Date('2025-02-15'),
        },
      });

      const summary = await KPIService.getKPISummary(testUser.id, {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      expect(summary.totalKPIs).toBe(1);
      expect(summary.totalDelayedDays).toBe(5);
    });

    it('should include employee details', async () => {
      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
        },
      });

      const summary = await KPIService.getKPISummary(testUser.id);

      expect(summary.employee).toBeDefined();
      expect(summary.employee.id).toBe(testUser.id);
      expect(summary.employee.name).toBe('KPI Team Member');
    });
  });

  describe('getKPITrends', () => {
    beforeEach(async () => {
      await prisma.kPIEntry.deleteMany({});
    });

    it('should return empty array for employee with no KPIs', async () => {
      const trends = await KPIService.getKPITrends(testUser.id);

      expect(trends).toHaveLength(0);
    });

    it('should return KPI trends over time', async () => {
      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
          score: 90,
          period: new Date('2025-01-01'),
        },
      });

      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 3,
          score: 95,
          period: new Date('2025-02-01'),
        },
      });

      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 2,
          score: 97,
          period: new Date('2025-03-01'),
        },
      });

      const trends = await KPIService.getKPITrends(testUser.id);

      expect(trends).toHaveLength(3);
      expect(trends[0].score).toBe(90);
      expect(trends[1].score).toBe(95);
      expect(trends[2].score).toBe(97);
    });

    it('should filter by date range', async () => {
      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
          score: 90,
          period: new Date('2025-01-01'),
        },
      });

      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 3,
          score: 95,
          period: new Date('2025-02-01'),
        },
      });

      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 2,
          score: 97,
          period: new Date('2025-03-01'),
        },
      });

      const trends = await KPIService.getKPITrends(testUser.id, {
        startDate: '2025-02-01',
        endDate: '2025-02-28',
      });

      expect(trends).toHaveLength(1);
      expect(trends[0].score).toBe(95);
    });

    it('should sort trends by period', async () => {
      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
          score: 90,
          period: new Date('2025-03-01'),
        },
      });

      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 3,
          score: 95,
          period: new Date('2025-01-01'),
        },
      });

      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 2,
          score: 97,
          period: new Date('2025-02-01'),
        },
      });

      const trends = await KPIService.getKPITrends(testUser.id);

      expect(trends).toHaveLength(3);
      expect(trends[0].period).toEqual(new Date('2025-01-01'));
      expect(trends[1].period).toEqual(new Date('2025-02-01'));
      expect(trends[2].period).toEqual(new Date('2025-03-01'));
    });
  });
});
