import { z } from "zod";

export const technicianLoginSchema = z.object({
  identifier: z
    .string()
    .min(1, "Email or Mobile is required"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

export const customerLoginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter valid email address"),
  password: z
    .string()
    .min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .min(3, "Name must be at least 3 characters"),
    mobile: z
      .string()
      .min(1, "Mobile is required")
      .regex(/^\d{10}$/, "Enter valid mobile number"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Enter valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
    address: z.string().optional().refine((val) => !val || val.length >= 10, {
      message: "Address must be at least 10 characters",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter valid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "Enter 6-digit OTP"),
});

export type TechnicianLoginInput = z.infer<typeof technicianLoginSchema>;
export type CustomerLoginInput = z.infer<typeof customerLoginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type OtpInput = z.infer<typeof otpSchema>;
