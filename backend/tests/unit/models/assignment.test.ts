import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient, AssignmentRole } from '@prisma/client';

const prisma = new PrismaClient();

describe('Assignment Model', () => {
  let testProject: { id: string };
  let testUser: { id: string; email: string };
  let testPhase: { id: string; projectId: string };

  beforeAll(async () => {
    await prisma.assignment.deleteMany({});
    await prisma.phase.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.client.deleteMany({});

    const project = await prisma.project.create({
      data: {
        clientId: (await prisma.client.create({ data: { name: 'Test Client', email: 'test@example.com' } })).id,
        contractCode: `UNIT-${Date.now()}-${Math.random()}`,
        name: 'Unit Test Project',
        startDate: new Date('2025-01-01'),
        estimatedEndDate: new Date('2025-03-01'),
        builtUpArea: 1000,
      },
    });
    testProject = project;

    testUser = await prisma.user.create({
      data: {
        email: 'assignment-test@example.com',
        name: 'Assignment Test User',
        role: 'TEAM_MEMBER',
      },
    });

    const phase = await prisma.phase.create({
      data: {
        projectId: project.id,
        name: 'Test Phase',
        phaseOrder: 1,
        status: 'PLANNED',
      },
    });
    testPhase = phase;
  });

  afterAll(async () => {
    await prisma.assignment.deleteMany({});
    await prisma.phase.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.$disconnect();
  });

  describe('Assignment Creation', () => {
    it('should create assignment with valid data', async () => {
      await prisma.assignment.deleteMany({});

      const assignment = await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          userId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercent: 50,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-03-01'),
        },
      });

      expect(assignment).toHaveProperty('id');
      expect(assignment.phaseId).toBe(testPhase.id);
      expect(assignment.userId).toBe(testUser.id);
      expect(assignment.workingPercent).toBe(50);
    });

    it('should enforce unique constraint on phaseId + userId', async () => {
      await prisma.assignment.deleteMany({});

      await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          userId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercent: 50,
        },
      });

      await expect(
        prisma.assignment.create({
          data: {
            phaseId: testPhase.id,
            userId: testUser.id,
            role: AssignmentRole.TEAM_MEMBER,
            workingPercent: 30,
          },
        })
      ).rejects.toThrow();
    });

    it('should create TEAM_LEADER role assignment', async () => {
      await prisma.assignment.deleteMany({});

      const leaderUser = await prisma.user.create({
        data: {
          email: 'leader@example.com',
          name: 'Team Leader',
          role: 'TEAM_LEADER',
        },
      });

      const assignment = await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          userId: leaderUser.id,
          role: AssignmentRole.TEAM_LEADER,
          workingPercent: 50,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-03-01'),
        },
      });

      expect(assignment.role).toBe(AssignmentRole.TEAM_LEADER);
    });
  });

  describe('Assignment Queries', () => {
    beforeEach(async () => {
      await prisma.assignment.deleteMany({});
    });

    it('should find assignments by phase', async () => {
      const assignment = await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          userId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercent: 50,
        },
      });

      const assignments = await prisma.assignment.findMany({
        where: { phaseId: testPhase.id },
      });

      expect(assignments).toHaveLength(1);
      expect(assignments[0].userId).toBe(testUser.id);
    });

    it('should find assignments by user', async () => {
      const project2 = await prisma.project.create({
        data: {
          clientId: (await prisma.client.create({ data: { name: 'Test Client 3', email: 'test3@example.com' } })).id,
          contractCode: `UNIT-${Date.now()}-${Math.random()}`,
          name: 'Unit Test Project 2',
          startDate: new Date('2025-01-01'),
          estimatedEndDate: new Date('2025-03-01'),
          builtUpArea: 1000,
        },
      });

      const phase2 = await prisma.phase.create({
        data: {
          projectId: project2.id,
          name: 'Test Phase 2',
          phaseOrder: 1,
          status: 'PLANNED',
        },
      });

      await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          userId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercent: 30,
        },
      });

      await prisma.assignment.create({
        data: {
          phaseId: phase2.id,
          userId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercent: 40,
        },
      });

      const userAssignments = await prisma.assignment.findMany({
        where: { userId: testUser.id },
        include: { phase: true, user: true },
      });

      expect(userAssignments).toHaveLength(2);
    });

    it('should calculate total allocation percentage for user', async () => {
      const project2 = await prisma.project.create({
        data: {
          clientId: (await prisma.client.create({ data: { name: 'Test Client 2', email: 'test2@example.com' } })).id,
          contractCode: `UNIT-${Date.now()}-${Math.random()}`,
          name: 'Unit Test Project 2',
          startDate: new Date('2025-01-01'),
          estimatedEndDate: new Date('2025-03-01'),
          builtUpArea: 1000,
        },
      });

      const phase2 = await prisma.phase.create({
        data: {
          projectId: project2.id,
          name: 'Test Phase 2',
          phaseOrder: 1,
          status: 'PLANNED',
        },
      });

      await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          userId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercent: 60,
        },
      });

      await prisma.assignment.create({
        data: {
          phaseId: phase2.id,
          userId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercent: 30,
        },
      });

      const assignments = await prisma.assignment.findMany({
        where: { userId: testUser.id },
      });

      const totalAllocation = assignments.reduce((sum, a) => sum + a.workingPercent, 0);

      expect(totalAllocation).toBe(90);
    });
  });

  describe('Assignment Updates', () => {
    beforeEach(async () => {
      await prisma.assignment.deleteMany({});
    });

    it('should update assignment workingPercent', async () => {
      const assignment = await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          userId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercent: 50,
        },
      });

      const updated = await prisma.assignment.update({
        where: { id: assignment.id },
        data: { workingPercent: 75 },
      });

      expect(updated.workingPercent).toBe(75);
    });

    it('should update assignment endDate', async () => {
      const assignment = await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          userId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercent: 50,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-03-01'),
        },
      });

      const newEndDate = new Date('2025-04-01');
      const updated = await prisma.assignment.update({
        where: { id: assignment.id },
        data: { endDate: newEndDate },
      });

      expect(updated.endDate).toEqual(newEndDate);
    });
  });

  describe('Assignment Deletion', () => {
    beforeEach(async () => {
      await prisma.assignment.deleteMany({});
    });

    it('should delete assignment', async () => {
      const assignment = await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          userId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercent: 50,
        },
      });

      await prisma.assignment.delete({
        where: { id: assignment.id },
      });

      const deleted = await prisma.assignment.findUnique({
        where: { id: assignment.id },
      });

      expect(deleted).toBeNull();
    });
  });
});
