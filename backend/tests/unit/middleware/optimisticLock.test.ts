import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { checkVersionConflict, incrementVersion } from '../../../src/middleware/optimisticLock';
import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../src/middleware/errorHandler';

const prisma = new PrismaClient();

describe('Optimistic Locking Middleware', () => {
  let testUserId: string;
  let testProjectId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        role: 'MANAGER',
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    const project = await prisma.project.create({
      data: {
        clientId: 'test-client',
        name: 'Test Project',
        contractCode: `CONTRACT-${Date.now()}`,
        contractSigningDate: new Date(),
        builtUpArea: 1000,
        startDate: new Date(),
        estimatedEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        currentPhase: 'STUDIES',
        status: 'PLANNED',
      },
    });
    testProjectId = project.id;
  });

  describe('checkVersionConflict', () => {
    it('should pass when versions match', async () => {
      const req = {
        method: 'PUT',
        params: { id: testProjectId },
        body: { version: 1, name: 'Updated Project' },
        prisma,
      } as unknown as Request;

      const res = {} as Response;
      const next = jest.fn() as NextFunction;

      await checkVersionConflict()(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should throw error when versions do not match', async () => {
      await prisma.project.update({
        where: { id: testProjectId },
        data: { version: 2 },
      });

      const req = {
        method: 'PUT',
        params: { id: testProjectId },
        body: { version: 1, name: 'Updated Project' },
        prisma,
      } as unknown as Request;

      const res = {} as Response;
      const next = jest.fn() as NextFunction;

      await checkVersionConflict()(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = next.mock.calls[0][0] as AppError;
      expect(error.statusCode).toBe(409);
      expect(error.message).toContain('Version conflict');
    });

    it('should pass for non-modifying methods', async () => {
      const req = {
        method: 'GET',
        params: { id: testProjectId },
        body: { version: 1 },
        prisma,
      } as unknown as Request;

      const res = {} as Response;
      const next = jest.fn() as NextFunction;

      await checkVersionConflict()(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('incrementVersion', () => {
    it('should increment version in data', () => {
      const data = {
        name: 'Test Project',
        status: 'IN_PROGRESS',
      };

      const result = incrementVersion(data);

      expect(result).toEqual({
        name: 'Test Project',
        status: 'IN_PROGRESS',
        version: { increment: 1 },
      });
    });

    it('should preserve existing version field', () => {
      const data = {
        name: 'Test Project',
        version: 5,
      };

      const result = incrementVersion(data);

      expect(result).toEqual({
        name: 'Test Project',
        version: { increment: 1 },
      });
    });
  });
});
