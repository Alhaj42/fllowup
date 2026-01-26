import request from 'supertest';
import app, { setupRoutes } from '../../../src/app';
import { prisma } from '../../../src/services/prismaClient';
import { Role } from '@prisma/client';

const mockUser = {
  id: 'audit-test-user',
  email: 'audit@example.com',
  name: 'Audit Test User',
  role: Role.MANAGER,
};

jest.mock('../../../src/middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = mockUser;
    next();
  }),
}));

describe('Audit Middleware', () => {
  let projectId: string;
  let testUserId: string;

  beforeAll(async () => {
    setupRoutes();
    const user = await prisma.user.create({
      data: mockUser,
    });

    testUserId = user.id;

    const client = await prisma.client.create({
      data: {
        name: 'Test Client',
      },
    });

    const project = await prisma.project.create({
      data: {
        clientId: client.id,
        contractCode: 'AUDIT-001',
        name: 'Audit Test Project',
        startDate: new Date(),
        estimatedEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    projectId = project.id;
  });

  afterAll(async () => {
    await prisma.project.deleteMany({});
    await prisma.auditLog.deleteMany({
      where: { userId: mockUser.id },
    });
    await prisma.user.deleteMany({
      where: { id: mockUser.id },
    });
    await prisma.client.deleteMany({});
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({
      where: { userId: mockUser.id },
    });
    await prisma.project.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.user.deleteMany({
      where: { id: mockUser.id },
    });
  });

  describe('audit logging', () => {
    it('should log CREATE action on POST', async () => {
      const client = await prisma.client.create({
        data: {
          name: 'Test Client for Audit',
        },
      });

      const response = await request(app)
        .post(`/api/v1/projects`)
        .send({
          clientId: client.id,
          contractCode: `NEW-${Date.now()}`,
          name: 'New Project',
          startDate: new Date(),
          estimatedEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .expect(201);

      const auditLogs = await prisma.auditLog.findMany({
        where: {
          userId: mockUser.id,
          action: 'CREATE',
        },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].action).toBe('CREATE');
    });

    it('should log UPDATE action on PUT', async () => {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      await request(app)
        .put(`/api/v1/projects/${projectId}`)
        .send({
          name: 'Updated Project Name',
          version: project?.version,
        })
        .expect(200);

      const auditLogs = await prisma.auditLog.findMany({
        where: {
          userId: mockUser.id,
          action: 'UPDATE',
          entityId: projectId,
        },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].action).toBe('UPDATE');
    });
  });
});
