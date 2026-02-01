import { User } from '@prisma/client';
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
declare class UserService {
    private prisma;
    constructor();
    createUser(input: CreateUserInput, userId: string, _role: 'MANAGER' | 'TEAM_LEADER' | 'TEAM_MEMBER'): Promise<User>;
    updateUser(userId: string, input: UpdateUserInput, currentUserId: string): Promise<User>;
    getUserById(userId: string): Promise<User | null>;
    getUsersByRole(role: 'MANAGER' | 'TEAM_LEADER' | 'TEAM_MEMBER'): Promise<User[]>;
    getAllUsers(params?: GetUsersFilter): Promise<UsersResponse>;
    deleteUser(userId: string, currentUserId: string): Promise<void>;
    getUserByEmail(email: string): Promise<User | null>;
    deactivateUser(userId: string, currentUserId: string, _role: string): Promise<void>;
    toggleUserActiveStatus(userId: string, currentUserId: string, _role: string): Promise<User>;
    getTeamLeaders(): Promise<User[]>;
    getTeamMembers(): Promise<User[]>;
}
declare const userService: UserService;
export { UserService };
export default userService;
//# sourceMappingURL=userService.d.ts.map