import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { JobService, TicketStatus, Ticket } from "../services/job.service";

// ==========================================
// QUERY KEYS
// ==========================================

export const jobQueryKeys = {
  all: ["work-orders"] as const,
  technicianList: () => [...jobQueryKeys.all, "tech-list"] as const,
  customerList: (mobile: string) => [...jobQueryKeys.all, "cust-list", mobile] as const,
  details: (ticketNo: string) => [...jobQueryKeys.all, "detail", ticketNo] as const,
  attendance: () => ["attendance"] as const,
  attendanceHistory: (month?: number, year?: number) =>
    ["attendance-history", month, year] as const,
  invoices: (mobile: string) => ["invoices", mobile] as const,
};

// ==========================================
// TECHNICIAN — TICKET HOOKS
// ==========================================

export function useTechnicianJobs() {
  return useQuery({
    queryKey: jobQueryKeys.technicianList(),
    queryFn: () => JobService.getTechnicianJobs(),
    staleTime: 10_000,
  });
}

export function useJobDetails(ticketNo: string) {
  return useQuery({
    queryKey: jobQueryKeys.details(ticketNo),
    queryFn: () => JobService.getJobDetails(ticketNo),
    enabled: !!ticketNo,
  });
}

export function useUpdateJobStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketNo, status }: { ticketNo: string; status: TicketStatus }) =>
      JobService.updateJobStatus(ticketNo, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.technicianList() });
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.details(data.ticketNo) });
    },
  });
}

export function useRejectJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketNo, reason }: { ticketNo: string; reason: string }) =>
      JobService.rejectJob(ticketNo, reason),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.technicianList() });
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.details(vars.ticketNo) });
    },
  });
}

export function useUploadTicketImage() {
  return useMutation({
    mutationFn: ({
      ticketNo,
      imageUri,
      type,
    }: {
      ticketNo: string;
      imageUri: string;
      type: "BEFORE" | "AFTER";
    }) => JobService.uploadTicketImage(ticketNo, imageUri, type),
  });
}

export function useSaveBeforePhotos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketNo, photos }: { ticketNo: string; photos: string[] }) =>
      JobService.saveBeforePhotos(ticketNo, photos),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.technicianList() });
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.details(data.ticketNo) });
    },
  });
}

export function useCompleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ticketNo,
      payload,
    }: {
      ticketNo: string;
      payload: {
        beforePhotos: string[];
        afterPhotos: string[];
        customerSignature: string;
        workNotes: string;
        duration: string;
        paymentCollection?: number;
        paymentMethod?: string;
      };
    }) => JobService.completeJob(ticketNo, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.technicianList() });
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.details(data.ticketNo) });
      if (data.customerMobile) {
        queryClient.invalidateQueries({
          queryKey: jobQueryKeys.customerList(data.customerMobile),
        });
        queryClient.invalidateQueries({
          queryKey: jobQueryKeys.invoices(data.customerMobile),
        });
      }
    },
  });
}

export function useMarkJobPending() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ticketNo,
      pendingReason,
      notes,
      photos,
    }: {
      ticketNo: string;
      pendingReason: string;
      notes?: string;
      photos?: string[];
    }) => JobService.markJobPending(ticketNo, pendingReason, notes, photos),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.technicianList() });
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.details(data.ticketNo) });
    },
  });
}

export function useCollectPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ticketNo,
      amount,
      paymentMethod,
    }: {
      ticketNo: string;
      amount: number;
      paymentMethod: string;
    }) => JobService.collectPayment(ticketNo, { amount, paymentMethod }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.technicianList() });
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.details(vars.ticketNo) });
    },
  });
}

export function useRescheduleJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketNo, nextVisitDate }: { ticketNo: string; nextVisitDate: string }) =>
      JobService.rescheduleJob(ticketNo, nextVisitDate),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.technicianList() });
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.details(data.ticketNo) });
    },
  });
}

// ==========================================
// ATTENDANCE HOOKS
// ==========================================

export function useAttendanceStatus() {
  return useQuery({
    queryKey: jobQueryKeys.attendance(),
    queryFn: () => JobService.getAttendanceStatus(),
    staleTime: 30_000,
  });
}

export function useAttendanceHistory(month?: number, year?: number) {
  return useQuery({
    queryKey: jobQueryKeys.attendanceHistory(month, year),
    queryFn: () => JobService.getAttendanceHistory(month, year),
    staleTime: 60_000,
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      location,
      latitude,
      longitude,
    }: {
      location: string;
      latitude?: number;
      longitude?: number;
    }) => JobService.checkIn(location, latitude, longitude),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.attendance() });
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.attendanceHistory() });
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.technicianList() });
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      latitude,
      longitude,
    }: {
      latitude?: number;
      longitude?: number;
    } = {}) => JobService.checkOut(latitude, longitude),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.attendance() });
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.attendanceHistory() });
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.technicianList() });
    },
  });
}

// ==========================================
// CUSTOMER HOOKS
// ==========================================

export function useCustomerTickets(mobile: string) {
  return useQuery({
    queryKey: jobQueryKeys.customerList(mobile),
    queryFn: () => JobService.getCustomerTickets(mobile),
    enabled: !!mobile,
  });
}

export function useCustomerInvoices(mobile: string) {
  return useQuery({
    queryKey: jobQueryKeys.invoices(mobile),
    queryFn: () => JobService.getCustomerInvoices(mobile),
    enabled: !!mobile,
  });
}

export function useRaiseTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      customerName: string;
      customerMobile: string;
      category: string;
      subCategory: string;
      description: string;
      address: string;
      images?: string[];
    }) => JobService.raiseTicket(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: jobQueryKeys.customerList(data.customerMobile),
      });
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.technicianList() });
    },
  });
}
