import { apiClient } from "../api/client";
import { APP_CONFIG } from "../config/app.config";

export interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    name: string;
    mobile: string;
    role: "TECHNICIAN" | "CUSTOMER";
    email?: string;
  };
}

export class AuthService {
  /**
   * Unified Login (tries customer first, falls back to technician)
   */
  static async login(email: string, password: string): Promise<LoginResponse> {
    try {
      // 1. Try customer login
      const response = await apiClient.post("/auth/customer/login", {
        tenantId: APP_CONFIG.tenantId,
        email,
        password,
      });

      const { user, tokens } = response.data.data;
      return {
        success: true,
        token: tokens.accessToken,
        user: {
          id: user.id,
          name: user.name,
          mobile: user.phone || "",
          role: user.role,
          email: user.email,
        },
      };
    } catch (customerError: any) {
      // If customer fails, try technician login
      try {
        const response = await apiClient.post("/auth/technician/login", {
          tenantId: APP_CONFIG.tenantId,
          email,
          password,
        });

        const { user, tokens } = response.data.data;
        console.log("LOGIN SUCCESS ONLY - no attendance started");
        return {
          success: true,
          token: tokens.accessToken,
          user: {
            id: user.id,
            name: user.name,
            mobile: user.phone || "",
            role: user.role,
            email: user.email,
          },
        };
      } catch (techError: any) {
        const msg =
          techError.response?.data?.message ||
          customerError.response?.data?.message ||
          "Invalid email or password.";
        throw new Error(msg);
      }
    }
  }

  /**
   * Customer Registration
   */
  static async registerCustomer(payload: {
    name: string;
    email: string;
    mobile: string;
    password: string;
  }): Promise<{ message: string }> {
    try {
      const response = await apiClient.post("/auth/customer/register", {
        tenantId: APP_CONFIG.tenantId,
        name: payload.name,
        email: payload.email,
        phone: payload.mobile,
        password: payload.password,
        confirmPassword: payload.password,
      });

      return {
        message: response.data.message || "OTP sent to your email address.",
      };
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || "Failed to register.";
      throw new Error(msg);
    }
  }

  /**
   * Customer OTP Verification
   */
  static async verifyOtp(email: string, otp: string): Promise<LoginResponse> {
    try {
      const response = await apiClient.post("/auth/customer/verify-otp", {
        tenantId: APP_CONFIG.tenantId,
        email,
        otp,
      });

      const { user, tokens } = response.data.data;

      return {
        success: true,
        token: tokens.accessToken,
        user: {
          id: user.id,
          name: user.name,
          mobile: user.phone || "",
          role: user.role,
          email: user.email,
        },
      };
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || "Verification failed.";
      throw new Error(msg);
    }
  }

  /**
   * Resend OTP
   */
  static async resendOtp(email: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post("/auth/customer/resend-otp", {
        tenantId: APP_CONFIG.tenantId,
        email,
      });

      return {
        message: response.data.message || "OTP resent successfully.",
      };
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || "Failed to resend OTP.";
      throw new Error(msg);
    }
  }

  /**
   * Customer Forgot Password
   */
  static async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post("/auth/customer/forgot-password", {
        tenantId: APP_CONFIG.tenantId,
        email,
      });

      return {
        message: response.data.message || "Reset OTP sent to your email.",
      };
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || "Failed to request reset link.";
      throw new Error(msg);
    }
  }

  /**
   * Verify Forgot Password OTP
   */
  static async verifyForgotPasswordOtp(email: string, otp: string): Promise<{ resetToken: string }> {
    const payload = {
      tenantId: APP_CONFIG.tenantId,
      email,
      otp,
    };
    console.log("verifyForgotPasswordOtp Request Payload:", JSON.stringify(payload, null, 2));
    try {
      const response = await apiClient.post("/auth/customer/verify-forgot-password-otp", payload);
      return {
        resetToken: response.data.data.resetToken,
      };
    } catch (error: any) {
      if (error.response) {
        console.log("verifyForgotPasswordOtp Response Error Body:", JSON.stringify(error.response.data, null, 2));
      } else {
        console.log("verifyForgotPasswordOtp Error Message:", error.message);
      }
      const msg = error.response?.data?.message || error.message || "Failed to verify OTP.";
      throw new Error(msg);
    }
  }

  /**
   * Customer Reset Password (using resetToken & newPassword)
   */
  static async resetPassword(resetToken: string, newPassword: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post("/auth/customer/reset-password", {
        resetToken,
        newPassword,
        confirmNewPassword: newPassword,
      });

      return {
        message: response.data.message || "Password updated successfully.",
      };
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || "Failed to reset password.";
      throw new Error(msg);
    }
  }
}
export default AuthService;
