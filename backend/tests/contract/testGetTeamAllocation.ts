import request from 'supertest';
import app from '../../../src/api/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('GET /team/allocation - Contract Test', () => {
  let authToken: string;
  let testProject: any;
  let testPhase: any;
  let testUsers: any[];

  beforeAll(async () => {
    testUsers = await Promise.all([
      prisma.user.create({
        data: {
          email: 'manager@example.com',
          name: 'Manager User',
          role: 'MANAGER',
        },
      }),
      prisma.user.create({
        data: {
          email: 'member1@example.com',
          name: 'Team Member 1',
          role: 'TEAM_MEMBER',
          position: 'Architect',
        },
      }),
      prisma.user.create({
        data: {
          email: 'member2@example.com',
          name: 'Team Member 2',
          role: 'TEAM_MEMBER',
          position: 'Designer',
        },
      }),
      prisma.user.create({
        data: {
          email: 'member3@example.com',
          name: 'Team Member 3',
          role: 'TEAM_MEMBER',
          position: 'Engineer',
        },
      }),
    ]);

    testProject = await prisma.project.create({
      data: {
        name: 'Test Project for Allocation',
        contractCode: 'ALLOC-001',
        clientId: 'client-1',
        contractSigningDate: new Date('2024-01-01'),
        builtUpArea: 1000,
        startDate: new Date('2024-01-15'),
        estimatedEndDate: new Date('2024-12-31'),
        status: 'PLANNED',
        createdBy: testUsers[0].id,
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

    await prisma.assignment.createMany({
      data: [
        {
          phaseId: testPhase.id,
          teamMemberId: testUsers[1].id,
          role: 'TEAM_MEMBER',
          workingPercentage: 50,
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-28'),
        },
        {
          phaseId: testPhase.id,
          teamMemberId: testUsers[1].id,
          role: 'TEAM_LEADER',
          workingPercentage: 100,
          startDate: new Date('2024-03-01'),
          endDate: new Date('2024-03-31'),
        },
        {
          phaseId: testPhase.id,
          teamMemberId: testUsers[2].id,
          role: 'TEAM_MEMBER',
          workingPercentage: 100,
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-28'),
        },
        {
          phaseId: testPhase.id,
          teamMemberId: testUsers[3].id,
          role: 'TEAM_MEMBER',
          workingPercentage: 75,
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-28'),
        },
      ],
    });

    authToken = `Bearer mock-token-${testUsers[0].id}`;
  });

  afterAll(async () => {
    await prisma.assignment.deleteMany({});
    await prisma.phase.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Request/Response Contract', () => {
    it('should return 200 OK with team allocation data', async () => {
      const response = await request(app)
        .get('/api/v1/team/allocation')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toMatchObject({
        totalTeamMembers: expect.any(Number),
        allocatedMembers: expect.any(Number),
        overallocatedMembers: expect.any(Number),
        allocations: expect.any(Array),
      });
    });

    it('should return 401 Unauthorized without authentication', async () => {
      await request(app)
        .get('/api/v1/team/allocation')
        .expect(401);
    });
  });

  describe('Response Schema Validation', () => {
    it('should return allocation summary with correct fields', async () => {
      const response = await request(app)
        .get('/api/v1/team/allocation')
        .set('Authorization', authToken)
        .expect(200);

      const summary = response.body;

      expect(summary).toHaveProperty('totalTeamMembers');
      expect(summary).toHaveProperty('allocatedMembers');
      expect(summary).toHaveProperty('overallocatedMembers');
      expect(summary).toHaveProperty('allocations');
    });

    it('should have correct data types', async () => {
      const response = await request(app)
        .get('/api/v1/team/allocation')
        .set('Authorization', authToken)
        .expect(200);

      const summary = response.body;

      expect(typeof summary.totalTeamMembers).toBe('number');
      expect(typeof summary.allocatedMembers).toBe('number');
      expect(typeof summary.overallocatedMembers).toBe('number');
      expect(Array.isArray(summary.allocations)).toBe(true);
    });

    it('should return allocation array with correct structure', async () => {
      const response = await request(app)
        .get('/api/v1/team/allocation')
        .set('Authorization', authToken)
        .expect(200);

      const allocations = response.body.allocations;

      if (allocations.length > 0) {
        const allocation = allocations[0];

        expect(allocation).toHaveProperty('userId');
        expect(allocation).toHaveProperty('userName');
        expect(allocation).toHaveProperty('totalAllocation');
        expect(allocation).toHaveProperty('assignments');
        expect(allocation).toHaveProperty('isOverallocated');
      }
    });
  });

  describe('Data Accuracy', () => {
    it('should calculate total team members correctly', async () => {
      const response = await request(app)
        .get('/api/v1/team/allocation')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.totalTeamMembers).toBe(4);
    });

    it('should calculate allocated members correctly', async () => {
      const response = await request(app)
        .get('/api/v1/team/allocation')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.allocatedMembers).toBe(3);
    });

    it('should identify over-allocated members', async () => {
      const response = await request(app)
        .get('/api/v1/team/allocation')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.overallocatedMembers).toBeGreaterThanOrEqual(0);
      expect(response.body.overallocatedMembers).toBeLessThanOrEqual(3);
    });

    it('should calculate per-member allocation correctly', async () => {
      const response = await request(app)
        .get('/api/v1/team/allocation')
        .set('Authorization', authToken)
        .expect(200);

      const allocations = response.body.allocations;

      const member1Allocation = allocations.find((a: any) => a.userId === testUsers[1].id);
      expect(member1Allocation).toBeDefined();
      expect(member1Allocation.totalAllocation).toBe(150);

      const member2Allocation = allocations.find((a: any) => a.userId === testUsers[2].id);
      expect(member2Allocation).toBeDefined();
      expect(member2Allocation.totalAllocation).toBe(100);

      const member3Allocation = allocations.find((a: any) => a.userId === testUsers[3].id);
      expect(member3Allocation).toBeDefined();
      expect(member3Allocation.totalAllocation).toBe(75);
    });

    it('should flag over-allocated members correctly', async () => {
      const response = await request(app)
        .get('/api/v1/team/allocation')
        .set('Authorization', authToken)
        .expect(200);

      const allocations = response.body.allocations;

      const member1Allocation = allocations.find((a: any) => a.userId === testUsers[1].id);
      expect(member1Allocation).toBeDefined();
      expect(member1Allocation.isOverallocated).toBe(true);

      const member2Allocation = allocations.find((a: any) => a.userId === testUsers[2].id);
      expect(member2Allocation).toBeDefined();
      expect(member2Allocation.isOverallocated).toBe(false);
    });
  });

  describe('Assignments Data', () => {
    it('should include assignment details for each team member', async () => {
      const response = await request(app)
        .get('/api/v1/team/allocation')
        .set('Authorization', authToken)
        .expect(200);

      const allocations = response.body.allocations;

      const member1Allocation = allocations.find((a: any) => a.userId === testUsers[1].id);
      expect(member1Allocation.assignments).toHaveLength(2);

      const assignment1 = member1Allocation.assignments[0];
      expect(assignment1).toMatchObject({
        id: expect.any(String),
        phaseId: expect.any(String),
        projectName: expect.any(String),
        role: expect.any(String),
        workingPercentage: expect.any(Number),
        startDate: expect.any(String),
        endDate: expect.any(String),
      });
    });

    it('should group assignments by team member', async () => {
      const response = await request(app)
        .get('/api/v1/team/allocation')
        .set('Authorization', authToken)
        .expect(200);

      const allocations = response.body.allocations;

      const uniqueUserIds = new Set(allocations.map((a: any) => a.userId));
      expect(uniqueUserIds.size).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty assignments list', async () => {
      await prisma.assignment.deleteMany({});

      const response = await request(app)
        .get('/api/v1/team/allocation')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.totalTeamMembers).toBe(4);
      expect(response.body.allocatedMembers).toBe(0);
      expect(response.body.overallocatedMembers).toBe(0);
      expect(response.body.allocations).toHaveLength(4);
    });

    it('should handle users with 100% single allocation', async () => {
      await prisma.assignment.deleteMany({});

      await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUsers[2].id,
          role: 'TEAM_MEMBER',
          workingPercentage: 100,
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-28'),
        },
      });

      const response = await request(app)
        .get('/api/v1/team/allocation')
        .set('Authorization', authToken)
        .expect(200);

      const memberAllocation = response.body.allocations.find((a: any) => a.userId === testUsers[2].id);
      expect(memberAllocation.totalAllocation).toBe(100);
      expect(memberAllocation.isOverallocated).toBe(false);
    });

    it('should handle users with 0% allocation', async () => {
      const response = await request(app)
        .get('/api/v1/team/allocation')
        .set('Authorization', authToken)
        .expect(200);

      const unallocatedUser = response.body.allocations.find((a: any) => a.userId === testUsers[0].id);
      expect(unallocatedUser).toBeDefined();
      expect(unallocatedUser.totalAllocation).toBe(0);
      expect(unallocatedUser.isOverallocated).toBe(false);
      expect(unallocatedUser.assignments).toHaveLength(0);
    });
  });

  describe('Filtering Options', () => {
    it('should accept optional date range filter', async () => {
      const response = await request(app)
        .get('/api/v1/team/allocation')
        .set('Authorization', authToken)
        .query({ startDate: '2024-02-01', endDate: '2024-02-28' })
        .expect(200);

      expect(response.body).toHaveProperty('allocations');
    });

    it('should accept optional projectId filter', async () => {
      const response = await request(app)
        .get('/api/v1/team/allocation')
        .set('Authorization', authToken)
        .query({ projectId: testProject.id })
        .expect(200);

      expect(response.body).toHaveProperty('allocations');
      const allocation = response.body.allocations[0];
      if (allocation && allocation.assignments.length > 0) {
        expect(allocation.assignments[0].projectId).toBe(testProject.id);
      }
    });
  });
});
