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

describe('PUT /tasks/:id API Contract', () => {
  let testClient: { id: string };
  let testProject: { id: string };
  let testPhase: { id: string };
  let testTeamLeader: { id: string };
  let testTeamMember: { id: string };
  let testTask: { id: string; version: number };
  let testTask2: { id: string; version: number };

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

    const task = await prisma.client.task.create({
      data: {
        phaseId: testPhase.id,
        code: `TASK-${Date.now()}`,
        description: 'Original description',
        duration: 5,
        status: 'PLANNED',
      },
    });
    testTask = task;

    const task2 = await prisma.client.task.create({
      data: {
        phaseId: testPhase.id,
        code: `TASK-${Date.now()}-2`,
        description: 'Second task',
        duration: 4,
        status: 'PLANNED',
      },
    });
    testTask2 = task2;

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
    await prisma.client.deleteMany({});
    await prisma.$disconnect();
  });

  it('should update task with valid data', async () => {
    const response = await request(app)
      .put(`/api/v1/tasks/${testTask.id}`)
      .set('Authorization', `Bearer team-leader-token`)
      .send({
        description: 'Updated description',
        version: testTask.version,
      })
      .expect(200);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('description', 'Updated description');
    expect(response.body).toHaveProperty('version', testTask.version + 1);
  });

  it('should update task status', async () => {
    const response = await request(app)
      .put(`/api/v1/tasks/${testTask.id}`)
      .set('Authorization', `Bearer team-leader-token`)
      .send({
        status: 'COMPLETED',
        version: testTask2.version,
      })
      .expect(200);

    expect(response.body.status).toBe('COMPLETED');
  });

  it('should update task with assigned team member', async () => {
    const response = await request(app)
      .put(`/api/v1/tasks/${testTask.id}`)
      .set('Authorization', `Bearer team-leader-token`)
      .send({
        assignedTeamMemberId: testTeamMember.id,
        version: testTask.version,
      })
      .expect(200);

    expect(response.body).toHaveProperty('assignedTeamMemberId', testTeamMember.id);
  });

  it('should update task with start and end dates', async () => {
    const startDate = new Date('2024-01-20');
    const endDate = new Date('2024-01-25');

    const response = await request(app)
      .put(`/api/v1/tasks/${testTask.id}`)
      .set('Authorization', `Bearer team-leader-token`)
      .send({
        startDate,
        endDate,
        version: testTask2.version,
      })
      .expect(200);

    expect(response.body).toHaveProperty('startDate');
    expect(response.body).toHaveProperty('endDate');
    });

  it('should unassign team member when assignedTeamMemberId is null', async () => {
    const response = await request(app)
      .put(`/api/v1/tasks/${testTask.id}`)
      .set('Authorization', `Bearer team-leader-token`)
      .send({
        assignedTeamMemberId: null,
        version: testTask2.version,
      })
      .expect(200);

    expect(response.body.assignedTeamMemberId).toBeNull();
  });

  it('should return 404 if task does not exist', async () => {
    const response = await request(app)
      .put('/api/v1/tasks/non-existent-task-id')
      .set('Authorization', `Bearer team-leader-token`)
      .send({
        description: 'This task does not exist',
        version: 1,
      })
      .expect(404);

    expect(response.body).toHaveProperty('error', 'Task not found');
  });

  it('should return 409 for version conflict', async () => {
    const response = await request(app)
      .put(`/api/v1/tasks/${testTask.id}`)
      .set('Authorization', `Bearer team-leader-token`)
      .send({
        description: 'Concurrent update',
        version: testTask.version - 1, // Wrong version intentionally
      })
      .expect(409);

    expect(response.body).toHaveProperty('error', 'Version conflict');
  });

  it('should return 400 if version field is missing', async () => {
    const response = await request(app)
      .put(`/api/v1/tasks/${testTask.id}`)
      .set('Authorization', `Bearer team-leader-token`)
      .send({
        description: 'Update without version',
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  it('should not allow changing task code to duplicate in same phase', async () => {
    const task2 = await prisma.client.task.create({
      data: {
        phaseId: testPhase.id,
        code: `TASK-DUP-${Date.now()}`,
        description: 'Task in phase 1',
        duration: 3,
        status: 'PLANNED',
      },
    });

    const response = await request(app)
      .put(`/api/v1/tasks/${testTask.id}`)
      .set('Authorization', `Bearer team-leader-token`)
      .send({
        code: task2.code,
        version: testTask.version,
      })
      .expect(409);

    expect(response.body).toHaveProperty('error', 'Task code already exists in this phase');
  });

  it('should allow changing task code to duplicate in different phase', async () => {
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

    const response = await request(app)
      .put(`/api/v1/tasks/${testTask.id}`)
      .set('Authorization', `Bearer team-leader-token`)
      .send({
        code: task2.code,
        version: testTask.version,
      })
      .expect(200);

    expect(response.body.code).toBe(task2.code);
  });

  it('should support partial updates', async () => {
    const response = await request(app)
      .put(`/api/v1/tasks/${testTask.id}`)
      .set('Authorization', `Bearer team-leader-token`)
      .send({
        duration: 10,
        version: testTask2.version,
      })
      .expect(200);

    expect(response.body).toHaveProperty('duration', 10);
    expect(response.body).toHaveProperty('description'); // Original description should remain
    expect(response.body).toHaveProperty('version', testTask2.version + 1);
  });

  it('should increment version on every update', async () => {
    await request(app)
      .put(`/api/v1/tasks/${testTask.id}`)
      .set('Authorization', `Bearer team-leader-token`)
      .send({
        description: 'Update 1',
        version: testTask.version,
      })
      .expect(200);

    const updatedTask1 = await prisma.client.task.findUnique({
      where: { id: testTask.id },
    });

    expect(updatedTask1.version).toBe(testTask.version + 1);

    await request(app)
      .put(`/api/v1/tasks/${testTask2.id}`)
      .set('Authorization', `Bearer team-leader-token`)
      .send({
        description: 'Update 2',
        version: updatedTask1.version,
      })
      .expect(200);

    const updatedTask2 = await prisma.client.task.findUnique({
      where: { id: testTask2.id },
    });

    expect(updatedTask2.version).toBe(updatedTask1.version + 1);
  });
});
