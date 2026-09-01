import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server;

export function initSocket(httpServer: HttpServer, corsOrigin: string): Server {
  io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on('join:dashboard', () => {
      socket.join('dashboard');
      console.log(`[Socket] ${socket.id} joined dashboard room`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

// Emit events to all dashboard subscribers
export function emitBookingUpdate(booking: unknown): void {
  if (io) {
    io.to('dashboard').emit('booking:updated', booking);
  }
}

export function emitMechanicUpdate(mechanic: unknown): void {
  if (io) {
    io.to('dashboard').emit('mechanic:updated', mechanic);
  }
}

export function emitNewBooking(booking: unknown): void {
  if (io) {
    io.to('dashboard').emit('booking:new', booking);
  }
}

export function emitDashboardRefresh(): void {
  if (io) {
    io.to('dashboard').emit('dashboard:refresh');
  }
}
