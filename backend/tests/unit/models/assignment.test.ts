import { PrismaClient, Assignment, AssignmentRole } from '@prisma/client';

const prisma = new PrismaClient();

describe('Assignment Model', () => {
  let testPhase: any;
  let testProject: any;
  let testUser: any;

  beforeAll(async () => {
    testUser = await prisma.user.create({
      data: {
        email: 'test-assignment@example.com',
        name: 'Test User',
        role: 'TEAM_MEMBER',
        position: 'Architect',
        region: 'North',
      },
    });

    testProject = await prisma.project.create({
      data: {
        name: 'Test Project for Assignments',
        contractCode: 'ASSIGN-001',
        clientId: 'client-1',
        contractSigningDate: new Date('2024-01-01'),
        builtUpArea: 1000,
        startDate: new Date('2024-01-15'),
        estimatedEndDate: new Date('2024-12-31'),
        status: 'PLANNED',
        createdBy: testUser.id,
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
  });

  afterAll(async () => {
    await prisma.assignment.deleteMany({});
    await prisma.phase.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe('Create Operations', () => {
    it('should create an assignment successfully', async () => {
      const assignment = await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: 'TEAM_MEMBER',
          workingPercentage: 100,
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-28'),
        },
      });

      expect(assignment).toBeDefined();
      expect(assignment.id).toBeDefined();
      expect(assignment.phaseId).toBe(testPhase.id);
      expect(assignment.teamMemberId).toBe(testUser.id);
      expect(assignment.role).toBe('TEAM_MEMBER');
      expect(assignment.workingPercentage.toNumber()).toBe(100);
      expect(assignment.isActive).toBe(true);
    });

    it('should create a team leader assignment', async () => {
      const assignment = await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: 'TEAM_LEADER',
          workingPercentage: 50,
          startDate: new Date('2024-03-01'),
          endDate: new Date('2024-03-31'),
        },
      });

      expect(assignment.role).toBe('TEAM_LEADER');
      expect(assignment.workingPercentage.toNumber()).toBe(50);
    });

    it('should create assignment with partial allocation', async () => {
      const assignment = await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: 'TEAM_MEMBER',
          workingPercentage: 75,
          startDate: new Date('2024-04-01'),
          endDate: new Date('2024-04-30'),
        },
      });

      expect(assignment.workingPercentage.toNumber()).toBe(75);
    });

    it('should fail to create assignment without required fields', async () => {
      await expect(
        prisma.assignment.create({
          data: {
            phaseId: testPhase.id,
            teamMemberId: testUser.id,
          } as any,
        })
      ).rejects.toThrow();
    });

    it('should enforce unique constraint on phaseId + teamMemberId + role', async () => {
      const assignmentData = {
        phaseId: testPhase.id,
        teamMemberId: testUser.id,
        role: 'TEAM_MEMBER' as AssignmentRole,
        workingPercentage: 100,
        startDate: new Date('2024-05-01'),
        endDate: new Date('2024-05-31'),
      };

      await prisma.assignment.create({ data: assignmentData });

      await expect(
        prisma.assignment.create({
          data: assignmentData,
        })
      ).rejects.toThrow();
    });
  });

  describe('Update Operations', () => {
    let assignment: Assignment;

    beforeEach(async () => {
      assignment = await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: 'TEAM_MEMBER',
          workingPercentage: 100,
          startDate: new Date('2024-06-01'),
          endDate: new Date('2024-06-30'),
        },
      });
    });

    afterEach(async () => {
      await prisma.assignment.delete({ where: { id: assignment.id } });
    });

    it('should update working percentage', async () => {
      const updated = await prisma.assignment.update({
        where: { id: assignment.id },
        data: { workingPercentage: 50 },
      });

      expect(updated.workingPercentage.toNumber()).toBe(50);
    });

    it('should update end date', async () => {
      const newEndDate = new Date('2024-07-15');
      const updated = await prisma.assignment.update({
        where: { id: assignment.id },
        data: { endDate: newEndDate },
      });

      expect(updated.endDate).toEqual(newEndDate);
    });

    it('should deactivate assignment', async () => {
      const updated = await prisma.assignment.update({
        where: { id: assignment.id },
        data: { isActive: false },
      });

      expect(updated.isActive).toBe(false);
    });

    it('should increment version on update', async () => {
      const updated = await prisma.assignment.update({
        where: { id: assignment.id },
        data: { workingPercentage: 75 },
      });

      expect(updated.version).toBe(assignment.version + 1);
    });
  });

  describe('Read Operations', () => {
    let assignments: Assignment[];

    beforeEach(async () => {
      assignments = await Promise.all([
        prisma.assignment.create({
          data: {
            phaseId: testPhase.id,
            teamMemberId: testUser.id,
            role: 'TEAM_MEMBER',
            workingPercentage: 100,
            startDate: new Date('2024-07-01'),
            endDate: new Date('2024-07-31'),
          },
        }),
        prisma.assignment.create({
          data: {
            phaseId: testPhase.id,
            teamMemberId: testUser.id,
            role: 'TEAM_LEADER',
            workingPercentage: 50,
            startDate: new Date('2024-08-01'),
            endDate: new Date('2024-08-31'),
          },
        }),
      ]);
    });

    afterEach(async () => {
      await prisma.assignment.deleteMany({});
    });

    it('should find assignment by id', async () => {
      const found = await prisma.assignment.findUnique({
        where: { id: assignments[0].id },
      });

      expect(found).toBeDefined();
      expect(found?.id).toBe(assignments[0].id);
    });

    it('should find all assignments for a phase', async () => {
      const found = await prisma.assignment.findMany({
        where: { phaseId: testPhase.id },
      });

      expect(found).toHaveLength(2);
    });

    it('should find all assignments for a team member', async () => {
      const found = await prisma.assignment.findMany({
        where: { teamMemberId: testUser.id },
      });

      expect(found).toHaveLength(2);
    });

    it('should find active assignments only', async () => {
      const found = await prisma.assignment.findMany({
        where: { isActive: true },
      });

      expect(found).toHaveLength(2);
    });

    it('should include related phase', async () => {
      const found = await prisma.assignment.findUnique({
        where: { id: assignments[0].id },
        include: { phase: true },
      });

      expect(found?.phase).toBeDefined();
      expect(found?.phase?.id).toBe(testPhase.id);
    });

    it('should include related team member', async () => {
      const found = await prisma.assignment.findUnique({
        where: { id: assignments[0].id },
        include: { teamMember: true },
      });

      expect(found?.teamMember).toBeDefined();
      expect(found?.teamMember?.id).toBe(testUser.id);
    });
  });

  describe('Delete Operations', () => {
    let assignment: Assignment;

    beforeEach(async () => {
      assignment = await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: 'TEAM_MEMBER',
          workingPercentage: 100,
          startDate: new Date('2024-09-01'),
          endDate: new Date('2024-09-30'),
        },
      });
    });

    it('should delete an assignment', async () => {
      await prisma.assignment.delete({
        where: { id: assignment.id },
      });

      const found = await prisma.assignment.findUnique({
        where: { id: assignment.id },
      });

      expect(found).toBeNull();
    });
  });

  describe('Date Constraints', () => {
    it('should accept valid date range (startDate <= endDate)', async () => {
      const assignment = await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: 'TEAM_MEMBER',
          workingPercentage: 100,
          startDate: new Date('2024-10-01'),
          endDate: new Date('2024-10-31'),
        },
      });

      expect(assignment.startDate).toBeDefined();
      expect(assignment.endDate).toBeDefined();
    });

    it('should accept null endDate (ongoing assignment)', async () => {
      const assignment = await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: 'TEAM_MEMBER',
          workingPercentage: 100,
          startDate: new Date('2024-11-01'),
          endDate: null,
        },
      });

      expect(assignment.endDate).toBeNull();
    });
  });

  describe('Percentage Constraints', () => {
    it('should accept valid working percentage (0-100)', async () => {
      const assignment = await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: 'TEAM_MEMBER',
          workingPercentage: 25,
          startDate: new Date('2024-12-01'),
          endDate: new Date('2024-12-31'),
        },
      });

      expect(assignment.workingPercentage.toNumber()).toBe(25);
    });

    it('should accept 100% allocation', async () => {
      const assignment = await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: 'TEAM_MEMBER',
          workingPercentage: 100,
          startDate: new Date('2024-12-01'),
          endDate: new Date('2024-12-31'),
        },
      });

      expect(assignment.workingPercentage.toNumber()).toBe(100);
    });
  });

  describe('Cascade Operations', () => {
    let assignment: Assignment;

    beforeEach(async () => {
      assignment = await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: 'TEAM_MEMBER',
          workingPercentage: 100,
          startDate: new Date('2024-12-01'),
          endDate: new Date('2024-12-31'),
        },
      });
    });

    it('should cascade delete when phase is deleted', async () => {
      await prisma.phase.delete({
        where: { id: testPhase.id },
      });

      const found = await prisma.assignment.findUnique({
        where: { id: assignment.id },
      });

      expect(found).toBeNull();
    });

    it('should cascade delete when team member is deleted', async () => {
      const newAssignment = await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: 'TEAM_MEMBER',
          workingPercentage: 50,
          startDate: new Date('2024-12-01'),
          endDate: new Date('2024-12-31'),
        },
      });

      await prisma.user.delete({
        where: { id: testUser.id },
      });

      const found = await prisma.assignment.findUnique({
        where: { id: newAssignment.id },
      });

      expect(found).toBeNull();
    });
  });
});
