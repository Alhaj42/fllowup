import { create } from 'zustand';

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
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!localStorage.getItem('auth_token'),
  user: JSON.parse(localStorage.getItem('auth_user') || 'null'),
  token: localStorage.getItem('auth_token'),

  login: async (email: string, password: string) => {
    // TODO: Implement actual login with Auth0
    // For now, mock login for development
    const mockUser: User = {
      id: '1',
      email,
      name: email.split('@')[0],
      role: 'MANAGER',
    };
    const mockToken = 'mock-jwt-token';

    localStorage.setItem('auth_token', mockToken);
    localStorage.setItem('auth_user', JSON.stringify(mockUser));

    set({
      isAuthenticated: true,
      user: mockUser,
      token: mockToken,
    });
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    set({
      isAuthenticated: false,
      user: null,
      token: null,
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
}));
