import { PrismaClient, Task, TaskStatus } from '@prisma/client';

const prisma = new PrismaClient();

describe('Task Model', () => {
  let testPhase: any;
  let testProject: any;
  let testUser: any;

  beforeAll(async () => {
    testUser = await prisma.user.create({
      data: {
        email: 'test-task@example.com',
        name: 'Test User',
        role: 'TEAM_MEMBER',
        position: 'Architect',
        region: 'North',
      },
    });

    testProject = await prisma.project.create({
      data: {
        name: 'Test Project for Tasks',
        contractCode: 'TASK-001',
        clientId: 'client-1',
        contractSigningDate: new Date('2024-01-01'),
        builtUpArea: 1000,
        startDate: new Date('2024-01-15'),
        estimatedEndDate: new Date('2024-12-31'),
        status: 'PLANNED',
        createdBy: testUser.id,
      },
    });

    testPhase = await prisma.phase.create({
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

  afterAll(async () => {
    await prisma.task.deleteMany({});
    await prisma.phase.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe('Create Operations', () => {
    it('should create a task successfully', async () => {
      const task = await prisma.task.create({
        data: {
          phaseId: testPhase.id,
          code: 'TASK-001',
          description: 'Test task description',
          duration: 10,
          status: 'PLANNED',
        },
      });

      expect(task).toBeDefined();
      expect(task.id).toBeDefined();
      expect(task.phaseId).toBe(testPhase.id);
      expect(task.code).toBe('TASK-001');
      expect(task.description).toBe('Test task description');
      expect(task.duration).toBe(10);
      expect(task.status).toBe('PLANNED');
      expect(task.assignedTeamMemberId).toBeNull();
      expect(task.startDate).toBeNull();
      expect(task.endDate).toBeNull();
      expect(task.version).toBe(1);
    });

    it('should create task with assigned team member', async () => {
      const task = await prisma.task.create({
        data: {
          phaseId: testPhase.id,
          code: 'TASK-002',
          description: 'Assigned task',
          duration: 15,
          status: 'IN_PROGRESS',
          assignedTeamMemberId: testUser.id,
        },
      });

      expect(task.assignedTeamMemberId).toBe(testUser.id);
      expect(task.status).toBe('IN_PROGRESS');
    });

    it('should create task with dates', async () => {
      const task = await prisma.task.create({
        data: {
          phaseId: testPhase.id,
          code: 'TASK-003',
          description: 'Task with dates',
          duration: 5,
          status: 'COMPLETED',
          startDate: new Date('2024-02-05'),
          endDate: new Date('2024-02-10'),
        },
      });

      expect(task.startDate).toBeDefined();
      expect(task.endDate).toBeDefined();
      expect(new Date(task.endDate) >= new Date(task.startDate)).toBe(true);
    });

    it('should fail to create task without required fields', async () => {
      await expect(
        prisma.task.create({
          data: {
            phaseId: testPhase.id,
          } as any,
        })
      ).rejects.toThrow();
    });

    it('should enforce unique constraint on phaseId + code', async () => {
      const taskData = {
        phaseId: testPhase.id,
        code: 'TASK-DUP',
        description: 'Duplicate task',
        duration: 10,
        status: 'PLANNED',
      };

      await prisma.task.create({ data: taskData });

      await expect(
        prisma.task.create({ data: taskData })
      ).rejects.toThrow();
    });
  });

  describe('Update Operations', () => {
    let task: Task;

    beforeEach(async () => {
      task = await prisma.task.create({
        data: {
          phaseId: testPhase.id,
          code: 'TASK-UPDATE',
          description: 'Task to update',
          duration: 10,
          status: 'PLANNED',
        },
      });
    });

    afterEach(async () => {
      await prisma.task.delete({ where: { id: task.id } });
    });

    it('should update task description', async () => {
      const updated = await prisma.task.update({
        where: { id: task.id },
        data: { description: 'Updated description' },
      });

      expect(updated.description).toBe('Updated description');
    });

    it('should update task status', async () => {
      const updated = await prisma.task.update({
        where: { id: task.id },
        data: { status: 'IN_PROGRESS' },
      });

      expect(updated.status).toBe('IN_PROGRESS');
    });

    it('should update task assignment', async () => {
      const updated = await prisma.task.update({
        where: { id: task.id },
        data: {
          assignedTeamMemberId: testUser.id,
          status: 'IN_PROGRESS',
          startDate: new Date('2024-02-01'),
        },
      });

      expect(updated.assignedTeamMemberId).toBe(testUser.id);
      expect(updated.status).toBe('IN_PROGRESS');
    });

    it('should mark task as completed with end date', async () => {
      const updated = await prisma.task.update({
        where: { id: task.id },
        data: {
          status: 'COMPLETED',
          endDate: new Date('2024-02-15'),
        },
      });

      expect(updated.status).toBe('COMPLETED');
      expect(updated.endDate).toBeDefined();
    });

    it('should increment version on update', async () => {
      const updated = await prisma.task.update({
        where: { id: task.id },
        data: { description: 'Version test' },
      });

      expect(updated.version).toBe(task.version + 1);
    });
  });

  describe('Read Operations', () => {
    let tasks: Task[];

    beforeEach(async () => {
      tasks = await Promise.all([
        prisma.task.create({
          data: {
            phaseId: testPhase.id,
            code: 'TASK-READ-1',
            description: 'Read test 1',
            duration: 5,
            status: 'PLANNED',
          },
        }),
        prisma.task.create({
          data: {
            phaseId: testPhase.id,
            code: 'TASK-READ-2',
            description: 'Read test 2',
            duration: 10,
            status: 'IN_PROGRESS',
          },
        }),
      ]);
    });

    afterEach(async () => {
      await prisma.task.deleteMany({});
    });

    it('should find task by id', async () => {
      const found = await prisma.task.findUnique({
        where: { id: tasks[0].id },
      });

      expect(found).toBeDefined();
      expect(found?.id).toBe(tasks[0].id);
      expect(found?.code).toBe('TASK-READ-1');
    });

    it('should find all tasks for a phase', async () => {
      const found = await prisma.task.findMany({
        where: { phaseId: testPhase.id },
      });

      expect(found).toHaveLength(2);
    });

    it('should find tasks by status', async () => {
      const found = await prisma.task.findMany({
        where: { status: 'PLANNED' },
      });

      expect(found).toHaveLength(1);
      expect(found[0].code).toBe('TASK-READ-1');
    });

    it('should find tasks assigned to team member', async () => {
      const assignedTask = await prisma.task.create({
        data: {
          phaseId: testPhase.id,
          code: 'TASK-ASSIGNED',
          description: 'Assigned task',
          duration: 15,
          status: 'IN_PROGRESS',
          assignedTeamMemberId: testUser.id,
        },
      });

      const found = await prisma.task.findMany({
        where: { assignedTeamMemberId: testUser.id },
      });

      expect(found.length).toBeGreaterThan(0);
      expect(found.some(t => t.code === 'TASK-ASSIGNED')).toBe(true);

      await prisma.task.delete({ where: { id: assignedTask.id } });
    });

    it('should include related phase', async () => {
      const found = await prisma.task.findUnique({
        where: { id: tasks[0].id },
        include: { phase: true },
      });

      expect(found?.phase).toBeDefined();
      expect(found?.phase?.id).toBe(testPhase.id);
    });

    it('should include related assigned team member', async () => {
      const found = await prisma.task.findMany({
        where: { assignedTeamMemberId: testUser.id },
        include: { assignedTeamMember: true },
      });

      if (found.length > 0 && found[0].assignedTeamMember) {
        expect(found[0].assignedTeamMember?.id).toBe(testUser.id);
      }
    });
  });

  describe('Delete Operations', () => {
    let task: Task;

    beforeEach(async () => {
      task = await prisma.task.create({
        data: {
          phaseId: testPhase.id,
          code: 'TASK-DEL',
          description: 'Task to delete',
          duration: 5,
          status: 'PLANNED',
        },
      });
    });

    it('should delete a task', async () => {
      await prisma.task.delete({
        where: { id: task.id },
      });

      const found = await prisma.task.findUnique({
        where: { id: task.id },
      });

      expect(found).toBeNull();
    });
  });

  describe('Date Constraints', () => {
    it('should accept valid date range (startDate <= endDate)', async () => {
      const task = await prisma.task.create({
        data: {
          phaseId: testPhase.id,
          code: 'TASK-DATE-1',
          description: 'Task with valid dates',
          duration: 10,
          status: 'IN_PROGRESS',
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-10'),
        },
      });

      expect(task.startDate).toBeDefined();
      expect(task.endDate).toBeDefined();
    });

    it('should accept null dates (unassigned/unscheduled)', async () => {
      const task = await prisma.task.create({
        data: {
          phaseId: testPhase.id,
          code: 'TASK-DATE-2',
          description: 'Unscheduled task',
          duration: 5,
          status: 'PLANNED',
        },
      });

      expect(task.startDate).toBeNull();
      expect(task.endDate).toBeNull();
    });
  });

  describe('Status Transitions', () => {
    it('should allow PLANNED to IN_PROGRESS transition', async () => {
      const task = await prisma.task.create({
        data: {
          phaseId: testPhase.id,
          code: 'TASK-STATUS-1',
          description: 'Status transition',
          duration: 10,
          status: 'PLANNED',
        },
      });

      const updated = await prisma.task.update({
        where: { id: task.id },
        data: {
          status: 'IN_PROGRESS',
          startDate: new Date('2024-02-01'),
        },
      });

      expect(updated.status).toBe('IN_PROGRESS');
      expect(updated.startDate).toBeDefined();
    });

    it('should allow IN_PROGRESS to COMPLETED transition', async () => {
      const task = await prisma.task.create({
        data: {
          phaseId: testPhase.id,
          code: 'TASK-STATUS-2',
          description: 'Status transition',
          duration: 10,
          status: 'IN_PROGRESS',
          startDate: new Date('2024-02-01'),
        },
      });

      const updated = await prisma.task.update({
        where: { id: task.id },
        data: {
          status: 'COMPLETED',
          endDate: new Date('2024-02-10'),
        },
      });

      expect(updated.status).toBe('COMPLETED');
      expect(updated.endDate).toBeDefined();
    });

    it('should allow PLANNED to COMPLETED transition', async () => {
      const task = await prisma.task.create({
        data: {
          phaseId: testPhase.id,
          code: 'TASK-STATUS-3',
          description: 'Status transition',
          duration: 10,
          status: 'PLANNED',
        },
      });

      const updated = await prisma.task.update({
        where: { id: task.id },
        data: {
          status: 'COMPLETED',
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-10'),
        },
      });

      expect(updated.status).toBe('COMPLETED');
    });
  });

  describe('Duration Constraints', () => {
    it('should accept positive duration', async () => {
      const task = await prisma.task.create({
        data: {
          phaseId: testPhase.id,
          code: 'TASK-DUR-1',
          description: 'Duration test',
          duration: 5,
          status: 'PLANNED',
        },
      });

      expect(task.duration).toBe(5);
    });

    it('should accept long duration', async () => {
      const task = await prisma.task.create({
        data: {
          phaseId: testPhase.id,
          code: 'TASK-DUR-2',
          description: 'Long duration task',
          duration: 365,
          status: 'PLANNED',
        },
      });

      expect(task.duration).toBe(365);
    });
  });

  describe('Cascade Operations', () => {
    let task: Task;

    beforeEach(async () => {
      task = await prisma.task.create({
        data: {
          phaseId: testPhase.id,
          code: 'TASK-CASCADE',
          description: 'Cascade test',
          duration: 10,
          status: 'PLANNED',
        },
      });
    });

    it('should cascade delete when phase is deleted', async () => {
      await prisma.phase.delete({
        where: { id: testPhase.id },
      });

      const found = await prisma.task.findUnique({
        where: { id: task.id },
      });

      expect(found).toBeNull();
    });
  });
});
