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
  // Batch 1 — List Screens
  AttendanceHistory: undefined;
  AssignedJobs: undefined;
  // Batch 2 — Job Lifecycle Actions
  AcceptTicket: { jobId: string; ticketNo: string; customerName: string };
  RejectTicket: { jobId: string; ticketNo: string };
  ReachLocation: { jobId: string; ticketNo: string; address: string };
  // Batch 3 — Work Execution
  StartJob: { jobId: string; ticketNo: string };
  MarkPending: { jobId: string; ticketNo: string };
  // Batch 4 — Completion Flow
  CompleteJob: { jobId: string; ticketNo: string; customerName: string };
  CustomerSignature: { jobId: string; ticketNo: string; customerName: string };
  PaymentCollection: { jobId: string; ticketNo: string; amount?: number };
};

export type RootStackParamList = {
  Auth: undefined;
  CustomerPortal: undefined;
  TechnicianPortal: undefined;
};
