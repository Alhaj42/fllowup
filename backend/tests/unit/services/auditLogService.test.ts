import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import AuditLogService from '../../../src/services/auditLogService';
import { AuditEntityType, AuditAction } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('AuditLogService', () => {
  let testUserId: string;

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
    await prisma.auditLog.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  it('should log a CREATE action', async () => {
    const entityId = 'test-entity-1';
    
    await AuditLogService.logCreate(
      AuditEntityType.PROJECT,
      entityId,
      testUserId,
      { name: 'Test Project' }
    );

    const logs = await prisma.auditLog.findMany({
      where: { entityId },
    });

    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe(AuditAction.CREATE);
    expect(logs[0].entityType).toBe(AuditEntityType.PROJECT);
    expect(logs[0].changedBy).toBe(testUserId);
    expect(logs[0].changes).toEqual({
      after: { name: 'Test Project' },
    });
  });

  it('should log an UPDATE action', async () => {
    const entityId = 'test-entity-2';
    
    await AuditLogService.logUpdate(
      AuditEntityType.PROJECT,
      entityId,
      testUserId,
      { name: 'Old Name' },
      { name: 'New Name' }
    );

    const logs = await prisma.auditLog.findMany({
      where: { entityId },
    });

    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe(AuditAction.UPDATE);
    expect(logs[0].changes).toEqual({
      before: { name: 'Old Name' },
      after: { name: 'New Name' },
    });
  });

  it('should log a DELETE action', async () => {
    const entityId = 'test-entity-3';
    
    await AuditLogService.logDelete(
      AuditEntityType.PROJECT,
      entityId,
      testUserId,
      { name: 'Deleted Project' }
    );

    const logs = await prisma.auditLog.findMany({
      where: { entityId },
    });

    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe(AuditAction.DELETE);
    expect(logs[0].changes).toEqual({
      before: { name: 'Deleted Project' },
    });
  });

  it('should retrieve history for an entity', async () => {
    const entityId = 'test-entity-4';
    
    await AuditLogService.logCreate(
      AuditEntityType.PROJECT,
      entityId,
      testUserId,
      { name: 'Test Project' }
    );

    await AuditLogService.logUpdate(
      AuditEntityType.PROJECT,
      entityId,
      testUserId,
      { name: 'Test Project' },
      { name: 'Updated Project' }
    );

    const history = await AuditLogService.getHistory(AuditEntityType.PROJECT, entityId);

    expect(history).toHaveLength(2);
    expect(history[0].action).toBe(AuditAction.UPDATE);
    expect(history[1].action).toBe(AuditAction.CREATE);
  });
});
