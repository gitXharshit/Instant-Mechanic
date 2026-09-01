'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Star, Briefcase, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { MechanicStatusBadge } from '@/components/dashboard/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { fetchMechanics } from '@/lib/api';
import { getInitials, SERVICE_LABELS } from '@/lib/utils';
import { useSocket } from '@/hooks/useSocket';
import type { Mechanic, MechanicStatus, MechanicFilters } from '@/types';

const STATUS_OPTIONS: { value: MechanicStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'BUSY', label: 'Busy' },
  { value: 'OFF_DUTY', label: 'Off Duty' },
];

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500',
];

function MechanicCard({ mechanic }: { mechanic: Mechanic }) {
  const colorClass = AVATAR_COLORS[mechanic.name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <Card className="hover:shadow-md transition-shadow animate-fade-in">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarFallback className={`${colorClass} text-white text-sm font-semibold`}>
              {getInitials(mechanic.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-sm">{mechanic.name}</p>
                <p className="text-xs text-muted-foreground">{mechanic.email}</p>
              </div>
              <MechanicStatusBadge status={mechanic.status} size="sm" />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                <span className="font-medium text-foreground">{mechanic.rating.toFixed(1)}</span>
                <span>rating</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5" />
                <span className="font-medium text-foreground">{mechanic.jobsCompleted}</span>
                <span>jobs</span>
              </div>
              {mechanic.location && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground col-span-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{mechanic.location}</span>
                </div>
              )}
            </div>

            {mechanic.specialization.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {mechanic.specialization.slice(0, 3).map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {SERVICE_LABELS[s]}
                  </span>
                ))}
                {mechanic.specialization.length > 3 && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    +{mechanic.specialization.length - 3}
                  </span>
                )}
              </div>
            )}

            {mechanic.currentBooking && (
              <div className="mt-3 rounded-lg bg-muted/50 p-2.5">
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Current Job</p>
                <p className="text-xs font-medium truncate">
                  {(mechanic.currentBooking as { customer?: { name?: string } }).customer?.name ?? 'Customer'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {SERVICE_LABELS[mechanic.currentBooking.service]}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MechanicCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex gap-4">
          <Skeleton className="h-12 w-12 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
            <div className="grid grid-cols-2 gap-2 mt-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MechanicsPage() {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<MechanicFilters>({
    page: 1, limit: 12, search: '', status: '', sortBy: 'name', sortOrder: 'asc',
  });

  const load = useCallback(async (f: MechanicFilters, silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const res = await fetchMechanics(f);
      setMechanics(res.data);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(filters); }, [filters, load]);

  useSocket({
    'mechanic:updated': (updated) => {
      setMechanics((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    },
    'dashboard:refresh': () => { load(filters, true); },
  });

  const setFilter = <K extends keyof MechanicFilters>(key: K, value: MechanicFilters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value, page: key !== 'page' ? 1 : (value as number) }));

  // Stats
  const available = mechanics.filter((m) => m.status === 'AVAILABLE').length;
  const busy = mechanics.filter((m) => m.status === 'BUSY').length;
  const offDuty = mechanics.filter((m) => m.status === 'OFF_DUTY').length;

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Mechanics"
        subtitle={`${total} mechanics`}
        onRefresh={() => load(filters, true)}
        refreshing={refreshing}
      />

      <div className="flex-1 p-6 space-y-5 overflow-auto">
        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Available', count: available, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
            { label: 'Busy', count: busy, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/40' },
            { label: 'Off Duty', count: offDuty, color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-800/40' },
          ].map(({ label, count, color, bg }) => (
            <Card key={label} className={`${bg} border-0`}>
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${color}`}>{loading ? '—' : count}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search mechanics…"
              className="pl-9"
              onChange={(e) => {
                const val = e.target.value;
                setTimeout(() => setFilter('search', val), 300);
              }}
            />
          </div>
          <Select
            value={filters.status ?? ''}
            onValueChange={(v) => setFilter('status', v as MechanicStatus | '')}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value || '__all__'} value={o.value || '__all__'}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.sortBy ?? 'name'}
            onValueChange={(v) => setFilter('sortBy', v)}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort: Name</SelectItem>
              <SelectItem value="jobsCompleted">Sort: Jobs Completed</SelectItem>
              <SelectItem value="rating">Sort: Rating</SelectItem>
              <SelectItem value="joinedAt">Sort: Joined</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cards grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 12 }).map((_, i) => <MechanicCardSkeleton key={i} />)
            : mechanics.length === 0
            ? (
              <div className="col-span-full py-16 text-center">
                <p className="text-sm text-muted-foreground">No mechanics found</p>
              </div>
            )
            : mechanics.map((m) => <MechanicCard key={m.id} mechanic={m} />)
          }
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline" size="sm"
              disabled={(filters.page ?? 1) <= 1}
              onClick={() => setFilter('page', (filters.page ?? 1) - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {filters.page} of {totalPages}
            </span>
            <Button
              variant="outline" size="sm"
              disabled={(filters.page ?? 1) >= totalPages}
              onClick={() => setFilter('page', (filters.page ?? 1) + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
