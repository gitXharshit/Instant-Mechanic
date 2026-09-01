export type BookingStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'ON_THE_WAY'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type MechanicStatus = 'AVAILABLE' | 'BUSY' | 'OFF_DUTY';

export type ServiceCategory =
  | 'OIL_CHANGE'
  | 'BRAKE_SERVICE'
  | 'TYRE_SERVICE'
  | 'BATTERY_SERVICE'
  | 'ENGINE_DIAGNOSTIC'
  | 'AC_SERVICE'
  | 'FULL_SERVICE'
  | 'ELECTRICAL'
  | 'SUSPENSION'
  | 'TRANSMISSION'
  | 'DETAILING'
  | 'ROADSIDE_ASSISTANCE';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city: string;
  createdAt: string;
  totalBookings?: number;
  totalSpend?: number;
}

export interface Mechanic {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: ServiceCategory[];
  status: MechanicStatus;
  rating: number;
  jobsCompleted: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  joinedAt: string;
  updatedAt: string;
  currentBooking?: Booking | null;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  customer: Pick<Customer, 'id' | 'name' | 'email' | 'phone'>;
  customerId: string;
  mechanic?: Pick<Mechanic, 'id' | 'name' | 'phone' | 'status'> | null;
  mechanicId?: string | null;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehiclePlate: string;
  service: ServiceCategory;
  serviceDetails?: string;
  status: BookingStatus;
  amount: number;
  scheduledAt: string;
  completedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardOverview {
  totalBookings: number;
  todayBookings: number;
  completedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  activeMechanics: number;
  newCustomers: number;
}

export interface DashboardCharts {
  bookingsByStatus: { status: BookingStatus; count: number }[];
  bookingsByService: { service: ServiceCategory; count: number; revenue: number }[];
  bookingsOverTime: { date: string; count: number; revenue: number }[];
}

export interface DashboardData {
  overview: DashboardOverview;
  charts: DashboardCharts;
  recentBookings: Booking[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface BookingFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: BookingStatus | '';
  service?: ServiceCategory | '';
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MechanicFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: MechanicStatus | '';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CustomerFilters {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
