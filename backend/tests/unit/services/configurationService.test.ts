import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { configurationService } from '../../../src/services/configurationService';

const prisma = new PrismaClient();

describe('ConfigurationService', () => {
  beforeEach(async () => {
    await prisma.configurationItem.deleteMany({});
  });

  afterEach(async () => {
    await prisma.configurationItem.deleteMany({});
  });

  describe('getConfigurationByCategory', () => {
    it('should return all active configuration items for a category', async () => {
      await prisma.configurationItem.createMany({
        data: [
          {
            category: 'PHASE_NAMES',
            key: 'phase_1',
            value: 'Studies',
            isActive: true,
            sortOrder: 1,
          },
          {
            category: 'PHASE_NAMES',
            key: 'phase_2',
            value: 'Design',
            isActive: true,
            sortOrder: 2,
          },
          {
            category: 'PROJECT_TYPES',
            key: 'type_1',
            value: 'Residential',
            isActive: true,
            sortOrder: 1,
          },
        ],
      });

      const items = await configurationService.getConfigurationByCategory('PHASE_NAMES');

      expect(items).toHaveLength(2);
      expect(items[0].category).toBe('PHASE_NAMES');
      expect(items[0].key).toBe('phase_1');
      expect(items[0].value).toBe('Studies');
      expect(items[1].key).toBe('phase_2');
    });

    it('should not return inactive configuration items', async () => {
      await prisma.configurationItem.createMany({
        data: [
          {
            category: 'PHASE_NAMES',
            key: 'phase_1',
            value: 'Studies',
            isActive: true,
            sortOrder: 1,
          },
          {
            category: 'PHASE_NAMES',
            key: 'phase_2',
            value: 'Design',
            isActive: false,
            sortOrder: 2,
          },
        ],
      });

      const items = await configurationService.getConfigurationByCategory('PHASE_NAMES');

      expect(items).toHaveLength(1);
      expect(items[0].key).toBe('phase_1');
    });

    it('should return empty array for non-existent category', async () => {
      const items = await configurationService.getConfigurationByCategory('NONEXISTENT');

      expect(items).toEqual([]);
    });

    it('should return items ordered by sortOrder', async () => {
      await prisma.configurationItem.createMany({
        data: [
          {
            category: 'PHASE_NAMES',
            key: 'phase_3',
            value: 'Technical',
            isActive: true,
            sortOrder: 3,
          },
          {
            category: 'PHASE_NAMES',
            key: 'phase_1',
            value: 'Studies',
            isActive: true,
            sortOrder: 1,
          },
          {
            category: 'PHASE_NAMES',
            key: 'phase_2',
            value: 'Design',
            isActive: true,
            sortOrder: 2,
          },
        ],
      });

      const items = await configurationService.getConfigurationByCategory('PHASE_NAMES');

      expect(items[0].sortOrder).toBe(1);
      expect(items[1].sortOrder).toBe(2);
      expect(items[2].sortOrder).toBe(3);
    });
  });

  describe('getConfigurationByKey', () => {
    it('should return a configuration item by category and key', async () => {
      await prisma.configurationItem.create({
        data: {
          category: 'PHASE_NAMES',
          key: 'phase_1',
          value: 'Studies',
          isActive: true,
          sortOrder: 1,
        },
      });

      const item = await configurationService.getConfigurationByKey('PHASE_NAMES', 'phase_1');

      expect(item).not.toBeNull();
      expect(item?.category).toBe('PHASE_NAMES');
      expect(item?.key).toBe('phase_1');
      expect(item?.value).toBe('Studies');
    });

    it('should return null for non-existent key', async () => {
      const item = await configurationService.getConfigurationByKey('PHASE_NAMES', 'nonexistent');

      expect(item).toBeNull();
    });

    it('should return null for inactive configuration item', async () => {
      await prisma.configurationItem.create({
        data: {
          category: 'PHASE_NAMES',
          key: 'phase_1',
          value: 'Studies',
          isActive: false,
          sortOrder: 1,
        },
      });

      const item = await configurationService.getConfigurationByKey('PHASE_NAMES', 'phase_1');

      expect(item).toBeNull();
    });
  });

  describe('createConfiguration', () => {
    it('should create a new configuration item', async () => {
      const item = await configurationService.createConfiguration({
        category: 'PHASE_NAMES',
        key: 'phase_1',
        value: 'Studies',
        sortOrder: 1,
      });

      expect(item).toHaveProperty('id');
      expect(item.category).toBe('PHASE_NAMES');
      expect(item.key).toBe('phase_1');
      expect(item.value).toBe('Studies');
      expect(item.isActive).toBe(true);
      expect(item.sortOrder).toBe(1);
    });

    it('should set default sortOrder if not provided', async () => {
      const item = await configurationService.createConfiguration({
        category: 'PHASE_NAMES',
        key: 'phase_1',
        value: 'Studies',
      });

      expect(item.sortOrder).toBe(0);
    });

    it('should set default isActive to true', async () => {
      const item = await configurationService.createConfiguration({
        category: 'PHASE_NAMES',
        key: 'phase_1',
        value: 'Studies',
        sortOrder: 1,
      });

      expect(item.isActive).toBe(true);
    });
  });

  describe('updateConfiguration', () => {
    beforeEach(async () => {
      await prisma.configurationItem.create({
        data: {
          category: 'PHASE_NAMES',
          key: 'phase_1',
          value: 'Studies',
          isActive: true,
          sortOrder: 1,
        },
      });
    });

    it('should update configuration value', async () => {
      const updated = await configurationService.updateConfiguration('PHASE_NAMES', 'phase_1', {
        value: 'Updated Studies',
      });

      expect(updated.value).toBe('Updated Studies');
    });

    it('should update isActive status', async () => {
      const updated = await configurationService.updateConfiguration('PHASE_NAMES', 'phase_1', {
        isActive: false,
      });

      expect(updated.isActive).toBe(false);
    });

    it('should update sortOrder', async () => {
      const updated = await configurationService.updateConfiguration('PHASE_NAMES', 'phase_1', {
        sortOrder: 5,
      });

      expect(updated.sortOrder).toBe(5);
    });

    it('should update multiple fields at once', async () => {
      const updated = await configurationService.updateConfiguration('PHASE_NAMES', 'phase_1', {
        value: 'Updated Studies',
        isActive: false,
        sortOrder: 5,
      });

      expect(updated.value).toBe('Updated Studies');
      expect(updated.isActive).toBe(false);
      expect(updated.sortOrder).toBe(5);
    });
  });

  describe('deleteConfiguration', () => {
    it('should delete a configuration item', async () => {
      const created = await prisma.configurationItem.create({
        data: {
          category: 'PHASE_NAMES',
          key: 'phase_1',
          value: 'Studies',
          isActive: true,
          sortOrder: 1,
        },
      });

      const deleted = await configurationService.deleteConfiguration('PHASE_NAMES', 'phase_1');

      expect(deleted.id).toBe(created.id);

      const found = await prisma.configurationItem.findUnique({
        where: {
          category_key: {
            category: 'PHASE_NAMES',
            key: 'phase_1',
          },
        },
      });

      expect(found).toBeNull();
    });
  });

  describe('bulkCreateConfiguration', () => {
    it('should create multiple configuration items', async () => {
      const result = await configurationService.bulkCreateConfiguration([
        {
          category: 'PHASE_NAMES',
          key: 'phase_1',
          value: 'Studies',
          sortOrder: 1,
        },
        {
          category: 'PHASE_NAMES',
          key: 'phase_2',
          value: 'Design',
          sortOrder: 2,
        },
        {
          category: 'PHASE_NAMES',
          key: 'phase_3',
          value: 'Technical',
          sortOrder: 3,
        },
      ]);

      expect(result.count).toBe(3);

      const items = await prisma.configurationItem.findMany({
        where: { category: 'PHASE_NAMES' },
      });

      expect(items).toHaveLength(3);
    });

    it('should skip duplicates when skipDuplicates is enabled', async () => {
      await prisma.configurationItem.create({
        data: {
          category: 'PHASE_NAMES',
          key: 'phase_1',
          value: 'Studies',
          isActive: true,
          sortOrder: 1,
        },
      });

      const result = await configurationService.bulkCreateConfiguration([
        {
          category: 'PHASE_NAMES',
          key: 'phase_1',
          value: 'Studies',
          sortOrder: 1,
        },
        {
          category: 'PHASE_NAMES',
          key: 'phase_2',
          value: 'Design',
          sortOrder: 2,
        },
      ]);

      expect(result.count).toBe(1);

      const items = await prisma.configurationItem.findMany({
        where: { category: 'PHASE_NAMES' },
      });

      expect(items).toHaveLength(2);
    });
  });
});
