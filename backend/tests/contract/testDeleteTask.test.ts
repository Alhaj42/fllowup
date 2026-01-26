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

describe('DELETE /tasks/:id API Contract', () => {
  let testClient: { id: string };
  let testProject: { id: string };
  let testPhase: { id: string };
  let testTeamLeader: { id: string };
  let testTeamMember: { id: string };

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
        teamMemberId: teamLeader.id,
        role: 'TEAM_LEADER',
        workingPercentage: 100,
        startDate: new Date('2024-01-15'),
      },
    });

    const task = await prisma.client.task.create({
      data: {
        phaseId: testPhase.id,
        code: `TASK-${Date.now()}`,
        description: 'Task to be deleted',
        duration: 5,
        status: 'PLANNED',
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

  it('should delete task successfully', async () => {
    const response = await request(app)
      .delete(`/api/v1/tasks/${task.id}`)
      .set('Authorization', `Bearer team-leader-token`)
      .expect(204);

    const deletedTask = await prisma.client.task.findUnique({
      where: { id: task.id },
    });

    expect(deletedTask).toBeNull();
  });

  it('should return 404 if task does not exist', async () => {
    const response = await request(app)
      .delete('/api/v1/tasks/non-existent-task-id')
      .set('Authorization', `Bearer team-leader-token`)
      .expect(404);

    expect(response.body).toHaveProperty('error', 'Task not found');
  });

  it('should delete task with assigned team member', async () => {
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

    const task = await prisma.client.task.create({
      data: {
        phaseId: testPhase.id,
        code: `TASK-ASSIGNED-${Date.now()}`,
        description: 'Assigned task to delete',
        duration: 7,
        status: 'PLANNED',
        assignedTeamMemberId: teamMember.id,
      },
    });

    await request(app)
      .delete(`/api/v1/tasks/${task.id}`)
      .set('Authorization', `Bearer team-leader-token`)
      .expect(204);

    const deletedTask = await prisma.client.task.findUnique({
      where: { id: task.id },
    });

    expect(deletedTask).toBeNull();
  });

  it('should delete task with dates', async () => {
    const task = await prisma.client.task.create({
      data: {
        phaseId: testPhase.id,
        code: `TASK-DATES-${Date.now()}`,
        description: 'Task with dates',
        duration: 10,
        status: 'IN_PROGRESS',
        startDate: new Date('2024-01-20'),
        endDate: new Date('2024-01-30'),
      },
    });

    await request(app)
      .delete(`/api/v1/tasks/${task.id}`)
      .set('Authorization', `Bearer team-leader-token`)
      .expect(204);

    const deletedTask = await prisma.client.task.findUnique({
      where: { id: task.id },
    });

    expect(deletedTask).toBeNull();
  });

  it('should delete task with status transitions', async () => {
    const task = await prisma.client.task.create({
      data: {
        phaseId: testPhase.id,
        code: `TASK-STATUS-${Date.now()}`,
        description: 'Task with status',
        duration: 5,
        status: 'IN_PROGRESS',
      },
    });

    await request(app)
      .delete(`/api/v1/tasks/${task.id}`)
      .set('Authorization', `Bearer team-leader-token`)
      .expect(204);

    const deletedTask = await prisma.client.task.findUnique({
      where: { id: task.id },
    });

    expect(deletedTask).toBeNull();
  });

  it('should return 204 with no body', async () => {
    const response = await request(app)
      .delete(`/api/v1/tasks/${task.id}`)
      .set('Authorization', `Bearer team-leader-token`);

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
  });

  it('should not affect other tasks in same phase', async () => {
    const task1 = await prisma.client.task.create({
      data: {
        phaseId: testPhase.id,
        code: `TASK-1-${Date.now()}`,
        description: 'Task 1',
        duration: 3,
        status: 'PLANNED',
      },
    });

    const task2 = await prisma.client.task.create({
      data: {
        phaseId: testPhase.id,
        code: `TASK-2-${Date.now()}`,
        description: 'Task 2',
        duration: 4,
        status: 'IN_PROGRESS',
      },
    });

    await request(app)
      .delete(`/api/v1/tasks/${task1.id}`)
      .set('Authorization', `Bearer team-leader-token`)
      .expect(204);

    const remainingTask = await prisma.client.task.findUnique({
      where: { id: task2.id },
    });

    expect(remainingTask).toBeDefined();
    expect(remainingTask).not.toBeNull();
  });

  it('should handle deletion of non-existent task gracefully', async () => {
    const response = await request(app)
      .delete('/api/v1/tasks/00000000-0000-0000-0000000000000')
      .set('Authorization', `Bearer team-leader-token`)
      .expect(404);

    expect(response.body).toHaveProperty('error');
  });
});
