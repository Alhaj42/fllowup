import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../../src/api/app';

const prisma = new PrismaClient();

describe('Team Allocation Calculation - Integration Test', () => {
  let authToken: string;
  let testProject: any;
  let testPhase: any;
  let testUsers: any[];

  beforeAll(async () => {
    testUsers = await Promise.all([
      prisma.user.create({
        data: {
          email: 'manager-alloc@example.com',
          name: 'Manager',
          role: 'MANAGER',
          position: 'Project Manager',
        },
      }),
      prisma.user.create({
        data: {
          email: 'member-alloc1@example.com',
          name: 'Member 1',
          role: 'TEAM_MEMBER',
          position: 'Architect',
        },
      }),
      prisma.user.create({
        data: {
          email: 'member-alloc2@example.com',
          name: 'Member 2',
          role: 'TEAM_MEMBER',
          position: 'Designer',
        },
      }),
      prisma.user.create({
        data: {
          email: 'member-alloc3@example.com',
          name: 'Member 3',
          role: 'TEAM_MEMBER',
          position: 'Engineer',
        },
      }),
    ]);

    testProject = await prisma.project.create({
      data: {
        name: 'Allocation Test Project',
        contractCode: 'ALLOC-TEST-001',
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

    authToken = `Bearer mock-token-${testUsers[0].id}`;
  });

  afterAll(async () => {
    await prisma.assignment.deleteMany({});
    await prisma.phase.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.assignment.deleteMany({});
  });

  describe('Allocation Calculation Logic', () => {
    it('should calculate single assignment at 100%', async () => {
      await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUsers[1].id,
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

      const allocation = response.body.allocations.find((a: any) => a.userId === testUsers[1].id);
      expect(allocation.totalAllocation).toBe(100);
      expect(allocation.isOverallocated).toBe(false);
    });

    it('should calculate multiple assignments correctly', async () => {
      await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUsers[1].id,
          role: 'TEAM_MEMBER',
          workingPercentage: 50,
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-15'),
        },
      });

      await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUsers[1].id,
          role: 'TEAM_LEADER',
          workingPercentage: 50,
          startDate: new Date('2024-02-16'),
          endDate: new Date('2024-02-28'),
        },
      });

      const response = await request(app)
        .get('/api/v1/team/allocation')
        .set('Authorization', authToken)
        .expect(200);

      const allocation = response.body.allocations.find((a: any) => a.userId === testUsers[1].id);
      expect(allocation.totalAllocation).toBe(100);
      expect(allocation.assignments).toHaveLength(2);
    });

    it('should flag over-allocation (>100%)', async () => {
      await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUsers[1].id,
          role: 'TEAM_MEMBER',
          workingPercentage: 75,
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-15'),
        },
      });

      await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUsers[1].id,
          role: 'TEAM_LEADER',
          workingPercentage: 50,
          startDate: new Date('2024-02-16'),
          endDate: new Date('2024-02-28'),
        },
      });

      const response = await request(app)
        .get('/api/v1/team/allocation')
        .set('Authorization', authToken)
        .expect(200);

      const allocation = response.body.allocations.find((a: any) => a.userId === testUsers[1].id);
      expect(allocation.totalAllocation).toBe(125);
      expect(allocation.isOverallocated).toBe(true);
      expect(response.body.overallocatedMembers).toBeGreaterThan(0);
    });

    it('should handle edge case of exactly 100%', async () => {
      await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUsers[1].id,
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

      const allocation = response.body.allocations.find((a: any) => a.userId === testUsers[1].id);
      expect(allocation.totalAllocation).toBe(100);
      expect(allocation.isOverallocated).toBe(false);
    });
  });

  describe('Active Assignment Filtering', () => {
    it('should only include active assignments in calculation', async () => {
      await prisma.assignment.createMany({
        data: [
          {
            phaseId: testPhase.id,
            teamMemberId: testUsers[1].id,
            role: 'TEAM_MEMBER',
            workingPercentage: 50,
            startDate: new Date('2024-02-01'),
            endDate: new Date('2024-02-28'),
            isActive: true,
          },
          {
            phaseId: testPhase.id,
            teamMemberId: testUsers[1].id,
            role: 'TEAM_LEADER',
            workingPercentage: 75,
            startDate: new Date('2024-03-01'),
            endDate: new Date('2024-03-31'),
            isActive: false,
          },
        ],
      });

      const response = await request(app)
        .get('/api/v1/team/allocation')
        .set('Authorization', authToken)
        .expect(200);

      const allocation = response.body.allocations.find((a: any) => a.userId === testUsers[1].id);
      expect(allocation.totalAllocation).toBe(50);
      expect(allocation.assignments).toHaveLength(1);
    });
  });

  describe('Date Range Filtering', () => {
    it('should filter assignments by date range', async () => {
      await prisma.assignment.createMany({
        data: [
          {
            phaseId: testPhase.id,
            teamMemberId: testUsers[1].id,
            role: 'TEAM_MEMBER',
            workingPercentage: 50,
            startDate: new Date('2024-02-01'),
            endDate: new Date('2024-02-15'),
          },
          {
            phaseId: testPhase.id,
            teamMemberId: testUsers[1].id,
            role: 'TEAM_LEADER',
            workingPercentage: 50,
            startDate: new Date('2024-03-01'),
            endDate: new Date('2024-03-31'),
          },
        ],
      });

      const response = await request(app)
        .get('/api/v1/team/allocation')
        .set('Authorization', authToken)
        .query({ startDate: '2024-02-01', endDate: '2024-02-28' })
        .expect(200);

      const allocation = response.body.allocations.find((a: any) => a.userId === testUsers[1].id);
      expect(allocation.totalAllocation).toBe(50);
      expect(allocation.assignments).toHaveLength(1);
    });
  });

  describe('Project Filtering', () => {
    it('should filter allocations by project', async () => {
      const secondProject = await prisma.project.create({
        data: {
          name: 'Second Project',
          contractCode: 'ALLOC-TEST-002',
          clientId: 'client-1',
          contractSigningDate: new Date('2024-01-01'),
          builtUpArea: 500,
          startDate: new Date('2024-01-15'),
          estimatedEndDate: new Date('2024-12-31'),
          status: 'PLANNED',
          createdBy: testUsers[0].id,
        },
      });

      const secondPhase = await prisma.phase.create({
        data: {
          projectId: secondProject.id,
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
            workingPercentage: 100,
            startDate: new Date('2024-02-01'),
            endDate: new Date('2024-02-28'),
          },
          {
            phaseId: secondPhase.id,
            teamMemberId: testUsers[1].id,
            role: 'TEAM_LEADER',
            workingPercentage: 100,
            startDate: new Date('2024-02-01'),
            endDate: new Date('2024-02-28'),
          },
        ],
      });

      const response = await request(app)
        .get('/api/v1/team/allocation')
        .set('Authorization', authToken)
        .query({ projectId: testProject.id })
        .expect(200);

      const allocation = response.body.allocations.find((a: any) => a.userId === testUsers[1].id);
      expect(allocation.totalAllocation).toBe(100);
      expect(allocation.assignments).toHaveLength(1);

      await prisma.phase.delete({ where: { id: secondPhase.id } });
      await prisma.project.delete({ where: { id: secondProject.id } });
    });
  });

  describe('Multiple Team Members', () => {
    it('should calculate allocations for all team members', async () => {
      await prisma.assignment.createMany({
        data: [
          {
            phaseId: testPhase.id,
            teamMemberId: testUsers[1].id,
            role: 'TEAM_MEMBER',
            workingPercentage: 100,
            startDate: new Date('2024-02-01'),
            endDate: new Date('2024-02-28'),
          },
          {
            phaseId: testPhase.id,
            teamMemberId: testUsers[2].id,
            role: 'TEAM_MEMBER',
            workingPercentage: 75,
            startDate: new Date('2024-02-01'),
            endDate: new Date('2024-02-28'),
          },
          {
            phaseId: testPhase.id,
            teamMemberId: testUsers[3].id,
            role: 'TEAM_MEMBER',
            workingPercentage: 50,
            startDate: new Date('2024-02-01'),
            endDate: new Date('2024-02-28'),
          },
        ],
      });

      const response = await request(app)
        .get('/api/v1/team/allocation')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.totalTeamMembers).toBe(4);
      expect(response.body.allocatedMembers).toBe(3);

      const member1Allocation = response.body.allocations.find((a: any) => a.userId === testUsers[1].id);
      expect(member1Allocation.totalAllocation).toBe(100);
      expect(member1Allocation.isOverallocated).toBe(false);

      const member2Allocation = response.body.allocations.find((a: any) => a.userId === testUsers[2].id);
      expect(member2Allocation.totalAllocation).toBe(75);
      expect(member2Allocation.isOverallocated).toBe(false);

      const member3Allocation = response.body.allocations.find((a: any) => a.userId === testUsers[3].id);
      expect(member3Allocation.totalAllocation).toBe(50);
      expect(member3Allocation.isOverallocated).toBe(false);
    });
  });

  describe('Summary Statistics', () => {
    it('should calculate total team members correctly', async () => {
      const response = await request(app)
        .get('/api/v1/team/allocation')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.totalTeamMembers).toBe(4);
    });

    it('should calculate allocated members count', async () => {
      await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUsers[1].id,
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

      expect(response.body.allocatedMembers).toBe(1);
      expect(response.body.totalTeamMembers).toBe(4);
    });

    it('should calculate over-allocated members count', async () => {
      await prisma.assignment.createMany({
        data: [
          {
            phaseId: testPhase.id,
            teamMemberId: testUsers[1].id,
            role: 'TEAM_MEMBER',
            workingPercentage: 75,
            startDate: new Date('2024-02-01'),
            endDate: new Date('2024-02-15'),
          },
          {
            phaseId: testPhase.id,
            teamMemberId: testUsers[1].id,
            role: 'TEAM_LEADER',
            workingPercentage: 50,
            startDate: new Date('2024-02-16'),
            endDate: new Date('2024-02-28'),
          },
        ],
      });

      const response = await request(app)
        .get('/api/v1/team/allocation')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.overallocatedMembers).toBe(1);
    });
  });
});
