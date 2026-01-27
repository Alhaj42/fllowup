import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient, PhaseName } from '@prisma/client';

const prisma = new PrismaClient();

describe('KPIEntry Model', () => {
  let testProject: { id: string };
  let testUser: { id: string; email: string };
  let testPhase: { id: string; projectId: string };

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

    const project = await prisma.project.create({
      data: {
        clientId: client.id,
        contractCode: `UNIT-${Date.now()}-${Math.random()}`,
        name: 'Unit Test Project',
        contractSigningDate: new Date('2025-01-01'),
        startDate: new Date('2025-01-01'),
        estimatedEndDate: new Date('2025-03-01'),
        builtUpArea: 1000,
      },
    });
    testProject = project;

    testUser = await prisma.user.create({
      data: {
        email: 'kpi-test@example.com',
        name: 'KPI Test User',
        role: 'TEAM_MEMBER',
      },
    });

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
  });

  afterAll(async () => {
    await prisma.kPIEntry.deleteMany({});
    await prisma.phase.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.$disconnect();
  });

  describe('KPIEntry Creation', () => {
    beforeEach(async () => {
      await prisma.kPIEntry.deleteMany({});
    });

    it('should create KPIEntry with valid data', async () => {
      const kpiEntry = await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
          clientModifications: 2,
          technicalMistakes: 1,
          period: new Date('2025-01-01'),
          score: 85.5,
        },
      });

      expect(kpiEntry).toHaveProperty('id');
      expect(kpiEntry.employeeId).toBe(testUser.id);
      expect(kpiEntry.projectId).toBe(testProject.id);
      expect(kpiEntry.phaseId).toBe(testPhase.id);
      expect(kpiEntry.delayedDays).toBe(5);
      expect(kpiEntry.clientModifications).toBe(2);
      expect(kpiEntry.technicalMistakes).toBe(1);
      expect(kpiEntry.score).toBe(85.5);
    });

    it('should create KPIEntry with zero values', async () => {
      const kpiEntry = await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 0,
          clientModifications: 0,
          technicalMistakes: 0,
        },
      });

      expect(kpiEntry.delayedDays).toBe(0);
      expect(kpiEntry.clientModifications).toBe(0);
      expect(kpiEntry.technicalMistakes).toBe(0);
    });

    it('should create KPIEntry without period', async () => {
      const kpiEntry = await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 3,
        },
      });

      expect(kpiEntry.period).toBeNull();
    });

    it('should create KPIEntry without score', async () => {
      const kpiEntry = await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 2,
        },
      });

      expect(kpiEntry.score).toBeNull();
    });
  });

  describe('KPIEntry Queries', () => {
    beforeEach(async () => {
      await prisma.kPIEntry.deleteMany({});
    });

    it('should find KPI entries by employee', async () => {
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
          phaseId: testPhase.id,
          delayedDays: 3,
        },
      });

      const kpiEntries = await prisma.kPIEntry.findMany({
        where: { employeeId: testUser.id },
      });

      expect(kpiEntries).toHaveLength(2);
      expect(kpiEntries[0].employeeId).toBe(testUser.id);
      expect(kpiEntries[1].employeeId).toBe(testUser.id);
    });

    it('should find KPI entries by project', async () => {
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
          phaseId: testPhase.id,
          clientModifications: 2,
        },
      });

      const kpiEntries = await prisma.kPIEntry.findMany({
        where: { projectId: testProject.id },
      });

      expect(kpiEntries).toHaveLength(2);
      expect(kpiEntries[0].projectId).toBe(testProject.id);
      expect(kpiEntries[1].projectId).toBe(testProject.id);
    });

    it('should find KPI entries by phase', async () => {
      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          technicalMistakes: 3,
        },
      });

      const kpiEntries = await prisma.kPIEntry.findMany({
        where: { phaseId: testPhase.id },
      });

      expect(kpiEntries).toHaveLength(1);
      expect(kpiEntries[0].phaseId).toBe(testPhase.id);
    });

    it('should find KPI entries by period', async () => {
      const period = new Date('2025-01-01');
      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          period: period,
          delayedDays: 1,
        },
      });

      const kpiEntries = await prisma.kPIEntry.findMany({
        where: { period: period },
      });

      expect(kpiEntries).toHaveLength(1);
      expect(kpiEntries[0].period).toEqual(period);
    });

    it('should find KPI entries by score range', async () => {
      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          score: 90,
          delayedDays: 0,
        },
      });

      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          score: 75,
          delayedDays: 2,
        },
      });

      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          score: 60,
          delayedDays: 5,
        },
      });

      const highScoreEntries = await prisma.kPIEntry.findMany({
        where: {
          score: { gte: 80 },
        },
      });

      expect(highScoreEntries).toHaveLength(1);
      expect(highScoreEntries[0].score).toBe(90);
    });
  });

  describe('KPIEntry Updates', () => {
    let kpiEntry: any;

    beforeEach(async () => {
      await prisma.kPIEntry.deleteMany({});
      kpiEntry = await prisma.kPIEntry.create({
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
      const updated = await prisma.kPIEntry.update({
        where: { id: kpiEntry.id },
        data: { delayedDays: 10 },
      });

      expect(updated.delayedDays).toBe(10);
    });

    it('should update clientModifications', async () => {
      const updated = await prisma.kPIEntry.update({
        where: { id: kpiEntry.id },
        data: { clientModifications: 5 },
      });

      expect(updated.clientModifications).toBe(5);
    });

    it('should update technicalMistakes', async () => {
      const updated = await prisma.kPIEntry.update({
        where: { id: kpiEntry.id },
        data: { technicalMistakes: 3 },
      });

      expect(updated.technicalMistakes).toBe(3);
    });

    it('should update score', async () => {
      const updated = await prisma.kPIEntry.update({
        where: { id: kpiEntry.id },
        data: { score: 95.5 },
      });

      expect(updated.score).toBe(95.5);
    });

    it('should update period', async () => {
      const newPeriod = new Date('2025-02-01');
      const updated = await prisma.kPIEntry.update({
        where: { id: kpiEntry.id },
        data: { period: newPeriod },
      });

      expect(updated.period).toEqual(newPeriod);
    });
  });

  describe('KPIEntry Deletion', () => {
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

    it('should delete KPIEntry', async () => {
      await prisma.kPIEntry.delete({
        where: { id: kpiEntry.id },
      });

      const deleted = await prisma.kPIEntry.findUnique({
        where: { id: kpiEntry.id },
      });

      expect(deleted).toBeNull();
    });
  });

  describe('KPIEntry Relationships', () => {
    beforeEach(async () => {
      await prisma.kPIEntry.deleteMany({});
    });

    it('should include employee relation', async () => {
      const kpiEntry = await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
        },
      });

      const withRelations = await prisma.kPIEntry.findUnique({
        where: { id: kpiEntry.id },
        include: { employee: true },
      });

      expect(withRelations?.employee).toBeDefined();
      expect(withRelations?.employee.id).toBe(testUser.id);
      expect(withRelations?.employee.name).toBe('KPI Test User');
    });

    it('should include project relation', async () => {
      const kpiEntry = await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
        },
      });

      const withRelations = await prisma.kPIEntry.findUnique({
        where: { id: kpiEntry.id },
        include: { project: true },
      });

      expect(withRelations?.project).toBeDefined();
      expect(withRelations?.project.id).toBe(testProject.id);
      expect(withRelations?.project.name).toBe('Unit Test Project');
    });

    it('should include phase relation', async () => {
      const kpiEntry = await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
        },
      });

      const withRelations = await prisma.kPIEntry.findUnique({
        where: { id: kpiEntry.id },
        include: { phase: true },
      });

      expect(withRelations?.phase).toBeDefined();
      expect(withRelations?.phase.id).toBe(testPhase.id);
      expect(withRelations?.phase.name).toBe(PhaseName.STUDIES);
    });

    it('should include all relations', async () => {
      const kpiEntry = await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
        },
      });

      const withRelations = await prisma.kPIEntry.findUnique({
        where: { id: kpiEntry.id },
        include: {
          employee: true,
          project: true,
          phase: true,
        },
      });

      expect(withRelations?.employee).toBeDefined();
      expect(withRelations?.project).toBeDefined();
      expect(withRelations?.phase).toBeDefined();
    });
  });
});
