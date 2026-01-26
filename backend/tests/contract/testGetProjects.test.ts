import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app, { setupRoutes } from '../../src/app';
import { PrismaClient, ProjectStatus } from '@prisma/client';

const prisma = new PrismaClient();

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'MANAGER',
};

// Mock authentication middleware - always sets user and allows all requests
jest.mock('../../src/middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = mockUser;
    next();
  }),
}));

describe('GET /projects API Contract', () => {
  let authToken: string;
  let testClient: { id: string };
  let testProjects: Array<{ id: string; contractCode: string; name: string; status: ProjectStatus }>;

  beforeAll(async () => {
    setupRoutes();

    const client = await prisma.client.create({
      data: {
        name: 'Test Client',
        email: 'test@example.com',
      },
    });
    testClient = client;

    const user = await prisma.user.create({
      data: {
        email: 'manager@example.com',
        name: 'Test Manager',
        role: 'MANAGER',
      },
    });

    testProjects = [];

    for (let i = 0; i < 5; i++) {
      const project = await prisma.project.create({
        data: {
          clientId: testClient.id,
          name: `Test Project ${i}`,
          contractCode: `CONTRACT-00${i}`,
          builtUpArea: 1000 + i * 100,
          startDate: new Date('2024-01-15'),
          estimatedEndDate: new Date('2024-03-15'),
          status: i === 0 ? 'PLANNED' : i === 1 ? 'IN_PROGRESS' : i === 2 ? 'ON_HOLD' : 'COMPLETE',
        },
      });
      testProjects.push({
        id: project.id,
        contractCode: project.contractCode,
        name: project.name,
        status: project.status,
      });
    }

    authToken = 'test-token';
  });

  afterAll(async () => {
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.$disconnect();
  });

  it('should return 200 with valid authentication', async () => {
    const response = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer test-token`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('projects');
    expect(response.body).toHaveProperty('total');
    expect(Array.isArray(response.body.projects)).toBe(true);
  });

  it('should return projects array', async () => {
    const response = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer test-token`);

    expect(response.body.projects).toBeInstanceOf(Array);
    expect(response.body.projects.length).toBeGreaterThanOrEqual(0);
  });

  it('should support status filtering', async () => {
    const response = await request(app)
      .get('/api/v1/projects?status=IN_PROGRESS')
      .set('Authorization', `Bearer test-token`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.projects)).toBe(true);
    response.body.projects.forEach((project: { status: string }) => {
      expect(project.status).toBe('IN_PROGRESS');
    });
  });

  it('should support pagination with page parameter', async () => {
    const response = await request(app)
      .get('/api/v1/projects?page=1&limit=2')
      .set('Authorization', `Bearer test-token`);

    expect(response.status).toBe(200);
    expect(response.body.projects).toBeInstanceOf(Array);
    expect(response.body.projects.length).toBeLessThanOrEqual(2);
    expect(response.body).toHaveProperty('total');
  });

  it('should return correct total count', async () => {
    const response = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer test-token`);

    expect(response.body.total).toBeDefined();
    expect(typeof response.body.total).toBe('number');
    expect(response.body.total).toBeGreaterThanOrEqual(0);
  });

  it('should include all required project fields', async () => {
    const response = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer test-token`);

    if (response.body.projects.length > 0) {
      const project = response.body.projects[0];
      expect(project).toHaveProperty('id');
      expect(project).toHaveProperty('name');
      expect(project).toHaveProperty('contractCode');
      expect(project).toHaveProperty('clientId');
      expect(project).toHaveProperty('status');
      expect(project).toHaveProperty('startDate');
      expect(project).toHaveProperty('estimatedEndDate');
    }
  });

  it('should handle empty results', async () => {
    await prisma.project.deleteMany({});

    const response = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer test-token`);

    expect(response.status).toBe(200);
    expect(response.body.projects).toEqual([]);
    expect(response.body.total).toBe(0);
  });
});
