import apiClient from './api';
import type { User, UserFilters, CreateUserInput, UpdateUserInput, UsersResponse, UserRole } from '../types/user';

/**
 * User API Service
 * Handles all user-related API operations
 */
class UserService {
  /**
   * Get all users with optional filters
   */
  async getUsers(filters?: UserFilters): Promise<UsersResponse> {
    const params = new URLSearchParams();
    
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.role) {
      params.append('role', filters.role);
    }
    if (filters?.isActive !== undefined) {
      params.append('isActive', String(filters.isActive));
    }

    const queryString = params.toString();
    const url = queryString ? `/v1/users?${queryString}` : '/v1/users';
    
    return apiClient.get<UsersResponse>(url);
  }

  /**
   * Get a single user by ID
   */
  async getUserById(id: string): Promise<User> {
    return apiClient.get<User>(`/v1/users/${id}`);
  }

  /**
   * Create a new user
   */
  async createUser(data: CreateUserInput): Promise<User> {
    return apiClient.post<User>('/v1/users', data);
  }

  /**
   * Update an existing user
   */
  async updateUser(id: string, data: UpdateUserInput): Promise<User> {
    return apiClient.put<User>(`/v1/users/${id}`, data);
  }

  /**
   * Delete a user
   */
  async deleteUser(id: string): Promise<void> {
    return apiClient.delete<void>(`/v1/users/${id}`);
  }

  /**
   * Toggle user active status
   */
  async toggleUserActive(id: string): Promise<User> {
    return apiClient.patch<User>(`/v1/users/${id}/toggle`, {});
  }

  /**
   * Get all team leaders
   */
  async getTeamLeaders(): Promise<User[]> {
    const response = await apiClient.get<{ users: User[] }>('/v1/users/roles/team-leaders');
    return response.users;
  }

  /**
   * Get all team members
   */
  async getTeamMembers(): Promise<User[]> {
    const response = await apiClient.get<{ users: User[] }>('/v1/users/roles/team-members');
    return response.users;
  }

  /**
   * Get users by specific role
   */
  async getUsersByRole(role: UserRole): Promise<User[]> {
    const response = await apiClient.get<{ users: User[] }>(`/v1/users?role=${role}`);
    return response.users;
  }
}

export const userService = new UserService();
export default userService;
