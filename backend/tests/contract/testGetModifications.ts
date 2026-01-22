import request from 'supertest';
import app from '../../../src/api/app';
import { PrismaClient } from '@prisma/client';
import { AuditAction } from '@prisma/client';

const prisma = new PrismaClient();

describe('GET /projects/:id/modifications - Contract Test', () => {
  let authToken: string;
  let testProject: any;
  let testUser: any;

  beforeAll(async () => {
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        role: 'MANAGER',
      },
    });

    testProject = await prisma.project.create({
      data: {
        name: 'Test Project',
        contractCode: 'TEST-001',
        clientId: 'client-1',
        contractSigningDate: new Date('2024-01-01'),
        builtUpArea: 1000,
        startDate: new Date('2024-01-15'),
        estimatedEndDate: new Date('2024-12-31'),
        status: 'ACTIVE',
        createdBy: testUser.id,
      },
    });

    await prisma.auditLog.createMany({
      data: [
        {
          entityType: 'Project',
          entityId: testProject.id,
          action: AuditAction.UPDATE,
          userId: testUser.id,
          changes: {
            modificationNumber: 1,
            description: 'First modification',
            daysUsed: 2,
          },
          timestamp: new Date('2024-01-20'),
        },
        {
          entityType: 'Project',
          entityId: testProject.id,
          action: AuditAction.UPDATE,
          userId: testUser.id,
          changes: {
            modificationNumber: 2,
            description: 'Second modification',
            daysUsed: 3,
          },
          timestamp: new Date('2024-02-15'),
        },
      ],
    });

    authToken = `Bearer mock-token-${testUser.id}`;
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe('Request/Response Contract', () => {
    it('should return 200 OK with modifications list', async () => {
      const response = await request(app)
        .get(`/api/v1/projects/${testProject.id}/modifications`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toMatchObject({
        projectId: testProject.id,
        totalAllowed: expect.any(Number),
        totalUsed: expect.any(Number),
        remaining: expect.any(Number),
        daysPerTime: expect.any(Number),
        daysUsed: expect.any(Number),
        canModify: expect.any(Boolean),
        modifications: expect.any(Array),
      });

      expect(response.body.modifications).toHaveLength(2);
      expect(response.body.modifications[0]).toMatchObject({
        id: expect.any(String),
        projectId: testProject.id,
        modificationNumber: 1,
        description: 'First modification',
        createdAt: expect.any(String),
        createdBy: testUser.id,
      });
    });

    it('should return 401 Unauthorized without authentication', async () => {
      await request(app).get(`/api/v1/projects/${testProject.id}/modifications`).expect(401);
    });

    it('should return 404 Not Found for non-existent project', async () => {
      await request(app)
        .get('/api/v1/projects/nonexistent/modifications')
        .set('Authorization', authToken)
        .expect(404);
    });
  });

  describe('Response Schema Validation', () => {
    it('should match expected schema', async () => {
      const response = await request(app)
        .get(`/api/v1/projects/${testProject.id}/modifications`)
        .set('Authorization', authToken)
        .expect(200);

      const stats = response.body;

      expect(stats).toHaveProperty('projectId');
      expect(stats).toHaveProperty('totalAllowed');
      expect(stats).toHaveProperty('totalUsed');
      expect(stats).toHaveProperty('remaining');
      expect(stats).toHaveProperty('daysPerTime');
      expect(stats).toHaveProperty('daysUsed');
      expect(stats).toHaveProperty('canModify');
      expect(stats).toHaveProperty('modifications');

      expect(typeof stats.projectId).toBe('string');
      expect(typeof stats.totalAllowed).toBe('number');
      expect(typeof stats.totalUsed).toBe('number');
      expect(typeof stats.remaining).toBe('number');
      expect(typeof stats.daysPerTime).toBe('number');
      expect(typeof stats.daysUsed).toBe('number');
      expect(typeof stats.canModify).toBe('boolean');
      expect(Array.isArray(stats.modifications)).toBe(true);

      if (stats.modifications.length > 0) {
        const modification = stats.modifications[0];
        expect(typeof modification.id).toBe('string');
        expect(typeof modification.projectId).toBe('string');
        expect(typeof modification.modificationNumber).toBe('number');
        expect(typeof modification.description).toBe('string');
        expect(typeof modification.createdAt).toBe('string');
        expect(modification.createdBy).toBeNull();
        expect(typeof modification.description).toBe('string');
      }
    });
  });

  describe('Data Integrity', () => {
    it('should return modifications in chronological order', async () => {
      const response = await request(app)
        .get(`/api/v1/projects/${testProject.id}/modifications`)
        .set('Authorization', authToken)
        .expect(200);

      const modifications = response.body.modifications;

      for (let i = 1; i < modifications.length; i++) {
        expect(new Date(modifications[i].createdAt)).toBeGreaterThanOrEqual(
          new Date(modifications[i - 1].createdAt)
        );
      }
    });

    it('should calculate modification statistics correctly', async () => {
      const response = await request(app)
        .get(`/api/v1/projects/${testProject.id}/modifications`)
        .set('Authorization', authToken)
        .expect(200);

      const stats = response.body;

      expect(stats.totalUsed).toBe(2);
      expect(stats.remaining).toBe(stats.totalAllowed - stats.totalUsed);
      expect(stats.daysUsed).toBe(5);
      expect(stats.canModify).toBe(stats.remaining > 0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle project with no modifications', async () => {
      const noModProject = await prisma.project.create({
        data: {
          name: 'No Modifications Project',
          contractCode: 'NOMOD-001',
          clientId: 'client-1',
          contractSigningDate: new Date('2024-01-01'),
          builtUpArea: 500,
          startDate: new Date('2024-01-15'),
          estimatedEndDate: new Date('2024-12-31'),
          status: 'ACTIVE',
          createdBy: testUser.id,
          modificationAllowedTimes: 3,
          modificationDaysPerTime: 5,
        },
      });

      const response = await request(app)
        .get(`/api/v1/projects/${noModProject.id}/modifications`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.totalUsed).toBe(0);
      expect(response.body.remaining).toBe(3);
      expect(response.body.modifications).toHaveLength(0);
      expect(response.body.canModify).toBe(true);

      await prisma.project.delete({ where: { id: noModProject.id } });
    });

    it('should handle project with unlimited modifications', async () => {
      const unlimitedProject = await prisma.project.create({
        data: {
          name: 'Unlimited Modifications Project',
          contractCode: 'UNLIM-001',
          clientId: 'client-1',
          contractSigningDate: new Date('2024-01-01'),
          builtUpArea: 500,
          startDate: new Date('2024-01-15'),
          estimatedEndDate: new Date('2024-12-31'),
          status: 'ACTIVE',
          createdBy: testUser.id,
          modificationAllowedTimes: null,
          modificationDaysPerTime: null,
        },
      });

      const response = await request(app)
        .get(`/api/v1/projects/${unlimitedProject.id}/modifications`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.totalAllowed).toBe(3);
      expect(response.body.daysPerTime).toBe(5);
      expect(response.body.canModify).toBe(true);

      await prisma.project.delete({ where: { id: unlimitedProject.id } });
    });
  });
});
