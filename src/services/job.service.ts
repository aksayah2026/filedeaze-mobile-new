import { apiClient } from "../api/client";

// ==========================================
// DOMAIN TYPES (re-exported for consumers)
// ==========================================

export type TicketStatus =
  | "NEW"
  | "ASSIGNED"
  | "ACCEPTED"
  | "TRAVELLING"
  | "REACHED"
  | "IN_PROGRESS"
  | "PENDING"
  | "RESCHEDULED"
  | "COMPLETED"
  | "CLOSED";

export type TicketPriority = "URGENT" | "HIGH" | "MEDIUM" | "LOW";

export interface Ticket {
  ticketNo: string;
  customerName: string;
  customerMobile: string;
  service: string;
  description: string;
  status: TicketStatus;
  priority?: TicketPriority;
  scheduledDate: string;
  scheduledTime: string;
  address: string;
  technicianName?: string;
  technicianMobile?: string;
  notes?: string;
  beforePhotos?: string[];
  afterPhotos?: string[];
  customerSignature?: string;
  workNotes?: string;
  duration?: string;
  paymentCollection?: number;
  paymentMethod?: string;
  nextVisitDate?: string;
  pendingReason?: string;
  category?: string;
  subCategory?: string;
  images?: string[];
}

export interface Invoice {
  invoiceNo: string;
  ticketNo: string;
  amount: number;
  gst: number;
  total: number;
  paymentStatus: "PAID" | "UNPAID";
}

export interface AttendanceLog {
  checkedIn: boolean;
  checkInTime?: string;
  checkInLocation?: string;
  checkOutTime?: string;
  workingHours?: string;
  shiftCompleted?: boolean;
  rawCheckInTime?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  workingHours?: string;
  location?: string;
  status: "PRESENT" | "ABSENT" | "HALF_DAY" | "LATE";
}

function normalizeAttendanceLog(raw: any): AttendanceLog {
  if (!raw) return { checkedIn: false };

  // Dashboard API field is "isCheckedIn" (boolean)
  const checkedIn: boolean = Boolean(raw.isCheckedIn ?? raw.checkedIn ?? false);

  // checkInTime is ISO string — convert to readable time "06:32 AM"
  const checkInTime: string | undefined = raw.checkInTime
    ? new Date(raw.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : undefined;

  const checkOutTime: string | undefined = raw.checkOutTime
    ? new Date(raw.checkOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : undefined;

  return {
    checkedIn,
    checkInTime,
    // Dashboard does not return location — attendance history uses checkInRemarks
    checkInLocation: raw.checkInLocation ?? raw.checkInRemarks ?? raw.location ?? undefined,
    checkOutTime,
    workingHours: raw.workingHours ?? undefined,
  };
}

function normalizeAttendanceRecord(raw: any): AttendanceRecord {
  // Attendance API fields: checkInTime (ISO), checkOutTime (ISO|null), checkInRemarks, date (ISO)

  const checkInTime: string | undefined = raw.checkInTime
    ? new Date(raw.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })
    : undefined;

  const checkOutTime: string | undefined = raw.checkOutTime
    ? new Date(raw.checkOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })
    : undefined;

  // Calculate working hours from timestamps
  let workingHours: string | undefined = raw.workingHours ?? undefined;
  if (!workingHours && raw.checkInTime && raw.checkOutTime) {
    const diffMs = new Date(raw.checkOutTime).getTime() - new Date(raw.checkInTime).getTime();
    const totalMins = Math.floor(diffMs / 60000);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    workingHours = `${h}h ${String(m).padStart(2, "0")}m`;
  }

  // Derive status from check-in time (after 09:30 IST = LATE, no checkIn = ABSENT)
  let status: "PRESENT" | "ABSENT" | "HALF_DAY" | "LATE" = "PRESENT";
  if (!raw.checkInTime) {
    status = "ABSENT";
  } else {
    // Formatter to extract local hour/minute in IST
    const formatter = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: false,
      timeZone: "Asia/Kolkata",
    });
    const formattedParts = formatter.formatToParts(new Date(raw.checkInTime));
    const hourPart = formattedParts.find((p) => p.type === "hour")?.value;
    const minPart = formattedParts.find((p) => p.type === "minute")?.value;
    const hour = hourPart ? parseInt(hourPart, 10) : 0;
    const min = minPart ? parseInt(minPart, 10) : 0;

    if (hour > 9 || (hour === 9 && min > 30)) status = "LATE";
  }

  // extract date part in local timezone
  // extract date part in local timezone from actual check-in time or createdAt to avoid UTC date-only offsets
  let dateStr = "";
  const baseDate = raw.checkInTime || raw.createdAt || raw.date;
  if (baseDate) {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Kolkata",
    });
    dateStr = formatter.format(new Date(baseDate));
  }

  return {
    id:           raw.id ?? "",
    date:         dateStr,
    checkInTime,
    checkOutTime,
    workingHours,
    location:     raw.checkInRemarks ?? raw.location ?? raw.checkInLocation ?? undefined,
    status,
  };
}

