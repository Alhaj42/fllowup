import request from 'supertest';
import app from '../../../src/api/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('POST /projects/:id/requirements - Contract Test', () => {
  let authToken: string;
  let testProject: any;
  let testUser: any;

  beforeAll(async () => {
    testUser = await prisma.user.create({
      data: {
        email: 'test-req@example.com',
        name: 'Test User',
        role: 'MANAGER',
      },
    });

    testProject = await prisma.project.create({
      data: {
        name: 'Test Project for Requirements',
        contractCode: 'REQ-POST-001',
        clientId: 'client-1',
        contractSigningDate: new Date('2024-01-01'),
        builtUpArea: 1000,
        startDate: new Date('2024-01-15'),
        estimatedEndDate: new Date('2024-12-31'),
        status: 'PLANNED',
        createdBy: testUser.id,
      },
    });

    authToken = `Bearer mock-token-${testUser.id}`;
  });

  afterAll(async () => {
    await prisma.projectRequirement.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe('Request/Response Contract', () => {
    it('should return 201 Created when requirement is successfully created', async () => {
      const newRequirement = {
        description: 'New test requirement',
        isModified: false,
        sortOrder: 1,
      };

      const response = await request(app)
        .post(`/api/v1/projects/${testProject.id}/requirements`)
        .set('Authorization', authToken)
        .send(newRequirement)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        projectId: testProject.id,
        description: newRequirement.description,
        isCompleted: false,
        isModified: newRequirement.isModified,
        sortOrder: newRequirement.sortOrder,
        modificationCount: 0,
        completedAt: null,
        completedBy: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should return 401 Unauthorized without authentication', async () => {
      const newRequirement = {
        description: 'Test requirement',
        sortOrder: 1,
      };

      await request(app)
        .post(`/api/v1/projects/${testProject.id}/requirements`)
        .send(newRequirement)
        .expect(401);
    });

    it('should return 404 Not Found for non-existent project', async () => {
      const newRequirement = {
        description: 'Test requirement',
        sortOrder: 1,
      };

      await request(app)
        .post('/api/v1/projects/nonexistent/requirements')
        .set('Authorization', authToken)
        .send(newRequirement)
        .expect(404);
    });

    it('should return 400 Bad Request when description is missing', async () => {
      const invalidRequirement = {
        isModified: false,
        sortOrder: 1,
      };

      const response = await request(app)
        .post(`/api/v1/projects/${testProject.id}/requirements`)
        .set('Authorization', authToken)
        .send(invalidRequirement)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 Bad Request when description is empty', async () => {
      const invalidRequirement = {
        description: '',
        sortOrder: 1,
      };

      const response = await request(app)
        .post(`/api/v1/projects/${testProject.id}/requirements`)
        .set('Authorization', authToken)
        .send(invalidRequirement)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 Forbidden for non-MANAGER user', async () => {
      const nonManagerUser = await prisma.user.create({
        data: {
          email: 'nonmanager@example.com',
          name: 'Non Manager',
          role: 'TEAM_MEMBER',
        },
      });

      const nonManagerToken = `Bearer mock-token-${nonManagerUser.id}`;

      const newRequirement = {
        description: 'Test requirement',
        sortOrder: 1,
      };

      await request(app)
        .post(`/api/v1/projects/${testProject.id}/requirements`)
        .set('Authorization', nonManagerToken)
        .send(newRequirement)
        .expect(403);

      await prisma.user.delete({ where: { id: nonManagerUser.id } });
    });
  });

  describe('Request Body Schema Validation', () => {
    it('should accept valid request body', async () => {
      const validBody = {
        description: 'Valid requirement',
        isModified: false,
        sortOrder: 5,
      };

      const response = await request(app)
        .post(`/api/v1/projects/${testProject.id}/requirements`)
        .set('Authorization', authToken)
        .send(validBody)
        .expect(201);

      expect(response.body.description).toBe(validBody.description);
    });

    it('should accept optional fields', async () => {
      const minimalBody = {
        description: 'Minimal requirement',
      };

      const response = await request(app)
        .post(`/api/v1/projects/${testProject.id}/requirements`)
        .set('Authorization', authToken)
        .send(minimalBody)
        .expect(201);

      expect(response.body.description).toBe(minimalBody.description);
      expect(response.body.isModified).toBe(false);
      expect(response.body.sortOrder).toBeDefined();
    });

    it('should accept boolean isModified', async () => {
      const body = {
        description: 'Modified requirement',
        isModified: true,
      };

      const response = await request(app)
        .post(`/api/v1/projects/${testProject.id}/requirements`)
        .set('Authorization', authToken)
        .send(body)
        .expect(201);

      expect(response.body.isModified).toBe(true);
    });

    it('should accept numeric sortOrder', async () => {
      const body = {
        description: 'Ordered requirement',
        sortOrder: 10,
      };

      const response = await request(app)
        .post(`/api/v1/projects/${testProject.id}/requirements`)
        .set('Authorization', authToken)
        .send(body)
        .expect(201);

      expect(response.body.sortOrder).toBe(10);
    });
  });

  describe('Response Schema Validation', () => {
    it('should return requirement with all required fields', async () => {
      const body = {
        description: 'Complete requirement test',
        isModified: false,
        sortOrder: 1,
      };

      const response = await request(app)
        .post(`/api/v1/projects/${testProject.id}/requirements`)
        .set('Authorization', authToken)
        .send(body)
        .expect(201);

      const requirement = response.body;

      expect(requirement).toHaveProperty('id');
      expect(requirement).toHaveProperty('projectId');
      expect(requirement).toHaveProperty('description');
      expect(requirement).toHaveProperty('isCompleted');
      expect(requirement).toHaveProperty('isModified');
      expect(requirement).toHaveProperty('sortOrder');
      expect(requirement).toHaveProperty('modificationCount');
      expect(requirement).toHaveProperty('completedAt');
      expect(requirement).toHaveProperty('completedBy');
      expect(requirement).toHaveProperty('createdAt');
      expect(requirement).toHaveProperty('updatedAt');
    });

    it('should have correct data types', async () => {
      const body = {
        description: 'Type test requirement',
        isModified: true,
        sortOrder: 5,
      };

      const response = await request(app)
        .post(`/api/v1/projects/${testProject.id}/requirements`)
        .set('Authorization', authToken)
        .send(body)
        .expect(201);

      const requirement = response.body;

      expect(typeof requirement.id).toBe('string');
      expect(typeof requirement.projectId).toBe('string');
      expect(typeof requirement.description).toBe('string');
      expect(typeof requirement.isCompleted).toBe('boolean');
      expect(typeof requirement.isModified).toBe('boolean');
      expect(typeof requirement.sortOrder).toBe('number');
      expect(typeof requirement.modificationCount).toBe('number');
      expect(typeof requirement.createdAt).toBe('string');
      expect(typeof requirement.updatedAt).toBe('string');
    });
  });

  describe('Data Integrity', () => {
    it('should assign default values for optional fields', async () => {
      const body = {
        description: 'Default values test',
      };

      const response = await request(app)
        .post(`/api/v1/projects/${testProject.id}/requirements`)
        .set('Authorization', authToken)
        .send(body)
        .expect(201);

      expect(response.body.isCompleted).toBe(false);
      expect(response.body.isModified).toBe(false);
      expect(response.body.modificationCount).toBe(0);
      expect(response.body.completedAt).toBeNull();
      expect(response.body.completedBy).toBeNull();
    });

    it('should assign auto-generated sortOrder if not provided', async () => {
      const body = {
        description: 'Auto sort order test',
      };

      const response = await request(app)
        .post(`/api/v1/projects/${testProject.id}/requirements`)
        .set('Authorization', authToken)
        .send(body)
        .expect(201);

      expect(response.body.sortOrder).toBeDefined();
      expect(typeof response.body.sortOrder).toBe('number');
    });

    it('should link requirement to correct project', async () => {
      const body = {
        description: 'Project link test',
        sortOrder: 1,
      };

      const response = await request(app)
        .post(`/api/v1/projects/${testProject.id}/requirements`)
        .set('Authorization', authToken)
        .send(body)
        .expect(201);

      expect(response.body.projectId).toBe(testProject.id);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long description', async () => {
      const longDescription = 'A'.repeat(1000);

      const body = {
        description: longDescription,
        sortOrder: 1,
      };

      const response = await request(app)
        .post(`/api/v1/projects/${testProject.id}/requirements`)
        .set('Authorization', authToken)
        .send(body)
        .expect(201);

      expect(response.body.description).toBe(longDescription);
    });

    it('should handle special characters in description', async () => {
      const specialDescription = 'Requirement with émojis 🎉 and spëcial chars!@#$%';

      const body = {
        description: specialDescription,
        sortOrder: 1,
      };

      const response = await request(app)
        .post(`/api/v1/projects/${testProject.id}/requirements`)
        .set('Authorization', authToken)
        .send(body)
        .expect(201);

      expect(response.body.description).toBe(specialDescription);
    });

    it('should handle negative sortOrder', async () => {
      const body = {
        description: 'Negative sort order',
        sortOrder: -5,
      };

      const response = await request(app)
        .post(`/api/v1/projects/${testProject.id}/requirements`)
        .set('Authorization', authToken)
        .send(body)
        .expect(201);

      expect(response.body.sortOrder).toBe(-5);
    });

    it('should handle zero sortOrder', async () => {
      const body = {
        description: 'Zero sort order',
        sortOrder: 0,
      };

      const response = await request(app)
        .post(`/api/v1/projects/${testProject.id}/requirements`)
        .set('Authorization', authToken)
        .send(body)
        .expect(201);

      expect(response.body.sortOrder).toBe(0);
    });
  });
});
