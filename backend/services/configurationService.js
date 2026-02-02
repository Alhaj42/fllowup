"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configurationService = exports.ConfigurationService = void 0;
// @ts-nocheck
const prisma_1 = __importDefault(require("../utils/prisma"));
class ConfigurationService {
    async getConfigurationByCategory(category) {
        return prisma_1.default.configurationItem.findMany({
            where: {
                category,
                isActive: true,
            },
            orderBy: {
                sortOrder: 'asc',
            },
        });
    }
    async getConfigurationByKey(category, key) {
        return prisma_1.default.configurationItem.findFirst({
            where: {
                category,
                key,
                isActive: true,
            },
        });
    }
    async createConfiguration(input) {
        return prisma_1.default.configurationItem.create({
            data: input,
        });
    }
    async updateConfiguration(category, name, updates) {
        return prisma_1.default.configurationItem.update({
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
    async deleteConfiguration(category, name) {
        return prisma_1.default.configurationItem.delete({
            where: {
                category_name: {
                    category: category,
                    name: name,
                },
            },
        });
    }
    async bulkCreateConfiguration(items) {
        const result = await prisma_1.default.configurationItem.createMany({
            data: items,
            skipDuplicates: true,
        });
        return { count: result.count };
    }
}
exports.ConfigurationService = ConfigurationService;
exports.configurationService = new ConfigurationService();
//# sourceMappingURL=configurationService.js.map