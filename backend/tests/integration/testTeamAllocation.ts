import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import app, { setupRoutes } from '../../src/app';
import { PrismaClient, AssignmentRole } from '@prisma/client';

const prisma = new PrismaClient();

const mockUser = {
  id: 'team-allocation-integration-user-id',
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

describe('Team Allocation Calculation Integration', () => {
  let testClient: { id: string };
  let testUser1: { id: string; name: string; email: string };
  let testUser2: { id: string; name: string; email: string };
  let testProject: { id: string };
  let testPhase1: { id: string };
  let testPhase2: { id: string };

  beforeAll(async () => {
    setupRoutes();

    testClient = await prisma.client.create({
      data: { name: 'Integration Test Client', email: 'integration@example.com' },
    });

    testUser1 = await prisma.user.create({
      data: {
        email: 'user1@example.com',
        name: 'Integration User 1',
        role: 'TEAM_MEMBER',
      },
    });

    testUser2 = await prisma.user.create({
      data: {
        email: 'user2@example.com',
        name: 'Integration User 2',
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
        contractCode: `INT-ALLOC-${Date.now()}`,
        name: 'Team Allocation Test Project',
        startDate: new Date('2025-01-01'),
        estimatedEndDate: new Date('2025-03-01'),
        builtUpArea: 1000,
      },
    });

    testPhase1 = await prisma.phase.create({
      data: {
        projectId: testProject.id,
        name: 'Studies',
        phaseOrder: 1,
        status: 'IN_PROGRESS',
      },
    });

    testPhase2 = await prisma.phase.create({
      data: {
        projectId: testProject.id,
        name: 'Design',
        phaseOrder: 2,
        status: 'PLANNED',
      },
    });
  });

  describe('Allocation Percentage Calculation', () => {
    it('should calculate allocation for single phase assignment', async () => {
      await prisma.assignment.create({
        data: {
          phaseId: testPhase1.id,
          userId: testUser1.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercent: 50,
        },
      });

      const userAssignments = await prisma.assignment.findMany({
        where: { userId: testUser1.id },
      });

      const totalAllocation = userAssignments.reduce((sum, a) => sum + a.workingPercent, 0);

      expect(totalAllocation).toBe(50);
    });

    it('should calculate allocation for multiple phase assignments', async () => {
      await prisma.assignment.create({
        data: {
          phaseId: testPhase1.id,
          userId: testUser1.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercent: 40,
        },
      });

      await prisma.assignment.create({
        data: {
          phaseId: testPhase2.id,
          userId: testUser1.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercent: 30,
        },
      });

      const userAssignments = await prisma.assignment.findMany({
        where: { userId: testUser1.id },
      });

      const totalAllocation = userAssignments.reduce((sum, a) => sum + a.workingPercent, 0);

      expect(totalAllocation).toBe(70);
    });

    it('should identify over-allocated users (>100%)', async () => {
      await prisma.assignment.create({
        data: {
          phaseId: testPhase1.id,
          userId: testUser1.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercent: 80,
        },
      });

      await prisma.assignment.create({
        data: {
          phaseId: testPhase2.id,
          userId: testUser1.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercent: 40,
        },
      });

      const userAssignments = await prisma.assignment.findMany({
        where: { userId: testUser1.id },
      });

      const totalAllocation = userAssignments.reduce((sum, a) => sum + a.workingPercent, 0);

      expect(totalAllocation).toBe(120);
      expect(totalAllocation).toBeGreaterThan(100);
    });
  });

  describe('Allocation by Project', () => {
    it('should calculate allocation for project team', async () => {
      await prisma.assignment.create({
        data: {
          phaseId: testPhase1.id,
          userId: testUser1.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercent: 60,
        },
      });

      await prisma.assignment.create({
        data: {
          phaseId: testPhase2.id,
          userId: testUser1.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercent: 30,
        },
      });

      const projectPhases = await prisma.phase.findMany({
        where: { projectId: testProject.id },
      });

      const projectAssignments = await prisma.assignment.findMany({
        where: {
          phaseId: { in: projectPhases.map(p => p.id) },
        },
        include: { phase: true, user: true },
      });

      expect(projectAssignments).toHaveLength(2);
    });

    it('should filter active project assignments only', async () => {
      const completedProject = await prisma.project.create({
        data: {
          clientId: testClient.id,
          contractCode: `COMP-${Date.now()}`,
          name: 'Completed Project',
          startDate: new Date('2024-01-01'),
          estimatedEndDate: new Date('2024-03-01'),
          builtUpArea: 1000,
          status: 'COMPLETE',
        },
      });

      const completedPhase = await prisma.phase.create({
        data: {
          projectId: completedProject.id,
          name: 'Completed Phase',
          phaseOrder: 1,
          status: 'COMPLETE',
        },
      });

      await prisma.assignment.create({
        data: {
          phaseId: testPhase1.id,
          userId: testUser1.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercent: 50,
        },
      });

      await prisma.assignment.create({
        data: {
          phaseId: completedPhase.id,
          userId: testUser2.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercent: 50,
        },
      });

      const activeProjectPhases = await prisma.phase.findMany({
        where: {
          projectId: testProject.id,
          status: { not: { in: ['COMPLETE', 'CANCELLED'] } },
        },
      });

      const activeAssignments = await prisma.assignment.findMany({
        where: {
          phaseId: { in: activeProjectPhases.map(p => p.id) },
        },
      });

      expect(activeAssignments).toHaveLength(1);
      expect(activeAssignments[0].userId).toBe(testUser1.id);
    });
  });

  describe('Allocation History Tracking', () => {
    it('should track assignment dates', async () => {
      const assignment = await prisma.assignment.create({
        data: {
          phaseId: testPhase1.id,
          userId: testUser1.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercent: 50,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-02-01'),
        },
      });

      expect(assignment.startDate).toBeDefined();
      expect(assignment.endDate).toBeDefined();
      expect(assignment.startDate.getTime()).toBeLessThan(assignment.endDate.getTime());
    });

    it('should support open-ended assignments (no endDate)', async () => {
      const assignment = await prisma.assignment.create({
        data: {
          phaseId: testPhase1.id,
          userId: testUser1.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercent: 50,
          startDate: new Date('2025-01-01'),
        },
      });

      expect(assignment.endDate).toBeNull();
    });
  });

  describe('Team Capacity Planning', () => {
    it('should calculate available capacity for team', async () => {
      await prisma.assignment.create({
        data: {
          phaseId: testPhase1.id,
          userId: testUser1.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercent: 75,
        },
      });

      await prisma.assignment.create({
        data: {
          phaseId: testPhase2.id,
          userId: testUser2.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercent: 50,
        },
      });

      const allAssignments = await prisma.assignment.findMany();

      const totalCapacityUsed = allAssignments.reduce((sum, a) => sum + a.workingPercent, 0);

      expect(totalCapacityUsed).toBe(125);
    });

    it('should identify available team members for new assignments', async () => {
      const availableCapacity = 100;

      await prisma.assignment.create({
        data: {
          phaseId: testPhase1.id,
          userId: testUser1.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercent: 80,
        },
      });

      const user1Assignments = await prisma.assignment.findMany({
        where: { userId: testUser1.id },
      });

      const user1Used = user1Assignments.reduce((sum, a) => sum + a.workingPercent, 0);
      const user1Available = availableCapacity - user1Used;

      expect(user1Available).toBe(20);
    });
  });
});
