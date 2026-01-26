import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import AuditLogService from '../../../src/services/auditLogService';
import { AuditAction, Role } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('AuditLogService', () => {
  let testUserId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test-audit@example.com',
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
      'Project',
      entityId,
      testUserId,
      Role.MANAGER,
      { name: 'Test Project' }
    );

    const logs = await prisma.auditLog.findMany({
      where: { entityId },
    });

    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe(AuditAction.CREATE);
    expect(logs[0].entityType).toBe('Project');
    expect(logs[0].userId).toBe(testUserId);
    expect(logs[0].role).toBe(Role.MANAGER);
    const details = JSON.parse(logs[0].details || '{}');
    expect(details.after).toEqual({ name: 'Test Project' });
  });

  it('should log an UPDATE action', async () => {
    const entityId = 'test-entity-2';
    
    await AuditLogService.logUpdate(
      'Project',
      entityId,
      testUserId,
      Role.MANAGER,
      { name: 'Old Name' },
      { name: 'New Name' }
    );

    const logs = await prisma.auditLog.findMany({
      where: { entityId },
    });

    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe(AuditAction.UPDATE);
    const details = JSON.parse(logs[0].details || '{}');
    expect(details.before).toEqual({ name: 'Old Name' });
    expect(details.after).toEqual({ name: 'New Name' });
  });

  it('should log a DELETE action', async () => {
    const entityId = 'test-entity-3';
    
    await AuditLogService.logDelete(
      'Project',
      entityId,
      testUserId,
      Role.MANAGER,
      { name: 'Deleted Project' }
    );

    const logs = await prisma.auditLog.findMany({
      where: { entityId },
    });

    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe(AuditAction.DELETE);
    const details = JSON.parse(logs[0].details || '{}');
    expect(details.before).toEqual({ name: 'Deleted Project' });
  });

  it('should retrieve history for an entity', async () => {
    const entityId = 'test-entity-4';

    await AuditLogService.logCreate(
      'Project',
      entityId,
      testUserId,
      Role.MANAGER,
      { name: 'Test Project' }
    );

    const createLogs = await prisma.auditLog.findMany({
      where: { entityId },
    });
    expect(createLogs).toHaveLength(1);

    await AuditLogService.logUpdate(
      'Project',
      entityId,
      testUserId,
      Role.MANAGER,
      { name: 'Test Project' },
      { name: 'Updated Project' }
    );

    await new Promise(resolve => setTimeout(resolve, 10));

    const allLogs = await prisma.auditLog.findMany({
      where: { entityId },
    });

    const history = await AuditLogService.getAuditLogsByEntity('Project', entityId);

    expect(allLogs).toHaveLength(2);
    expect(history).toHaveLength(2);
    // Ordered by timestamp desc, so update is first
    expect(history[0].action).toBe(AuditAction.UPDATE);
    expect(history[1].action).toBe(AuditAction.CREATE);
  });
});
