import { PrismaClient, Phase, PhaseStatus, PhaseName } from '@prisma/client';

const prisma = new PrismaClient();

describe('Phase Model', () => {
  let testProject: any;
  let testUser: any;

  beforeAll(async () => {
    testUser = await prisma.user.create({
      data: {
        email: 'test-phase@example.com',
        name: 'Test User',
        role: 'MANAGER',
        position: 'Project Manager',
        region: 'North',
      },
    });

    testProject = await prisma.project.create({
      data: {
        name: 'Test Project for Phases',
        contractCode: 'PHASE-001',
        clientId: 'client-1',
        contractSigningDate: new Date('2024-01-01'),
        builtUpArea: 1000,
        startDate: new Date('2024-01-15'),
        estimatedEndDate: new Date('2024-12-31'),
        status: 'PLANNED',
        createdBy: testUser.id,
      },
    });
  });

  afterAll(async () => {
    await prisma.task.deleteMany({});
    await prisma.phase.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe('Create Operations', () => {
    it('should create a phase successfully', async () => {
      const phase = await prisma.phase.create({
        data: {
          projectId: testProject.id,
          name: 'STUDIES',
          startDate: new Date('2024-02-01'),
          duration: 30,
          estimatedEndDate: new Date('2024-03-03'),
          status: 'PLANNED',
        },
      });

      expect(phase).toBeDefined();
      expect(phase.id).toBeDefined();
      expect(phase.projectId).toBe(testProject.id);
      expect(phase.name).toBe('STUDIES');
      expect(phase.startDate).toBeDefined();
      expect(phase.duration).toBe(30);
      expect(phase.estimatedEndDate).toBeDefined();
      expect(phase.status).toBe('PLANNED');
      expect(phase.actualStartDate).toBeNull();
      expect(phase.actualEndDate).toBeNull();
      expect(phase.progress.toNumber()).toBe(0);
      expect(phase.version).toBe(1);
    });

    it('should create DESIGN phase', async () => {
      const phase = await prisma.phase.create({
        data: {
          projectId: testProject.id,
          name: 'DESIGN',
          startDate: new Date('2024-03-04'),
          duration: 45,
          estimatedEndDate: new Date('2024-04-18'),
          status: 'PLANNED',
        },
      });

      expect(phase.name).toBe('DESIGN');
    });

    it('should create phase with progress', async () => {
      const phase = await prisma.phase.create({
        data: {
          projectId: testProject.id,
          name: 'STUDIES',
          startDate: new Date('2024-02-01'),
          duration: 30,
          estimatedEndDate: new Date('2024-03-03'),
          status: 'IN_PROGRESS',
          progress: 50,
        },
      });

      expect(phase.progress.toNumber()).toBe(50);
      expect(phase.status).toBe('IN_PROGRESS');
    });

    it('should fail to create phase without required fields', async () => {
      await expect(
        prisma.phase.create({
          data: {
            projectId: testProject.id,
          } as any,
        })
      ).rejects.toThrow();
    });

    it('should enforce unique constraint on projectId + name', async () => {
      const phaseData = {
        projectId: testProject.id,
        name: 'STUDIES' as PhaseName,
        startDate: new Date('2024-02-01'),
        duration: 30,
        estimatedEndDate: new Date('2024-03-03'),
        status: 'PLANNED',
      };

      await prisma.phase.create({ data: phaseData });

      await expect(
        prisma.phase.create({ data: phaseData })
      ).rejects.toThrow();
    });
  });

  describe('Update Operations', () => {
    let phase: Phase;

    beforeEach(async () => {
      phase = await prisma.phase.create({
        data: {
          projectId: testProject.id,
          name: 'STUDIES',
          startDate: new Date('2024-02-01'),
          duration: 30,
          estimatedEndDate: new Date('2024-03-03'),
          status: 'PLANNED',
        },
      });
    });

    afterEach(async () => {
      await prisma.phase.delete({ where: { id: phase.id } });
    });

    it('should update phase status', async () => {
      const updated = await prisma.phase.update({
        where: { id: phase.id },
        data: { status: 'IN_PROGRESS' },
      });

      expect(updated.status).toBe('IN_PROGRESS');
    });

    it('should update phase progress', async () => {
      const updated = await prisma.phase.update({
        where: { id: phase.id },
        data: { progress: 75 },
      });

      expect(updated.progress.toNumber()).toBe(75);
    });

    it('should mark phase as started', async () => {
      const updated = await prisma.phase.update({
        where: { id: phase.id },
        data: {
          status: 'IN_PROGRESS',
          actualStartDate: new Date('2024-02-01'),
        },
      });

      expect(updated.status).toBe('IN_PROGRESS');
      expect(updated.actualStartDate).toBeDefined();
    });

    it('should mark phase as completed', async () => {
      const updated = await prisma.phase.update({
        where: { id: phase.id },
        data: {
          status: 'COMPLETED',
          actualEndDate: new Date('2024-03-02'),
          progress: 100,
        },
      });

      expect(updated.status).toBe('COMPLETED');
      expect(updated.actualEndDate).toBeDefined();
      expect(updated.progress.toNumber()).toBe(100);
    });

    it('should update duration', async () => {
      const updated = await prisma.phase.update({
        where: { id: phase.id },
        data: { duration: 45 },
      });

      expect(updated.duration).toBe(45);
    });

    it('should increment version on update', async () => {
      const updated = await prisma.phase.update({
        where: { id: phase.id },
        data: { progress: 25 },
      });

      expect(updated.version).toBe(phase.version + 1);
    });
  });

  describe('Read Operations', () => {
    let phases: Phase[];

    beforeEach(async () => {
      phases = await Promise.all([
        prisma.phase.create({
          data: {
            projectId: testProject.id,
            name: 'STUDIES',
            startDate: new Date('2024-02-01'),
            duration: 30,
            estimatedEndDate: new Date('2024-03-03'),
            status: 'PLANNED',
          },
        }),
        prisma.phase.create({
          data: {
            projectId: testProject.id,
            name: 'DESIGN',
            startDate: new Date('2024-03-04'),
            duration: 45,
            estimatedEndDate: new Date('2024-04-18'),
            status: 'PLANNED',
          },
        }),
      ]);
    });

    afterEach(async () => {
      await prisma.phase.deleteMany({});
    });

    it('should find phase by id', async () => {
      const found = await prisma.phase.findUnique({
        where: { id: phases[0].id },
      });

      expect(found).toBeDefined();
      expect(found?.id).toBe(phases[0].id);
      expect(found?.name).toBe('STUDIES');
    });

    it('should find all phases for a project', async () => {
      const found = await prisma.phase.findMany({
        where: { projectId: testProject.id },
        orderBy: { startDate: 'asc' },
      });

      expect(found).toHaveLength(2);
      expect(found[0].name).toBe('STUDIES');
      expect(found[1].name).toBe('DESIGN');
    });

    it('should find phases by status', async () => {
      const completedPhase = await prisma.phase.create({
        data: {
          projectId: testProject.id,
          name: 'STUDIES-COMP',
          startDate: new Date('2024-01-01'),
          duration: 30,
          estimatedEndDate: new Date('2024-01-31'),
          status: 'COMPLETED',
          progress: 100,
          actualStartDate: new Date('2024-01-01'),
          actualEndDate: new Date('2024-01-31'),
        },
      });

      const found = await prisma.phase.findMany({
        where: { status: 'COMPLETED' },
      });

      expect(found.length).toBeGreaterThanOrEqual(1);
      expect(found.some(p => p.name === 'STUDIES-COMP')).toBe(true);

      await prisma.phase.delete({ where: { id: completedPhase.id } });
    });

    it('should include related project', async () => {
      const found = await prisma.phase.findUnique({
        where: { id: phases[0].id },
        include: { project: true },
      });

      expect(found?.project).toBeDefined();
      expect(found?.project?.id).toBe(testProject.id);
    });

    it('should include related tasks', async () => {
      await prisma.task.create({
        data: {
          phaseId: phases[0].id,
          code: 'TASK-1',
          description: 'Test task',
          duration: 10,
          status: 'PLANNED',
        },
      });

      const found = await prisma.phase.findUnique({
        where: { id: phases[0].id },
        include: { tasks: true },
      });

      expect(found?.tasks).toBeDefined();
      expect(found?.tasks.length).toBeGreaterThan(0);

      await prisma.task.deleteMany({});
    });
  });

  describe('Delete Operations', () => {
    let phase: Phase;

    beforeEach(async () => {
      phase = await prisma.phase.create({
        data: {
          projectId: testProject.id,
          name: 'STUDIES',
          startDate: new Date('2024-02-01'),
          duration: 30,
          estimatedEndDate: new Date('2024-03-03'),
          status: 'PLANNED',
        },
      });
    });

    it('should delete a phase', async () => {
      await prisma.phase.delete({
        where: { id: phase.id },
      });

      const found = await prisma.phase.findUnique({
        where: { id: phase.id },
      });

      expect(found).toBeNull();
    });
  });

  describe('Date Constraints', () => {
    it('should accept valid date range', async () => {
      const phase = await prisma.phase.create({
        data: {
          projectId: testProject.id,
          name: 'STUDIES',
          startDate: new Date('2024-02-01'),
          duration: 30,
          estimatedEndDate: new Date('2024-03-03'),
          status: 'PLANNED',
        },
      });

      expect(phase.startDate).toBeDefined();
      expect(phase.estimatedEndDate).toBeDefined();
    });

    it('should accept null actual dates (not started)', async () => {
      const phase = await prisma.phase.create({
        data: {
          projectId: testProject.id,
          name: 'STUDIES',
          startDate: new Date('2024-02-01'),
          duration: 30,
          estimatedEndDate: new Date('2024-03-03'),
          status: 'PLANNED',
        },
      });

      expect(phase.actualStartDate).toBeNull();
      expect(phase.actualEndDate).toBeNull();
    });
  });

  describe('Progress Values', () => {
    it('should accept progress between 0 and 100', async () => {
      const phase = await prisma.phase.create({
        data: {
          projectId: testProject.id,
          name: 'STUDIES',
          startDate: new Date('2024-02-01'),
          duration: 30,
          estimatedEndDate: new Date('2024-03-03'),
          status: 'IN_PROGRESS',
          progress: 50,
        },
      });

      expect(phase.progress.toNumber()).toBe(50);
    });

    it('should default progress to 0 for PLANNED phases', async () => {
      const phase = await prisma.phase.create({
        data: {
          projectId: testProject.id,
          name: 'STUDIES',
          startDate: new Date('2024-02-01'),
          duration: 30,
          estimatedEndDate: new Date('2024-03-03'),
          status: 'PLANNED',
        },
      });

      expect(phase.progress.toNumber()).toBe(0);
    });

    it('should allow progress of 100 for COMPLETED phases', async () => {
      const phase = await prisma.phase.create({
        data: {
          projectId: testProject.id,
          name: 'STUDIES',
          startDate: new Date('2024-01-01'),
          duration: 30,
          estimatedEndDate: new Date('2024-01-31'),
          status: 'COMPLETED',
          progress: 100,
        },
      });

      expect(phase.progress.toNumber()).toBe(100);
    });
  });

  describe('Status Transitions', () => {
    it('should allow PLANNED to IN_PROGRESS transition', async () => {
      const phase = await prisma.phase.create({
        data: {
          projectId: testProject.id,
          name: 'STUDIES',
          startDate: new Date('2024-02-01'),
          duration: 30,
          estimatedEndDate: new Date('2024-03-03'),
          status: 'PLANNED',
        },
      });

      const updated = await prisma.phase.update({
        where: { id: phase.id },
        data: {
          status: 'IN_PROGRESS',
          actualStartDate: new Date('2024-02-01'),
        },
      });

      expect(updated.status).toBe('IN_PROGRESS');
    });

    it('should allow IN_PROGRESS to COMPLETED transition', async () => {
      const phase = await prisma.phase.create({
        data: {
          projectId: testProject.id,
          name: 'STUDIES',
          startDate: new Date('2024-02-01'),
          duration: 30,
          estimatedEndDate: new Date('2024-03-03'),
          status: 'IN_PROGRESS',
          actualStartDate: new Date('2024-02-01'),
        },
      });

      const updated = await prisma.phase.update({
        where: { id: phase.id },
        data: {
          status: 'COMPLETED',
          actualEndDate: new Date('2024-02-28'),
          progress: 100,
        },
      });

      expect(updated.status).toBe('COMPLETED');
    });

    it('should allow ON_HOLD status', async () => {
      const phase = await prisma.phase.create({
        data: {
          projectId: testProject.id,
          name: 'STUDIES',
          startDate: new Date('2024-02-01'),
          duration: 30,
          estimatedEndDate: new Date('2024-03-03'),
          status: 'PLANNED',
        },
      });

      const updated = await prisma.phase.update({
        where: { id: phase.id },
        data: { status: 'ON_HOLD' },
      });

      expect(updated.status).toBe('ON_HOLD');
    });
  });

  describe('Duration Values', () => {
    it('should accept positive duration', async () => {
      const phase = await prisma.phase.create({
        data: {
          projectId: testProject.id,
          name: 'STUDIES',
          startDate: new Date('2024-02-01'),
          duration: 30,
          estimatedEndDate: new Date('2024-03-03'),
          status: 'PLANNED',
        },
      });

      expect(phase.duration).toBe(30);
    });

    it('should accept long duration', async () => {
      const phase = await prisma.phase.create({
        data: {
          projectId: testProject.id,
          name: 'DESIGN',
          startDate: new Date('2024-01-01'),
          duration: 365,
          estimatedEndDate: new Date('2024-12-31'),
          status: 'PLANNED',
        },
      });

      expect(phase.duration).toBe(365);
    });
  });

  describe('Cascade Operations', () => {
    let phase: Phase;

    beforeEach(async () => {
      phase = await prisma.phase.create({
        data: {
          projectId: testProject.id,
          name: 'STUDIES',
          startDate: new Date('2024-02-01'),
          duration: 30,
          estimatedEndDate: new Date('2024-03-03'),
          status: 'PLANNED',
        },
      });
    });

    it('should cascade delete tasks when phase is deleted', async () => {
      await prisma.task.create({
        data: {
          phaseId: phase.id,
          code: 'TASK-CASCADE',
          description: 'Cascade test task',
          duration: 10,
          status: 'PLANNED',
        },
      });

      await prisma.phase.delete({
        where: { id: phase.id },
      });

      const found = await prisma.task.findUnique({
        where: { code: 'TASK-CASCADE' },
      });

      expect(found).toBeNull();
    });
  });
});
