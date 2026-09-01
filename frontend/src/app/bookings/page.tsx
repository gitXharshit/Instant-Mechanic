'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, SlidersHorizontal, Download, ChevronUp, ChevronDown,
  ChevronsUpDown, ChevronLeft, ChevronRight, RefreshCw, Plus,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { BookingStatusBadge } from '@/components/dashboard/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchBookings, getBookingExportUrl, updateBookingStatus } from '@/lib/api';
import { formatCurrency, formatDateTime, SERVICE_LABELS } from '@/lib/utils';
import { useSocket } from '@/hooks/useSocket';
import type { Booking, BookingStatus, BookingFilters, ServiceCategory } from '@/types';
import { BookingDetailModal } from '@/components/bookings/BookingDetailModal';

const STATUS_OPTIONS: { value: BookingStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'ON_THE_WAY', label: 'On The Way' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const SERVICE_OPTIONS = [
  { value: '' as const, label: 'All Services' },
  ...Object.entries(SERVICE_LABELS).map(([value, label]) => ({
    value: value as ServiceCategory,
    label,
  })),
];

type SortField = 'createdAt' | 'scheduledAt' | 'amount' | 'status';

function SortIcon({
  field,
  current,
  order,
}: {
  field: SortField;
  current: SortField;
  order: 'asc' | 'desc';
}) {
  if (field !== current) return <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />;
  return order === 'asc' ? (
    <ChevronUp className="h-3.5 w-3.5 text-primary" />
  ) : (
    <ChevronDown className="h-3.5 w-3.5 text-primary" />
  );
}

function TableRowSkeleton() {
  return (
    <tr className="border-b">
      {Array.from({ length: 9 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const [filters, setFilters] = useState<BookingFilters>({
    page: 1,
    limit: 15,
    search: '',
    status: '',
    service: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  const load = useCallback(async (f: BookingFilters, silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetchBookings(f);
      setBookings(res.data);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(filters);
  }, [filters, load]);

  // Live update: update in-place or prepend new booking
  useSocket({
    'booking:updated': (updated) => {
      setBookings((prev) =>
        prev.map((b) => (b.id === updated.id ? updated : b))
      );
      if (selectedBooking?.id === updated.id) setSelectedBooking(updated);
    },
    'booking:new': () => {
      load(filters, true);
    },
    'dashboard:refresh': () => {
      load(filters, true);
    },
  });

  const setFilter = <K extends keyof BookingFilters>(key: K, value: BookingFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: key !== 'page' ? 1 : (value as number) }));
  };

  const handleSearch = (value: string) => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setFilter('search', value), 350);
  };

  const handleSort = (field: SortField) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'desc' ? 'asc' : 'desc',
      page: 1,
    }));
  };

  const handleStatusChange = async (
    bookingId: string,
    newStatus: BookingStatus
  ) => {
    await updateBookingStatus(bookingId, newStatus);
    load(filters, true);
  };

  const SortTh = ({
    field,
    children,
    className = '',
  }: {
    field: SortField;
    children: React.ReactNode;
    className?: string;
  }) => (
    <th
      className={`px-4 py-3 text-left text-xs font-medium text-muted-foreground cursor-pointer select-none whitespace-nowrap hover:text-foreground transition-colors ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <SortIcon
          field={field}
          current={filters.sortBy as SortField}
          order={filters.sortOrder ?? 'desc'}
        />
      </div>
    </th>
  );

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Bookings"
        subtitle={`${total.toLocaleString()} total bookings`}
        onRefresh={() => load(filters, true)}
        refreshing={refreshing}
      />

      <div className="flex-1 p-6 space-y-4 overflow-auto">
        {/* Filters toolbar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bookings, customers, vehicles…"
                  className="pl-9"
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>

              {/* Status filter */}
              <Select
                value={filters.status ?? ''}
                onValueChange={(v) => setFilter('status', v as BookingStatus | '')}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value || '__all__'}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Service filter */}
              <Select
                value={filters.service ?? ''}
                onValueChange={(v) => setFilter('service', v as ServiceCategory | '')}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Service" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value || '__all__'}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date range */}
              <Input
                type="date"
                className="w-36"
                onChange={(e) => setFilter('startDate', e.target.value)}
                title="Start date"
              />
              <Input
                type="date"
                className="w-36"
                onChange={(e) => setFilter('endDate', e.target.value)}
                title="End date"
              />

              <div className="ml-auto flex items-center gap-2">
                {/* Rows per page */}
                <Select
                  value={String(filters.limit)}
                  onValueChange={(v) => setFilter('limit', parseInt(v))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 15, 25, 50].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Export CSV */}
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a
                    href={getBookingExportUrl({ status: filters.status, startDate: filters.startDate })}
                    download="bookings.csv"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Export
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                    Booking ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Vehicle
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Service
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Mechanic
                  </th>
                  <SortTh field="status">Status</SortTh>
                  <SortTh field="amount">Amount</SortTh>
                  <SortTh field="scheduledAt">Scheduled</SortTh>
                  <SortTh field="createdAt">Created</SortTh>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading
                  ? Array.from({ length: filters.limit ?? 15 }).map((_, i) => (
                      <TableRowSkeleton key={i} />
                    ))
                  : bookings.length === 0
                  ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="h-8 w-8 text-muted-foreground/40" />
                          <p className="text-sm text-muted-foreground">No bookings found</p>
                          <p className="text-xs text-muted-foreground">
                            Try adjusting your filters
                          </p>
                        </div>
                      </td>
                    </tr>
                  )
                  : bookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => setSelectedBooking(booking)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-primary font-medium">
                          {booking.bookingNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-xs whitespace-nowrap">
                            {booking.customer?.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {booking.customer?.phone}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-xs whitespace-nowrap font-medium">
                            {booking.vehicleYear} {booking.vehicleMake} {booking.vehicleModel}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {booking.vehiclePlate}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs whitespace-nowrap">
                          {SERVICE_LABELS[booking.service]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          {booking.mechanic?.name ?? (
                            <span className="italic">Unassigned</span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <BookingStatusBadge status={booking.status} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium tabular-nums">
                          {formatCurrency(booking.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                        {formatDateTime(booking.scheduledAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                        {formatDateTime(booking.createdAt)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && bookings.length > 0 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Showing{' '}
                <span className="font-medium text-foreground">
                  {((filters.page ?? 1) - 1) * (filters.limit ?? 15) + 1}–
                  {Math.min((filters.page ?? 1) * (filters.limit ?? 15), total)}
                </span>{' '}
                of <span className="font-medium text-foreground">{total.toLocaleString()}</span>
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(filters.page ?? 1) <= 1}
                  onClick={() => setFilter('page', (filters.page ?? 1) - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = Math.max(
                    1,
                    Math.min(
                      totalPages - 4,
                      (filters.page ?? 1) - 2
                    )
                  ) + i;
                  return page <= totalPages ? (
                    <Button
                      key={page}
                      variant={page === filters.page ? 'default' : 'outline'}
                      size="sm"
                      className="w-8"
                      onClick={() => setFilter('page', page)}
                    >
                      {page}
                    </Button>
                  ) : null;
                })}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(filters.page ?? 1) >= totalPages}
                  onClick={() => setFilter('page', (filters.page ?? 1) + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Booking detail modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
