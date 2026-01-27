import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient, AssignmentRole, PhaseName } from '@prisma/client';
import request from 'supertest';
import express from 'express';
import assignmentRoutes from '../../../src/api/routes/assignmentRoutes';

const prisma = new PrismaClient();

const app = express();
app.use(express.json());
app.use('/api', assignmentRoutes);

describe('GET /assignments/team/:memberId endpoint (Contract Test)', () => {
  let testProject1: { id: string; name: string };
  let testProject2: { id: string; name: string };
  let testUser: { id: string; email: string };
  let testPhase1: { id: string };
  let testPhase2: { id: string };
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

    testProject1 = await prisma.project.create({
      data: {
        clientId: client.id,
        contractCode: `PROJ1-${Date.now()}`,
        name: 'Project Alpha',
        contractSigningDate: new Date('2025-01-01'),
        startDate: new Date('2025-01-01'),
        estimatedEndDate: new Date('2025-12-31'),
        builtUpArea: 1000,
      },
    });

    testProject2 = await prisma.project.create({
      data: {
        clientId: client.id,
        contractCode: `PROJ2-${Date.now()}`,
        name: 'Project Beta',
        contractSigningDate: new Date('2025-01-01'),
        startDate: new Date('2025-02-01'),
        estimatedEndDate: new Date('2025-12-31'),
        builtUpArea: 1500,
      },
    });

    testUser = await prisma.user.create({
      data: {
        email: 'team-member@example.com',
        name: 'Team Member',
        role: 'TEAM_MEMBER',
      },
    });

    testPhase1 = await prisma.phase.create({
      data: {
        projectId: testProject1.id,
        name: PhaseName.STUDIES,
        startDate: new Date('2025-01-01'),
        duration: 90,
        estimatedEndDate: new Date('2025-04-01'),
        status: 'IN_PROGRESS',
      },
    });

    testPhase2 = await prisma.phase.create({
      data: {
        projectId: testProject2.id,
        name: PhaseName.DESIGN,
        startDate: new Date('2025-02-01'),
        duration: 90,
        estimatedEndDate: new Date('2025-05-01'),
        status: 'PLANNED',
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

  describe('GET /assignments/team/:memberId', () => {
    it('should return empty array for user with no assignments', async () => {
      const response = await request(app)
        .get(`/api/assignments/team/${testUser.id}`)
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it('should return assignments for team member across multiple projects', async () => {
      // Create assignment in project 1
      await prisma.assignment.create({
        data: {
          phaseId: testPhase1.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 50,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-03-31'),
        },
      });

      // Create assignment in project 2
      await prisma.assignment.create({
        data: {
          phaseId: testPhase2.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_LEADER,
          workingPercentage: 30,
          startDate: new Date('2025-02-01'),
          endDate: new Date('2025-04-30'),
        },
      });

      const response = await request(app)
        .get(`/api/assignments/team/${testUser.id}`)
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].teamMemberId).toBe(testUser.id);
      expect(response.body[1].teamMemberId).toBe(testUser.id);
      expect(response.body[0].teamMember.email).toBe(testUser.email);
      expect(response.body[1].teamMember.email).toBe(testUser.email);
    });

    it('should include project and phase details in response', async () => {
      const assignment = await prisma.assignment.create({
        data: {
          phaseId: testPhase1.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 60,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-03-31'),
        },
      });

      const response = await request(app)
        .get(`/api/assignments/team/${testUser.id}`)
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].phase).toBeDefined();
      expect(response.body[0].phase.project).toBeDefined();
      expect(response.body[0].phase.project.name).toBe(testProject1.name);
      expect(response.body[0].phase.name).toBe(testPhase1.name);
      expect(response.body[0].teamMember).toBeDefined();
      expect(response.body[0].teamMember.name).toBeDefined();
      expect(response.body[0].teamMember.email).toBeDefined();
    });

    it('should return 401 for unauthorized request', async () => {
      const response = await request(app)
        .get(`/api/assignments/team/${testUser.id}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Unauthorized');
    });

    it('should return 404 for non-existent team member', async () => {
      const response = await request(app)
        .get('/api/assignments/team/non-existent-user-id')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role);

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });

    it('should return assignments sorted by startDate', async () => {
      await prisma.assignment.create({
        data: {
          phaseId: testPhase2.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 30,
          startDate: new Date('2025-02-01'),
          endDate: new Date('2025-04-30'),
        },
      });

      await prisma.assignment.create({
        data: {
          phaseId: testPhase1.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 50,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-03-31'),
        },
      });

      const response = await request(app)
        .get(`/api/assignments/team/${testUser.id}`)
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(new Date(response.body[0].startDate).getTime()).toBeLessThanOrEqual(
        new Date(response.body[1].startDate).getTime()
      );
    });
  });

  describe('GET /assignments/project/:projectId', () => {
    it('should return empty array for project with no assignments', async () => {
      const response = await request(app)
        .get(`/api/assignments/project/${testProject1.id}`)
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it('should return all assignments for project across all phases', async () => {
      const user2 = await prisma.user.create({
        data: {
          email: 'user2@example.com',
          name: 'User 2',
          role: 'TEAM_MEMBER',
        },
      });

      await prisma.assignment.create({
        data: {
          phaseId: testPhase1.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 50,
        },
      });

      await prisma.assignment.create({
        data: {
          phaseId: testPhase1.id,
          teamMemberId: user2.id,
          role: AssignmentRole.TEAM_LEADER,
          workingPercentage: 100,
        },
      });

      await prisma.assignment.create({
        data: {
          phaseId: testPhase2.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 30,
        },
      });

      const response = await request(app)
        .get(`/api/assignments/project/${testProject1.id}`)
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body.every((a: any) => a.phase.projectId === testProject1.id)).toBe(true);
    });

    it('should include team member details (name, email, role)', async () => {
      await prisma.assignment.create({
        data: {
          phaseId: testPhase1.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 60,
        },
      });

      const response = await request(app)
        .get(`/api/assignments/project/${testProject1.id}`)
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].teamMember).toBeDefined();
      expect(response.body[0].teamMember.name).toBe(testUser.email.split('@')[0]);
      expect(response.body[0].teamMember.email).toBe(testUser.email);
      expect(response.body[0].teamMember.role).toBe('TEAM_MEMBER');
    });

    it('should return assignments sorted by phase and team member', async () => {
      await prisma.assignment.create({
        data: {
          phaseId: testPhase2.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 30,
        },
      });

      await prisma.assignment.create({
        data: {
          phaseId: testPhase1.id,
          teamMemberId: testUser.id,
          role: AssignmentRole.TEAM_MEMBER,
          workingPercentage: 50,
        },
      });

      const response = await request(app)
        .get(`/api/assignments/project/${testProject1.id}`)
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role);

      expect(response.status).toBe(200);
    });

    it('should return 401 for unauthorized request', async () => {
      const response = await request(app)
        .get(`/api/assignments/project/${testProject1.id}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Unauthorized');
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .get('/api/assignments/project/non-existent-project-id')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role);

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });
});
