import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { JobService } from "../services/job.service";
import { TicketStatus, Ticket } from "../mock/data";

// Query keys enumeration
export const jobQueryKeys = {
  all: ["work-orders"] as const,
  technicianList: () => [...jobQueryKeys.all, "tech-list"] as const,
  customerList: (mobile: string) => [...jobQueryKeys.all, "cust-list", mobile] as const,
  details: (ticketNo: string) => [...jobQueryKeys.all, "detail", ticketNo] as const,
  attendance: () => ["attendance"] as const,
  invoices: (mobile: string) => ["invoices", mobile] as const,
};

// ==========================================
// TECHNICIAN HOOKS
// ==========================================

export function useTechnicianJobs() {
  return useQuery({
    queryKey: jobQueryKeys.technicianList(),
    queryFn: () => JobService.getTechnicianJobs(),
    staleTime: 5000,
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
      if (data.customerMobile) {
        queryClient.invalidateQueries({ queryKey: jobQueryKeys.customerList(data.customerMobile) });
      }
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
        queryClient.invalidateQueries({ queryKey: jobQueryKeys.customerList(data.customerMobile) });
        queryClient.invalidateQueries({ queryKey: jobQueryKeys.invoices(data.customerMobile) });
      }
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
      if (data.customerMobile) {
        queryClient.invalidateQueries({ queryKey: jobQueryKeys.customerList(data.customerMobile) });
      }
    },
  });
}

export function useMarkJobPending() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketNo, pendingReason }: { ticketNo: string; pendingReason: string }) =>
      JobService.markJobPending(ticketNo, pendingReason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.technicianList() });
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.details(data.ticketNo) });
      if (data.customerMobile) {
        queryClient.invalidateQueries({ queryKey: jobQueryKeys.customerList(data.customerMobile) });
      }
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
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (location: string) => JobService.checkIn(location),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.attendance() });
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => JobService.checkOut(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.attendance() });
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
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.customerList(data.customerMobile) });
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.technicianList() });
    },
  });
}
