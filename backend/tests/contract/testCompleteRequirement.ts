import request from 'supertest';
import app from '../../../src/api/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('PATCH /requirements/:id/complete - Contract Test', () => {
  let authToken: string;
  let testProject: any;
  let testUser: any;
  let testRequirement: any;

  beforeAll(async () => {
    testUser = await prisma.user.create({
      data: {
        email: 'test-req-complete@example.com',
        name: 'Test User',
        role: 'MANAGER',
      },
    });

    testProject = await prisma.project.create({
      data: {
        name: 'Test Project for Requirements Complete',
        contractCode: 'REQ-COMPLETE-001',
        clientId: 'client-1',
        contractSigningDate: new Date('2024-01-01'),
        builtUpArea: 1000,
        startDate: new Date('2024-01-15'),
        estimatedEndDate: new Date('2024-12-31'),
        status: 'PLANNED',
        createdBy: testUser.id,
      },
    });

    testRequirement = await prisma.projectRequirement.create({
      data: {
        projectId: testProject.id,
        description: 'Requirement to complete',
        isCompleted: false,
        sortOrder: 1,
        isModified: false,
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Request/Response Contract', () => {
    it('should return 200 OK when requirement is successfully marked as completed', async () => {
      const response = await request(app)
        .patch(`/api/v1/requirements/${testRequirement.id}/complete`)
        .set('Authorization', authToken)
        .send({ isCompleted: true })
        .expect(200);

      expect(response.body).toMatchObject({
        id: testRequirement.id,
        projectId: testProject.id,
        description: testRequirement.description,
        isCompleted: true,
        isModified: testRequirement.isModified,
        sortOrder: testRequirement.sortOrder,
        modificationCount: testRequirement.modificationCount,
        completedAt: expect.any(String),
        completedBy: testUser.id,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      expect(new Date(response.body.completedAt)).toBeInstanceOf(Date);
    });

    it('should return 401 Unauthorized without authentication', async () => {
      await request(app)
        .patch(`/api/v1/requirements/${testRequirement.id}/complete`)
        .send({ isCompleted: true })
        .expect(401);
    });

    it('should return 404 Not Found for non-existent requirement', async () => {
      await request(app)
        .patch('/api/v1/requirements/nonexistent/complete')
        .set('Authorization', authToken)
        .send({ isCompleted: true })
        .expect(404);
    });

    it('should return 400 Bad Request when isCompleted is missing', async () => {
      const response = await request(app)
        .patch(`/api/v1/requirements/${testRequirement.id}/complete`)
        .set('Authorization', authToken)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 Forbidden for non-MANAGER user', async () => {
      const nonManagerUser = await prisma.user.create({
        data: {
          email: 'nonmanager-complete@example.com',
          name: 'Non Manager',
          role: 'TEAM_MEMBER',
        },
      });

      const nonManagerToken = `Bearer mock-token-${nonManagerUser.id}`;

      await request(app)
        .patch(`/api/v1/requirements/${testRequirement.id}/complete`)
        .set('Authorization', nonManagerToken)
        .send({ isCompleted: true })
        .expect(403);

      await prisma.user.delete({ where: { id: nonManagerUser.id } });
    });
  });

  describe('Mark as Complete', () => {
    it('should set isCompleted to true', async () => {
      const incompleteReq = await prisma.projectRequirement.create({
        data: {
          projectId: testProject.id,
          description: 'Incomplete requirement',
          isCompleted: false,
          sortOrder: 10,
          isModified: false,
        },
      });

      const response = await request(app)
        .patch(`/api/v1/requirements/${incompleteReq.id}/complete`)
        .set('Authorization', authToken)
        .send({ isCompleted: true })
        .expect(200);

      expect(response.body.isCompleted).toBe(true);

      await prisma.projectRequirement.delete({ where: { id: incompleteReq.id } });
    });

    it('should set completedAt timestamp', async () => {
      const beforeTime = new Date();

      const incompleteReq = await prisma.projectRequirement.create({
        data: {
          projectId: testProject.id,
          description: 'Incomplete requirement',
          isCompleted: false,
          sortOrder: 11,
          isModified: false,
        },
      });

      const response = await request(app)
        .patch(`/api/v1/requirements/${incompleteReq.id}/complete`)
        .set('Authorization', authToken)
        .send({ isCompleted: true })
        .expect(200);

      const completedAt = new Date(response.body.completedAt);

      expect(completedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());

      await prisma.projectRequirement.delete({ where: { id: incompleteReq.id } });
    });

    it('should set completedBy to current user', async () => {
      const incompleteReq = await prisma.projectRequirement.create({
        data: {
          projectId: testProject.id,
          description: 'Incomplete requirement',
          isCompleted: false,
          sortOrder: 12,
          isModified: false,
        },
      });

      const response = await request(app)
        .patch(`/api/v1/requirements/${incompleteReq.id}/complete`)
        .set('Authorization', authToken)
        .send({ isCompleted: true })
        .expect(200);

      expect(response.body.completedBy).toBe(testUser.id);

      await prisma.projectRequirement.delete({ where: { id: incompleteReq.id } });
    });
  });

  describe('Mark as Incomplete', () => {
    let completedRequirement: any;

    beforeEach(async () => {
      completedRequirement = await prisma.projectRequirement.create({
        data: {
          projectId: testProject.id,
          description: 'Completed requirement',
          isCompleted: true,
          completedAt: new Date(),
          completedBy: testUser.id,
          sortOrder: 20,
          isModified: false,
        },
      });
    });

    afterEach(async () => {
      await prisma.projectRequirement.delete({ where: { id: completedRequirement.id } });
    });

    it('should set isCompleted to false', async () => {
      const response = await request(app)
        .patch(`/api/v1/requirements/${completedRequirement.id}/complete`)
        .set('Authorization', authToken)
        .send({ isCompleted: false })
        .expect(200);

      expect(response.body.isCompleted).toBe(false);
    });

    it('should clear completedAt timestamp', async () => {
      const response = await request(app)
        .patch(`/api/v1/requirements/${completedRequirement.id}/complete`)
        .set('Authorization', authToken)
        .send({ isCompleted: false })
        .expect(200);

      expect(response.body.completedAt).toBeNull();
    });

    it('should clear completedBy', async () => {
      const response = await request(app)
        .patch(`/api/v1/requirements/${completedRequirement.id}/complete`)
        .set('Authorization', authToken)
        .send({ isCompleted: false })
        .expect(200);

      expect(response.body.completedBy).toBeNull();
    });
  });

  describe('Response Schema Validation', () => {
    it('should return requirement with all required fields', async () => {
      const response = await request(app)
        .patch(`/api/v1/requirements/${testRequirement.id}/complete`)
        .set('Authorization', authToken)
        .send({ isCompleted: true })
        .expect(200);

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
      const response = await request(app)
        .patch(`/api/v1/requirements/${testRequirement.id}/complete`)
        .set('Authorization', authToken)
        .send({ isCompleted: true })
        .expect(200);

      const requirement = response.body;

      expect(typeof requirement.id).toBe('string');
      expect(typeof requirement.projectId).toBe('string');
      expect(typeof requirement.description).toBe('string');
      expect(typeof requirement.isCompleted).toBe('boolean');
      expect(typeof requirement.isModified).toBe('boolean');
      expect(typeof requirement.sortOrder).toBe('number');
      expect(typeof requirement.modificationCount).toBe('number');
    });
  });

  describe('Data Integrity', () => {
    it('should not modify other fields', async () => {
      const incompleteReq = await prisma.projectRequirement.create({
        data: {
          projectId: testProject.id,
          description: 'Preserve fields test',
          isCompleted: false,
          sortOrder: 30,
          isModified: true,
          modificationCount: 5,
        },
      });

      const response = await request(app)
        .patch(`/api/v1/requirements/${incompleteReq.id}/complete`)
        .set('Authorization', authToken)
        .send({ isCompleted: true })
        .expect(200);

      expect(response.body.description).toBe('Preserve fields test');
      expect(response.body.sortOrder).toBe(30);
      expect(response.body.isModified).toBe(true);
      expect(response.body.modificationCount).toBe(5);

      await prisma.projectRequirement.delete({ where: { id: incompleteReq.id } });
    });

    it('should update updatedAt timestamp', async () => {
      const beforeUpdate = testRequirement.updatedAt;

      await request(app)
        .patch(`/api/v1/requirements/${testRequirement.id}/complete`)
        .set('Authorization', authToken)
        .send({ isCompleted: true })
        .expect(200);

      const updated = await prisma.projectRequirement.findUnique({
        where: { id: testRequirement.id },
      });

      expect(new Date(updated!.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(beforeUpdate).getTime()
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle marking already completed requirement as completed', async () => {
      const completedReq = await prisma.projectRequirement.create({
        data: {
          projectId: testProject.id,
          description: 'Already completed',
          isCompleted: true,
          completedAt: new Date(),
          completedBy: testUser.id,
          sortOrder: 40,
          isModified: false,
        },
      });

      const response = await request(app)
        .patch(`/api/v1/requirements/${completedReq.id}/complete`)
        .set('Authorization', authToken)
        .send({ isCompleted: true })
        .expect(200);

      expect(response.body.isCompleted).toBe(true);

      await prisma.projectRequirement.delete({ where: { id: completedReq.id } });
    });

    it('should handle marking already incomplete requirement as incomplete', async () => {
      const incompleteReq = await prisma.projectRequirement.create({
        data: {
          projectId: testProject.id,
          description: 'Already incomplete',
          isCompleted: false,
          sortOrder: 41,
          isModified: false,
        },
      });

      const response = await request(app)
        .patch(`/api/v1/requirements/${incompleteReq.id}/complete`)
        .set('Authorization', authToken)
        .send({ isCompleted: false })
        .expect(200);

      expect(response.body.isCompleted).toBe(false);

      await prisma.projectRequirement.delete({ where: { id: incompleteReq.id } });
    });

    it('should handle invalid boolean value', async () => {
      const incompleteReq = await prisma.projectRequirement.create({
        data: {
          projectId: testProject.id,
          description: 'Invalid boolean test',
          isCompleted: false,
          sortOrder: 50,
          isModified: false,
        },
      });

      await request(app)
        .patch(`/api/v1/requirements/${incompleteReq.id}/complete`)
        .set('Authorization', authToken)
        .send({ isCompleted: 'true' })
        .expect(400);

      await prisma.projectRequirement.delete({ where: { id: incompleteReq.id } });
    });
  });
});
