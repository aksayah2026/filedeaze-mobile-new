export type AuthStackParamList = {
  Login: { email?: string; successBanner?: boolean } | undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email?: string; token?: string };
  OtpVerification: {
    email: string;
    mobile?: string;
    mode: "register" | "forgot_password";
    name?: string;
    password?: string;
    address?: string;
  };
};

export type CustomerStackParamList = {
  CustomerHome: undefined;
  CustomerJobDetails: { jobId: string };
};

export type TechnicianStackParamList = {
  TechnicianHome: undefined;
  TechnicianJobDetails: { jobId: string };
};

export type RootStackParamList = {
  Auth: undefined;
  CustomerPortal: undefined;
  TechnicianPortal: undefined;
};
