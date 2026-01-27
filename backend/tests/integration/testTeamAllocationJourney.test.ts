import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient, AssignmentRole, PhaseName } from '@prisma/client';
import request from 'supertest';
import express from 'express';
import assignmentRoutes from '../../../src/api/routes/assignmentRoutes';

const prisma = new PrismaClient();

const app = express();
app.use(express.json());
app.use('/api', assignmentRoutes);

describe('Integration Test: Team Allocation User Journey', () => {
  let testClient: { id: string };
  let testProject: { id: string; name: string };
  let testPhases: Array<{ id: string; name: string }>;
  let managerUser: { id: string; email: string };
  let teamMember1: { id: string; email: string; name: string };
  let teamMember2: { id: string; email: string; name: string };
  let teamLeader: { id: string; email: string; name: string };

  beforeAll(async () => {
    // Clean up
    await prisma.assignment.deleteMany({});
    await prisma.phase.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.client.deleteMany({});

    // Create test data
    testClient = await prisma.client.create({
      data: {
        name: 'Integration Test Client',
        contactEmail: 'integration@example.com',
      },
    });

    testProject = await prisma.project.create({
      data: {
        clientId: testClient.id,
        contractCode: `INT-${Date.now()}`,
        name: 'Integration Test Project',
        contractSigningDate: new Date('2025-01-01'),
        startDate: new Date('2025-01-01'),
        estimatedEndDate: new Date('2025-12-31'),
        builtUpArea: 2000,
      },
    });

    // Create phases
    testPhases = [
      await prisma.phase.create({
        data: {
          projectId: testProject.id,
          name: PhaseName.STUDIES,
          startDate: new Date('2025-01-01'),
          duration: 90,
          estimatedEndDate: new Date('2025-04-01'),
          status: 'IN_PROGRESS',
        },
      }),
      await prisma.phase.create({
        data: {
          projectId: testProject.id,
          name: PhaseName.DESIGN,
          startDate: new Date('2025-04-01'),
          duration: 90,
          estimatedEndDate: new Date('2025-07-01'),
          status: 'PLANNED',
        },
      }),
      await prisma.phase.create({
        data: {
          projectId: testProject.id,
          name: PhaseName.EXECUTION,
          startDate: new Date('2025-07-01'),
          duration: 90,
          estimatedEndDate: new Date('2025-10-01'),
          status: 'PLANNED',
        },
      }),
    ];

    // Create users
    managerUser = await prisma.user.create({
      data: {
        email: 'integration-manager@example.com',
        name: 'Integration Manager',
        role: 'MANAGER',
      },
    });

    teamMember1 = await prisma.user.create({
      data: {
        email: 'member1@example.com',
        name: 'Team Member Alpha',
        role: 'TEAM_MEMBER',
      },
    });

    teamMember2 = await prisma.user.create({
      data: {
        email: 'member2@example.com',
        name: 'Team Member Beta',
        role: 'TEAM_MEMBER',
      },
    });

    teamLeader = await prisma.user.create({
      data: {
        email: 'leader@example.com',
        name: 'Team Leader Gamma',
        role: 'TEAM_LEADER',
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

  describe('Scenario 1: Manager assigns team members across multiple phases', () => {
    it('should successfully assign team member to first phase (50%)', async () => {
      const response = await request(app)
        .post('/api/assignments')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          phaseId: testPhases[0].id,
          teamMemberId: teamMember1.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 50,
          startDate: '2025-01-01',
          endDate: '2025-03-31',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(Number(response.body.workingPercentage)).toBe(50);
    });

    it('should successfully assign same team member to second phase (30%)', async () => {
      const response = await request(app)
        .post('/api/assignments')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          phaseId: testPhases[1].id,
          teamMemberId: teamMember1.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 30,
          startDate: '2025-04-01',
          endDate: '2025-06-30',
        });

      expect(response.status).toBe(201);
      expect(Number(response.body.workingPercentage)).toBe(30);
    });

    it('should retrieve all assignments for team member (80% total)', async () => {
      const response = await request(app)
        .get(`/api/assignments/team/${teamMember1.id}`)
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);

      const totalAllocation = response.body.reduce(
        (sum: number, a: any) => sum + Number(a.workingPercentage),
        0
      );
      expect(totalAllocation).toBe(80);
    });
  });

  describe('Scenario 2: Over-allocation detection and rejection', () => {
    it('should reject assignment when allocation would exceed 100%', async () => {
      const response = await request(app)
        .post('/api/assignments')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          phaseId: testPhases[2].id,
          teamMemberId: teamMember1.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 30, // Would make total 110%
          startDate: '2025-07-01',
          endDate: '2025-09-30',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('would exceed 100%');
      expect(response.body.currentAllocation).toBe(80);
      expect(response.body.proposedAllocation).toBe(110);
    });
  });

  describe('Scenario 3: Team Leader assignment to phase', () => {
    it('should successfully assign team leader (100% to one phase)', async () => {
      const response = await request(app)
        .post('/api/assignments')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          phaseId: testPhases[0].id,
          teamMemberId: teamLeader.id,
          role: AssignmentRole.TEAM_LEADER,
          workingPercentage: 100,
          startDate: '2025-01-01',
          endDate: '2025-03-31',
        });

      expect(response.status).toBe(201);
      expect(response.body.role).toBe(AssignmentRole.TEAM_LEADER);
      expect(Number(response.body.workingPercentage)).toBe(100);
    });

    it('should prevent team leader from being assigned to multiple phases (no over-allocation)', async () => {
      const response = await request(app)
        .post('/api/assignments')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          phaseId: testPhases[1].id,
          teamMemberId: teamLeader.id,
          role: AssignmentRole.TEAM_LEADER,
          workingPercentage: 10,
          startDate: '2025-04-01',
          endDate: '2025-06-30',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('would exceed 100%');
    });
  });

  describe('Scenario 4: Manager views project team assignments', () => {
    it('should retrieve all team assignments for project', async () => {
      // Create multiple assignments
      await request(app)
        .post('/api/assignments')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          phaseId: testPhases[0].id,
          teamMemberId: teamMember2.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 50,
          startDate: '2025-01-01',
          endDate: '2025-03-31',
        });

      const response = await request(app)
        .get(`/api/assignments/project/${testProject.id}`)
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role);

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);

      // Verify all assignments belong to the project
      response.body.forEach((assignment: any) => {
        expect(assignment.phase.projectId).toBe(testProject.id);
        expect(assignment.teamMember).toBeDefined();
        expect(assignment.teamMember.name).toBeDefined();
        expect(assignment.teamMember.email).toBeDefined();
      });
    });

    it('should show different roles (TEAM_MEMBER vs TEAM_LEADER)', async () => {
      const response = await request(app)
        .get(`/api/assignments/project/${testProject.id}`)
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role);

      expect(response.status).toBe(200);

      const roles = response.body.map((a: any) => a.role);
      expect(roles).toContain(AssignmentRole.TEAM_MEMBER);
      expect(roles).toContain(AssignmentRole.TEAM_LEADER);
    });
  });

  describe('Scenario 5: Update assignment allocation', () => {
    let assignmentId: string;

    beforeAll(async () => {
      // Create initial assignment
      const createResponse = await request(app)
        .post('/api/assignments')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          phaseId: testPhases[0].id,
          teamMemberId: teamMember2.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 40,
          startDate: '2025-01-01',
          endDate: '2025-03-31',
        });

      assignmentId = createResponse.body.id;
    });

    it('should successfully update assignment percentage', async () => {
      const response = await request(app)
        .put(`/api/assignments/${assignmentId}`)
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          workingPercentage: 60,
        });

      expect(response.status).toBe(200);
      expect(Number(response.body.workingPercentage)).toBe(60);
    });

    it('should reject update that would cause over-allocation', async () => {
      // First assign team member to another phase
      await request(app)
        .post('/api/assignments')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          phaseId: testPhases[1].id,
          teamMemberId: teamMember2.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 30,
          startDate: '2025-04-01',
          endDate: '2025-06-30',
        });

      // Try to update first assignment to 80% (would make total 110%)
      const response = await request(app)
        .put(`/api/assignments/${assignmentId}`)
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          workingPercentage: 80,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('would exceed 100%');
    });
  });

  describe('Scenario 6: Remove assignment', () => {
    let assignmentId: string;

    beforeAll(async () => {
      const createResponse = await request(app)
        .post('/api/assignments')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          phaseId: testPhases[0].id,
          teamMemberId: teamMember1.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 50,
          startDate: '2025-01-01',
          endDate: '2025-03-31',
        });

      assignmentId = createResponse.body.id;
    });

    it('should successfully delete assignment', async () => {
      const deleteResponse = await request(app)
        .delete(`/api/assignments/${assignmentId}`)
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role);

      expect(deleteResponse.status).toBe(204);

      // Verify assignment is deleted
      const getResponse = await request(app)
        .get(`/api/assignments/team/${teamMember1.id}`)
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role);

      expect(getResponse.body).toHaveLength(0);
    });

    it('should allow re-assigning member after deletion', async () => {
      const response = await request(app)
        .post('/api/assignments')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          phaseId: testPhases[1].id,
          teamMemberId: teamMember1.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 100,
          startDate: '2025-04-01',
          endDate: '2025-06-30',
        });

      expect(response.status).toBe(201);
      expect(Number(response.body.workingPercentage)).toBe(100);
    });
  });

  describe('Scenario 7: Complete team allocation journey', () => {
    it('should handle full assignment lifecycle: create, read, update, delete', async () => {
      // Step 1: Create assignment
      const createResponse = await request(app)
        .post('/api/assignments')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          phaseId: testPhases[2].id,
          teamMemberId: teamMember2.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 70,
          startDate: '2025-07-01',
          endDate: '2025-09-30',
        });

      expect(createResponse.status).toBe(201);
      const assignmentId = createResponse.body.id;

      // Step 2: Read assignment
      const readResponse = await request(app)
        .get(`/api/assignments/team/${teamMember2.id}`)
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role);

      expect(readResponse.status).toBe(200);
      expect(readResponse.body).toHaveLength(1);
      expect(readResponse.body[0].id).toBe(assignmentId);

      // Step 3: Update assignment
      const updateResponse = await request(app)
        .put(`/api/assignments/${assignmentId}`)
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          workingPercentage: 80,
        });

      expect(updateResponse.status).toBe(200);
      expect(Number(updateResponse.body.workingPercentage)).toBe(80);

      // Step 4: Delete assignment
      const deleteResponse = await request(app)
        .delete(`/api/assignments/${assignmentId}`)
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role);

      expect(deleteResponse.status).toBe(204);
    });
  });
});
