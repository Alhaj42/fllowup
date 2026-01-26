import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app, { setupRoutes } from '../../src/app';
import { PrismaClient, TaskStatus, PhaseStatus, AssignmentRole } from '@prisma/client';

const prisma = new PrismaClient();

describe('Task Phase Flow Integration Tests', () => {
  let testClient: { id: string };
  let testProject: { id: string };
  let testPhase1: { id: string };
  let testPhase2: { id: string };
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

    const phase1 = await prisma.client.phase.create({
      data: {
        projectId: testProject.id,
        name: 'STUDIES',
        startDate: new Date('2024-01-15'),
        duration: 60,
        estimatedEndDate: new Date('2024-03-15'),
        status: 'PLANNED',
      },
    });
    testPhase1 = phase1;

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
    testPhase2 = phase2;

    await prisma.client.assignment.create({
      data: {
        phaseId: testPhase1.id,
        teamMemberId: testTeamLeader.id,
        role: 'TEAM_LEADER',
        workingPercentage: 100,
        startDate: new Date('2024-01-15'),
      },
    });

    await prisma.client.assignment.create({
      data: {
        phaseId: testPhase1.id,
        teamMemberId: testTeamMember.id,
        role: 'TEAM_MEMBER',
        workingPercentage: 100,
        startDate: new Date('2024-01-15'),
      },
    });

    await prisma.client.assignment.create({
      data: {
        phaseId: testPhase2.id,
        teamMemberId: testTeamLeader.id,
        role: 'TEAM_LEADER',
        workingPercentage: 100,
        startDate: new Date('2024-03-16'),
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

  describe('Task Completion Triggers Phase Completion', () => {
    it('should auto-complete phase when all tasks are COMPLETED', async () => {
      const task1 = await prisma.client.task.create({
        data: {
          phaseId: testPhase1.id,
          code: `TASK-1-${Date.now()}`,
          description: 'Task 1',
          duration: 5,
          status: 'IN_PROGRESS',
        },
      });

      const task2 = await prisma.client.task.create({
        data: {
          phaseId: testPhase1.id,
          code: `TASK-2-${Date.now()}`,
          description: 'Task 2',
          duration: 3,
          status: 'IN_PROGRESS',
        },
      });

      expect(testPhase1.status).toBe('PLANNED');

      await request(app)
        .put(`/api/v1/tasks/${task1.id}`)
        .set('Authorization', `Bearer team-leader-token`)
        .send({
          status: 'COMPLETED',
          version: task1.version,
        })
        .expect(200);

      const phaseAfterTask1 = await prisma.client.phase.findUnique({
        where: { id: testPhase1.id },
      });

      expect(phaseAfterTask1.status).toBe('PLANNED');

      await request(app)
        .put(`/api/v1/tasks/${task2.id}`)
        .set('Authorization', `Bearer team-leader-token`)
        .send({
          status: 'COMPLETED',
          version: task2.version,
        })
        .expect(200);

      const phaseAfterTask2 = await prisma.client.phase.findUnique({
        where: { id: testPhase1.id },
      });
      expect(phaseAfterTask2.status).toBe('COMPLETED');
    });

    it('should auto-start next phase when previous phase completes', async () => {
      const task1 = await prisma.client.task.create({
        data: {
          phaseId: testPhase1.id,
          code: `TASK-3-${Date.now()}`,
          description: 'Task 1',
          duration: 5,
          status: 'PLANNED',
        },
      });

      const task2 = await prisma.client.task.create({
        data: {
          phaseId: testPhase1.id,
          code: `TASK-4-${Date.now()}`,
          description: 'Task 2',
          duration: 3,
          status: 'PLANNED',
        },
      });

      expect(testPhase2.status).toBe('PLANNED');

      await request(app)
        .put(`/api/v1/tasks/${task1.id}`)
        .set('Authorization', `Bearer team-leader-token`)
        .send({
          status: 'COMPLETED',
          version: task1.version,
        })
        .expect(200);

      await request(app)
        .put(`/api/v1/tasks/${task2.id}`)
        .set('Authorization', `Bearer team-leader-token`)
        .send({
          status: 'COMPLETED',
          version: task2.version,
        })
        .expect(200);

      const phase2AfterCompletion = await prisma.client.phase.findUnique({
        where: { id: testPhase2.id },
      });
      expect(phase2AfterCompletion.status).toBe('IN_PROGRESS');
    });

    it('should not auto-complete phase if tasks are incomplete', async () => {
      const task1 = await prisma.client.task.create({
        data: {
          phaseId: testPhase1.id,
          code: `TASK-5-${Date.now()}`,
          description: 'Task 1',
          duration: 5,
          status: 'PLANNED',
        },
      });

      const task2 = await prisma.client.task.create({
        data: {
          phaseId: testPhase1.id,
          code: `TASK-6-${Date.now()}`,
          description: 'Task 2',
          duration: 3,
          status: 'PLANNED',
        },
      });

      await request(app)
        .put(`/api/v1/tasks/${task1.id}`)
        .set('Authorization', `Bearer team-leader-token`)
        .send({
          status: 'COMPLETED',
          version: task1.version,
        })
        .expect(200);

      const phaseAfterOneTask = await prisma.client.phase.findUnique({
        where: { id: testPhase1.id },
      });
      expect(phaseAfterOneTask.status).toBe('PLANNED');
    });

    it('should handle empty phase (no tasks)', async () => {
      const emptyPhase = await prisma.client.phase.create({
        data: {
          projectId: testProject.id,
          name: 'DESIGN',
          startDate: new Date('2024-03-16'),
          duration: 30,
          estimatedEndDate: new Date('2024-04-15'),
          status: 'IN_PROGRESS',
        },
      });

      const phase = await prisma.client.phase.findUnique({
        where: { id: emptyPhase.id },
      });
      expect(phase.status).toBe('IN_PROGRESS');
    });
  });

  describe('Role-Based Task Permissions', () => {
    const teamLeaderUser = {
      id: testTeamLeader.id,
      email: 'teamleader@example.com',
      role: 'TEAM_LEADER' as const,
    };

    const teamMemberUser = {
      id: testTeamMember.id,
      email: 'teammember@example.com',
      role: 'TEAM_MEMBER' as const,
    };

    it('should allow Team Leader to create tasks in assigned phase', async () => {
      const mockAuth = jest.mock('../../src/middleware/auth', () => ({
        authenticate: jest.fn((req, res, next) => {
          req.user = teamLeaderUser;
          next();
        }),
      }));

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer team-leader-token`)
        .send({
          phaseId: testPhase1.id,
          code: `TASK-TL-${Date.now()}`,
          description: 'Team Leader task',
          duration: 5,
          status: 'PLANNED',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('phaseId', testPhase1.id);

      mockAuth.mockClear();
    });

    it('should allow Team Leader to update tasks in assigned phase', async () => {
      const task = await prisma.client.task.create({
        data: {
          phaseId: testPhase1.id,
          code: `TASK-UPDATE-${Date.now()}`,
          description: 'Task to update',
          duration: 5,
          status: 'PLANNED',
        },
      });

      const mockAuth = jest.mock('../../src/middleware/auth', () => ({
        authenticate: jest.fn((req, res, next) => {
          req.user = teamLeaderUser;
          next();
        }),
      }));

      const response = await request(app)
        .put(`/api/v1/tasks/${task.id}`)
        .set('Authorization', `Bearer team-leader-token`)
        .send({
          description: 'Updated by Team Leader',
          version: task.version,
        })
        .expect(200);

      expect(response.body).toHaveProperty('description', 'Updated by Team Leader');

      mockAuth.mockClear();
    });

    it('should allow Team Leader to delete tasks in assigned phase', async () => {
      const task = await prisma.client.task.create({
        data: {
          phaseId: testPhase1.id,
          code: `TASK-DELETE-${Date.now()}`,
          description: 'Task to delete',
          duration: 5,
          status: 'PLANNED',
        },
      });

      const mockAuth = jest.mock('../../src/middleware/auth', () => ({
        authenticate: jest.fn((req, res, next) => {
          req.user = teamLeaderUser;
          next();
        }),
      }));

      await request(app)
        .delete(`/api/v1/tasks/${task.id}`)
        .set('Authorization', `Bearer team-leader-token`)
        .expect(204);

      const deletedTask = await prisma.client.task.findUnique({
        where: { id: task.id },
      });
      expect(deletedTask).toBeNull();

      mockAuth.mockClear();
    });

    it('should allow Team Member to view tasks (read-only)', async () => {
      const task = await prisma.client.task.create({
        data: {
          phaseId: testPhase1.id,
          code: `TASK-READONLY-${Date.now()}`,
          description: 'Read-only task',
          duration: 5,
          status: 'PLANNED',
        },
      });

      const mockAuth = jest.mock('../../src/middleware/auth', () => ({
        authenticate: jest.fn((req, res, next) => {
          req.user = teamMemberUser;
          next();
        }),
      }));

      const response = await request(app)
        .get(`/api/v1/phases/${testPhase1.id}/tasks`)
        .set('Authorization', `Bearer team-member-token`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      const taskResponse = response.body.find((t: { code: string }) => t.code === task.code);
      expect(taskResponse).toBeDefined();

      mockAuth.mockClear();
    });

    it('should prevent Team Member from creating tasks', async () => {
      const mockAuth = jest.mock('../../src/middleware/auth', () => ({
        authenticate: jest.fn((req, res, next) => {
          req.user = teamMemberUser;
          next();
        }),
      }));

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer team-member-token`)
        .send({
          phaseId: testPhase1.id,
          code: `TASK-TM-${Date.now()}`,
          description: 'Team Member task',
          duration: 5,
          status: 'PLANNED',
        })
        .expect(403);

      expect(response.body).toHaveProperty('error');

      mockAuth.mockClear();
    });

    it('should prevent Team Member from updating tasks', async () => {
      const task = await prisma.client.task.create({
        data: {
          phaseId: testPhase1.id,
          code: `TASK-TM-UPDATE-${Date.now()}`,
          description: 'Task team member cannot update',
          duration: 5,
          status: 'PLANNED',
        },
      });

      const mockAuth = jest.mock('../../src/middleware/auth', () => ({
        authenticate: jest.fn((req, res, next) => {
          req.user = teamMemberUser;
          next();
        }),
      }));

      const response = await request(app)
        .put(`/api/v1/tasks/${task.id}`)
        .set('Authorization', `Bearer team-member-token`)
        .send({
          description: 'Team Member attempting update',
          version: task.version,
        })
        .expect(403);

      expect(response.body).toHaveProperty('error');

      mockAuth.mockClear();
    });

    it('should prevent Team Member from deleting tasks', async () => {
      const task = await prisma.client.task.create({
        data: {
          phaseId: testPhase1.id,
          code: `TASK-TM-DELETE-${Date.now()}`,
          description: 'Task team member cannot delete',
          duration: 5,
          status: 'PLANNED',
        },
      });

      const mockAuth = jest.mock('../../src/middleware/auth', () => ({
        authenticate: jest.fn((req, res, next) => {
          req.user = teamMemberUser;
          next();
        }),
      }));

      const response = await request(app)
        .delete(`/api/v1/tasks/${task.id}`)
        .set('Authorization', `Bearer team-member-token`)
        .expect(403);

      expect(response.body).toHaveProperty('error');

      mockAuth.mockClear();
    });
  });
});