const BASE = "/mobile/technician";

export class JobService {
  // ==========================================
  // TECHNICIAN — TICKETS
  // ==========================================

  /**
   * GET /mobile/technician/tickets
   * Returns all tickets assigned to the logged-in technician.
   */
  static async getTechnicianJobs(): Promise<Ticket[]> {
    const res = await apiClient.get<Ticket[]>(`${BASE}/tickets`);
    return res.data;
  }

  /**
   * GET /mobile/technician/tickets/:ticketNo
   */
  static async getJobDetails(ticketNo: string): Promise<Ticket | null> {
    try {
      const res = await apiClient.get<Ticket>(`${BASE}/tickets/${ticketNo}`);
      return res.data;
    } catch {
      return null;
    }
  }

  /**
   * PATCH /mobile/technician/tickets/:ticketNo/status
   * Body: { status }
   */
  static async updateJobStatus(ticketNo: string, status: TicketStatus): Promise<Ticket> {
    const res = await apiClient.patch<Ticket>(`${BASE}/tickets/${ticketNo}/status`, { status });
    return res.data;
  }

  /**
   * POST /mobile/technician/tickets/:ticketNo/reject
   * Body: { reason }
   */
  static async rejectJob(ticketNo: string, reason: string): Promise<{ ticketNo: string }> {
    const res = await apiClient.post<{ ticketNo: string }>(`${BASE}/tickets/${ticketNo}/reject`, {
      reason,
    });
    return res.data;
  }

