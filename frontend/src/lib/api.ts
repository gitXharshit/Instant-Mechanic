import type {
  ApiResponse,
  PaginatedResponse,
  DashboardData,
  Booking,
  Mechanic,
  Customer,
  BookingFilters,
  MechanicFilters,
  CustomerFilters,
  BookingStatus,
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://instant-mechanic-hq4o.onrender.com';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetcher<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(
      res.status,
      data?.error?.message || 'Request failed',
      data?.error?.code
    );
  }

  return data;
}

function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const query = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== '') {
      query.set(key, String(val));
    }
  }
  const str = query.toString();
  return str ? `?${str}` : '';
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export async function fetchDashboard(): Promise<ApiResponse<DashboardData>> {
  return fetcher<ApiResponse<DashboardData>>('/api/dashboard');
}

// ─── Bookings ────────────────────────────────────────────────────────────────

export async function fetchBookings(
  filters: BookingFilters = {}
): Promise<PaginatedResponse<Booking>> {
  return fetcher<PaginatedResponse<Booking>>(
    `/api/bookings${buildQuery(filters as Record<string, string | number | boolean | undefined | null>)}`
  );
}

export async function fetchBooking(id: string): Promise<ApiResponse<Booking>> {
  return fetcher<ApiResponse<Booking>>(`/api/bookings/${id}`);
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
  mechanicId?: string,
  notes?: string
): Promise<ApiResponse<Booking>> {
  return fetcher<ApiResponse<Booking>>(`/api/bookings/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, mechanicId, notes }),
  });
}

export function getBookingExportUrl(filters: Partial<BookingFilters> = {}): string {
  return `${API_BASE}/api/bookings/export/csv${buildQuery(
    filters as Record<string, string | number | boolean | undefined | null>
  )}`;
}

// ─── Mechanics ───────────────────────────────────────────────────────────────

export async function fetchMechanics(
  filters: MechanicFilters = {}
): Promise<PaginatedResponse<Mechanic>> {
  return fetcher<PaginatedResponse<Mechanic>>(
    `/api/mechanics${buildQuery(filters as Record<string, string | number | boolean | undefined | null>)}`
  );
}

export async function fetchMechanic(id: string): Promise<ApiResponse<Mechanic>> {
  return fetcher<ApiResponse<Mechanic>>(`/api/mechanics/${id}`);
}

// ─── Customers ───────────────────────────────────────────────────────────────

export async function fetchCustomers(
  filters: CustomerFilters = {}
): Promise<PaginatedResponse<Customer>> {
  return fetcher<PaginatedResponse<Customer>>(
    `/api/customers${buildQuery(filters as Record<string, string | number | boolean | undefined | null>)}`
  );
}

export async function fetchCustomer(id: string): Promise<ApiResponse<Customer>> {
  return fetcher<ApiResponse<Customer>>(`/api/customers/${id}`);
}

export { ApiError };
