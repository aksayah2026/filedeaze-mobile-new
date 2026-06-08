import { create } from "zustand";
import { APP_CONFIG } from "../config/app.config";
import AuthService from "../services/auth.service";

export type UserRole = "CUSTOMER" | "TECHNICIAN" | "ADMIN" | "SUPER_ADMIN";

export interface UserProfile {
  id: string;
  name: string;
  mobile: string;
  role: UserRole;
  email?: string;
  avatar?: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  role: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await AuthService.login(email, password);
      
      const userProfile: UserProfile = {
        id: res.user.id,
        name: res.user.name,
        mobile: res.user.mobile,
        role: res.user.role,
        email: res.user.email,
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
      };

      set({
        user: userProfile,
        token: res.token,
        role: res.user.role,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err?.message || "Invalid credentials.",
      });
      throw err;
    }
  },

  logout: () => {
    set({
      user: null,
      token: null,
      role: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
export default useAuthStore;
