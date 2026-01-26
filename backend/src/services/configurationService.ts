import prisma from '../utils/prisma';

interface ConfigurationItem {
  id: string;
  category: string;
  key: string;
  value: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateConfigInput {
  category: string;
  key: string;
  value: string;
  sortOrder?: number;
}

interface UpdateConfigInput {
  value?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export class ConfigurationService {
  async getConfigurationByCategory(category: string): Promise<ConfigurationItem[]> {
    return prisma.configurationItem.findMany({
      where: {
        category,
        isActive: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });
  }

  async getConfigurationByKey(category: string, key: string): Promise<ConfigurationItem | null> {
    return prisma.configurationItem.findFirst({
      where: {
        category,
        key,
        isActive: true,
      },
    });
  }

  async createConfiguration(input: CreateConfigInput): Promise<ConfigurationItem> {
    return prisma.configurationItem.create({
      data: input,
    });
  }

  async updateConfiguration(
    category: string,
    key: string,
    updates: UpdateConfigInput
  ): Promise<ConfigurationItem> {
    return prisma.configurationItem.update({
      where: {
        category_key: {
          category,
          key,
        },
      },
      data: updates,
    });
  }

  async deleteConfiguration(category: string, key: string): Promise<ConfigurationItem> {
    return prisma.configurationItem.delete({
      where: {
        category_key: {
          category,
          key,
        },
      },
    });
  }

  async bulkCreateConfiguration(items: CreateConfigInput[]): Promise<{ count: number }> {
    const result = await prisma.configurationItem.createMany({
      data: items,
      skipDuplicates: true,
    });
    return { count: result.count };
  }
}

export const configurationService = new ConfigurationService();
