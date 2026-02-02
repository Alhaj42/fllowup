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
export declare class ConfigurationService {
    getConfigurationByCategory(category: string): Promise<ConfigurationItem[]>;
    getConfigurationByKey(category: string, key: string): Promise<ConfigurationItem | null>;
    createConfiguration(input: CreateConfigInput): Promise<ConfigurationItem>;
    updateConfiguration(category: ConfigurationCategory, name: string, updates: UpdateConfigInput): Promise<ConfigurationItem>;
    deleteConfiguration(category: ConfigurationCategory, name: string): Promise<ConfigurationItem>;
    bulkCreateConfiguration(items: CreateConfigInput[]): Promise<{
        count: number;
    }>;
}
export declare const configurationService: ConfigurationService;
export {};
//# sourceMappingURL=configurationService.d.ts.map