import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient, AssignmentRole, PhaseName } from '@prisma/client';
import request from 'supertest';
import express from 'express';
import assignmentRoutes from '../../../src/api/routes/assignmentRoutes';

const prisma = new PrismaClient();

const app = express();
app.use(express.json());
app.use('/api', assignmentRoutes);

describe('POST /assignments endpoint (Contract Test)', () => {
  let testProject: { id: string };
  let testUser: { id: string; email: string };
  let testPhase: { id: string };
  let managerUser: { id: string; role: string };

  beforeAll(async () => {
    await prisma.assignment.deleteMany({});
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
        contractCode: `CONTRACT-${Date.now()}`,
        name: 'Contract Test Project',
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
        email: 'team-member@example.com',
        name: 'Team Member',
        role: 'TEAM_MEMBER',
      },
    });

    managerUser = await prisma.user.create({
      data: {
        email: 'manager@example.com',
        name: 'Manager',
        role: 'MANAGER',
      },
    });
  });

  afterAll(async () => {
    await prisma.assignment.deleteMany({});
    await prisma.phase.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.assignment.deleteMany({});
  });

  describe('POST /assignments', () => {
    it('should create assignment with valid data', async () => {
      const response = await request(app)
        .post('/api/assignments')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 50,
          startDate: '2025-01-01',
          endDate: '2025-03-31',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.teamMemberId).toBe(testUser.id);
      expect(response.body.phaseId).toBe(testPhase.id);
      expect(Number(response.body.workingPercentage)).toBe(50);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/assignments')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          // Missing role, workingPercentage, startDate
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should return 400 for invalid workingPercentage', async () => {
      const response = await request(app)
        .post('/api/assignments')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: -10,
          startDate: '2025-01-01',
          endDate: '2025-03-31',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('workingPercentage must be between 0 and 100');
    });

    it('should return 400 for workingPercentage > 100', async () => {
      const response = await request(app)
        .post('/api/assignments')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 150,
          startDate: '2025-01-01',
          endDate: '2025-03-31',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('workingPercentage must be between 0 and 100');
    });

    it('should return 400 for invalid date range (endDate before startDate)', async () => {
      const response = await request(app)
        .post('/api/assignments')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 50,
          startDate: '2025-06-01',
          endDate: '2025-05-01',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('endDate must be after startDate');
    });

    it('should return 400 for invalid date format', async () => {
      const response = await request(app)
        .post('/api/assignments')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 50,
          startDate: 'invalid-date',
          endDate: '2025-03-31',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid startDate format');
    });

    it('should return 400 for over-allocation (>100%)', async () => {
      // Create existing assignment
      await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 80,
        },
      });

      const response = await request(app)
        .post('/api/assignments')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 30,
          startDate: '2025-01-01',
          endDate: '2025-03-31',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('would exceed 100%');
      expect(response.body.currentAllocation).toBe(80);
      expect(response.body.proposedAllocation).toBe(110);
    });

    it('should return 409 for duplicate assignment (same user, same phase)', async () => {
      await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 50,
        },
      });

      const response = await request(app)
        .post('/api/assignments')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 30,
          startDate: '2025-01-01',
          endDate: '2025-03-31',
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('already assigned');
    });

    it('should return 404 for non-existent phase', async () => {
      const response = await request(app)
        .post('/api/assignments')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          phaseId: 'non-existent-phase-id',
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 50,
          startDate: '2025-01-01',
          endDate: '2025-03-31',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });

    it('should return 404 for non-existent team member', async () => {
      const response = await request(app)
        .post('/api/assignments')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          phaseId: testPhase.id,
          teamMemberId: 'non-existent-user-id',
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 50,
          startDate: '2025-01-01',
          endDate: '2025-03-31',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('PUT /assignments/:id', () => {
    it('should update assignment successfully', async () => {
      const assignment = await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 50,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-03-31'),
        },
      });

      const response = await request(app)
        .put(`/api/assignments/${assignment.id}`)
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          workingPercentage: 75,
        });

      expect(response.status).toBe(200);
      expect(Number(response.body.workingPercentage)).toBe(75);
    });

    it('should return 404 for non-existent assignment', async () => {
      const response = await request(app)
        .put('/api/assignments/non-existent-id')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          workingPercentage: 75,
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });

    it('should return 400 for invalid date range on update', async () => {
      const assignment = await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 50,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-03-31'),
        },
      });

      const response = await request(app)
        .put(`/api/assignments/${assignment.id}`)
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          startDate: '2025-06-01',
          endDate: '2025-05-01',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('endDate must be after startDate');
    });
  });

  describe('DELETE /assignments/:id', () => {
    it('should delete assignment successfully', async () => {
      const assignment = await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 50,
        },
      });

      const response = await request(app)
        .delete(`/api/assignments/${assignment.id}`)
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role);

      expect(response.status).toBe(204);
    });

    it('should return 404 for non-existent assignment', async () => {
      const response = await request(app)
        .delete('/api/assignments/non-existent-id')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });
  });
});
