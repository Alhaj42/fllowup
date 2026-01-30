import { UserRole, User, PrismaClient } from '@prisma/client';
import logger from '../utils/logger';
import AuditLogService from './auditLogService';
import { prisma } from './prismaClient';

export interface CreateUserInput {
  email: string;
  name: string;
  role: UserRole;
  position?: string;
  region?: string;
  grade?: string;
  level?: string;
  monthlyCost?: number;
}

export interface UpdateUserInput {
  name?: string;
  role?: UserRole;
  position?: string;
  region?: string;
  grade?: string;
  level?: string;
  monthlyCost?: number;
  isActive?: boolean;
}

export interface GetUsersFilter {
  role?: UserRole;
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
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async createUser(
    input: CreateUserInput,
    userId: string,
    role: UserRole
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

      logger.info('User created successfully', { userId: user.id, email: user.email });

      return user;
    } catch (error) {
      logger.error('Failed to create user', { error, input });
      throw error;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      return user;
    } catch (error) {
      logger.error('Failed to get user by ID', { error, id });
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      return user;
    } catch (error) {
      logger.error('Failed to get user by email', { error, email });
      throw error;
    }
  }

  async getUsers(filter: GetUsersFilter): Promise<UsersResponse> {
    try {
      const page = filter.page ?? 1;
      const limit = filter.limit ?? 50;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (filter.role) {
        where.role = filter.role;
      }

      if (filter.isActive !== undefined) {
        where.isActive = filter.isActive;
      }

      if (filter.search) {
        where.OR = [
          { name: { contains: filter.search, mode: 'insensitive' } },
          { email: { contains: filter.search, mode: 'insensitive' } },
        ];
      }

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.user.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        users,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error('Failed to get users', { error, filter });
      throw error;
    }
  }

  async updateUser(
    id: string,
    input: UpdateUserInput,
    userId: string,
    role: UserRole
  ): Promise<User> {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new Error('User not found');
      }

      const user = await this.prisma.user.update({
        where: { id },
        data: {
          ...input,
          monthlyCost: input.monthlyCost !== undefined ? input.monthlyCost : existingUser.monthlyCost,
        },
      });

      await AuditLogService.logUpdate(
        'USER',
        id,
        userId,
        role,
        existingUser,
        user
      );

      logger.info('User updated successfully', { userId: id });

      return user;
    } catch (error) {
      logger.error('Failed to update user', { error, id, input });
      throw error;
    }
  }

  async deactivateUser(
    id: string,
    userId: string,
    role: UserRole
  ): Promise<User> {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new Error('User not found');
      }

      const user = await this.prisma.user.update({
        where: { id },
        data: {
          isActive: false,
        },
      });

      await AuditLogService.logUpdate(
        'USER',
        id,
        userId,
        role,
        existingUser,
        user
      );

      logger.info('User deactivated successfully', { userId: id });

      return user;
    } catch (error) {
      logger.error('Failed to deactivate user', { error, id });
      throw error;
    }
  }

  async toggleUserActiveStatus(
    id: string,
    userId: string,
    role: UserRole
  ): Promise<User> {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new Error('User not found');
      }

      const user = await this.prisma.user.update({
        where: { id },
        data: {
          isActive: !existingUser.isActive,
        },
      });

      await AuditLogService.logUpdate(
        'USER',
        id,
        userId,
        role,
        existingUser,
        user
      );

      logger.info('User active status toggled', { userId: id, isActive: user.isActive });

      return user;
    } catch (error) {
      logger.error('Failed to toggle user active status', { error, id });
      throw error;
    }
  }

  async getTeamLeaders(): Promise<User[]> {
    try {
      const teamLeaders = await this.prisma.user.findMany({
        where: {
          role: 'TEAM_LEADER',
          isActive: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return teamLeaders;
    } catch (error) {
      logger.error('Failed to get team leaders', { error });
      throw error;
    }
  }

  async getTeamMembers(): Promise<User[]> {
    try {
      const teamMembers = await this.prisma.user.findMany({
        where: {
          role: 'TEAM_MEMBER',
          isActive: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return teamMembers;
    } catch (error) {
      logger.error('Failed to get team members', { error });
      throw error;
    }
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          role,
          isActive: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return users;
    } catch (error) {
      logger.error('Failed to get users by role', { error, role });
      throw error;
    }
  }

  async getActiveUsers(): Promise<User[]> {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return users;
    } catch (error) {
      logger.error('Failed to get active users', { error });
      throw error;
    }
  }
}

export default UserService;
