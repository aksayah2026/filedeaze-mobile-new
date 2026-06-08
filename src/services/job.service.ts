import {
  MOCK_TICKETS,
  MOCK_INVOICES,
  MOCK_ATTENDANCE,
  Ticket,
  TicketStatus,
  Invoice,
  AttendanceLog,
} from "../mock/data";

export class JobService {
  // ==========================================
  // TECHNICIAN SERVICE FLOWS
  // ==========================================

  /**
   * Get all work orders for the logged-in technician
   */
  static async getTechnicianJobs(): Promise<Ticket[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...MOCK_TICKETS]);
      }, 800);
    });
  }

  /**
   * Get details for a specific ticket
   */
  static async getJobDetails(ticketNo: string): Promise<Ticket | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const found = MOCK_TICKETS.find((t) => t.ticketNo === ticketNo) || null;
        resolve(found);
      }, 500);
    });
  }

  /**
   * Update the status of a ticket
   */
  static async updateJobStatus(ticketNo: string, status: TicketStatus): Promise<Ticket> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = MOCK_TICKETS.findIndex((t) => t.ticketNo === ticketNo);
        if (index === -1) {
          reject(new Error("Ticket not found"));
          return;
        }

        MOCK_TICKETS[index].status = status;
        resolve({ ...MOCK_TICKETS[index] });
      }, 600);
    });
  }

  /**
   * Complete a job with full closure criteria
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
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = MOCK_TICKETS.findIndex((t) => t.ticketNo === ticketNo);
        if (index === -1) {
          reject(new Error("Ticket not found"));
          return;
        }

        const ticket = MOCK_TICKETS[index];
        ticket.status = "COMPLETED";
        ticket.beforePhotos = payload.beforePhotos;
        ticket.afterPhotos = payload.afterPhotos;
        ticket.customerSignature = payload.customerSignature;
        ticket.workNotes = payload.workNotes;
        ticket.duration = payload.duration;
        ticket.paymentCollection = payload.paymentCollection;
        ticket.paymentMethod = payload.paymentMethod;

        // Generate Invoice
        if (payload.paymentCollection && payload.paymentCollection > 0) {
          const baseAmount = Math.round(payload.paymentCollection / 1.18);
          const gstAmount = payload.paymentCollection - baseAmount;
          
          const newInvoice: Invoice = {
            invoiceNo: `INV-2026-${MOCK_INVOICES.length + 101}`,
            ticketNo: ticketNo,
            amount: baseAmount,
            gst: gstAmount,
            total: payload.paymentCollection,
            paymentStatus: "PAID",
          };
          MOCK_INVOICES.push(newInvoice);
        }

        resolve({ ...ticket });
      }, 1000);
    });
  }

  /**
   * Reschedule a job with a new scheduled date
   */
  static async rescheduleJob(ticketNo: string, nextVisitDate: string): Promise<Ticket> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = MOCK_TICKETS.findIndex((t) => t.ticketNo === ticketNo);
        if (index === -1) {
          reject(new Error("Ticket not found"));
          return;
        }

        MOCK_TICKETS[index].status = "RESCHEDULED";
        MOCK_TICKETS[index].nextVisitDate = nextVisitDate;
        MOCK_TICKETS[index].scheduledDate = nextVisitDate;
        resolve({ ...MOCK_TICKETS[index] });
      }, 700);
    });
  }

  /**
   * Mark a job as pending with reason
   */
  static async markJobPending(ticketNo: string, pendingReason: string): Promise<Ticket> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = MOCK_TICKETS.findIndex((t) => t.ticketNo === ticketNo);
        if (index === -1) {
          reject(new Error("Ticket not found"));
          return;
        }

        MOCK_TICKETS[index].status = "PENDING";
        MOCK_TICKETS[index].pendingReason = pendingReason;
        resolve({ ...MOCK_TICKETS[index] });
      }, 700);
    });
  }

  // ==========================================
  // ATTENDANCE SERVICE FLOWS
  // ==========================================

  /**
   * Fetch current check-in/out status
   */
  static async getAttendanceStatus(): Promise<AttendanceLog> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ ...MOCK_ATTENDANCE });
      }, 400);
    });
  }

  /**
   * Check in the technician
   */
  static async checkIn(location: string): Promise<AttendanceLog> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const checkInTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        MOCK_ATTENDANCE.checkedIn = true;
        MOCK_ATTENDANCE.checkInTime = checkInTime;
        MOCK_ATTENDANCE.checkInLocation = location;
        MOCK_ATTENDANCE.checkOutTime = undefined;
        MOCK_ATTENDANCE.workingHours = undefined;
        resolve({ ...MOCK_ATTENDANCE });
      }, 800);
    });
  }

  /**
   * Check out the technician
   */
  static async checkOut(): Promise<AttendanceLog> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!MOCK_ATTENDANCE.checkedIn) {
          reject(new Error("Not checked in yet."));
          return;
        }

        const checkOutTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        MOCK_ATTENDANCE.checkedIn = false;
        MOCK_ATTENDANCE.checkOutTime = checkOutTime;
        MOCK_ATTENDANCE.workingHours = "8 Hours 15 Mins"; // Mock calculated duration
        resolve({ ...MOCK_ATTENDANCE });
      }, 800);
    });
  }

  // ==========================================
  // CUSTOMER SERVICE FLOWS
  // ==========================================

  /**
   * Get tickets raised by a customer (e.g. Raj Kumar)
   */
  static async getCustomerTickets(mobile: string): Promise<Ticket[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const tickets = MOCK_TICKETS.filter((t) => t.customerMobile === mobile);
        resolve(tickets);
      }, 700);
    });
  }

  /**
   * Raise a new customer service request
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
    return new Promise((resolve) => {
      setTimeout(() => {
        const ticketNo = `FE-2026-${String(MOCK_TICKETS.length + 1).padStart(3, "0")}`;
        const newTicket: Ticket = {
          ticketNo,
          customerName: payload.customerName,
          customerMobile: payload.customerMobile,
          service: `${payload.category} - ${payload.subCategory}`,
          description: payload.description,
          status: "NEW",
          scheduledDate: new Date(Date.now() + 86400000).toISOString().split("T")[0], // Tomorrow
          scheduledTime: "10:00 AM - 12:00 PM",
          address: payload.address,
          category: payload.category,
          subCategory: payload.subCategory,
          images: payload.images || [],
        };

        MOCK_TICKETS.push(newTicket);
        resolve(newTicket);
      }, 1000);
    });
  }

  /**
   * Get invoices for a customer
   */
  static async getCustomerInvoices(mobile: string): Promise<Invoice[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const customerTickets = MOCK_TICKETS.filter((t) => t.customerMobile === mobile).map((t) => t.ticketNo);
        const invoices = MOCK_INVOICES.filter((inv) => customerTickets.includes(inv.ticketNo));
        resolve(invoices);
      }, 600);
    });
  }
}
export default JobService;
