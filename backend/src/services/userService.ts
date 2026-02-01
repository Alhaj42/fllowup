import { PrismaClient, User, Prisma } from '@prisma/client';
import logger from '../utils/logger';
import AuditLogService from './auditLogService';
import { prisma } from './prismaClient';

export interface CreateUserInput {
  email: string;
  name: string;
  role: 'MANAGER' | 'TEAM_LEADER' | 'TEAM_MEMBER';
  position?: string;
  region?: string;
  grade?: string;
  level?: string;
  monthlyCost?: number;
}

export interface UpdateUserInput {
  name?: string;
  role?: 'MANAGER' | 'TEAM_LEADER' | 'TEAM_MEMBER';
  position?: string;
  region?: string;
  grade?: string;
  level?: string;
  monthlyCost?: number;
  isActive?: boolean;
}

export interface GetUsersFilter {
  role?: 'MANAGER' | 'TEAM_LEADER' | 'TEAM_MEMBER';
  isActive?: boolean;
  page?: number;
  limit?: number;
  search?: string;
}

export interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class UserService {
  constructor() {
    this.prisma = prisma;
  }

  async createUser(
    input: CreateUserInput,
    userId: string,
    role: 'MANAGER' | 'TEAM_LEADER' | 'TEAM_MEMBER'
  ): Promise<User> {
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

      await AuditLogService.logCreate(
        'USER',
        user.id,
        userId,
        role,
        user
      );

      logger.info(`User created: ${user.email} (${role})`);
      return user;
    } catch (error) {
      logger.error('Failed to create user:', error);
      throw error;
    }
  }

  async updateUser(
    userId: string,
    input: UpdateUserInput,
    currentUserId: string
  ): Promise<User> {
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

      await AuditLogService.logUpdate('USER', userId, currentUserId, user, input);
      logger.info(`User updated: ${userId}`);
      return user;
    } catch (error) {
      logger.error('Failed to update user:', error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      return user;
    } catch (error) {
      logger.error('Failed to get user:', error);
      throw error;
    }
  }

  async getUsersByRole(
    role: 'MANAGER' | 'TEAM_LEADER' | 'TEAM_MEMBER'
  ): Promise<User[]> {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          role: role,
        },
      });
      return users;
    } catch (error) {
      logger.error('Failed to get users by role:', error);
      throw error;
    }
  }

  async getAllUsers(params?: GetUsersFilter): Promise<UsersResponse> {
    try {
      const { page = 1, limit = 10, role, isActive = true, search } = params || {};

      const where: any = {};
      if (role) where.role = role;
      if (isActive !== undefined) where.isActive = isActive;
      if (search) where.name = { contains: search, mode: 'insensitive' };

      const users = await this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      const total = await this.prisma.user.count({ where });

      const totalPages = Math.ceil(total / limit);

      logger.info(`Retrieved ${users.length} users (page ${page} of ${totalPages})`);
      return { users, total, page, limit, totalPages };
    } catch (error) {
      logger.error('Failed to get all users:', error);
      throw error;
    }
  }

  async deleteUser(userId: string, currentUserId: string): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id: userId },
      });

      await AuditLogService.logDelete('USER', userId, currentUserId);

      logger.info(`User deleted: ${userId}`);
    } catch (error) {
      logger.error('Failed to delete user:', error);
      throw error;
    }
  }
}

const userService = new UserService();
export default userService;
