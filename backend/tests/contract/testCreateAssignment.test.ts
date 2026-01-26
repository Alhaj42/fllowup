import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app, { setupRoutes } from '../../src/app';
import { PrismaClient, AssignmentRole } from '@prisma/client';

const prisma = new PrismaClient();

const mockManagerUser = { id: '', email: '', role: '' };

jest.mock('../../src/middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = mockManagerUser;
    next();
  }),
}));

jest.mock('../../src/services/auditLogService', () => ({
  default: {
    logCreate: jest.fn().mockResolvedValue(undefined),
    logUpdate: jest.fn().mockResolvedValue(undefined),
    logDelete: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('POST /phases/:phaseId/assignments API Contract', () => {
  let testClient: { id: string };
  let testProject: { id: string };
  let testUser: { id: string };
  let testPhase: { id: string };

  beforeAll(async () => {
    await prisma.assignment.deleteMany({});
    await prisma.phase.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.client.deleteMany({});

    setupRoutes();

    testClient = await prisma.client.create({
      data: {
        name: 'Test Client for Assignments',
        email: `assignment-client-${Date.now()}@example.com`,
      },
    });

    testUser = await prisma.user.create({
      data: {
        email: `assignment-user-${Date.now()}@example.com`,
        name: 'Assignment User',
        role: 'TEAM_MEMBER',
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
    await prisma.phase.deleteMany({});
    await prisma.project.deleteMany({});

    testProject = await prisma.project.create({
      data: {
        clientId: testClient.id,
        contractCode: `ASSIGN-${Date.now()}-${Math.random()}`,
        name: 'Test Project for Assignments',
        startDate: new Date('2025-01-01'),
        estimatedEndDate: new Date('2025-03-01'),
        builtUpArea: 1000,
      },
    });

    testPhase = await prisma.phase.create({
      data: {
        projectId: testProject.id,
        name: 'Test Phase',
        phaseOrder: 1,
        status: 'IN_PROGRESS',
      },
    });
  });

  it('should create assignment with valid data', async () => {
    const response = await request(app)
      .post(`/api/v1/phases/${testPhase.id}/assignments`)
      .set('Authorization', `Bearer test-token`)
      .send({
        userId: testUser.id,
        role: 'TEAM_MEMBER',
        workingPercent: 50,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-03-01'),
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.userId).toBe(testUser.id);
    expect(response.body.phaseId).toBe(testPhase.id);
  });

  it('should return 400 if userId is missing', async () => {
    const response = await request(app)
      .post(`/api/v1/phases/${testPhase.id}/assignments`)
      .set('Authorization', `Bearer test-token`)
      .send({
        role: 'TEAM_MEMBER',
        workingPercent: 50,
        startDate: new Date('2025-01-01'),
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  it('should return 404 if phase not found', async () => {
    const response = await request(app)
      .post('/api/v1/phases/non-existent-id/assignments')
      .set('Authorization', `Bearer test-token`)
      .send({
        userId: testUser.id,
        role: ' TEAM_MEMBER',
        workingPercent: 50,
        startDate: new Date('2025-01-01'),
      })
      .expect(404);

    expect(response.body).toHaveProperty('error');
  });

  it('should return 409 if assignment already exists for user+phase', async () => {
    await prisma.assignment.create({
      data: {
        phaseId: testPhase.id,
        userId: testUser.id,
        role: AssignmentRole.TEAM_MEMBER,
        workingPercent: 50,
      },
    });

    const response = await request(app)
      .post(`/api/v1/phases/${testPhase.id}/assignments`)
      .set('Authorization', `Bearer test-token`)
      .send({
        userId: testUser.id,
        role: 'TEAM_MEMBER',
        workingPercent: 30,
        startDate: new Date('2025-01-01'),
      })
      .expect(409);

    expect(response.body).toHaveProperty('error');
  });

  it('should validate workingPercent is between 0 and 100', async () => {
    const response = await request(app)
      .post(`/api/v1/phases/${testPhase.id}/assignments`)
      .set('Authorization', `Bearer test-token`)
      .send({
        userId: testUser.id,
        role: 'TEAM_MEMBER',
        workingPercent: 150,
        startDate: new Date('2025-01-01'),
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  it('should accept optional endDate', async () => {
    const response = await request(app)
      .post(`/api/v1/phases/${testPhase.id}/assignments`)
      .set('Authorization', `Bearer test-token`)
      .send({
        userId: testUser.id,
        role: ' TEAM_MEMBER',
        workingPercent: 50,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-03-01'),
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('endDate');
  });

  it('should validate date sequence (startDate <= endDate)', async () => {
    const response = await request(app)
      .post(`/api/v1/phases/${testPhase.id}/assignments`)
      .set('Authorization', `Bearer test-token`)
      .send({
        userId: testUser.id,
        role: 'TEAM_MEMBER',
        workingPercent: 50,
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-01-01'),
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  it('should return 401 for unauthenticated requests', async () => {
    const response = await request(app)
      .post(`/api/v1/phases/${testPhase.id}/assignments`)
      .send({
        userId: testUser.id,
        role: ' TEAM_MEMBER',
        workingPercent: 50,
        startDate: new Date('2025-01-01'),
      })
      .expect(401);

    expect(response.body).toHaveProperty('error');
  });

  it('should detect over-allocation (>100%)', async () => {
    const response = await request(app)
      .post(`/api/v1/phases/${testPhase.id}/assignments`)
      .set('Authorization', `Bearer test-token`)
      .send({
        userId: testUser.id,
        role: 'TEAM_MEMBER',
        workingPercent: 110,
        startDate: new Date('2025-01-01'),
      })
      .expect(200);

    expect(response.body).toHaveProperty('overallocationWarning');
    expect(response.body.overallocationWarning).toContain('over-allocated');
  });

  it('should create TEAM_LEADER role assignment', async () => {
    const leaderUser = await prisma.user.create({
      data: {
        email: `leader-${Date.now()}@example.com`,
        name: 'Team Leader',
        role: 'TEAM_LEADER',
      },
    });

    const response = await request(app)
      .post(`/api/v1/phases/${testPhase.id}/assignments`)
      .set('Authorization', `Bearer test-token`)
      .send({
        userId: leaderUser.id,
        role: 'TEAM_LEADER',
        workingPercent: 50,
        startDate: new Date('2025-01-01'),
      })
      .expect(201);

    expect(response.body.role).toBe('TEAM_LEADER');
  });
});
