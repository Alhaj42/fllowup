import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app, { setupRoutes } from '../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const mockUser = {
  id: 'test-update-project-user-id',
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

describe('PUT /projects/:id API Contract', () => {
  let testClient: { id: string; name: string };
  let testProject: { id: string; name: string; version: number };

  beforeAll(async () => {
    setupRoutes();

    const client = await prisma.client.create({
      data: {
        name: 'Test Client for Update',
        email: 'update-client@example.com',
      },
    });
    testClient = client;

    const project = await prisma.project.create({
      data: {
        clientId: client.id,
        name: 'Test Project for Update',
        contractCode: 'UPDATE-CONTRACT',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-03-01'),
      },
    });
    testProject = project;
  });

  afterAll(async () => {
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({
      where: { id: mockUser.id },
    });
    await prisma.client.deleteMany({});
    await prisma.$disconnect();
  });

  it('should update project with valid data', async () => {
    const response = await request(app)
      .put(`/api/v1/projects/${testProject.id}`)
      .set('Authorization', `Bearer ${mockUser.id}`)
      .send({
        name: 'Updated Project Name',
        version: testProject.version,
      })
      .expect(200);

    expect(response.body).toHaveProperty('name', 'Updated Project Name');
    expect(response.body.version).toBe(testProject.version + 1);
  });

  it('should return 404 if project not found', async () => {
    const response = await request(app)
      .put('/api/v1/projects/non-existent-id')
      .set('Authorization', `Bearer ${mockUser.id}`)
      .send({
        name: 'Updated Name',
        version: 1,
      })
      .expect(404);

    expect(response.body).toHaveProperty('error');
  });

  it('should return 409 if version conflicts', async () => {
    await prisma.project.update({
      where: { id: testProject.id },
      data: { name: 'Concurrent Update' },
    });

    const response = await request(app)
      .put(`/api/v1/projects/${testProject.id}`)
      .set('Authorization', `Bearer ${mockUser.id}`)
      .send({
        name: 'Attempted Update',
        version: testProject.version,
      })
      .expect(409);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Version conflict');
  });

  it('should return 400 if version is missing', async () => {
    const response = await request(app)
      .put(`/api/v1/projects/${testProject.id}`)
      .set('Authorization', `Bearer ${mockUser.id}`)
      .send({
        name: 'Updated Name',
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  it('should update multiple fields at once', async () => {
    const response = await request(app)
      .put(`/api/v1/projects/${testProject.id}`)
      .set('Authorization', `Bearer ${mockUser.id}`)
      .send({
        name: 'Updated Name',
        builtUpArea: 2500,
        licenseType: 'UPDATED_LICENSE',
        projectType: 'RENOVATION',
        version: testProject.version + 1,
      })
      .expect(200);

    expect(response.body.name).toBe('Updated Name');
    expect(response.body.builtUpArea).toBe(2500);
    expect(response.body.licenseType).toBe('UPDATED_LICENSE');
    expect(response.body.projectType).toBe('RENOVATION');
  });

  it('should allow updating project status', async () => {
    const response = await request(app)
      .put(`/api/v1/projects/${testProject.id}`)
      .set('Authorization', `Bearer ${mockUser.id}`)
      .send({
        status: 'IN_PROGRESS',
        version: testProject.version + 1,
      })
      .expect(200);

    expect(response.body.status).toBe('IN_PROGRESS');
  });

  it('should return 401 for unauthenticated requests', async () => {
    const response = await request(app)
      .put(`/api/v1/projects/${testProject.id}`)
      .send({
        name: 'Unauthorized Update',
        version: 1,
      })
      .expect(401);

    expect(response.body).toHaveProperty('error');
  });
});
