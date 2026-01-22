import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('PUT /projects/:id API Contract', () => {
  let authToken: string;
  let testClient: { id: string; name: string };
  let testProject: { id: string; name: string; contractCode: string };

  beforeAll(async () => {
    const client = await prisma.client.create({
      data: {
        name: 'Test Client',
        contactEmail: 'test@example.com',
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

    authToken = 'test-token';

    const project = await prisma.project.create({
      data: {
        clientId: testClient.id,
        name: 'Test Project',
        contractCode: `CONTRACT-${Date.now()}`,
        contractSigningDate: new Date('2024-01-01'),
        builtUpArea: 1000,
        startDate: new Date('2024-01-15'),
        estimatedEndDate: new Date('2024-03-15'),
        currentPhase: 'STUDIES',
        status: 'PLANNED',
        version: 1,
      },
    });
    testProject = project;
  });

  afterAll(async () => {
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.$disconnect();
  });

  it('should return 401 without authentication', async () => {
    const response = await request(app)
      .put(`/api/v1/projects/${testProject.id}`)
      .send({});

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });

  it('should return 404 for non-existent project', async () => {
    const response = await request(app)
      .put('/api/v1/projects/non-existent-id')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Updated Project' });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });

  it('should update project name', async () => {
    const response = await request(app)
      .put(`/api/v1/projects/${testProject.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Updated Project Name' });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Updated Project Name');
    expect(response.body.id).toBe(testProject.id);
    expect(response.body.version).toBe(testProject.version + 1);
  });

  it('should update project status', async () => {
    const response = await request(app)
      .put(`/api/v1/projects/${testProject.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'IN_PROGRESS' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('IN_PROGRESS');
  });

  it('should update project phase', async () => {
    const response = await request(app)
      .put(`/api/v1/projects/${testProject.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ currentPhase: 'DESIGN' });

    expect(response.status).toBe(200);
    expect(response.body.currentPhase).toBe('DESIGN');
  });

  it('should update built-up area', async () => {
    const response = await request(app)
      .put(`/api/v1/projects/${testProject.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ builtUpArea: 2500 });

    expect(response.status).toBe(200);
    expect(response.body.builtUpArea).toBe(2500);
  });

  it('should update project requirements', async () => {
    const response = await request(app)
      .put(`/api/v1/projects/${testProject.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ requirements: 'Updated requirements text' });

    expect(response.status).toBe(200);
    expect(response.body.requirements).toBe('Updated requirements text');
  });

  it('should set actual end date', async () => {
    const response = await request(app)
      .put(`/api/v1/projects/${testProject.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        actualEndDate: new Date('2024-03-10').toISOString(),
        status: 'COMPLETED',
      });

    expect(response.status).toBe(200);
    expect(response.body.actualEndDate).toBeDefined();
    expect(response.body.status).toBe('COMPLETED');
  });

  it('should update modification tracking fields', async () => {
    const response = await request(app)
      .put(`/api/v1/projects/${testProject.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        modificationAllowedTimes: 7,
        modificationDaysPerTime: 15,
      });

    expect(response.status).toBe(200);
    expect(response.body.modificationAllowedTimes).toBe(7);
    expect(response.body.modificationDaysPerTime).toBe(15);
  });

  it('should increment version number on update', async () => {
    const initialVersion = testProject.version;

    const response1 = await request(app)
      .put(`/api/v1/projects/${testProject.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Update 1' });

    expect(response1.body.version).toBe(initialVersion + 1);

    const response2 = await request(app)
      .put(`/api/v1/projects/${testProject.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Update 2' });

    expect(response2.body.version).toBe(initialVersion + 2);
  });

  it('should return 409 on version conflict (without version)', async () => {
    await prisma.project.update({
      where: { id: testProject.id },
      data: { version: 999 },
    });

    const response = await request(app)
      .put(`/api/v1/projects/${testProject.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Conflict Update',
        version: 1,
      });

    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Version conflict');
  });

  it('should handle multiple field updates', async () => {
    const response = await request(app)
      .put(`/api/v1/projects/${testProject.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Multi Update Project',
        builtUpArea: 3000,
        status: 'IN_PROGRESS',
        requirements: 'New requirements',
      });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Multi Update Project');
    expect(response.body.builtUpArea).toBe(3000);
    expect(response.body.status).toBe('IN_PROGRESS');
    expect(response.body.requirements).toBe('New requirements');
  });

  it('should validate negative built-up area', async () => {
    const response = await request(app)
      .put(`/api/v1/projects/${testProject.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ builtUpArea: -500 });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});