  /**
   * POST /mobile/technician/tickets/:ticketNo/images
   * Uploads a single image (multipart/form-data).
   * type: "BEFORE" | "AFTER"
   */
  static async uploadTicketImage(
    ticketNo: string,
    imageUri: string,
    type: "BEFORE" | "AFTER"
  ): Promise<{ url: string }> {
    const formData = new FormData();
    const filename = imageUri.split("/").pop() ?? "photo.jpg";
    const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
    const mimeType = ext === "png" ? "image/png" : "image/jpeg";

    formData.append("image", {
      uri: imageUri,
      name: filename,
      type: mimeType,
    } as any);
    formData.append("type", type);

    const res = await apiClient.post<{ url: string }>(
      `${BASE}/tickets/${ticketNo}/images`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data;
  }

  /**
   * Uploads all before photos and marks the job as IN_PROGRESS.
   * POST /mobile/technician/tickets/:ticketNo/images  (repeated per photo)
   * PATCH /mobile/technician/tickets/:ticketNo/status { status: "IN_PROGRESS" }
   */
  static async saveBeforePhotos(ticketNo: string, photos: string[]): Promise<Ticket> {
    // Upload each photo sequentially
    for (const uri of photos) {
      await JobService.uploadTicketImage(ticketNo, uri, "BEFORE");
    }
    // Transition status
    return JobService.updateJobStatus(ticketNo, "IN_PROGRESS");
  }

  /**
   * POST /mobile/technician/tickets/:ticketNo/complete
   */
  static async completeJob(
    ticketNo: string,
    payload: {
      beforePhotos: string[];
      afterPhotos: string[];
      customerSignature: string;
      workNotes: string;
      duration: string;
      paymentCollection?: number;
      paymentMethod?: string;
    }
  ): Promise<Ticket> {
    const res = await apiClient.post<Ticket>(`${BASE}/tickets/${ticketNo}/complete`, payload);
    return res.data;
  }

  /**
   * POST /mobile/technician/tickets/:ticketNo/pending
   */
  static async markJobPending(
    ticketNo: string,
    pendingReason: string,
    notes?: string,
    photos?: string[]
  ): Promise<Ticket> {
    const res = await apiClient.post<Ticket>(`${BASE}/tickets/${ticketNo}/pending`, {
      pendingReason,
      notes,
      photos,
    });
    return res.data;
  }

  /**
   * POST /mobile/technician/tickets/:ticketNo/collect-payment
   */
  static async collectPayment(
    ticketNo: string,
    payload: { amount: number; paymentMethod: string }
  ): Promise<{ invoiceNo: string; ticketNo: string; amount: number }> {
    const res = await apiClient.post<{ invoiceNo: string; ticketNo: string; amount: number }>(
      `${BASE}/tickets/${ticketNo}/collect-payment`,
      payload
    );
    return res.data;
  }

  /**
   * PATCH /mobile/technician/tickets/:ticketNo/reschedule
   */
  static async rescheduleJob(ticketNo: string, nextVisitDate: string): Promise<Ticket> {
    const res = await apiClient.patch<Ticket>(`${BASE}/tickets/${ticketNo}/reschedule`, {
      nextVisitDate,
    });
    return res.data;
  }

  // ==========================================
  // ATTENDANCE
  // ==========================================

  /**
   * GET /mobile/technician/attendance/today
   */
  static async getAttendanceStatus(): Promise<AttendanceLog> {
    const response = await apiClient.get<{
      success: boolean;
      data: {
        isCheckedIn: boolean;
        checkInTime: string | null;
        checkOutTime: string | null;
      };
    }>("/mobile/technician/dashboard");

    console.log("Technician dashboard attendance response:", response.data);
    console.log("DASHBOARD ATTENDANCE DATA:", response.data.data);

    const dashboard = response.data.data;
    const hasCheckedIn = !!dashboard.checkInTime;
    const hasCheckedOut = !!dashboard.checkOutTime;

    let workingHours: string | undefined = undefined;
    if (dashboard.checkInTime && dashboard.checkOutTime) {
      const diffMs = new Date(dashboard.checkOutTime).getTime() - new Date(dashboard.checkInTime).getTime();
      const totalMins = Math.floor(diffMs / 60000);
      const h = Math.floor(totalMins / 60);
      const m = totalMins % 60;
      workingHours = `${h}h ${String(m).padStart(2, "0")}m`;
    }

    return {
      checkedIn: dashboard.isCheckedIn === true && !hasCheckedOut,
      checkInTime: dashboard.checkInTime
        ? new Date(dashboard.checkInTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Kolkata",
          })
        : undefined,
      checkOutTime: dashboard.checkOutTime
        ? new Date(dashboard.checkOutTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Kolkata",
          })
        : undefined,
      checkInLocation: "Main Office HQ, Sector 62",
      shiftCompleted: hasCheckedIn && hasCheckedOut,
      rawCheckInTime: dashboard.checkInTime ?? undefined,
      workingHours,
    };
  }

  /**
   * GET /mobile/technician/attendance?month=&year=
   */
  static async getAttendanceHistory(
    month?: number,
    year?: number
  ): Promise<AttendanceRecord[]> {
    const params: Record<string, number> = {};
    if (month !== undefined) params.month = month;
    if (year !== undefined) params.year = year;
    const res = await apiClient.get<{ success: boolean; data: any[] }>(`${BASE}/attendance`, { params });
    const rawList = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
    return rawList.map(normalizeAttendanceRecord);
  }

  /**
   * POST /mobile/technician/attendance/checkin
   */
  static async checkIn(
    location: string,
    latitude?: number,
    longitude?: number
  ): Promise<AttendanceLog> {
    console.log("CHECK IN API CALLED ONLY BY BUTTON");
    const res = await apiClient.post<AttendanceLog>(`${BASE}/attendance/checkin`, {
      lat: latitude ?? 28.6139,
      lng: longitude ?? 77.2090,
      remarks: location,
    });
    return res.data;
  }

  /**
   * POST /mobile/technician/attendance/checkout
   */
  static async checkOut(latitude?: number, longitude?: number): Promise<AttendanceLog> {
    console.log("CHECK OUT API CALLED ONLY BY BUTTON");
    const res = await apiClient.post<AttendanceLog>(`${BASE}/attendance/checkout`, {
      lat: latitude ?? 28.6139,
      lng: longitude ?? 77.2090,
    });
    return res.data;
  }

  // ==========================================
  // CUSTOMER FLOWS
  // ==========================================

  /**
   * GET /mobile/customer/tickets?mobile=
   */
  static async getCustomerTickets(mobile: string): Promise<Ticket[]> {
    const res = await apiClient.get<Ticket[]>("/mobile/customer/tickets", {
      params: { mobile },
    });
    return res.data;
  }

  /**
   * POST /mobile/customer/tickets
   */
  static async raiseTicket(payload: {
    customerName: string;
    customerMobile: string;
    category: string;
    subCategory: string;
    description: string;
    address: string;
    images?: string[];
  }): Promise<Ticket> {
    const res = await apiClient.post<Ticket>("/mobile/customer/tickets", payload);
    return res.data;
  }

  /**
   * GET /mobile/customer/invoices?mobile=
   */
  static async getCustomerInvoices(mobile: string): Promise<Invoice[]> {
    const res = await apiClient.get<Invoice[]>("/mobile/customer/invoices", {
      params: { mobile },
    });
    return res.data;
  }
}

export default JobService;
