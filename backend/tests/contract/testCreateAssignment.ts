import request from 'supertest';
import app from '../../../src/api/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('POST /phases/:phaseId/assignments - Contract Test', () => {
  let authToken: string;
  let testPhase: any;
  let testProject: any;
  let testUser: any;

  beforeAll(async () => {
    testUser = await prisma.user.create({
      data: {
        email: 'test-assignment-api@example.com',
        name: 'Test Manager',
        role: 'MANAGER',
      },
    });

    testProject = await prisma.project.create({
      data: {
        name: 'Test Project for Assignments API',
        contractCode: 'ASSIGN-API-001',
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

    authToken = `Bearer mock-token-${testUser.id}`;
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
    it('should return 201 Created when assignment is successfully created', async () => {
      const newAssignment = {
        teamMemberId: testUser.id,
        role: 'TEAM_MEMBER',
        workingPercentage: 100,
        startDate: '2024-02-01',
        endDate: '2024-02-28',
      };

      const response = await request(app)
        .post(`/api/v1/phases/${testPhase.id}/assignments`)
        .set('Authorization', authToken)
        .send(newAssignment)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        phaseId: testPhase.id,
        teamMemberId: newAssignment.teamMemberId,
        role: newAssignment.role,
        workingPercentage: newAssignment.workingPercentage,
        isActive: true,
        startDate: expect.any(String),
        endDate: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should return 401 Unauthorized without authentication', async () => {
      const newAssignment = {
        teamMemberId: testUser.id,
        role: 'TEAM_MEMBER',
        workingPercentage: 100,
        startDate: '2024-02-01',
        endDate: '2024-02-28',
      };

      await request(app)
        .post(`/api/v1/phases/${testPhase.id}/assignments`)
        .send(newAssignment)
        .expect(401);
    });

    it('should return 404 Not Found for non-existent phase', async () => {
      const newAssignment = {
        teamMemberId: testUser.id,
        role: 'TEAM_MEMBER',
        workingPercentage: 100,
        startDate: '2024-02-01',
        endDate: '2024-02-28',
      };

      await request(app)
        .post('/api/v1/phases/nonexistent/assignments')
        .set('Authorization', authToken)
        .send(newAssignment)
        .expect(404);
    });

    it('should return 400 Bad Request when teamMemberId is missing', async () => {
      const invalidAssignment = {
        role: 'TEAM_MEMBER',
        workingPercentage: 100,
        startDate: '2024-02-01',
        endDate: '2024-02-28',
      };

      const response = await request(app)
        .post(`/api/v1/phases/${testPhase.id}/assignments`)
        .set('Authorization', authToken)
        .send(invalidAssignment)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 409 Conflict when assignment already exists', async () => {
      const assignmentData = {
        teamMemberId: testUser.id,
        role: 'TEAM_MEMBER',
        workingPercentage: 100,
        startDate: '2024-03-01',
        endDate: '2024-03-31',
      };

      await request(app)
        .post(`/api/v1/phases/${testPhase.id}/assignments`)
        .set('Authorization', authToken)
        .send(assignmentData)
        .expect(201);

      await request(app)
        .post(`/api/v1/phases/${testPhase.id}/assignments`)
        .set('Authorization', authToken)
        .send(assignmentData)
        .expect(409);
    });

    it('should return 403 Forbidden for non-MANAGER/TEAM_LEADER user', async () => {
      const teamMemberUser = await prisma.user.create({
        data: {
          email: 'teammember@example.com',
          name: 'Team Member',
          role: 'TEAM_MEMBER',
        },
      });

      const teamMemberToken = `Bearer mock-token-${teamMemberUser.id}`;

      const newAssignment = {
        teamMemberId: testUser.id,
        role: 'TEAM_MEMBER',
        workingPercentage: 100,
        startDate: '2024-02-01',
        endDate: '2024-02-28',
      };

      await request(app)
        .post(`/api/v1/phases/${testPhase.id}/assignments`)
        .set('Authorization', teamMemberToken)
        .send(newAssignment)
        .expect(403);

      await prisma.user.delete({ where: { id: teamMemberUser.id } });
    });
  });

  describe('Request Body Schema Validation', () => {
    it('should accept valid request body', async () => {
      const validBody = {
        teamMemberId: testUser.id,
        role: 'TEAM_MEMBER',
        workingPercentage: 100,
        startDate: '2024-02-01',
        endDate: '2024-02-28',
      };

      const response = await request(app)
        .post(`/api/v1/phases/${testPhase.id}/assignments`)
        .set('Authorization', authToken)
        .send(validBody)
        .expect(201);

      expect(response.body.teamMemberId).toBe(validBody.teamMemberId);
      expect(response.body.role).toBe(validBody.role);
    });

    it('should accept TEAM_LEADER role', async () => {
      const body = {
        teamMemberId: testUser.id,
        role: 'TEAM_LEADER',
        workingPercentage: 50,
        startDate: '2024-02-01',
        endDate: '2024-02-28',
      };

      const response = await request(app)
        .post(`/api/v1/phases/${testPhase.id}/assignments`)
        .set('Authorization', authToken)
        .send(body)
        .expect(201);

      expect(response.body.role).toBe('TEAM_LEADER');
    });

    it('should accept optional endDate', async () => {
      const body = {
        teamMemberId: testUser.id,
        role: 'TEAM_MEMBER',
        workingPercentage: 75,
        startDate: '2024-02-01',
      };

      const response = await request(app)
        .post(`/api/v1/phases/${testPhase.id}/assignments`)
        .set('Authorization', authToken)
        .send(body)
        .expect(201);

      expect(response.body.endDate).toBeNull();
    });

    it('should accept numeric workingPercentage', async () => {
      const body = {
        teamMemberId: testUser.id,
        role: 'TEAM_MEMBER',
        workingPercentage: 50,
        startDate: '2024-02-01',
        endDate: '2024-02-28',
      };

      const response = await request(app)
        .post(`/api/v1/phases/${testPhase.id}/assignments`)
        .set('Authorization', authToken)
        .send(body)
        .expect(201);

      expect(response.body.workingPercentage).toBe(50);
    });
  });

  describe('Response Schema Validation', () => {
    it('should return assignment with all required fields', async () => {
      const body = {
        teamMemberId: testUser.id,
        role: 'TEAM_MEMBER',
        workingPercentage: 100,
        startDate: '2024-02-01',
        endDate: '2024-02-28',
      };

      const response = await request(app)
        .post(`/api/v1/phases/${testPhase.id}/assignments`)
        .set('Authorization', authToken)
        .send(body)
        .expect(201);

      const assignment = response.body;

      expect(assignment).toHaveProperty('id');
      expect(assignment).toHaveProperty('phaseId');
      expect(assignment).toHaveProperty('teamMemberId');
      expect(assignment).toHaveProperty('role');
      expect(assignment).toHaveProperty('workingPercentage');
      expect(assignment).toHaveProperty('startDate');
      expect(assignment).toHaveProperty('endDate');
      expect(assignment).toHaveProperty('isActive');
      expect(assignment).toHaveProperty('createdAt');
      expect(assignment).toHaveProperty('updatedAt');
      expect(assignment).toHaveProperty('version');
    });

    it('should have correct data types', async () => {
      const body = {
        teamMemberId: testUser.id,
        role: 'TEAM_MEMBER',
        workingPercentage: 100,
        startDate: '2024-02-01',
        endDate: '2024-02-28',
      };

      const response = await request(app)
        .post(`/api/v1/phases/${testPhase.id}/assignments`)
        .set('Authorization', authToken)
        .send(body)
        .expect(201);

      const assignment = response.body;

      expect(typeof assignment.id).toBe('string');
      expect(typeof assignment.phaseId).toBe('string');
      expect(typeof assignment.teamMemberId).toBe('string');
      expect(typeof assignment.role).toBe('string');
      expect(typeof assignment.workingPercentage).toBe('number');
      expect(typeof assignment.startDate).toBe('string');
      expect(typeof assignment.endDate).toBe('string');
      expect(typeof assignment.isActive).toBe('boolean');
      expect(typeof assignment.version).toBe('number');
    });
  });

  describe('Data Integrity', () => {
    it('should assign default values for optional fields', async () => {
      const body = {
        teamMemberId: testUser.id,
        role: 'TEAM_MEMBER',
        workingPercentage: 100,
        startDate: '2024-02-01',
        endDate: '2024-02-28',
      };

      const response = await request(app)
        .post(`/api/v1/phases/${testPhase.id}/assignments`)
        .set('Authorization', authToken)
        .send(body)
        .expect(201);

      expect(response.body.isActive).toBe(true);
      expect(response.body.version).toBe(1);
    });

    it('should link assignment to correct phase', async () => {
      const body = {
        teamMemberId: testUser.id,
        role: 'TEAM_MEMBER',
        workingPercentage: 100,
        startDate: '2024-02-01',
        endDate: '2024-02-28',
      };

      const response = await request(app)
        .post(`/api/v1/phases/${testPhase.id}/assignments`)
        .set('Authorization', authToken)
        .send(body)
        .expect(201);

      expect(response.body.phaseId).toBe(testPhase.id);
    });

    it('should link assignment to correct team member', async () => {
      const body = {
        teamMemberId: testUser.id,
        role: 'TEAM_MEMBER',
        workingPercentage: 100,
        startDate: '2024-02-01',
        endDate: '2024-02-28',
      };

      const response = await request(app)
        .post(`/api/v1/phases/${testPhase.id}/assignments`)
        .set('Authorization', authToken)
        .send(body)
        .expect(201);

      expect(response.body.teamMemberId).toBe(testUser.id);
    });
  });

  describe('Edge Cases', () => {
    it('should handle 100% workingPercentage', async () => {
      const body = {
        teamMemberId: testUser.id,
        role: 'TEAM_MEMBER',
        workingPercentage: 100,
        startDate: '2024-02-01',
        endDate: '2024-02-28',
      };

      const response = await request(app)
        .post(`/api/v1/phases/${testPhase.id}/assignments`)
        .set('Authorization', authToken)
        .send(body)
        .expect(201);

      expect(response.body.workingPercentage).toBe(100);
    });

    it('should handle 1% workingPercentage', async () => {
      const body = {
        teamMemberId: testUser.id,
        role: 'TEAM_MEMBER',
        workingPercentage: 1,
        startDate: '2024-02-01',
        endDate: '2024-02-28',
      };

      const response = await request(app)
        .post(`/api/v1/phases/${testPhase.id}/assignments`)
        .set('Authorization', authToken)
        .send(body)
        .expect(201);

      expect(response.body.workingPercentage).toBe(1);
    });

    it('should handle past dates', async () => {
      const body = {
        teamMemberId: testUser.id,
        role: 'TEAM_MEMBER',
        workingPercentage: 50,
        startDate: '2020-01-01',
        endDate: '2020-01-31',
      };

      const response = await request(app)
        .post(`/api/v1/phases/${testPhase.id}/assignments`)
        .set('Authorization', authToken)
        .send(body)
        .expect(201);

      expect(response.body.startDate).toBeDefined();
      expect(response.body.endDate).toBeDefined();
    });

    it('should handle future dates', async () => {
      const body = {
        teamMemberId: testUser.id,
        role: 'TEAM_MEMBER',
        workingPercentage: 50,
        startDate: '2030-01-01',
        endDate: '2030-01-31',
      };

      const response = await request(app)
        .post(`/api/v1/phases/${testPhase.id}/assignments`)
        .set('Authorization', authToken)
        .send(body)
        .expect(201);

      expect(response.body.startDate).toBeDefined();
      expect(response.body.endDate).toBeDefined();
    });
  });
});
