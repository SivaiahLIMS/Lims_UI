import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  userId: number;
  username: string;
  tenantId: number;
  branchId: number;
  permissions: string[];
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => {
        set({ user, isAuthenticated: true });
      },
      logout: () => {
        set({ user: null, isAuthenticated: false });
        localStorage.removeItem('lims_access_token');
        localStorage.removeItem('lims_refresh_token');
      },
      hasPermission: (permission) => {
        const { user } = get();
        if (!user) return false;
        return user.permissions.includes(permission);
      },
    }),
    {
      name: 'lims-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
