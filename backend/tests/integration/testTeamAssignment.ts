import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app, { setupRoutes } from '../../src/app';
import { PrismaClient, AssignmentRole } from '@prisma/client';

const prisma = new PrismaClient();

const mockUser = {
  id: 'team-assignment-integration-user-id',
  email: 'integration@example.com',
  role: 'MANAGER',
};

jest.mock('../../src/middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = mockUser;
    next();
  }),
}));

describe('Team Assignment Flow Integration', () => {
  let testClient: { id: string };
  let testProject: { id: string };
  let testUser1: { id: string; name: string; email: string };
  let testUser2: { id: string; name: string; email: string };
  let testPhase: { id: string };

  beforeAll(async () => {
    setupRoutes();

    testClient = await prisma.client.create({
      data: { name: 'Team Assignment Client', email: 'assignment@example.com' },
    });

    testUser1 = await prisma.user.create({
      data: {
        email: 'assign1@example.com',
        name: 'Assignment User 1',
        role: 'TEAM_MEMBER',
      },
    });

    testUser2 = await prisma.user.create({
      data: {
        email: 'assign2@example.com',
        name: 'Assignment User 2',
        role: 'TEAM_MEMBER',
      },
    });
  });

  afterAll(async () => {
    await prisma.assignment.deleteMany({});
    await prisma.phase.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({ where: { id: mockUser.id } });
    await prisma.client.deleteMany({});
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.assignment.deleteMany({});
    await prisma.phase.deleteMany({});
    await prisma.project.deleteMany({});

    testProject = await prisma.project.create({
      data: {
        clientId: testClient.id,
        contractCode: `TEAM-${Date.now()}`,
        name: 'Team Assignment Test Project',
        startDate: new Date('2025-01-01'),
        estimatedEndDate: new Date('2025-03-01'),
        builtUpArea: 1000,
      },
    });

    testPhase = await prisma.phase.create({
      data: {
        projectId: testProject.id,
        name: 'Test Phase',
        phaseOrder: 1,
        status: 'IN_PROGRESS',
      },
    });
  });

  describe('Complete Assignment Workflow', () => {
    it('should create assignment and verify in database', async () => {
      const response = await request(app)
        .post(`/api/v1/phases/${testPhase.id}/assignments`)
        .set('Authorization', `Bearer ${mockUser.id}`)
        .send({
          userId: testUser1.id,
          role: 'TEAM_MEMBER',
          workingPercent: 50,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-03-01'),
        })
        .expect(201);

      const dbAssignment = await prisma.assignment.findUnique({
        where: { id: response.body.id },
      });

      expect(dbAssignment).not.toBeNull();
      expect(dbAssignment.userId).toBe(testUser1.id);
      expect(dbAssignment.phaseId).toBe(testPhase.id);
    });

    it('should retrieve assignments for phase', async () => {
      await request(app)
        .post(`/api/v1/phases/${testPhase.id}/assignments`)
        .set('Authorization', `Bearer ${mockUser.id}`)
        .send({
          userId: testUser1.id,
          role: 'TEAM_MEMBER',
          workingPercent: 50,
        });

      const assignmentsResponse = await request(app)
        .get(`/api/v1/phases/${testPhase.id}/assignments`)
        .set('Authorization', `Bearer ${mockUser.id}`)
        .expect(200);

      expect(assignmentsResponse.body).toBeInstanceOf(Array);
      expect(assignmentsResponse.body).toHaveLength(1);
      expect(assignmentsResponse.body[0].userId).toBe(testUser1.id);
    });

    it('should delete assignment and verify removal', async () => {
      const created = await request(app)
        .post(`/api/v1/phases/${testPhase.id}/assignments`)
        .set('Authorization', `Bearer ${mockUser.id}`)
        .send({
          userId: testUser1.id,
          role: 'TEAM_MEMBER',
          workingPercent: 50,
        })
        .expect(201);

      await request(app)
        .delete(`/api/v1/assignments/${created.body.id}`)
        .set('Authorization', `Bearer ${mockUser.id}`)
        .expect(204);

      const deleted = await prisma.assignment.findUnique({
        where: { id: created.body.id },
      });

      expect(deleted).toBeNull();
    });
  });

  describe('Multiple Team Members', () => {
    it('should assign multiple team members to same phase', async () => {
      await request(app)
        .post(`/api/v1/phases/${testPhase.id}/assignments`)
        .set('Authorization', `Bearer ${mockUser.id}`)
        .send({
          userId: testUser1.id,
          role: 'TEAM_MEMBER',
          workingPercent: 40,
        })
        .expect(201);

      await request(app)
        .post(`/api/v1/phases/${testPhase.id}/assignments`)
        .set('Authorization', `Bearer ${mockUser.id}`)
        .send({
          userId: testUser2.id,
          role: 'TEAM_MEMBER',
          workingPercent: 60,
        })
        .expect(201);

      const assignments = await prisma.assignment.findMany({
        where: { phaseId: testPhase.id },
      });

      expect(assignments).toHaveLength(2);
    });

    it('should update team member allocation', async () => {
      const created = await request(app)
        .post(`/api/v1/phases/${testPhase.id}/assignments`)
        .set('Authorization', `Bearer ${mockUser.id}`)
        .send({
          userId: testUser1.id,
          role: 'TEAM_MEMBER',
          workingPercent: 50,
        });

      const assignmentsResponse = await request(app)
        .get('/api/v1/team/allocation')
        .set('Authorization', `Bearer ${mockUser.id}`)
        .expect(200);

      const initialAllocation = assignmentsResponse.body.find(
        (a: any) => a.userId === testUser1.id
      );
      expect(initialAllocation.totalAllocation).toBe(50);

      await request(app)
        .delete(`/api/v1/assignments/${created.body.id}`)
        .set('Authorization', `Bearer ${mockUser.id}`)
        .expect(204);

      await request(app)
        .post(`/api/v1/phases/${testPhase.id}/assignments`)
        .set('Authorization', `Bearer ${mockUser.id}`)
        .send({
          userId: testUser1.id,
          role: 'TEAM_MEMBER',
          workingPercent: 75,
        })
        .expect(201);

      const updatedAllocationResponse = await request(app)
        .get('/api/v1/team/allocation')
        .set('Authorization', `Bearer ${mockUser.id}`)
        .expect(200);

      const updatedAllocation = updatedAllocationResponse.body.find(
        (a: any) => a.userId === testUser1.id
      );
      expect(updatedAllocation.totalAllocation).toBe(75);
    });
  });

  describe('Cross-Phase Assignments', () => {
    it('should assign user to multiple phases', async () => {
      const phase2 = await prisma.phase.create({
        data: {
          projectId: testProject.id,
          name: 'Phase 2',
          phaseOrder: 2,
          status: 'PLANNED',
        },
      });

      await request(app)
        .post(`/api/v1/phases/${testPhase.id}/assignments`)
        .set('Authorization', `Bearer ${mockUser.id}`)
        .send({
          userId: testUser1.id,
          role: 'TEAM_MEMBER',
          workingPercent: 40,
        })
        .expect(201);

      await request(app)
        .post(`/api/v1/phases/${phase2.id}/assignments`)
        .set('Authorization', `Bearer ${mockUser.id}`)
        .send({
          userId: testUser1.id,
          role: 'TEAM_MEMBER',
          workingPercent: 50,
        })
        .expect(201);

      const userAssignments = await prisma.assignment.findMany({
        where: { userId: testUser1.id },
      });

      expect(userAssignments).toHaveLength(2);
    });

    it('should calculate total allocation across phases', async () => {
      const phase2 = await prisma.phase.create({
        data: {
          projectId: testProject.id,
          name: 'Phase -Allocation Testing',
          phaseOrder: 2,
          status: 'IN_PROGRESS',
        },
      });

      await request(app)
        .post(`/api/v1/phases/${testPhase.id}/assignments`)
        .set('Authorization', `Bearer ${mockUser.id}`)
        .send({
          userId: testUser1.id,
          role: 'TEAM_MEMBER',
          workingPercent: 40,
        })
        .expect(201);

      await request(app)
        .post(`/api/v1/phases/${phase2.id}/assignments`)
        .set('Authorization', `Bearer ${mockUser.id}`)
        .send({
          userId: testUser1.id,
          role: 'TEAM_MEMBER',
          workingPercent: 50,
        })
        .expect(201);

      const allocationResponse = await request(app)
        .get('/api/v1/team/allocation')
        .set('Authorization', `Bearer ${mockUser.id}`)
        .expect(200);

      const userAllocation = allocationResponse.body.find(
        (a: any) => a.userId === testUser1.id
      );
      expect(userAllocation.totalAllocation).toBe(90);
    });
  });

  describe('Team Leader Assignments', () => {
    it('should assign team leader as TEAM_LEADER role', async () => {
      const leaderUser = await prisma.user.create({
        data: {
          email: 'leader@example.com',
          name: 'Team Leader',
          role: 'TEAM_LEADER',
        },
      });

      const response = await request(app)
        .post(`/api/v1/phases/${testPhase.id}/assignments`)
        .set('Authorization', `Bearer ${mockUser.id}`)
        .send({
          userId: leaderUser.id,
          role: 'TEAM_LEADER',
          workingPercent: 100,
        })
        .expect(201);

      expect(response.body.role).toBe('TEAM_LEADER');
    });

    it('should set team leader as phase leader', async () => {
      const leaderUser = await prisma.user.create({
        data: {
          email: 'phaseleader@example.com',
          name: 'Phase Leader',
          role: 'TEAM_LEADER',
        },
      });

      await request(app)
        .post(`/api/v1/phases/${testPhase.id}/team-leader`)
        .set('Authorization', `Bearer ${mockUser.id}`)
        .send({
          userId: leaderUser.id,
        })
        .expect(200);

      const updatedPhase = await prisma.phase.findUnique({
        where: { id: testPhase.id },
      });

      expect(updatedPhase.teamLeaderId).toBe(leaderUser.id);
    });

    it('should remove team leader assignment', async () => {
      const leaderUser = await prisma.user.create({
        data: {
          email: 'removable-leader@example.com',
          name: 'Removable Leader',
          role: 'TEAM_LEADER',
        },
      });

      await request(app)
        .post(`/api/v1/phases/${testPhase.id}/team-leader`)
        .set('Authorization', `Bearer ${mockUser.id}`)
        .send({
          userId: leaderUser.id,
        })
        .expect(200);

      await request(app)
        .delete(`/api/v1/phases/${testPhase.id}/team-leader`)
        .set('Authorization', `Bearer ${mockUser.id}`)
        .expect(200);

      const updatedPhase = await prisma.phase.findUnique({
        where: { id: testPhase.id },
      });

      expect(updatedPhase.teamLeaderId).toBeNull();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should prevent duplicate assignments', async () => {
      await request(app)
        .post(`/api/v1/phases/${testPhase.id}/assignments`)
        .set('Authorization', `Bearer ${mockUser.id}`)
        .send({
          userId: testUser1.id,
          role: 'TEAM_MEMBER',
          workingPercent: 50,
        })
        .expect(201);

      await request(app)
        .post(`/api/v1/phases/${testPhase.id}/assignments`)
        .set('Authorization', `Bearer ${mockUser.id}`)
        .send({
          userId: testUser1.id,
          role: 'TEAM_MEMBER',
          workingPercent: 30,
        })
        .expect(409);
    });

    it('should validate workingPercent range (0-100)', async () => {
      await request(app)
        .post(`/api/v1/phases/${testPhase.id}/assignments`)
        .set('Authorization', `Bearer ${mockUser.id}`)
        .send({
          userId: testUser1.id,
          role: 'TEAM_MEMBER',
          workingPercent: -10,
        })
        .expect(400);
    });

    it('should validate date sequence', async () => {
      await request(app)
        .post(`/api/v1/phases/${testPhase.id}/assignments`)
        .set('Authorization', `Bearer ${mockUser.id}`)
        .send({
          userId: testUser1.id,
          role: 'TEAM_MEMBER',
          workingPercent: 50,
          startDate: new Date('2025-03-01'),
          endDate: new Date('2025-01-01'),
        })
        .expect(400);
    });

    it('should handle assignment updates', async () => {
      const created = await request(app)
        .post(`/api/v1/phases/${testPhase.id}/assignments`)
        .set('Authorization', `Bearer ${mockUser.id}`)
        .send({
          userId: testUser1.id,
          role: 'TEAM_MEMBER',
          workingPercent: 50,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-02-01'),
        })
        .expect(201);

      await request(app)
        .delete(`/api/v1/assignments/${created.body.id}`)
        .set('Authorization', `Bearer ${mockUser.id}`)
        .expect(204);

      await request(app)
        .post(`/api/v1/phases/${testPhase.id}/assignments`)
        .set('Authorization', `Bearer ${mockUser.id}`)
        .send({
          userId: testUser1.id,
          role: 'TEAM_MEMBER',
          workingPercent: 75,
          startDate: new Date('2025-01-15'),
          endDate: new Date('2025-03-01'),
        })
        .expect(201);

      const updated = await prisma.assignment.findMany({
        where: { userId: testUser1.id },
      });

      expect(updated).toHaveLength(1);
      expect(updated[0].workingPercent).toBe(75);
    });
  });
});
