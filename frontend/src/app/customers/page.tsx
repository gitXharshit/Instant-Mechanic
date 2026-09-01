'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Mail, Phone, MapPin, ChevronLeft, ChevronRight, ShoppingBag, PoundSterling } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { fetchCustomers } from '@/lib/api';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';
import type { Customer, CustomerFilters } from '@/types';

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-orange-500',
];

function CustomerRow({ customer }: { customer: Customer }) {
  const colorClass = AVATAR_COLORS[customer.name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <tr className="border-b hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className={`${colorClass} text-white text-xs font-semibold`}>
              {getInitials(customer.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{customer.name}</p>
            <p className="text-xs text-muted-foreground">
              Since {formatDate(customer.createdAt)}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Mail className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate max-w-[180px]">{customer.email}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Phone className="h-3.5 w-3.5 shrink-0" />
          <span>{customer.phone}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span>{customer.city}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 text-xs">
          <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">{customer.totalBookings ?? 0}</span>
          <span className="text-muted-foreground">bookings</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <PoundSterling className="h-3.5 w-3.5" />
          {(customer.totalSpend ?? 0).toFixed(0)}
        </div>
      </td>
    </tr>
  );
}

function RowSkeleton() {
  return (
    <tr className="border-b">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [filters, setFilters] = useState<CustomerFilters>({
    page: 1, limit: 20, search: '', sortBy: 'createdAt', sortOrder: 'desc',
  });

  const load = useCallback(async (f: CustomerFilters, silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const res = await fetchCustomers(f);
      setCustomers(res.data);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(filters); }, [filters, load]);

  const setFilter = <K extends keyof CustomerFilters>(key: K, value: CustomerFilters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value, page: key !== 'page' ? 1 : (value as number) }));

  const totalSpend = customers.reduce((s, c) => s + (c.totalSpend ?? 0), 0);

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Customers"
        subtitle={`${total} registered customers`}
        onRefresh={() => load(filters, true)}
        refreshing={refreshing}
      />

      <div className="flex-1 p-6 space-y-4 overflow-auto">
        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-blue-50 dark:bg-blue-950/40 border-0">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {loading ? '—' : total}
              </p>
              <p className="text-xs text-muted-foreground">Total Customers</p>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50 dark:bg-emerald-950/40 border-0">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {loading ? '—' : formatCurrency(totalSpend)}
              </p>
              <p className="text-xs text-muted-foreground">Revenue (this page)</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers, email, city…"
              className="pl-9"
              onChange={(e) => {
                const val = e.target.value;
                setTimeout(() => setFilter('search', val), 300);
              }}
            />
          </div>
          <Select
            value={`${filters.sortBy}_${filters.sortOrder}`}
            onValueChange={(v) => {
              const [sortBy, sortOrder] = v.split('_') as [string, 'asc' | 'desc'];
              setFilters((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }));
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt_desc">Newest first</SelectItem>
              <SelectItem value="createdAt_asc">Oldest first</SelectItem>
              <SelectItem value="name_asc">Name A–Z</SelectItem>
              <SelectItem value="name_desc">Name Z–A</SelectItem>
              <SelectItem value="city_asc">City A–Z</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={String(filters.limit)}
            onValueChange={(v) => setFilter('limit', parseInt(v))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50].map((n) => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  {['Customer', 'Email', 'Phone', 'City', 'Bookings', 'Total Spend'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading
                  ? Array.from({ length: filters.limit ?? 20 }).map((_, i) => <RowSkeleton key={i} />)
                  : customers.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <p className="text-sm text-muted-foreground">No customers found</p>
                      </td>
                    </tr>
                  )
                  : customers.map((c) => <CustomerRow key={c.id} customer={c} />)
                }
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && customers.length > 0 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Showing{' '}
                <span className="font-medium text-foreground">
                  {((filters.page ?? 1) - 1) * (filters.limit ?? 20) + 1}–
                  {Math.min((filters.page ?? 1) * (filters.limit ?? 20), total)}
                </span>{' '}
                of <span className="font-medium text-foreground">{total}</span>
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline" size="sm"
                  disabled={(filters.page ?? 1) <= 1}
                  onClick={() => setFilter('page', (filters.page ?? 1) - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 text-xs text-muted-foreground">
                  {filters.page} / {totalPages}
                </span>
                <Button
                  variant="outline" size="sm"
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
    </div>
  );
}
