import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app, { setupRoutes } from '../../src/app';
import { PrismaClient, AssignmentRole } from '@prisma/client';

const prisma = new PrismaClient();

const mockUser = {
  id: 'allocation-test-user-id',
  email: 'allocation@example.com',
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

describe('GET /team/allocation API Contract', () => {
  let testClient: { id: string };
  let testProject: { id: string; name: string };
  let testUser1: { id: string; name: string; email: string };
  let testUser2: { id: string; name: string; email: string };
  let testPhase1: { id: string; projectId: string };
  let testPhase2: { id: string; projectId: string };

  beforeAll(async () => {
    await prisma.assignment.deleteMany({});
    await prisma.phase.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.client.deleteMany({});

    setupRoutes();

    testClient = await prisma.client.create({
      data: {
        name: 'Allocation Test Client',
        email: `allocation-${Date.now()}@example.com`,
      },
    });

    testProject = await prisma.project.create({
      data: {
        clientId: testClient.id,
        contractCode: `ALLOC-${Date.now()}-${Math.random()}`,
        name: 'Allocation Test Project',
        startDate: new Date('2025-01-01'),
        estimatedEndDate: new Date('2025-03-01'),
        builtUpArea: 1000,
      },
    });

    testUser1 = await prisma.user.create({
      data: {
        email: `user1-${Date.now()}@example.com`,
        name: 'Test User 1',
        role: 'TEAM_MEMBER',
      },
    });

    testUser2 = await prisma.user.create({
      data: {
        email: `user2-${Date.now()}@example.com`,
        name: 'Test User 2',
        role: 'TEAM_MEMBER',
      },
    });

    testPhase1 = await prisma.phase.create({
      data: {
        projectId: testProject.id,
        name: 'Test Phase 1',
        phaseOrder: 1,
        status: 'IN_PROGRESS',
      },
    });

    testPhase2 = await prisma.phase.create({
      data: {
        projectId: testProject.id,
        name: 'Test Phase 2',
        phaseOrder: 2,
        status: 'PLANNED',
      },
    });
  });

  afterAll(async () => {
    await prisma.assignment.deleteMany({});
    await prisma.phase.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [mockUser.id, testUser1.id, testUser2.id],
        },
      },
    });
    await prisma.client.deleteMany({});
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.assignment.deleteMany({});
  });

  describe('GET /team/allocation API Contract', () => {
    it('should get allocation summary for all team members', async () => {
      const response = await request(app)
        .get('/api/v1/team/allocation')
        .set('Authorization', `Bearer ${mockUser.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalTeamMembers');
      expect(response.body).toHaveProperty('allocatedMembers');
      expect(response.body).toHaveProperty('overallocatedMembers');
      expect(response.body).toHaveProperty('allocations');
      expect(Array.isArray(response.body.allocations)).toBe(true);
    });

  it('should filter allocations by projectId', async () => {
      await prisma.assignment.create({
        data: {
          phaseId: testPhase1.id,
          userId: testUser1.id,
          role: AssignmentRole.TE<arg_value>AM_MEMBER,
          workingPercent: 70,
        },
      });

      const response = await request(app)
        .get('/api/v1/team/allocation')
        .set('Authorization', `Bearer ${mockUser.id}`)
        .query({ projectId: testProject.id })
        .expect(200);

      console.log('Response body:', response.body);
      console.log('Number of allocations:', response.body.allocations?.length);

      const filteredAllocations = response.body.allocations.filter((a: any) => a.projectName === testProject.name);
      console.log('Filtered allocations count:', filteredAllocations.length);
      expect(filteredAllocations.length).toBeGreaterThan(0);
    });

      await new Promise(resolve => setTimeout(resolve, 10));

      const response = await request(app)
        .get('/api/v1/team/allocation')
        .set('Authorization', `Bearer ${mockUser.id}`)
        .query({ projectId: testProject.id })
        .expect(200);

      const filteredAllocations = response.body.allocations.filter((a: any) => a.projectName === testProject.name);
      console.log('Filtered allocations count:', filteredAllocations.length);
      expect(filteredAllocations.length).toBeGreaterThan(0);
    });

      await new Promise(resolve => setTimeout(resolve, 10));

      const response = await request(app)
        .get('/api/v1/team/allocation')
        .set('Authorization', `Bearer ${mockUser.id}`)
        .query({ projectId: testProject.id })
        .expect(200);

      const filteredAllocations = response.body.allocations.filter((a: any) => a.projectName === testProject.name);
      console.log('Filtered allocations count:', filteredAllocations.length);
      expect(filteredAllocations.length).toBeGreaterThan(0);
    });

      const response = await request(app)
        .get('/api/v1/team/allocation')
        .set('Authorization', `Bearer ${mockUser.id}`)
        .query({ projectId: testProject.id })
        .expect(200);

      console.log('Response body:', response.body);
      console.log('Number of allocations:', response.body.allocations?.length);

      const filteredAllocations = response.body.allocations.filter((a: any) => a.projectName === testProject.name);
      console.log('Filtered allocations count:', filteredAllocations.length);
      expect(filteredAllocations.length).toBeGreaterThan(0);
    });

    it('should calculate total allocation percentage per user', async () => {
      const assignment1 = await prisma.assignment.create({
        data: {
          phaseId: testPhase1.id,
          userId: testUser1.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercent: 70,
        },
      });

      const assignment2 = await prisma.assignment.create({
        data: {
          phaseId: testPhase1.id,
          userId: testUser1.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercent: 25,
        },
      });

      const response = await request(app)
        .get('/api/v1/team/allocation')
        .set('Authorization', `Bearer ${mockUser.id}`)
        .expect(200);

      const userAllocation = response.body.allocations.find((a: any) => a.userId === testUser1.id);
      expect(userAllocation.totalAllocation).toBe(95);
    });

    it('should detect over-allocated users', async () => {
      const assignment1 = await prisma.assignment.create({
        data: {
          phaseId: testPhase1.id,
          userId: testUser1.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercent: 70,
        },
      });

      const assignment2 = await prisma.assignment.create({
        data: {
          phaseId: testPhase2.id,
          userId: testUser1.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercent: 40,
        },
      });

      const response = await request(app)
        .get('/api/v1/team/allocation')
        .set('Authorization', `Bearer ${mockUser.id}`)
        .expect(200);

      const userAllocation = response.body.allocations.find((a: any) => a.userId === testUser1.id);
      expect(userAllocation.isOverallocated).toBe(true);
    });

    it('should mark users with allocation <=100% as not over-allocated', async () => {
      await prisma.assignment.create({
        data: {
          phaseId: testPhase1.id,
          userId: testUser1.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercent: 60,
        },
      });

      const response = await request(app)
        .get('/api/v1/team/allocation')
        .set('Authorization', `Bearer ${mockUser.id}`)
        .expect(200);

      const userAllocation = response.body.allocations.find((a: any) => a.userId === testUser1.id);
      expect(userAllocation.isOverallocated).toBe(false);
    });

  it('should return 401 for unauthenticated requests', async () => {
    const response = await request(app)
      .get('/api/v1/team/allocation')
      .expect(401);

    expect(response.body).toHaveProperty('error');
  });
});
