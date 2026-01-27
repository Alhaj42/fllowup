import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient, AssignmentRole, PhaseName, Role } from '@prisma/client';
import TeamService from '../../../src/services/teamService';

const prisma = new PrismaClient();

describe('TeamService', () => {
  let testProject: { id: string };
  let testUser: { id: string };
  let testLeader: { id: string };
  let testPhase: { id: string };
  let testPhase2: { id: string };

  beforeAll(async () => {
    // Clean up
    await prisma.assignment.deleteMany({});
    await prisma.phase.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.client.deleteMany({});

    // Create test client
    const client = await prisma.client.create({
      data: {
        name: 'Test Client',
        contactEmail: 'test@example.com',
      },
    });

    // Create test project
    testProject = await prisma.project.create({
      data: {
        clientId: client.id,
        contractCode: `TEAM-${Date.now()}-${Math.random()}`,
        name: 'Team Test Project',
        contractSigningDate: new Date('2025-01-01'),
        startDate: new Date('2025-01-01'),
        estimatedEndDate: new Date('2025-12-31'),
        builtUpArea: 1000,
      },
    });

    // Create test users
    testUser = await prisma.user.create({
      data: {
        email: 'team-member@example.com',
        name: 'Team Member',
        role: 'TEAM_MEMBER',
      },
    });

    testLeader = await prisma.user.create({
      data: {
        email: 'team-leader@example.com',
        name: 'Team Leader',
        role: 'TEAM_LEADER',
      },
    });

    // Create test phases
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

    testPhase2 = await prisma.phase.create({
      data: {
        projectId: testProject.id,
        name: PhaseName.DESIGN,
        startDate: new Date('2025-04-01'),
        duration: 90,
        estimatedEndDate: new Date('2025-07-01'),
        status: 'PLANNED',
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

  describe('assignTeamMember', () => {
    beforeEach(async () => {
      await prisma.assignment.deleteMany({});
    });

    it('should assign team member to phase successfully', async () => {
      const currentUser = await prisma.user.create({
        data: {
          email: 'manager@example.com',
          name: 'Manager',
          role: 'MANAGER',
        },
      });

      const assignment = await TeamService.assignTeamMember(
        {
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 50,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-03-31'),
        },
        currentUser.id,
        currentUser.role
      );

      expect(assignment).toHaveProperty('id');
      expect(assignment.teamMemberId).toBe(testUser.id);
      expect(assignment.phaseId).toBe(testPhase.id);
      expect(assignment.role).toBe(AssignmentRole.TEAM_MEMBER);
      expect(Number(assignment.workingPercentage)).toBe(50);
    });

    it('should throw error when allocation exceeds 100%', async () => {
      await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 80,
        },
      });

      const currentUser = await prisma.user.create({
        data: {
          email: 'manager2@example.com',
          name: 'Manager 2',
          role: 'MANAGER',
        },
      });

      await expect(
        TeamService.assignTeamMember(
          {
            phaseId: testPhase2.id,
            teamMemberId: testUser.id,
            role: AssignmentRole.TEAM_MEMBER,
            workingPercentage: 30,
            startDate: new Date('2025-04-01'),
            endDate: new Date('2025-06-30'),
          },
          currentUser.id,
          currentUser.role
        )
      ).rejects.toThrow('Team member allocation would exceed 100%');
    });

    it('should throw error for non-existent phase', async () => {
      const currentUser = await prisma.user.create({
        data: {
          email: 'manager3@example.com',
          name: 'Manager 3',
          role: 'MANAGER',
        },
      });

      await expect(
        TeamService.assignTeamMember(
          {
            phaseId: 'non-existent-phase-id',
            teamMemberId: testUser.id,
            role: AssignmentRole.TEAM_MEMBER,
            workingPercentage: 50,
            startDate: new Date('2025-01-01'),
            endDate: new Date('2025-03-31'),
          },
          currentUser.id,
          currentUser.role
        )
      ).rejects.toThrow('Phase not found');
    });

    it('should throw error for non-existent team member', async () => {
      const currentUser = await prisma.user.create({
        data: {
          email: 'manager4@example.com',
          name: 'Manager 4',
          role: 'MANAGER',
        },
      });

      await expect(
        TeamService.assignTeamMember(
          {
            phaseId: testPhase.id,
            teamMemberId: 'non-existent-user-id',
            role: AssignmentRole.TEAM_MEMBER,
            workingPercentage: 50,
            startDate: new Date('2025-01-01'),
            endDate: new Date('2025-03-31'),
          },
          currentUser.id,
          currentUser.role
        )
      ).rejects.toThrow('Team member not found');
    });

    it('should throw error when endDate is before startDate', async () => {
      const currentUser = await prisma.user.create({
        data: {
          email: 'manager5@example.com',
          name: 'Manager 5',
          role: 'MANAGER',
        },
      });

      await expect(
        TeamService.assignTeamMember(
          {
            phaseId: testPhase.id,
            teamMemberId: testUser.id,
            role: AssignmentRole.TEAM_MEMBER,
            workingPercentage: 50,
            startDate: new Date('2025-06-01'),
            endDate: new Date('2025-05-01'),
          },
          currentUser.id,
          currentUser.role
        )
      ).rejects.toThrow('endDate must be after startDate');
    });
  });

  describe('updateAssignment', () => {
    let existingAssignment: any;

    beforeEach(async () => {
      await prisma.assignment.deleteMany({});
      existingAssignment = await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 50,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-03-31'),
        },
      });
    });

    it('should update assignment successfully', async () => {
      const currentUser = await prisma.user.create({
        data: {
          email: 'manager6@example.com',
          name: 'Manager 6',
          role: 'MANAGER',
        },
      });

      const updated = await TeamService.updateAssignment(
        existingAssignment.id,
        {
          workingPercentage: 75,
        },
        currentUser.id,
        currentUser.role
      );

      expect(Number(updated.workingPercentage)).toBe(75);
    });

    it('should throw error when update causes over-allocation', async () => {
      // Create another assignment for same user
      await prisma.assignment.create({
        data: {
          phaseId: testPhase2.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 40,
        },
      });

      const currentUser = await prisma.user.create({
        data: {
          email: 'manager7@example.com',
          name: 'Manager 7',
          role: 'MANAGER',
        },
      });

      await expect(
        TeamService.updateAssignment(
          existingAssignment.id,
          {
            workingPercentage: 70,
          },
          currentUser.id,
          currentUser.role
        )
      ).rejects.toThrow('Team member allocation would exceed 100%');
    });

    it('should throw error for non-existent assignment', async () => {
      const currentUser = await prisma.user.create({
        data: {
          email: 'manager8@example.com',
          name: 'Manager 8',
          role: 'MANAGER',
        },
      });

      await expect(
        TeamService.updateAssignment(
          'non-existent-assignment-id',
          {
            workingPercentage: 75,
          },
          currentUser.id,
          currentUser.role
        )
      ).rejects.toThrow('Assignment not found');
    });
  });

  describe('getTeamMemberAssignments', () => {
    beforeEach(async () => {
      await prisma.assignment.deleteMany({});
    });

    it('should return empty array for user with no assignments', async () => {
      const assignments = await TeamService.getTeamMemberAssignments(testUser.id);

      expect(assignments).toHaveLength(0);
    });

    it('should return assignments for team member', async () => {
      await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 50,
        },
      });

      await prisma.assignment.create({
        data: {
          phaseId: testPhase2.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_LEADER,
          workingPercentage: 30,
        },
      });

      const assignments = await TeamService.getTeamMemberAssignments(testUser.id);

      expect(assignments).toHaveLength(2);
      expect(assignments[0].teamMemberId).toBe(testUser.id);
      expect(assignments[1].teamMemberId).toBe(testUser.id);
    });
  });

  describe('getProjectTeamAssignments', () => {
    beforeEach(async () => {
      await prisma.assignment.deleteMany({});
    });

    it('should return all assignments for project across phases', async () => {
      await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 50,
        },
      });

      await prisma.assignment.create({
        data: {
          phaseId: testPhase2.id,
          teamMemberId: testLeader.id,
          role: AssignmentRole.TEAM_LEADER,
          workingPercentage: 100,
        },
      });

      const assignments = await TeamService.getProjectTeamAssignments(testProject.id);

      expect(assignments).toHaveLength(2);
    });

    it('should return empty array for project with no assignments', async () => {
      const assignments = await TeamService.getProjectTeamAssignments(testProject.id);

      expect(assignments).toHaveLength(0);
    });
  });

  describe('checkAllocation', () => {
    beforeEach(async () => {
      await prisma.assignment.deleteMany({});
    });

    it('should return not overallocated for new user', async () => {
      const result = await TeamService.checkAllocation(testUser.id, 50);

      expect(result.isOverallocated).toBe(false);
      expect(result.currentAllocation).toBe(0);
      expect(result.proposedAllocation).toBe(50);
      expect(result.warning).toBeNull();
    });

    it('should return not overallocated for valid allocation', async () => {
      await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 40,
        },
      });

      const result = await TeamService.checkAllocation(testUser.id, 30);

      expect(result.isOverallocated).toBe(false);
      expect(result.currentAllocation).toBe(40);
      expect(result.proposedAllocation).toBe(70);
      expect(result.warning).toBeNull();
    });

    it('should return overallocated for >100% allocation', async () => {
      await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 80,
        },
      });

      const result = await TeamService.checkAllocation(testUser.id, 30);

      expect(result.isOverallocated).toBe(true);
      expect(result.currentAllocation).toBe(80);
      expect(result.proposedAllocation).toBe(110);
      expect(result.warning).toContain('Team member allocation would exceed 100%');
    });

    it('should return overallocated for exactly 100%', async () => {
      await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 100,
        },
      });

      const result = await TeamService.checkAllocation(testUser.id, 1);

      expect(result.isOverallocated).toBe(true);
      expect(result.currentAllocation).toBe(100);
      expect(result.proposedAllocation).toBe(101);
      expect(result.warning).toContain('101%');
    });
  });

  describe('removeAssignment', () => {
    it('should delete assignment successfully', async () => {
      const assignment = await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 50,
        },
      });

      const currentUser = await prisma.user.create({
        data: {
          email: 'manager9@example.com',
          name: 'Manager 9',
          role: 'MANAGER',
        },
      });

      await TeamService.removeAssignment(assignment.id, currentUser.id, currentUser.role);

      const deleted = await prisma.assignment.findUnique({
        where: { id: assignment.id },
      });

      expect(deleted).toBeNull();
    });

    it('should throw error for non-existent assignment', async () => {
      const currentUser = await prisma.user.create({
        data: {
          email: 'manager10@example.com',
          name: 'Manager 10',
          role: 'MANAGER',
        },
      });

      await expect(
        TeamService.removeAssignment(
          'non-existent-assignment-id',
          currentUser.id,
          currentUser.role
        )
      ).rejects.toThrow('Assignment not found');
    });
  });

  describe('getTeamWorkload', () => {
    beforeEach(async () => {
      await prisma.assignment.deleteMany({});
    });

    it('should return workload for all team members', async () => {
      await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 50,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-03-31'),
        },
      });

      await prisma.assignment.create({
        data: {
          phaseId: testPhase2.id,
          teamMemberId: testLeader.id,
          role: AssignmentRole.TEAM_LEADER,
          workingPercentage: 100,
          startDate: new Date('2025-04-01'),
          endDate: new Date('2025-06-30'),
        },
      });

      const workload = await TeamService.getTeamWorkload();

      expect(workload.length).toBeGreaterThanOrEqual(2);

      const userWorkload = workload.find(w => w.teamMemberId === testUser.id);
      expect(userWorkload).toBeDefined();
      expect(userWorkload?.totalAllocation).toBe(50);
      expect(userWorkload?.isOverallocated).toBe(false);
    });

    it('should mark overallocated members', async () => {
      // Create assignments for user across phases
      await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 60,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-03-31'),
        },
      });

      await prisma.assignment.create({
        data: {
          phaseId: testPhase2.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 50,
          startDate: new Date('2025-04-01'),
          endDate: new Date('2025-06-30'),
        },
      });

      const workload = await TeamService.getTeamWorkload();

      const userWorkload = workload.find(w => w.teamMemberId === testUser.id);
      expect(userWorkload?.totalAllocation).toBe(110);
      expect(userWorkload?.isOverallocated).toBe(true);
    });

    it('should filter by project when provided', async () => {
      await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 50,
        },
      });

      const workload = await TeamService.getTeamWorkload({ projectId: testProject.id });

      expect(workload.length).toBeGreaterThan(0);
      workload.forEach(entry => {
        entry.assignments.forEach(assignment => {
          expect(assignment.phase.projectId).toBe(testProject.id);
        });
      });
    });

    it('should return assignments sorted by team member name', async () => {
      const userB = await prisma.user.create({
        data: {
          email: 'user-b@example.com',
          name: 'Beta User',
          role: 'TEAM_MEMBER',
        },
      });

      const userA = await prisma.user.create({
        data: {
          email: 'user-a@example.com',
          name: 'Alpha User',
          role: 'TEAM_MEMBER',
        },
      });

      await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: userB.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 30,
        },
      });

      await prisma.assignment.create({
        data: {
          phaseId: testPhase.id,
          teamMemberId: userA.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 40,
        },
      });

      const workload = await TeamService.getTeamWorkload();

      const alphaIndex = workload.findIndex(w => w.teamMemberName === 'Alpha User');
      const betaIndex = workload.findIndex(w => w.teamMemberName === 'Beta User');

      expect(alphaIndex).toBeLessThan(betaIndex);
    });
  });
});
