import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient, AssignmentRole, PhaseName } from '@prisma/client';

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

    const client = await prisma.client.create({
      data: {
        name: 'Test Client',
        contactEmail: 'test@example.com',
      },
    });

    const project = await prisma.project.create({
      data: {
        clientId: client.id,
        contractCode: `UNIT-${Date.now()}-${Math.random()}`,
        name: 'Unit Test Project',
        contractSigningDate: new Date('2025-01-01'),
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
        name: PhaseName.STUDIES,
        startDate: new Date('2025-01-01'),
        duration: 60,
        estimatedEndDate: new Date('2025-03-01'),
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
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 50,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-03-01'),
        },
      });

      expect(assignment).toHaveProperty('id');
      expect(assignment.phaseId).toBe(testPhase.id);
      expect(assignment.teamMemberId).toBe(testUser.id);
      expect(Number(assignment.workingPercentage)).toBe(50);
    });

    it('should enforce unique constraint on phaseId + teamMemberId + role', async () => {
      await prisma.assignment.deleteMany({});

      await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 50,
        },
      });

      await expect(
        prisma.assignment.create({
          data: {
            phaseId: testPhase.id,
            teamMemberId: testUser.id,
            role: AssignmentRole.TEAM_MEMBER,
            workingPercentage: 30,
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
          teamMemberId: leaderUser.id,
          role: AssignmentRole.TEAM_LEADER,
          workingPercentage: 50,
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
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 50,
        },
      });

      const assignments = await prisma.assignment.findMany({
        where: { phaseId: testPhase.id },
      });

      expect(assignments).toHaveLength(1);
      expect(assignments[0].teamMemberId).toBe(testUser.id);
    });

    it('should find assignments by user', async () => {
      const client2 = await prisma.client.create({
        data: {
          name: 'Test Client 3',
          contactEmail: 'test3@example.com',
        },
      });

      const project2 = await prisma.project.create({
        data: {
          clientId: client2.id,
          contractCode: `UNIT-${Date.now()}-${Math.random()}`,
          name: 'Unit Test Project 2',
          contractSigningDate: new Date('2025-01-01'),
          startDate: new Date('2025-01-01'),
          estimatedEndDate: new Date('2025-03-01'),
          builtUpArea: 1000,
        },
      });

      const phase2 = await prisma.phase.create({
        data: {
          projectId: project2.id,
          name: PhaseName.STUDIES,
          startDate: new Date('2025-01-01'),
          duration: 60,
          estimatedEndDate: new Date('2025-03-01'),
          status: 'PLANNED',
        },
      });

      await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 30,
        },
      });

      await prisma.assignment.create({
        data: {
          phaseId: phase2.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 40,
        },
      });

      const userAssignments = await prisma.assignment.findMany({
        where: { teamMemberId: testUser.id },
        include: { phase: true, teamMember: true },
      });

      expect(userAssignments).toHaveLength(2);
    });

    it('should calculate total allocation percentage for user', async () => {
      const client2 = await prisma.client.create({
        data: {
          name: 'Test Client 2',
          contactEmail: 'test2@example.com',
        },
      });

      const project2 = await prisma.project.create({
        data: {
          clientId: client2.id,
          contractCode: `UNIT-${Date.now()}-${Math.random()}`,
          name: 'Unit Test Project 2',
          contractSigningDate: new Date('2025-01-01'),
          startDate: new Date('2025-01-01'),
          estimatedEndDate: new Date('2025-03-01'),
          builtUpArea: 1000,
        },
      });

      const phase2 = await prisma.phase.create({
        data: {
          projectId: project2.id,
          name: PhaseName.STUDIES,
          startDate: new Date('2025-01-01'),
          duration: 60,
          estimatedEndDate: new Date('2025-03-01'),
          status: 'PLANNED',
        },
      });

      await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 60,
        },
      });

      await prisma.assignment.create({
        data: {
          phaseId: phase2.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 30,
        },
      });

      const assignments = await prisma.assignment.findMany({
        where: { teamMemberId: testUser.id },
      });

      const totalAllocation = assignments.reduce((sum, a) => sum + Number(a.workingPercentage), 0);

      expect(totalAllocation).toBe(90);
    });
  });

  describe('Assignment Updates', () => {
    beforeEach(async () => {
      await prisma.assignment.deleteMany({});
    });

    it('should update assignment workingPercentage', async () => {
      const assignment = await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 50,
        },
      });

      const updated = await prisma.assignment.update({
        where: { id: assignment.id },
        data: { workingPercentage: 75 },
      });

      expect(Number(updated.workingPercentage)).toBe(75);
    });

    it('should update assignment endDate', async () => {
      const assignment = await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 50,
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
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 50,
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
