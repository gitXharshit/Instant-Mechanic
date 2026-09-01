'use client';

import { useCallback } from 'react';
import {
  CalendarCheck, CalendarClock, CheckCircle2, Clock, XCircle,
  PoundSterling, Wrench, UserPlus, TrendingUp,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { format } from 'date-fns';

import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { BookingStatusBadge } from '@/components/dashboard/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboard } from '@/hooks/useDashboard';
import { useSocket } from '@/hooks/useSocket';
import { formatCurrency, formatDateTime, SERVICE_LABELS } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: '#10b981',
  PENDING: '#f59e0b',
  ASSIGNED: '#3b82f6',
  ON_THE_WAY: '#8b5cf6',
  IN_PROGRESS: '#6366f1',
  CANCELLED: '#f43f5e',
};

const SERVICE_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e',
  '#06b6d4', '#84cc16', '#ec4899', '#f97316', '#a78bfa',
  '#22d3ee', '#fb7185',
];

function ChartSkeleton({ height = 280 }: { height?: number }) {
  return <Skeleton className="w-full rounded-lg" style={{ height }} />;
}

export default function DashboardPage() {
  const { data, loading, error, refresh, lastUpdated } = useDashboard();

  const handleDashboardRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  useSocket({ 'dashboard:refresh': handleDashboardRefresh });

  const overview = data?.overview;
  const charts = data?.charts;

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Operations Overview"
        subtitle="Real-time monitoring of bookings, mechanics and revenue"
        onRefresh={refresh}
        lastUpdated={lastUpdated}
      />

      <div className="flex-1 p-6 space-y-6">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Failed to load dashboard data: {error}. Make sure the backend is running on port 5000.
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Bookings"
            value={overview?.totalBookings.toLocaleString() ?? '—'}
            icon={CalendarCheck}
            loading={loading}
            colorClass="text-blue-600"
          />
          <StatCard
            title="Today's Bookings"
            value={overview?.todayBookings ?? '—'}
            subtitle="Scheduled for today"
            icon={CalendarClock}
            loading={loading}
            colorClass="text-violet-600"
          />
          <StatCard
            title="Total Revenue"
            value={overview ? formatCurrency(overview.totalRevenue) : '—'}
            subtitle="From completed bookings"
            icon={PoundSterling}
            loading={loading}
            colorClass="text-emerald-600"
          />
          <StatCard
            title="Active Mechanics"
            value={overview?.activeMechanics ?? '—'}
            subtitle="Currently on a job"
            icon={Wrench}
            loading={loading}
            colorClass="text-amber-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Completed"
            value={overview?.completedBookings.toLocaleString() ?? '—'}
            icon={CheckCircle2}
            loading={loading}
            colorClass="text-emerald-600"
          />
          <StatCard
            title="In Progress"
            value={overview?.pendingBookings ?? '—'}
            subtitle="Pending + active"
            icon={Clock}
            loading={loading}
            colorClass="text-amber-600"
          />
          <StatCard
            title="Cancelled"
            value={overview?.cancelledBookings ?? '—'}
            icon={XCircle}
            loading={loading}
            colorClass="text-rose-600"
          />
          <StatCard
            title="New Customers"
            value={overview?.newCustomers ?? '—'}
            subtitle="This month"
            icon={UserPlus}
            loading={loading}
            colorClass="text-primary"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Bookings over time — spans 2 cols */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Bookings & Revenue (30 Days)</CardTitle>
              <CardDescription>Daily booking volume and revenue trend</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={charts?.bookingsOverTime ?? []}>
                    <defs>
                      <linearGradient id="bookingsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => format(new Date(v), 'MMM d')}
                      className="text-xs"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ReTooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: 12,
                      }}
                      formatter={(value: number, name: string) => [
                        name === 'revenue' ? formatCurrency(value) : value,
                        name === 'revenue' ? 'Revenue' : 'Bookings',
                      ]}
                      labelFormatter={(label) => format(new Date(label), 'dd MMM yyyy')}
                    />
                    <Legend formatter={(v) => v === 'count' ? 'Bookings' : 'Revenue'} />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      fill="url(#bookingsGrad)"
                      strokeWidth={2}
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      fill="url(#revenueGrad)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Booking Status Pie */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Booking Status</CardTitle>
              <CardDescription>Distribution by status</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton />
              ) : (
                <div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={charts?.bookingsByStatus ?? []}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        dataKey="count"
                        nameKey="status"
                        paddingAngle={2}
                      >
                        {charts?.bookingsByStatus.map((entry, i) => (
                          <Cell
                            key={entry.status}
                            fill={STATUS_COLORS[entry.status] ?? '#94a3b8'}
                          />
                        ))}
                      </Pie>
                      <ReTooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: 12,
                        }}
                        formatter={(value, name) => [value, String(name).replace(/_/g, ' ')]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-2 space-y-1">
                    {charts?.bookingsByStatus.map((item) => (
                      <div key={item.status} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: STATUS_COLORS[item.status] ?? '#94a3b8' }}
                          />
                          <span className="text-muted-foreground">
                            {item.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <span className="font-medium">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Service breakdown bar chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Service Category Breakdown</CardTitle>
              <CardDescription>Bookings and revenue by service type</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={(charts?.bookingsByService ?? []).slice(0, 8)}
                    layout="vertical"
                    margin={{ left: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="service"
                      width={120}
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => SERVICE_LABELS[v as keyof typeof SERVICE_LABELS] ?? v}
                    />
                    <ReTooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: 12,
                      }}
                      formatter={(value, name) => [
                        name === 'count' ? value : formatCurrency(value as number),
                        name === 'count' ? 'Bookings' : 'Revenue',
                      ]}
                    />
                    <Legend formatter={(v) => v === 'count' ? 'Bookings' : 'Revenue'} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Recent bookings */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent Bookings</CardTitle>
              <CardDescription>Latest 5 bookings</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-3 p-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y">
                  {data?.recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center gap-3 px-6 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{booking.customer?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {SERVICE_LABELS[booking.service]} · {formatCurrency(booking.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(booking.scheduledAt)}
                        </p>
                      </div>
                      <BookingStatusBadge status={booking.status} size="sm" />
                    </div>
                  ))}
                  {!data?.recentBookings.length && (
                    <p className="p-6 text-sm text-muted-foreground text-center">
                      No bookings yet
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
