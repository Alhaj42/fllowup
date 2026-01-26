import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient, PhaseName, TaskStatus } from '@prisma/client';

const prisma = new PrismaClient();

describe('Task Model', () => {
  let testClient: { id: string };
  let testProject: { id: string };
  let testPhase: { id: string };
  let testTeamLeader: { id: string };
  let testTeamMember: { id: string };

  beforeAll(async () => {
    const client = await prisma.client.create({
      data: {
        name: 'Test Client',
        contactName: 'Test Contact',
      },
    });
    testClient = client;

    const teamLeader = await prisma.client.user.create({
      data: {
        email: 'teamleader@example.com',
        name: 'Test Team Leader',
        role: 'TEAM_LEADER',
      },
    });
    testTeamLeader = teamLeader;

    const teamMember = await prisma.client.user.create({
      data: {
        email: 'teammember@example.com',
        name: 'Test Team Member',
        role: 'TEAM_MEMBER',
      },
    });
    testTeamMember = teamMember;

    const project = await prisma.client.project.create({
      data: {
        clientId: testClient.id,
        name: 'Test Project',
        contractCode: `CONTRACT-${Date.now()}`,
        contractSigningDate: new Date('2024-01-01'),
        builtUpArea: 1000,
        startDate: new Date('2024-01-15'),
        estimatedEndDate: new Date('2024-03-15'),
      },
    });
    testProject = project;

    const phase = await prisma.client.phase.create({
      data: {
        projectId: testProject.id,
        name: 'STUDIES',
        startDate: new Date('2024-01-15'),
        duration: 60,
        estimatedEndDate: new Date('2024-03-15'),
        status: 'PLANNED',
      },
    });
    testPhase = phase;

    await prisma.client.assignment.create({
      data: {
        phaseId: testPhase.id,
        teamMemberId: testTeamLeader.id,
        role: 'TEAM_LEADER',
        workingPercentage: 100,
        startDate: new Date('2024-01-15'),
      },
    });

    await prisma.client.assignment.create({
      data: {
        phaseId: testPhase.id,
        teamMemberId: testTeamMember.id,
        role: 'TEAM_MEMBER',
        workingPercentage: 100,
        startDate: new Date('2024-01-15'),
      },
    });
  });

  afterAll(async () => {
    await prisma.client.task.deleteMany({});
    await prisma.client.assignment.deleteMany({});
    await prisma.client.phase.deleteMany({});
    await prisma.client.project.deleteMany({});
    await prisma.client.user.deleteMany({});
    await prisma.client.$disconnect();
  });

  beforeEach(async () => {
    await prisma.client.task.deleteMany({});
  });

  it('should create a task with all required fields', async () => {
    const task = await prisma.client.task.create({
      data: {
        phaseId: testPhase.id,
        code: `TASK-${Date.now()}`,
        description: 'Test task description',
        duration: 5,
        status: 'PLANNED',
      },
    });

    expect(task).toBeDefined();
    expect(task.id).toBeDefined();
    expect(task.code).toMatch(/^TASK-/);
    expect(task.description).toBe('Test task description');
    expect(task.duration).toBe(5);
    expect(task.status).toBe('PLANNED');
    expect(task.version).toBe(1);
  });

  it('should enforce unique task code within a phase', async () => {
    const code = `TASK-${Date.now()}`;

    await prisma.client.task.create({
      data: {
        phaseId: testPhase.id,
        code,
        description: 'First task',
        duration: 3,
        status: 'PLANNED',
      },
    });

    await expect(
      prisma.client.task.create({
        data: {
          phaseId: testPhase.id,
          code,
          description: 'Second task with same code',
          duration: 4,
          status: 'PLANNED',
        },
      })
    ).rejects.toThrow();
  });

  it('should allow same task code in different phases', async () => {
    const code = `TASK-${Date.now()}`;

    await prisma.client.task.create({
      data: {
        phaseId: testPhase.id,
        code,
        description: 'Task in phase 1',
        duration: 3,
        status: 'PLANNED',
      },
    });

    const phase2 = await prisma.client.phase.create({
      data: {
        projectId: testProject.id,
        name: 'DESIGN',
        startDate: new Date('2024-03-16'),
        duration: 30,
        estimatedEndDate: new Date('2024-04-15'),
        status: 'PLANNED',
      },
    });

    const task2 = await prisma.client.task.create({
      data: {
        phaseId: phase2.id,
        code,
        description: 'Task in phase 2',
        duration: 4,
        status: 'PLANNED',
      },
    });

    expect(task2).toBeDefined();
    expect(task2.code).toBe(code);
  });

  it('should support optional assignedTeamMemberId', async () => {
    await prisma.client.assignment.create({
      data: {
        phaseId: testPhase.id,
        teamMemberId: testTeamMember.id,
        role: 'TEAM_MEMBER',
        workingPercentage: 100,
        startDate: new Date('2024-01-15'),
      },
    });

    const task = await prisma.client.task.create({
      data: {
        phaseId: testPhase.id,
        code: `TASK-${Date.now()}`,
        description: 'Assigned task',
        duration: 7,
        status: 'PLANNED',
        assignedTeamMemberId: testTeamMember.id,
      },
    });

    expect(task.assignedTeamMemberId).toBe(testTeamMember.id);
  });

  it('should handle optional start and end dates', async () => {
    const task = await prisma.client.task.create({
      data: {
        phaseId: testPhase.id,
        code: `TASK-${Date.now()}`,
        description: 'Task with dates',
        duration: 10,
        status: 'IN_PROGRESS',
        startDate: new Date('2024-01-20'),
        endDate: new Date('2024-01-30'),
      },
    });

    expect(task.startDate).toBeDefined();
    expect(task.startDate).toBeInstanceOf(Date);
    expect(task.endDate).toBeDefined();
    expect(task.endDate).toBeInstanceOf(Date);
  });

  it('should support status transitions', async () => {
    const task = await prisma.client.task.create({
      data: {
        phaseId: testPhase.id,
        code: `TASK-${Date.now()}`,
        description: 'Task with status transition',
        duration: 5,
        status: 'PLANNED',
      },
    });

    expect(task.status).toBe('PLANNED');

    const updatedTask = await prisma.client.task.update({
      where: { id: task.id },
      data: { status: 'IN_PROGRESS' },
    });

    expect(updatedTask.status).toBe('IN_PROGRESS');

    const completedTask = await prisma.client.task.update({
      where: { id: task.id },
      data: { status: 'COMPLETED' },
    });

    expect(completedTask.status).toBe('COMPLETED');
  });

  it('should increment version on update', async () => {
    const task = await prisma.client.task.create({
      data: {
        phaseId: testPhase.id,
        code: `TASK-${Date.now()}`,
        description: 'Original description',
        duration: 5,
        status: 'PLANNED',
      },
    });

    expect(task.version).toBe(1);

    const updatedTask = await prisma.client.task.update({
      where: { id: task.id },
      data: { description: 'Updated description' },
    });

    expect(updatedTask.version).toBe(2);
  });

  it('should have proper indexes defined', async () => {
    const task1 = await prisma.client.task.create({
      data: {
        phaseId: testPhase.id,
        code: `TASK-${Date.now()}-1`,
        description: 'Task 1',
        duration: 3,
        status: 'PLANNED',
      },
    });

    const task2 = await prisma.client.task.create({
      data: {
        phaseId: testPhase.id,
        code: `TASK-${Date.now()}-2`,
        description: 'Task 2',
        duration: 4,
        status: 'IN_PROGRESS',
      },
    });

    const tasks = await prisma.client.task.findMany({
      where: {
        status: 'IN_PROGRESS',
      },
      orderBy: {
        code: 'asc',
      },
    });

    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe(task2.id);
  });

  it('should cascade delete when phase is deleted', async () => {
    const task = await prisma.client.task.create({
      data: {
        phaseId: testPhase.id,
        code: `TASK-${Date.now()}`,
        description: 'Task to be deleted',
        duration: 5,
        status: 'PLANNED',
      },
    });

    expect(task).toBeDefined();

    await prisma.client.phase.delete({
      where: { id: testPhase.id },
    });

    const deletedTask = await prisma.client.task.findUnique({
      where: { id: task.id },
    });

    expect(deletedTask).toBeNull();
  });
});
