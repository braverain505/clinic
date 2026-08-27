import { create } from 'zustand';
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  permissions: string[];
}

interface AuthStore {
  token: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  initializeAuth: () => void;
  clearError: () => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  isRole: (...roles: string[]) => boolean;
}

const useAuthStore = create<AuthStore>((set, get) => ({
  token: null,
  user: null,
  loading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ token, user, loading: false });
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login failed';
      set({ error: message, loading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, error: null });
  },

  initializeAuth: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      const parsed = JSON.parse(user);
      // Ensure permissions array exists
      if (!parsed.permissions) {
        parsed.permissions = [];
      }
      set({ token, user: parsed });
    }
  },

  clearError: () => set({ error: null }),

  hasPermission: (permission: string) => {
    const { user } = get();
    return user?.permissions?.includes(permission) ?? false;
  },

  hasAnyPermission: (permissions: string[]) => {
    const { user } = get();
    return permissions.some((p) => user?.permissions?.includes(p)) ?? false;
  },

  isRole: (...roles: string[]) => {
    const { user } = get();
    return user ? roles.includes(user.role) : false;
  },
}));

export default useAuthStore;
