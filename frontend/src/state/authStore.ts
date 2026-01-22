import { create } from 'zustand';

export type UserRole = 'MANAGER' | 'TEAM_LEADER' | 'TEAM_MEMBER';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
  setLoading: (isLoading: boolean) => void;
  
  hasRole: (roles: UserRole[]) => boolean;
  hasMinimumRole: (minimumRole: UserRole) => boolean;
}

const roleHierarchy: Record<UserRole, number> = {
  MANAGER: 3,
  TEAM_LEADER: 2,
  TEAM_MEMBER: 1,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,

  setAuth: (user: User, token: string) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, accessToken: token, isAuthenticated: true });
  },

  setUser: (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  setToken: (token: string) => {
    localStorage.setItem('accessToken', token);
    set({ accessToken: token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  hasRole: (roles: UserRole[]) => {
    const { user } = get();
    return user ? roles.includes(user.role) : false;
  },

  hasMinimumRole: (minimumRole: UserRole) => {
    const { user } = get();
    if (!user) return false;
    const userLevel = roleHierarchy[user.role] ?? 0;
    const requiredLevel = roleHierarchy[minimumRole] ?? 0;
    return userLevel >= requiredLevel;
  },
}));

export default useAuthStore;
