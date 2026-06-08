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

export interface Ticket {
  ticketNo: string;
  customerName: string;
  customerMobile: string;
  service: string;
  description: string;
  status: TicketStatus;
  scheduledDate: string;
  scheduledTime: string;
  address: string;
  technicianName?: string;
  technicianMobile?: string;
  notes?: string;
  
  // Completion Flow Fields
  beforePhotos?: string[];
  afterPhotos?: string[];
  customerSignature?: string;
  workNotes?: string;
  duration?: string;
  paymentCollection?: number;
  paymentMethod?: string;
  nextVisitDate?: string;
  pendingReason?: string;
  
  // Customer-raised ticket fields
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
}

// 1. Mock Technician Profile
export const MOCK_TECHNICIAN = {
  id: 1,
  name: "John Technician",
  mobile: "9876543210",
  role: "TECHNICIAN" as const,
  email: "john.tech@fieldeaze.com",
};

// 2. Mock Customer Profile
export const MOCK_CUSTOMER = {
  id: 101,
  name: "Raj Kumar",
  mobile: "9876543210",
  role: "CUSTOMER" as const,
};

// 3. Centralized Mock Ticket Database
export let MOCK_TICKETS: Ticket[] = [];

// 4. Centralized Mock Invoice Database
export let MOCK_INVOICES: Invoice[] = [];

// 5. Centralized Attendance State
export let MOCK_ATTENDANCE: AttendanceLog = {
  checkedIn: false,
};

/**
 * Utility to map internal ticket status to Customer-Facing status names
 */
export const mapToCustomerStatus = (status: TicketStatus): string => {
  switch (status) {
    case "NEW":
      return "NEW";
    case "ASSIGNED":
      return "ASSIGNED";
    case "ACCEPTED":
      return "TECHNICIAN ASSIGNED";
    case "TRAVELLING":
    case "REACHED":
      return "TECHNICIAN EN ROUTE";
    case "IN_PROGRESS":
      return "WORK IN PROGRESS";
    case "PENDING":
      return "PENDING";
    case "RESCHEDULED":
      return "RESCHEDULED";
    case "COMPLETED":
      return "COMPLETED";
    case "CLOSED":
      return "CLOSED";
    default:
      return status;
  }
};
