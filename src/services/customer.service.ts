import { apiClient } from "../api/client";

export interface Address {
  id: string;
  label: string;
  addressText: string;
  lat: number;
  lng: number;
  isActive: boolean;
}

export interface CustomerDashboardData {
  openTickets: number;
  completedTickets: number;
  recentInvoice: {
    id: string;
    invoiceNumber: string;
    total: number;
    generatedAt: string;
    pdfUrl: string | null;
    ticket: {
      ticketNumber: string;
      subCategory: {
        name: string;
        category: {
          name: string;
        };
      };
    };
  } | null;
}

export interface CustomerProfileData {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  alternatePhone: string | null;
  address: string | null;
  city: string | null;
  pincode: string | null;
  _count?: {
    tickets: number;
    feedback: number;
  };
}

export interface TicketLog {
  id: string;
  status: string;
  changedAt: string;
  changedBy: string;
  notes: string | null;
}

export interface CustomerTicketDetail {
  id: string;
  ticketNumber: string;
  description: string;
  serviceAddress: string | null;
  priority: string;
  status: string;
  scheduledAt: string | null;
  createdAt: string;
  technician: {
    id: string;
    name: string;
    phone: string;
    currentLat: number | null;
    currentLng: number | null;
    rating: number | null;
  } | null;
  subCategory: {
    id: string;
    name: string;
    category: {
      id: string;
      name: string;
    };
    serviceCharges?: {
      id: string;
      amount: number;
    }[];
  };
  images: {
    id: string;
    imageUrl: string;
    type: string;
  }[];
  statusLogs: TicketLog[];
  payment?: {
    id: string;
    status: string;
    amount: number;
    method: string;
  } | null;
  invoice?: {
    id: string;
    invoiceNumber: string;
    total: number;
    pdfUrl: string | null;
  } | null;
  feedback?: {
    id: string;
    rating: number;
    review: string;
  } | null;
}

export interface CustomerPayment {
  id: string;
  createdAt: string;
  amount: number;
  method: string;
  status: string;
  ticket: {
    description: string;
    subCategory: {
      name: string;
      category: {
        name: string;
      };
    };
  };
  invoice: {
    invoiceNumber: string;
    total: number;
  };
}

export interface CustomerFeedback {
  id: string;
  rating: number;
  review: string;
  createdAt: string;
  ticket: {
    ticketNumber: string;
    subCategory: {
      name: string;
      category: {
        name: string;
      };
    };
  };
}

export interface CustomerInvoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  gst: number;
  total: number;
  generatedAt: string;
  pdfUrl: string | null;
  ticket: {
    ticketNumber: string;
    description: string;
    priority: string;
    subCategory: {
      name: string;
      category: {
        name: string;
      };
    };
  };
  payment: {
    method: string;
    collectedAt: string;
    status: string;
  } | null;
}

export const CustomerService = {
  getDashboard: (): Promise<CustomerDashboardData> =>
    apiClient.get("/mobile/customer/dashboard").then((r) => r.data.data),

  getProfile: (): Promise<CustomerProfileData> =>
    apiClient.get("/mobile/customer/profile").then((r) => r.data.data),

  updateProfile: (payload: Partial<CustomerProfileData>): Promise<CustomerProfileData> =>
    apiClient.patch("/mobile/customer/profile", payload).then((r) => r.data.data),

  raiseTicket: (formData: FormData): Promise<any> =>
    apiClient
      .post("/mobile/customer/tickets", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.data),

  getTickets: (status?: string): Promise<CustomerTicketDetail[]> =>
    apiClient
      .get("/mobile/customer/tickets", { params: { status } })
      .then((r) => r.data.data),

  getTicketDetails: (id: string): Promise<CustomerTicketDetail> =>
    apiClient.get(`/mobile/customer/tickets/${id}`).then((r) => r.data.data),

  cancelTicket: (id: string, reason: string): Promise<any> =>
    apiClient
      .patch(`/mobile/customer/tickets/${id}/cancel`, { reason })
      .then((r) => r.data.data),

  trackTicket: (id: string): Promise<{
    ticketId: string;
    status: string;
    technician: {
      id: string;
      name: string;
      phone: string;
      currentLat: number | null;
      currentLng: number | null;
      rating: number | null;
    } | null;
    statusHistory: TicketLog[];
  }> => apiClient.get(`/mobile/customer/tickets/${id}/track`).then((r) => r.data.data),

  getPayments: (): Promise<CustomerPayment[]> =>
    apiClient.get("/mobile/customer/payments").then((r) => r.data.data),

  getFeedbackList: (): Promise<CustomerFeedback[]> =>
    apiClient.get("/mobile/customer/feedback").then((r) => r.data.data),

  submitFeedback: (payload: { ticketId: string; rating: number; review: string }): Promise<any> =>
    apiClient.post("/mobile/customer/feedback", payload).then((r) => r.data.data),

  getInvoices: (): Promise<CustomerInvoice[]> =>
    apiClient.get("/mobile/customer/invoices").then((r) => r.data.data),

  getInvoiceDetails: (id: string): Promise<{
    invoice: CustomerInvoice;
    tenant: {
      companyName: string;
      email: string;
      phone: string;
      address: string;
      city: string;
      state: string;
      logoUrl: string | null;
    };
    settings?: any;
  }> => apiClient.get(`/mobile/customer/invoices/${id}`).then((r) => r.data.data),

  getAddresses: (): Promise<Address[]> =>
    apiClient.get("/mobile/customer/addresses").then((r) => r.data.data),

  getCategories: (): Promise<any[]> =>
    apiClient.get("/web/manager/service-categories").then((r) => r.data.data),

  getCategoryDetails: (id: string): Promise<any> =>
    apiClient.get(`/web/manager/service-sub-categories?categoryId=${id}`).then((r) => r.data.data),

  addAddress: (payload: { label: string; addressText: string; lat: number; lng: number }): Promise<Address> =>
    apiClient.post("/mobile/customer/addresses", payload).then((r) => r.data.data),

  updateAddress: (id: string, payload: { label?: string; addressText?: string; lat?: number; lng?: number }): Promise<Address> =>
    apiClient.patch(`/mobile/customer/addresses/${id}`, payload).then((r) => r.data.data),

  deleteAddress: (id: string): Promise<any> =>
    apiClient.delete(`/mobile/customer/addresses/${id}`).then((r) => r.data.data),
};
