import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Project Creation Flow Integration', () => {
  let authToken: string;
  let testClient: { id: string; name: string };
  let testUser: { id: string; email: string; name: string };

  beforeAll(async () => {
    const client = await prisma.client.create({
      data: {
        name: 'Journey Test Client',
        contactEmail: 'journey@example.com',
        contactPhone: '123-456-7890',
      },
    });
    testClient = client;

    const user = await prisma.user.create({
      data: {
        email: 'journey-manager@example.com',
        name: 'Journey Manager',
        role: 'MANAGER',
      },
    });
    testUser = user;

    authToken = 'test-journey-token';
  });

  afterAll(async () => {
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.$disconnect();
  });

  it('should complete full project creation flow', async () => {
    const projectData = {
      clientId: testClient.id,
      name: 'Full Journey Project',
      contractCode: `JOURNEY-${Date.now()}`,
      contractSigningDate: new Date('2024-01-01'),
      builtUpArea: 2000,
      licenseType: 'Commercial',
      projectType: 'Studies',
      requirements: 'Full journey test requirements',
      startDate: new Date('2024-02-01'),
      estimatedEndDate: new Date('2024-04-30'),
    };

    const createResponse = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send(projectData);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.id).toBeDefined();
    expect(createResponse.body.name).toBe('Full Journey Project');

    const projectId = createResponse.body.id;

    const getResponse = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.id).toBe(projectId);
    expect(getResponse.body.name).toBe('Full Journey Project');
  });

  it('should handle project creation with phases', async () => {
    const projectData = {
      clientId: testClient.id,
      name: 'Project with Phases',
      contractCode: `PHASE-${Date.now()}`,
      contractSigningDate: '2024-01-01',
      builtUpArea: 1500,
      startDate: '2024-02-01',
      estimatedEndDate: '2024-06-30',
    };

    const createResponse = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send(projectData);

    expect(createResponse.status).toBe(201);

    const projectId = createResponse.body.id;

    const phaseResponse = await request(app)
      .post(`/api/v1/projects/${projectId}/phases`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'STUDIES',
        startDate: '2024-02-01',
        duration: 30,
      });

    expect(phaseResponse.status).toBe(201);
  });

  it('should handle project update after creation', async () => {
    const createResponse = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        clientId: testClient.id,
        name: 'Initial Project',
        contractCode: `UPDATE-${Date.now()}`,
        contractSigningDate: '2024-01-01',
        builtUpArea: 1000,
        startDate: '2024-02-01',
        estimatedEndDate: '2024-04-30',
      });

    expect(createResponse.status).toBe(201);

    const updateResponse = await request(app)
      .put(`/api/v1/projects/${createResponse.body.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Updated Project Name',
        status: 'IN_PROGRESS',
        builtUpArea: 1200,
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.name).toBe('Updated Project Name');
    expect(updateResponse.body.status).toBe('IN_PROGRESS');
    expect(updateResponse.body.builtUpArea).toBe(1200);
  });

  it('should handle multiple project operations in sequence', async () => {
    const projects = [];
    for (let i = 0; i < 3; i++) {
      const response = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          clientId: testClient.id,
          name: `Sequence Project ${i}`,
          contractCode: `SEQ-${i}-${Date.now()}`,
          contractSigningDate: '2024-01-01',
          builtUpArea: 1000 + i * 500,
          startDate: '2024-02-01',
          estimatedEndDate: '2024-04-30',
        });

      expect(response.status).toBe(201);
      projects.push(response.body);
    }

    const listResponse = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${authToken}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.projects.length).toBeGreaterThanOrEqual(3);
  });

  it('should validate project uniqueness across creations', async () => {
    const contractCode = `UNIQUE-${Date.now()}`;

    const firstResponse = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        clientId: testClient.id,
        name: 'Unique Project 1',
        contractCode,
        contractSigningDate: '2024-01-01',
        builtUpArea: 1000,
        startDate: '2024-02-01',
        estimatedEndDate: '2024-04-30',
      });

    expect(firstResponse.status).toBe(201);

    const secondResponse = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        clientId: testClient.id,
        name: 'Unique Project 2',
        contractCode,
        contractSigningDate: '2024-03-01',
        builtUpArea: 1500,
        startDate: '2024-04-01',
        estimatedEndDate: '2024-06-30',
      });

    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body).toHaveProperty('error');
  });

  it('should handle project deletion', async () => {
    const createResponse = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        clientId: testClient.id,
        name: 'To Delete',
        contractCode: `DELETE-${Date.now()}`,
        contractSigningDate: '2024-01-01',
        builtUpArea: 1000,
        startDate: '2024-02-01',
        estimatedEndDate: '2024-04-30',
      });

    expect(createResponse.status).toBe(201);

    const deleteResponse = await request(app)
      .delete(`/api/v1/projects/${createResponse.body.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(deleteResponse.status).toBe(200);

    const getResponse = await request(app)
      .get(`/api/v1/projects/${createResponse.body.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getResponse.status).toBe(404);
  });

  it('should maintain audit trail for project changes', async () => {
    const createResponse = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        clientId: testClient.id,
        name: 'Audit Test Project',
        contractCode: `AUDIT-${Date.now()}`,
        contractSigningDate: '2024-01-01',
        builtUpArea: 1000,
        startDate: '2024-02-01',
        estimatedEndDate: '2024-04-30',
      });

    expect(createResponse.status).toBe(201);

    const updateResponse = await request(app)
      .put(`/api/v1/projects/${createResponse.body.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Updated Audit Test Project',
        status: 'IN_PROGRESS',
      });

    expect(updateResponse.status).toBe(200);

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityType: 'PROJECT',
        entityId: createResponse.body.id,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    expect(auditLogs.length).toBeGreaterThanOrEqual(2);
    expect(auditLogs[0].action).toBe('UPDATE');
    expect(auditLogs[auditLogs.length - 1].action).toBe('CREATE');
  });

  it('should handle project with requirements', async () => {
    const createResponse = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        clientId: testClient.id,
        name: 'Project with Requirements',
        contractCode: `REQ-${Date.now()}`,
        contractSigningDate: '2024-01-01',
        builtUpArea: 1000,
        startDate: '2024-02-01',
        estimatedEndDate: '2024-04-30',
        requirements: 'Initial requirements text',
      });

    expect(createResponse.status).toBe(201);

    const addRequirementResponse = await request(app)
      .post(`/api/v1/projects/${createResponse.body.id}/requirements`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        description: 'First requirement',
        sortOrder: 1,
      });

    expect(addRequirementResponse.status).toBe(201);
  });

  it('should validate modification tracking on updates', async () => {
    const createResponse = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        clientId: testClient.id,
        name: 'Modification Test',
        contractCode: `MOD-${Date.now()}`,
        contractSigningDate: '2024-01-01',
        builtUpArea: 1000,
        startDate: '2024-02-01',
        estimatedEndDate: '2024-04-30',
        modificationAllowedTimes: 3,
        modificationDaysPerTime: 5,
      });

    expect(createResponse.status).toBe(201);

    for (let i = 0; i < 4; i++) {
      const response = await request(app)
        .put(`/api/v1/projects/${createResponse.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: `Modification ${i + 1}`,
        });

      if (i < 3) {
        expect(response.status).toBe(200);
      } else {
        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    }
  });
});
