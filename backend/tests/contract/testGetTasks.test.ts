import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app, { setupRoutes } from '../../src/app';
import { PrismaClient, TaskStatus, AssignmentRole } from '@prisma/client';

const prisma = new PrismaClient();

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'TEAM_LEADER',
};

jest.mock('../../src/middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = mockUser;
    next();
  }),
}));

describe('GET /phases/:phaseId/tasks API Contract', () => {
  let testClient: { id: string };
  let testProject: { id: string };
  let testPhase: { id: string };
  let testTasks: Array<{ id: string; code: string; status: TaskStatus }>;

  beforeAll(async () => {
    setupRoutes();

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
        teamMemberId: teamLeader.id,
        role: 'TEAM_LEADER',
        workingPercentage: 100,
        startDate: new Date('2024-01-15'),
      },
    });

    testTasks = [];
    const statuses: TaskStatus[] = ['PLANNED', 'IN_PROGRESS', 'COMPLETED'];

    for (let i = 0; i < 5; i++) {
      const task = await prisma.client.task.create({
        data: {
          phaseId: testPhase.id,
          code: `TASK-${i}`,
          description: `Test Task ${i}`,
          duration: 5 + i,
          status: statuses[i % 3],
        },
      });
      testTasks.push({
        id: task.id,
        code: task.code,
        status: task.status,
      });
    }
  });

  afterAll(async () => {
    await prisma.client.task.deleteMany({});
    await prisma.client.assignment.deleteMany({});
    await prisma.client.phase.deleteMany({});
    await prisma.client.project.deleteMany({});
    await prisma.client.user.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.$disconnect();
  });

  it('should return 200 with valid authentication', async () => {
    const response = await request(app)
      .get(`/api/v1/phases/${testPhase.id}/tasks`)
      .set('Authorization', `Bearer test-token`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should return tasks array', async () => {
    const response = await request(app)
      .get(`/api/v1/phases/${testPhase.id}/tasks`)
      .set('Authorization', `Bearer test-token`);

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(testTasks.length);
  });

  it('should support status filtering', async () => {
    const response = await request(app)
      .get(`/api/v1/phases/${testPhase.id}/tasks?status=IN_PROGRESS`)
      .set('Authorization', `Bearer test-token`);

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeGreaterThan(0);
    response.body.forEach((task: { status: TaskStatus }) => {
      expect(task.status).toBe('IN_PROGRESS');
    });
  });

  it('should return tasks with correct structure', async () => {
    const response = await request(app)
      .get(`/api/v1/phases/${testPhase.id}/tasks`)
      .set('Authorization', `Bearer test-token`);

    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).toHaveProperty('code');
    expect(response.body[0]).toHaveProperty('description');
    expect(response.body[0]).toHaveProperty('duration');
    expect(response.body[0]).toHaveProperty('status');
    expect(response.body[0]).toHaveProperty('phaseId');
  });

  it('should return empty array for phase with no tasks', async () => {
    const emptyPhase = await prisma.client.phase.create({
      data: {
        projectId: testProject.id,
        name: 'DESIGN',
        startDate: new Date('2024-03-16'),
        duration: 30,
        estimatedEndDate: new Date('2024-04-15'),
        status: 'PLANNED',
      },
    });

    const response = await request(app)
      .get(`/api/v1/phases/${emptyPhase.id}/tasks`)
      .set('Authorization', `Bearer test-token`);

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body).toHaveLength(0);
  });

  it('should return 404 for non-existent phase', async () => {
    const response = await request(app)
      .get('/api/v1/phases/non-existent-phase-id/tasks')
      .set('Authorization', `Bearer test-token`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });

  it('should return tasks ordered by code', async () => {
    const response = await request(app)
      .get(`/api/v1/phases/${testPhase.id}/tasks`)
      .set('Authorization', `Bearer test-token`);

    const codes = response.body.map((task: { code: string }) => task.code);
    const sortedCodes = [...codes].sort();

    expect(codes).toEqual(sortedCodes);
  });

  it('should include assigned team member if exists', async () => {
    const teamMember = await prisma.client.user.create({
      data: {
        email: 'teammember@example.com',
        name: 'Test Team Member',
        role: 'TEAM_MEMBER',
      },
    });

    await prisma.client.assignment.create({
      data: {
        phaseId: testPhase.id,
        teamMemberId: teamMember.id,
        role: 'TEAM_MEMBER',
        workingPercentage: 100,
        startDate: new Date('2024-01-15'),
      },
    });

    await prisma.client.task.create({
      data: {
        phaseId: testPhase.id,
        code: `TASK-ASSIGNED`,
        description: 'Assigned task',
        duration: 5,
        status: 'PLANNED',
        assignedTeamMemberId: teamMember.id,
      },
    });

    const response = await request(app)
      .get(`/api/v1/phases/${testPhase.id}/tasks`)
      .set('Authorization', `Bearer test-token`);

    const assignedTask = response.body.find((t: { code: string }) => t.code === 'TASK-ASSIGNED');
    expect(assignedTask).toBeDefined();
    expect(assignedTask.assignedTeamMemberId).toBe(teamMember.id);
  });
});
