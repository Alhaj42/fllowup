import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app, { setupRoutes } from '../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const mockManagerUser = {
  id: 'integration-manager-user-id',
  email: 'manager@example.com',
  role: 'MANAGER',
};

const mockTeamLeaderUser = {
  id: 'integration-teamleader-user-id',
  email: 'teamleader@example.com',
  role: 'TEAM_LEADER',
};

jest.mock('../../src/middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = mockManagerUser;
    next();
  }),
}));

describe('Project Creation Flow Integration Tests', () => {
  let testClient: { id: string; name: string };

  beforeAll(async () => {
    setupRoutes();

    testClient = await prisma.client.create({
      data: {
        name: 'Integration Test Client',
        email: 'integration@example.com',
      },
    });
  });

  afterAll(async () => {
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [mockManagerUser.id, mockTeamLeaderUser.id],
        },
      },
    });
    await prisma.client.deleteMany({});
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('Complete Project Creation Flow', () => {
    it('creates project with minimal required fields', async () => {
      const response = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${mockManagerUser.id}`)
        .send({
          clientId: testClient.id,
          contractCode: `INT-MIN-${Date.now()}`,
          name: 'Minimal Test Project',
          startDate: new Date('2025-01-01'),
          estimatedEndDate: new Date('2025-03-01'),
          builtUpArea: 1000,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Minimal Test Project');
      expect(response.body.status).toBe('PLANNED');
      expect(response.body.version).toBe(1);
    });

    it('creates project with all optional fields', async () => {
      const response = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${mockManagerUser.id}`)
        .send({
          clientId: testClient.id,
          contractCode: `INT-FULL-${Date.now()}`,
          name: 'Full Test Project',
          startDate: new Date('2025-01-01'),
          estimatedEndDate: new Date('2025-03-01'),
          builtUpArea: 2000,
          licenseType: 'RESIDENTIAL',
          projectType: 'NEW_CONSTRUCTION',
          description: 'Test project with all fields',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.builtUpArea).toBe(2000);
      expect(response.body.licenseType).toBe('RESIDENTIAL');
      expect(response.body.projectType).toBe('NEW_CONSTRUCTION');
      expect(response.body.description).toBe('Test project with all fields');
    });

    it('creates default phases for new project', async () => {
      const response = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${mockManagerUser.id}`)
        .send({
          clientId: testClient.id,
          contractCode: `INT-PHASE-${Date.now()}`,
          name: 'Project with Phases',
          startDate: new Date('2025-01-01'),
          estimatedEndDate: new Date('2025-03-01'),
          builtUpArea: 1500,
        })
        .expect(201);

      const projectId = response.body.id;

      const phasesResponse = await request(app)
        .get(`/api/v1/projects/${projectId}/phases`)
        .set('Authorization', `Bearer ${mockManagerUser.id}`)
        .expect(200);

      expect(phasesResponse.body).toBeInstanceOf(Array);
      expect(phasesResponse.body.length).toBeGreaterThan(0);
    });

    it('rejects duplicate contract codes', async () => {
      const contractCode = `INT-DUP-${Date.now()}`;

      await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${mockManagerUser.id}`)
        .send({
          clientId: testClient.id,
          contractCode,
          name: 'First Project',
          startDate: new Date('2025-01-01'),
          estimatedEndDate: new Date('2025-03-01'),
          builtUpArea: 1000,
        })
        .expect(201);

      await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${mockManagerUser.id}`)
        .send({
          clientId: testClient.id,
          contractCode,
          name: 'Second Project',
          startDate: new Date('2025-01-01'),
          estimatedEndDate: new Date('2025-03-01'),
          builtUpArea: 1000,
        })
        .expect(409);
    });
  });

  describe('Project Update Flow', () => {
    let createdProject: any;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${mockManagerUser.id}`)
        .send({
          clientId: testClient.id,
          contractCode: `INT-UPD-${Date.now()}`,
          name: 'Project for Update',
          startDate: new Date('2025-01-01'),
          estimatedEndDate: new Date('2025-03-01'),
          builtUpArea: 1000,
        });

      createdProject = response.body;
    });

    it('updates project fields', async () => {
      const response = await request(app)
        .put(`/api/v1/projects/${createdProject.id}`)
        .set('Authorization', `Bearer ${mockManagerUser.id}`)
        .send({
          name: 'Updated Project Name',
          builtUpArea: 2500,
          version: createdProject.version,
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Project Name');
      expect(response.body.builtUpArea).toBe(2500);
      expect(response.body.version).toBe(createdProject.version + 1);
    });

    it('updates project status', async () => {
      const response = await request(app)
        .put(`/api/v1/projects/${createdProject.id}`)
        .set('Authorization', `Bearer ${mockManagerUser.id}`)
        .send({
          status: 'IN_PROGRESS',
          version: createdProject.version,
        })
        .expect(200);

      expect(response.body.status).toBe('IN_PROGRESS');
      expect(response.body.version).toBe(createdProject.version + 1);
    });

    it('prevents concurrent updates with version conflict', async () => {
      const originalVersion = createdProject.version;

      await request(app)
        .put(`/api/v1/projects/${createdProject.id}`)
        .set('Authorization', `Bearer ${mockManagerUser.id}`)
        .send({
          name: 'First Update',
          version: originalVersion,
        })
        .expect(200);

      await request(app)
        .put(`/api/v1/projects/${createdProject.id}`)
        .set('Authorization', `Bearer ${mockManagerUser.id}`)
        .send({
          name: 'Second Update with Old Version',
          version: originalVersion,
        })
        .expect(409);
    });

    it('rejects updates without version field', async () => {
      await request(app)
        .put(`/api/v1/projects/${createdProject.id}`)
        .set('Authorization', `Bearer ${mockManagerUser.id}`)
        .send({
          name: 'Update Without Version',
        })
        .expect(400);
    });
  });

  describe('Project Retrieval Flow', () => {
    let createdProject: any;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${mockManagerUser.id}`)
        .send({
          clientId: testClient.id,
          contractCode: `INT-GET-${Date.now()}`,
          name: 'Project for Retrieval',
          startDate: new Date('2025-01-01'),
          estimatedEndDate: new Date('2025-03-01'),
          builtUpArea: 1000,
        });

      createdProject = response.body;
    });

    it('retrieves project by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/projects/${createdProject.id}`)
        .set('Authorization', `Bearer ${mockManagerUser.id}`)
        .expect(200);

      expect(response.body.id).toBe(createdProject.id);
      expect(response.body.name).toBe('Project for Retrieval');
      expect(response.body).toHaveProperty('client');
    });

    it('retrieves project dashboard summary', async () => {
      const response = await request(app)
        .get(`/api/v1/projects/${createdProject.id}/dashboard`)
        .set('Authorization', `Bearer ${mockManagerUser.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('project');
      expect(response.body).toHaveProperty('phases');
      expect(response.body).toHaveProperty('summary');
    });

    it('retrieves projects list with filters', async () => {
      const response = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${mockManagerUser.id}`)
        .query({ status: 'PLANNED' })
        .expect(200);

      expect(response.body).toHaveProperty('projects');
      expect(response.body.projects).toBeInstanceOf(Array);
      expect(response.body).toHaveProperty('total');
    });
  });

  describe('Data Integrity and Validation', () => {
    it('validates date sequence', async () => {
      await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${mockManagerUser.id}`)
        .send({
          clientId: testClient.id,
          contractCode: `INT-DATE-${Date.now()}`,
          name: 'Invalid Date Project',
          startDate: new Date('2025-03-01'),
          estimatedEndDate: new Date('2025-01-01'),
          builtUpArea: 1000,
        })
        .expect(400);
    });

    it('validates required fields', async () => {
      await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${mockManagerUser.id}`)
        .send({
          clientId: testClient.id,
          name: 'Incomplete Project',
        })
        .expect(400);
    });

    it('validates built-up area is positive', async () => {
      await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${mockManagerUser.id}`)
        .send({
          clientId: testClient.id,
          contractCode: `INT-AREA-${Date.now()}`,
          name: 'Invalid Area Project',
          startDate: new Date('2025-01-01'),
          estimatedEndDate: new Date('2025-03-01'),
          builtUpArea: -100,
        })
        .expect(400);
    });
  });

  describe('Audit Trail Verification', () => {
    it('creates audit log on project creation', async () => {
      const response = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${mockManagerUser.id}`)
        .send({
          clientId: testClient.id,
          contractCode: `INT-AUDIT-${Date.now()}`,
          name: 'Audit Test Project',
          startDate: new Date('2025-01-01'),
          estimatedEndDate: new Date('2025-03-01'),
          builtUpArea: 1000,
        })
        .expect(201);

      const auditLogs = await prisma.auditLog.findMany({
        where: {
          entityType: 'Project',
          entityId: response.body.id,
        },
      });

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].action).toBe('CREATE');
      expect(auditLogs[0].userId).toBe(mockManagerUser.id);
    });

    it('creates audit log on project update', async () => {
      const createResponse = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${mockManagerUser.id}`)
        .send({
          clientId: testClient.id,
          contractCode: `INT-AUDUP-${Date.now()}`,
          name: 'Audit Update Project',
          startDate: new Date('2025-01-01'),
          estimatedEndDate: new Date('2025-03-01'),
          builtUpArea: 1000,
        })
        .expect(201);

      await request(app)
        .put(`/api/v1/projects/${createResponse.body.id}`)
        .set('Authorization', `Bearer ${mockManagerUser.id}`)
        .send({
          name: 'Updated Name',
          version: createResponse.body.version,
        })
        .expect(200);

      const auditLogs = await prisma.auditLog.findMany({
        where: {
          entityType: 'Project',
          entityId: createResponse.body.id,
        },
      });

      expect(auditLogs).toHaveLength(2);
      expect(auditLogs[1].action).toBe('UPDATE');
    });
  });
});
