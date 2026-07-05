import { create } from 'zustand';
import { api, primeCsrf } from '../lib/api';

export interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  roles: string[];
  permissions: string[];
  preferred_language: string;
  avatar_path: string | null;
}

interface AuthState {
  user: AuthUser | null;
  status: 'idle' | 'loading' | 'authenticated' | 'guest';
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: 'idle',

  login: async (email, password) => {
    set({ status: 'loading' });
    await primeCsrf();
    const { data } = await api.post('/auth/login', { email, password });
    set({ user: data.user, status: 'authenticated' });
  },

  logout: async () => {
    await api.post('/auth/logout');
    set({ user: null, status: 'guest' });
  },

  fetchMe: async () => {
    set({ status: 'loading' });
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user, status: 'authenticated' });
    } catch {
      set({ user: null, status: 'guest' });
    }
  },

  hasRole: (role) => get().user?.roles.includes(role) ?? false,
  hasPermission: (permission) => get().user?.permissions.includes(permission) ?? false,
}));
