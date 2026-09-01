'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchDashboard } from '@/lib/api';
import type { DashboardData } from '@/types';

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetchDashboard();
      setData(res.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    const res = await fetchDashboard();
    setData(res.data);
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    load();
    // Auto-poll every 60s as a fallback (WebSocket is primary)
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, [load, refresh]);

  return { data, loading, error, refresh, lastUpdated };
}
