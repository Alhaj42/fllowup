import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app, { setupRoutes } from '../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const mockUser = {
  id: 'test-create-project-user-id',
  email: 'test@example.com',
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

describe('POST /projects API Contract', () => {
  let testClient: { id: string; name: string };

  beforeAll(async () => {
    setupRoutes();

    const client = await prisma.client.create({
      data: {
        name: 'Test Client for Project Creation',
        email: 'test-client@example.com',
      },
    });
    testClient = client;
  });

  afterAll(async () => {
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({
      where: { id: mockUser.id },
    });
    await prisma.client.deleteMany({});
    await prisma.$disconnect();
  });

  it('should create a new project with valid data', async () => {
    const response = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${mockUser.id}`)
      .send({
        clientId: testClient.id,
        contractCode: `CONTRACT-${Date.now()}`,
        name: 'New Test Project',
        startDate: new Date(),
        estimatedEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        builtUpArea: 2000,
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('name', 'New Test Project');
    expect(response.body).toHaveProperty('contractCode');
    expect(response.body).toHaveProperty('status', 'PLANNED');
    expect(response.body).toHaveProperty('clientId', testClient.id);
  });

  it('should return 400 if required fields are missing', async () => {
    const response = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${mockUser.id}`)
      .send({
        name: 'Incomplete Project',
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  it('should return 409 if contract code already exists', async () => {
    await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${mockUser.id}`)
      .send({
        clientId: testClient.id,
        contractCode: 'DUPLICATE-CONTRACT',
        name: 'First Project',
        startDate: new Date(),
        estimatedEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
      .expect(201);

    const response = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${mockUser.id}`)
      .send({
        clientId: testClient.id,
        contractCode: 'DUPLICATE-CONTRACT',
        name: 'Second Project',
        startDate: new Date(),
        estimatedEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
      .expect(409);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('already exists');
  });

  it('should return 401 for unauthenticated requests', async () => {
    const response = await request(app)
      .post('/api/v1/projects')
      .send({
        clientId: testClient.id,
        contractCode: 'TEST-001',
        name: 'Test Project',
        startDate: new Date(),
        estimatedEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
      .expect(401);

    expect(response.body).toHaveProperty('error');
  });

  it('should validate date sequence (startDate <= estimatedEndDate)', async () => {
    const response = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${mockUser.id}`)
      .send({
        clientId: testClient.id,
        contractCode: `TEST-${Date.now()}`,
        name: 'Invalid Dates Project',
        startDate: new Date('2025-01-01'),
        estimatedEndDate: new Date('2024-01-01'),
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  it('should include all optional fields when provided', async () => {
    const response = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${mockUser.id}`)
      .send({
        clientId: testClient.id,
        contractCode: `FULL-${Date.now()}`,
        name: 'Project with All Fields',
        startDate: new Date(),
        estimatedEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        builtUpArea: 1500,
        licenseType: 'RESIDENTIAL',
        projectType: 'NEW_CONSTRUCTION',
        description: 'Test project description',
      })
      .expect(201);

    expect(response.body).toHaveProperty('builtUpArea', 1500);
    expect(response.body).toHaveProperty('licenseType', 'RESIDENTIAL');
    expect(response.body).toHaveProperty('projectType', 'NEW_CONSTRUCTION');
    expect(response.body).toHaveProperty('description', 'Test project description');
  });
});
