export type UserRole = 'MANAGER' | 'TEAM_LEADER' | 'TEAM_MEMBER';

export const USER_ROLES: Record<UserRole, string> = {
  MANAGER: 'Manager',
  TEAM_LEADER: 'Team Leader',
  TEAM_MEMBER: 'Team Member',
};

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  position?: string;
  region?: string;
  grade?: string;
  level?: string;
  monthlyCost?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

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
  email?: string;
  name?: string;
  role?: UserRole;
  position?: string;
  region?: string;
  grade?: string;
  level?: string;
  monthlyCost?: number;
  isActive?: boolean;
}

export interface UserFilters {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
}
