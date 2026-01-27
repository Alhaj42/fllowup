import prisma from '../utils/prisma';
import { ConfigurationCategory } from '@prisma/client';

interface ConfigurationItem {
  id: string;
  category: ConfigurationCategory;
  name: string;
  code: string | null;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateConfigInput {
  category: ConfigurationCategory;
  name: string;
  code?: string;
  description?: string;
  sortOrder?: number;
}

interface UpdateConfigInput {
  name?: string;
  code?: string;
  description?: string;
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
    category: ConfigurationCategory,
    name: string,
    updates: UpdateConfigInput
  ): Promise<ConfigurationItem> {
    return prisma.configurationItem.update({
      where: {
        category_name: {
          category: category,
          name: name,
        },
      },
      data: {
        ...updates,
        name: name,
      },
    });
  }

  async deleteConfiguration(
    category: ConfigurationCategory,
    name: string
  ): Promise<ConfigurationItem> {
    return prisma.configurationItem.delete({
      where: {
        category_name: {
          category: category,
          name: name,
        },
      },
    });
  }

  async bulkCreateConfiguration(items: CreateConfigInput[]): Promise<{ count: number }> {
    const result = await prisma.configurationItem.createMany({
      data: items as any,
      skipDuplicates: true,
    });
    return { count: result.count };
  }
}

export const configurationService = new ConfigurationService();
