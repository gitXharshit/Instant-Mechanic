'use client';

import { useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { format } from 'date-fns';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboard } from '@/hooks/useDashboard';
import { useSocket } from '@/hooks/useSocket';
import { formatCurrency, SERVICE_LABELS } from '@/lib/utils';

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
  '#06b6d4', '#84cc16', '#ec4899', '#f97316', '#a78bfa', '#22d3ee', '#fb7185',
];

function ChartCard({
  title,
  description,
  children,
  loading,
  height = 280,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  loading?: boolean;
  height?: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="w-full rounded-lg" style={{ height }} />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const { data, loading, error, refresh, lastUpdated } = useDashboard();

  const handleRefresh = useCallback(() => { refresh(); }, [refresh]);
  useSocket({ 'dashboard:refresh': handleRefresh });

  const charts = data?.charts;

  // Compute revenue by service for a cleaner bar chart
  const revenueByService = (charts?.bookingsByService ?? [])
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Booking trend with 7-day rolling average (simple)
  const bookingTrend = (charts?.bookingsOverTime ?? []).map((d, i, arr) => {
    const window = arr.slice(Math.max(0, i - 6), i + 1);
    const avg = window.reduce((s, x) => s + x.count, 0) / window.length;
    return { ...d, rollingAvg: Math.round(avg * 10) / 10 };
  });

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Analytics"
        subtitle="Deep-dive into bookings and revenue trends"
        onRefresh={refresh}
        lastUpdated={lastUpdated}
      />

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Revenue & Bookings dual-axis */}
        <ChartCard
          title="Bookings & Revenue Over Time"
          description="Last 30 days — blue = bookings, green = revenue, dashed = 7-day rolling average"
          loading={loading}
          height={320}
        >
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={bookingTrend}>
              <defs>
                <linearGradient id="anaBookings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="anaRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => format(new Date(v), 'MMM d')}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`}
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
                  name === 'count' ? 'Bookings' : name === 'revenue' ? 'Revenue' : '7-Day Avg',
                ]}
                labelFormatter={(l) => format(new Date(l), 'dd MMM yyyy')}
              />
              <Legend formatter={(v: string) => ({ count: 'Bookings', revenue: 'Revenue', rollingAvg: '7-Day Avg' } as Record<string, string>)[v] ?? v} />
              <Area yAxisId="left" type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#anaBookings)" strokeWidth={2} />
              <Area yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#anaRevenue)" strokeWidth={2} />
              <Line yAxisId="left" type="monotone" dataKey="rollingAvg" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue by service */}
          <ChartCard
            title="Revenue by Service"
            description="Top 10 services by total revenue"
            loading={loading}
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueByService} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="service"
                  width={130}
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
                  formatter={(value: number, name: string) => [
                    name === 'revenue' ? formatCurrency(value) : value,
                    name === 'revenue' ? 'Revenue' : 'Bookings',
                  ]}
                />
                <Legend formatter={(v) => v === 'revenue' ? 'Revenue' : 'Bookings'} />
                <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} barSize={10}>
                  {revenueByService.map((_, i) => (
                    <Cell key={i} fill={SERVICE_COLORS[i % SERVICE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Status donut */}
          <ChartCard
            title="Booking Status Distribution"
            description="All-time breakdown by status"
            loading={loading}
          >
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={charts?.bookingsByStatus ?? []}
                  cx="50%"
                  cy="45%"
                  innerRadius={65}
                  outerRadius={100}
                  dataKey="count"
                  nameKey="status"
                  paddingAngle={2}
                  label={({ status, percent }) =>
                    `${status.replace(/_/g, ' ')} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {charts?.bookingsByStatus.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#94a3b8'} />
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
                <Legend
                  formatter={(v) => v.replace(/_/g, ' ')}
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Bookings by volume per service - grouped */}
        <ChartCard
          title="Bookings Volume by Service"
          description="Number of bookings per service category"
          loading={loading}
          height={300}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={(charts?.bookingsByService ?? []).sort((a, b) => b.count - a.count)}
              margin={{ bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis
                dataKey="service"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => SERVICE_LABELS[v as keyof typeof SERVICE_LABELS]?.split(' ')[0] ?? v}
                angle={-30}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <ReTooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
                formatter={(value: number, name: string) => [value, 'Bookings']}
                labelFormatter={(v) => SERVICE_LABELS[v as keyof typeof SERVICE_LABELS] ?? v}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {(charts?.bookingsByService ?? []).map((_, i) => (
                  <Cell key={i} fill={SERVICE_COLORS[i % SERVICE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
