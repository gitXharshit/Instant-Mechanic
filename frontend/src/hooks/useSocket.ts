'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Booking, Mechanic } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type SocketEvents = {
  'booking:updated': (booking: Booking) => void;
  'booking:new': (booking: Booking) => void;
  'mechanic:updated': (mechanic: Mechanic) => void;
  'dashboard:refresh': () => void;
};

let globalSocket: Socket | null = null;

export function useSocket(handlers: Partial<SocketEvents>) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!globalSocket) {
      globalSocket = io(API_URL, {
        transports: ['websocket', 'polling'],
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
      });
    }

    const socket = globalSocket;

    socket.emit('join:dashboard');

    const onBookingUpdated = (booking: Booking) => {
      handlersRef.current['booking:updated']?.(booking);
    };
    const onBookingNew = (booking: Booking) => {
      handlersRef.current['booking:new']?.(booking);
    };
    const onMechanicUpdated = (mechanic: Mechanic) => {
      handlersRef.current['mechanic:updated']?.(mechanic);
    };
    const onDashboardRefresh = () => {
      handlersRef.current['dashboard:refresh']?.();
    };

    socket.on('booking:updated', onBookingUpdated);
    socket.on('booking:new', onBookingNew);
    socket.on('mechanic:updated', onMechanicUpdated);
    socket.on('dashboard:refresh', onDashboardRefresh);

    return () => {
      socket.off('booking:updated', onBookingUpdated);
      socket.off('booking:new', onBookingNew);
      socket.off('mechanic:updated', onMechanicUpdated);
      socket.off('dashboard:refresh', onDashboardRefresh);
    };
  }, []);
}

export function useSocketStatus() {
  const statusRef = useRef<'connected' | 'disconnected' | 'connecting'>('connecting');

  useEffect(() => {
    if (!globalSocket) return;
    const socket = globalSocket;

    const onConnect = () => { statusRef.current = 'connected'; };
    const onDisconnect = () => { statusRef.current = 'disconnected'; };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return statusRef.current;
}
