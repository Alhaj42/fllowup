import modificationTrackingService, {
  CreateModificationParams,
  ModificationRecord,
  ModificationStats,
} from '../../../../src/services/modificationTrackingService';
import { PrismaClient } from '@prisma/client';
import { AuditAction } from '@prisma/client';

jest.mock('@prisma/client');

const mockedPrisma = PrismaClient as jest.MockedClass<typeof PrismaClient>;

describe('ModificationTrackingService', () => {
  let mockPrismaInstance: any;

  beforeEach(() => {
    mockPrismaInstance = {
      auditLog: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      project: {
        findUnique: jest.fn(),
      },
    };

    mockedPrisma.mockImplementation(() => mockPrismaInstance);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createModification', () => {
    it('should create a modification record successfully', async () => {
      const params: CreateModificationParams = {
        projectId: 'project-1',
        userId: 'user-1',
        modificationNumber: 1,
        description: 'Test modification',
        daysUsed: 3,
      };

      const mockAuditLog = {
        id: 'audit-1',
        entityType: 'Project',
        entityId: params.projectId,
        action: AuditAction.UPDATE,
        userId: params.userId,
        changes: {
          modificationNumber: params.modificationNumber,
          description: params.description,
          daysUsed: params.daysUsed,
        },
        timestamp: new Date('2024-01-01'),
      };

      mockPrismaInstance.auditLog.create.mockResolvedValue(mockAuditLog);

      const result = await modificationTrackingService.createModification(params);

      expect(mockPrismaInstance.auditLog.create).toHaveBeenCalledWith({
        data: {
          entityType: 'Project',
          entityId: params.projectId,
          action: AuditAction.UPDATE,
          userId: params.userId,
          changes: {
            modificationNumber: params.modificationNumber,
            description: params.description,
            daysUsed: params.daysUsed,
          },
          timestamp: expect.any(Date),
        },
      });

      expect(result).toEqual({
        id: mockAuditLog.id,
        projectId: mockAuditLog.entityId,
        modificationNumber: params.modificationNumber,
        description: params.description,
        createdAt: mockAuditLog.timestamp,
        createdBy: mockAuditLog.userId,
      });
    });

    it('should throw error when database fails', async () => {
      const params: CreateModificationParams = {
        projectId: 'project-1',
        userId: 'user-1',
        modificationNumber: 1,
        description: 'Test modification',
      };

      mockPrismaInstance.auditLog.create.mockRejectedValue(new Error('Database error'));

      await expect(modificationTrackingService.createModification(params)).rejects.toThrow(
        'Failed to create modification record'
      );
    });
  });

  describe('getModifications', () => {
    it('should return modifications for a project', async () => {
      const projectId = 'project-1';

      const mockAuditLogs = [
        {
          id: 'audit-1',
          entityType: 'Project',
          entityId: projectId,
          action: AuditAction.UPDATE,
          userId: 'user-1',
          changes: {
            modificationNumber: 1,
            description: 'First modification',
            daysUsed: 2,
          },
          timestamp: new Date('2024-01-01'),
        },
        {
          id: 'audit-2',
          entityType: 'Project',
          entityId: projectId,
          action: AuditAction.UPDATE,
          userId: 'user-1',
          changes: {
            modificationNumber: 2,
            description: 'Second modification',
            daysUsed: 3,
          },
          timestamp: new Date('2024-01-02'),
        },
      ];

      mockPrismaInstance.auditLog.findMany.mockResolvedValue(mockAuditLogs);

      const result = await modificationTrackingService.getModifications(projectId);

      expect(mockPrismaInstance.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          entityType: 'Project',
          entityId: projectId,
          action: AuditAction.UPDATE,
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'audit-1',
        projectId: projectId,
        modificationNumber: 1,
        description: 'First modification',
        createdAt: mockAuditLogs[0].timestamp,
        createdBy: 'user-1',
      });
      expect(result[1]).toEqual({
        id: 'audit-2',
        projectId: projectId,
        modificationNumber: 2,
        description: 'Second modification',
        createdAt: mockAuditLogs[1].timestamp,
        createdBy: 'user-1',
      });
    });

    it('should return empty array when no modifications exist', async () => {
      const projectId = 'project-1';

      mockPrismaInstance.auditLog.findMany.mockResolvedValue([]);

      const result = await modificationTrackingService.getModifications(projectId);

      expect(result).toEqual([]);
    });

    it('should handle audit logs without modificationNumber in changes', async () => {
      const projectId = 'project-1';

      const mockAuditLogs = [
        {
          id: 'audit-1',
          entityType: 'Project',
          entityId: projectId,
          action: AuditAction.UPDATE,
          userId: 'user-1',
          changes: {},
          timestamp: new Date('2024-01-01'),
        },
      ];

      mockPrismaInstance.auditLog.findMany.mockResolvedValue(mockAuditLogs);

      const result = await modificationTrackingService.getModifications(projectId);

      expect(result[0].modificationNumber).toBe(1);
      expect(result[0].description).toBe('Modification');
    });

    it('should throw error when database fails', async () => {
      const projectId = 'project-1';

      mockPrismaInstance.auditLog.findMany.mockRejectedValue(new Error('Database error'));

      await expect(modificationTrackingService.getModifications(projectId)).rejects.toThrow(
        'Failed to get modifications'
      );
    });
  });

  describe('getModificationStats', () => {
    it('should return modification statistics for a project', async () => {
      const projectId = 'project-1';

      const mockProject = {
        id: projectId,
        modificationAllowedTimes: 3,
        modificationDaysPerTime: 5,
      };

      const mockModifications: ModificationRecord[] = [
        {
          id: 'audit-1',
          projectId: projectId,
          modificationNumber: 1,
          description: 'First modification',
          createdAt: new Date('2024-01-01'),
          createdBy: 'user-1',
          daysUsed: 2,
        } as any,
        {
          id: 'audit-2',
          projectId: projectId,
          modificationNumber: 2,
          description: 'Second modification',
          createdAt: new Date('2024-01-02'),
          createdBy: 'user-1',
          daysUsed: 3,
        } as any,
      ];

      mockPrismaInstance.project.findUnique.mockResolvedValue(mockProject);
      jest
        .spyOn(modificationTrackingService, 'getModifications')
        .mockResolvedValue(mockModifications);

      const result = await modificationTrackingService.getModificationStats(projectId);

      expect(mockPrismaInstance.project.findUnique).toHaveBeenCalledWith({
        where: { id: projectId },
        select: {
          id: true,
          modificationAllowedTimes: true,
          modificationDaysPerTime: true,
        },
      });

      expect(result).toEqual({
        projectId: projectId,
        totalAllowed: 3,
        totalUsed: 2,
        remaining: 1,
        daysPerTime: 5,
        daysUsed: 5,
        canModify: true,
        modifications: mockModifications,
      });
    });

    it('should handle project with no modification limits set', async () => {
      const projectId = 'project-1';

      const mockProject = {
        id: projectId,
        modificationAllowedTimes: null,
        modificationDaysPerTime: null,
      };

      mockPrismaInstance.project.findUnique.mockResolvedValue(mockProject);
      jest.spyOn(modificationTrackingService, 'getModifications').mockResolvedValue([]);

      const result = await modificationTrackingService.getModificationStats(projectId);

      expect(result.totalAllowed).toBe(3);
      expect(result.daysPerTime).toBe(5);
      expect(result.remaining).toBe(3);
    });

    it('should throw error when project not found', async () => {
      const projectId = 'nonexistent';

      mockPrismaInstance.project.findUnique.mockResolvedValue(null);

      await expect(modificationTrackingService.getModificationStats(projectId)).rejects.toThrow(
        'Project not found'
      );
    });

    it('should throw error when database fails', async () => {
      const projectId = 'project-1';

      mockPrismaInstance.project.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(modificationTrackingService.getModificationStats(projectId)).rejects.toThrow(
        'Failed to get modification stats'
      );
    });
  });

  describe('checkModificationLimit', () => {
    it('should return canModify true when modifications remain', async () => {
      const projectId = 'project-1';

      const mockStats: ModificationStats = {
        projectId,
        totalAllowed: 3,
        totalUsed: 1,
        remaining: 2,
        daysPerTime: 5,
        daysUsed: 5,
        canModify: true,
        modifications: [],
      };

      jest.spyOn(modificationTrackingService, 'getModificationStats').mockResolvedValue(mockStats);

      const result = await modificationTrackingService.checkModificationLimit(projectId);

      expect(result).toEqual({
        canModify: true,
        remaining: 2,
      });
    });

    it('should return canModify false when limit reached', async () => {
      const projectId = 'project-1';

      const mockStats: ModificationStats = {
        projectId,
        totalAllowed: 3,
        totalUsed: 3,
        remaining: 0,
        daysPerTime: 5,
        daysUsed: 15,
        canModify: false,
        modifications: [],
      };

      jest.spyOn(modificationTrackingService, 'getModificationStats').mockResolvedValue(mockStats);

      const result = await modificationTrackingService.checkModificationLimit(projectId);

      expect(result).toEqual({
        canModify: false,
        remaining: 0,
      });
    });

    it('should throw error when service fails', async () => {
      const projectId = 'project-1';

      jest
        .spyOn(modificationTrackingService, 'getModificationStats')
        .mockRejectedValue(new Error('Service error'));

      await expect(modificationTrackingService.checkModificationLimit(projectId)).rejects.toThrow(
        'Failed to check modification limit'
      );
    });
  });

  describe('recordModification', () => {
    it('should record a modification when limit not reached', async () => {
      const projectId = 'project-1';
      const userId = 'user-1';
      const description = 'New modification';
      const daysUsed = 2;

      const mockStats: ModificationStats = {
        projectId,
        totalAllowed: 3,
        totalUsed: 1,
        remaining: 2,
        daysPerTime: 5,
        daysUsed: 5,
        canModify: true,
        modifications: [],
      };

      const mockModificationRecord: ModificationRecord = {
        id: 'audit-1',
        projectId,
        modificationNumber: 2,
        description,
        createdAt: new Date('2024-01-01'),
        createdBy: userId,
      };

      jest.spyOn(modificationTrackingService, 'getModificationStats').mockResolvedValue(mockStats);
      jest
        .spyOn(modificationTrackingService, 'createModification')
        .mockResolvedValue(mockModificationRecord);

      const result = await modificationTrackingService.recordModification(
        projectId,
        userId,
        description,
        daysUsed
      );

      expect(modificationTrackingService.createModification).toHaveBeenCalledWith({
        projectId,
        userId,
        modificationNumber: 2,
        description,
        daysUsed,
      });

      expect(result).toEqual(mockModificationRecord);
    });

    it('should throw error when modification limit reached', async () => {
      const projectId = 'project-1';
      const userId = 'user-1';
      const description = 'New modification';

      const mockStats: ModificationStats = {
        projectId,
        totalAllowed: 3,
        totalUsed: 3,
        remaining: 0,
        daysPerTime: 5,
        daysUsed: 15,
        canModify: false,
        modifications: [],
      };

      jest.spyOn(modificationTrackingService, 'getModificationStats').mockResolvedValue(mockStats);

      await expect(
        modificationTrackingService.recordModification(projectId, userId, description)
      ).rejects.toThrow('Modification limit reached. You have used 3 of 3 allowed modifications.');
    });

    it('should throw error when service fails', async () => {
      const projectId = 'project-1';
      const userId = 'user-1';
      const description = 'New modification';

      jest
        .spyOn(modificationTrackingService, 'getModificationStats')
        .mockRejectedValue(new Error('Service error'));

      await expect(
        modificationTrackingService.recordModification(projectId, userId, description)
      ).rejects.toThrow();
    });
  });
});
