import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'MANAGER' | 'TEAM_LEADER' | 'TEAM_MEMBER';
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const mockUser: User = {
            id: '1',
            email,
            name: email.split('@')[0],
            role: 'MANAGER',
          };
          const mockToken = 'mock-jwt-token-development';

          localStorage.setItem('auth_token', mockToken);
          localStorage.setItem('auth_user', JSON.stringify(mockUser));

          set({
            isAuthenticated: true,
            user: mockUser,
            token: mockToken,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          isLoading: false,
        });
      },

      setUser: (user: User | null) => {
        localStorage.setItem('auth_user', JSON.stringify(user));
        set({ user });
      },

      setToken: (token: string | null) => {
        if (token) {
          localStorage.setItem('auth_token', token);
        } else {
          localStorage.removeItem('auth_token');
        }
        set({ token });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export const hasRole = (role: User['role']): boolean => {
  const user = useAuthStore.getState().user;
  return user?.role === role;
};

export const useAuthActions = () => useAuthStore((state) => ({
  login: state.login,
  logout: state.logout,
  setUser: state.setUser,
  setToken: state.setToken,
  setLoading: state.setLoading,
}));

export const useAuthUser = () => useAuthStore((state) => state.user);
