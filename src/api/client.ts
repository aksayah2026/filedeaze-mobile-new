import axios, { InternalAxiosRequestConfig } from "axios";
import { APP_CONFIG } from "../config/app.config";
import { useAuthStore } from "../store/auth.store";

// Create configured Axios Instance
export const apiClient = axios.create({
  baseURL: APP_CONFIG.apiBaseUrl,
  timeout: APP_CONFIG.timeoutMs,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request Interceptor to append Authorization & Tenant Headers
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get state from Zustand store
    const { token } = useAuthStore.getState();

    // Attach Tenant identifier header
    config.headers["x-tenant-code"] = APP_CONFIG.tenantCode;

    // Attach JWT token
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized globally
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Auto logout on token expiration
      useAuthStore.getState().logout();
      
      return Promise.reject(new Error("Session expired. Please log in again."));
    }

    // Parse friendly message if available
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An unexpected network error occurred.";

    return Promise.reject(new Error(errorMessage));
  }
);
