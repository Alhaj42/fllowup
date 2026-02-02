"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const auditLogService_1 = __importDefault(require("./auditLogService"));
const prismaClient_1 = require("./prismaClient");
class UserService {
    prisma;
    constructor() {
        this.prisma = prismaClient_1.prisma;
    }
    async createUser(input, userId, _role) {
        try {
            const user = await this.prisma.user.create({
                data: {
                    email: input.email,
                    name: input.name,
                    role: input.role,
                    position: input.position,
                    region: input.region,
                    grade: input.grade,
                    level: input.level,
                    monthlyCost: input.monthlyCost ? input.monthlyCost : null,
                    isActive: true,
                },
            });
            await auditLogService_1.default.logCreate('USER', user.id, userId, _role, user);
            logger_1.default.info(`User created: ${user.email} (${_role})`);
            return user;
        }
        catch (error) {
            logger_1.default.error('Failed to create user:', error);
            throw error;
        }
    }
    async updateUser(userId, input, currentUserId) {
        try {
            const user = await this.prisma.user.update({
                where: { id: userId },
                data: {
                    ...(input.name !== undefined && { name: input.name }),
                    ...(input.role !== undefined && { role: input.role }),
                    ...(input.position !== undefined && { position: input.position }),
                    ...(input.region !== undefined && { region: input.region }),
                    ...(input.grade !== undefined && { grade: input.grade }),
                    ...(input.level !== undefined && { level: input.level }),
                    ...(input.monthlyCost !== undefined && { monthlyCost: input.monthlyCost }),
                    ...(input.isActive !== undefined && { isActive: input.isActive }),
                },
            });
            await auditLogService_1.default.logUpdate('USER', userId, currentUserId, 'MANAGER', user, input);
            logger_1.default.info(`User updated: ${userId}`);
            return user;
        }
        catch (error) {
            logger_1.default.error('Failed to update user:', error);
            throw error;
        }
    }
    async getUserById(userId) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
            });
            return user;
        }
        catch (error) {
            logger_1.default.error('Failed to get user:', error);
            throw error;
        }
    }
    async getUsersByRole(role) {
        try {
            const users = await this.prisma.user.findMany({
                where: {
                    role: role,
                },
            });
            return users;
        }
        catch (error) {
            logger_1.default.error('Failed to get users by role:', error);
            throw error;
        }
    }
    async getAllUsers(params) {
        try {
            const { page = 1, limit = 10, role, isActive = true, search } = params || {};
            const where = {};
            if (role)
                where.role = role;
            if (isActive !== undefined)
                where.isActive = isActive;
            if (search)
                where.name = { contains: search, mode: 'insensitive' };
            const users = await this.prisma.user.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            });
            const total = await this.prisma.user.count({ where });
            const totalPages = Math.ceil(total / limit);
            logger_1.default.info(`Retrieved ${users.length} users (page ${page} of ${totalPages})`);
            return { users, total, page, limit, totalPages };
        }
        catch (error) {
            logger_1.default.error('Failed to get all users:', error);
            throw error;
        }
    }
    async deleteUser(userId, currentUserId) {
        try {
            await this.prisma.user.delete({
                where: { id: userId },
            });
            await auditLogService_1.default.logDelete('USER', userId, currentUserId, 'MANAGER', {});
            logger_1.default.info(`User deleted: ${userId}`);
        }
        catch (error) {
            logger_1.default.error('Failed to delete user:', error);
            throw error;
        }
    }
    async getUserByEmail(email) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { email },
            });
            return user;
        }
        catch (error) {
            logger_1.default.error('Failed to get user by email:', error);
            throw error;
        }
    }
    async deactivateUser(userId, currentUserId, _role) {
        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: { isActive: false },
            });
            await auditLogService_1.default.logUpdate('USER', userId, currentUserId, _role, { isActive: true }, { isActive: false });
            logger_1.default.info(`User deactivated: ${userId}`);
        }
        catch (error) {
            logger_1.default.error('Failed to deactivate user:', error);
            throw error;
        }
    }
    async toggleUserActiveStatus(userId, currentUserId, _role) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                throw new Error('User not found');
            }
            const updatedUser = await this.prisma.user.update({
                where: { id: userId },
                data: { isActive: !user.isActive },
            });
            await auditLogService_1.default.logUpdate('USER', userId, currentUserId, _role, user, updatedUser);
            logger_1.default.info(`User status toggled: ${userId} -> ${updatedUser.isActive}`);
            return updatedUser;
        }
        catch (error) {
            logger_1.default.error('Failed to toggle user status:', error);
            throw error;
        }
    }
    async getTeamLeaders() {
        try {
            const users = await this.prisma.user.findMany({
                where: {
                    role: 'TEAM_LEADER',
                    isActive: true,
                },
            });
            return users;
        }
        catch (error) {
            logger_1.default.error('Failed to get team leaders:', error);
            throw error;
        }
    }
    async getTeamMembers() {
        try {
            const users = await this.prisma.user.findMany({
                where: {
                    role: 'TEAM_MEMBER',
                    isActive: true,
                },
            });
            return users;
        }
        catch (error) {
            logger_1.default.error('Failed to get team members:', error);
            throw error;
        }
    }
}
exports.UserService = UserService;
const userService = new UserService();
exports.default = userService;
//# sourceMappingURL=userService.js.map