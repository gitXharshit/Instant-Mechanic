import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { emitBookingUpdate, emitNewBooking, emitDashboardRefresh } from '../lib/socket';
import { createError } from '../middleware/errorHandler';
import { BookingStatus, ServiceCategory } from '@prisma/client';

const router = Router();

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.nativeEnum(BookingStatus).optional(),
  service: z.nativeEnum(ServiceCategory).optional(),
  mechanicId: z.string().optional(),
  customerId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(['createdAt', 'scheduledAt', 'amount', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(BookingStatus),
  mechanicId: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get all bookings with filtering, sorting, and pagination
 *     tags: [Bookings]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by booking number, customer name, vehicle
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, ASSIGNED, ON_THE_WAY, IN_PROGRESS, COMPLETED, CANCELLED] }
 *       - in: query
 *         name: service
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [createdAt, scheduledAt, amount, status] }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc] }
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = querySchema.parse(req.query);
    const skip = (query.page - 1) * query.limit;

    const where: Prisma.BookingWhereInput = {};

    if (query.search) {
      where.OR = [
        { bookingNumber: { contains: query.search } },
        { customer: { name: { contains: query.search } } },
        { vehicleMake: { contains: query.search } },
        { vehicleModel: { contains: query.search } },
        { vehiclePlate: { contains: query.search } },
      ];
    }

    if (query.status) where.status = query.status;
    if (query.service) where.service = query.service;
    if (query.mechanicId) where.mechanicId = query.mechanicId;
    if (query.customerId) where.customerId = query.customerId;

    if (query.startDate || query.endDate) {
      where.scheduledAt = {};
      if (query.startDate) where.scheduledAt.gte = new Date(query.startDate);
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        where.scheduledAt.lte = end;
      }
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { [query.sortBy]: query.sortOrder },
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true } },
          mechanic: { select: { id: true, name: true, phone: true, status: true } },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
        hasNext: query.page < Math.ceil(total / query.limit),
        hasPrev: query.page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get a single booking by ID
 *     tags: [Bookings]
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        mechanic: true,
      },
    });

    if (!booking) {
      return next(createError('Booking not found', 404, 'BOOKING_NOT_FOUND'));
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/bookings/{id}/status:
 *   patch:
 *     summary: Update booking status (triggers real-time WebSocket event)
 *     tags: [Bookings]
 */
router.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = updateStatusSchema.parse(req.body);

    const existing = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return next(createError('Booking not found', 404, 'BOOKING_NOT_FOUND'));
    }

    const updateData: Parameters<typeof prisma.booking.update>[0]['data'] = {
      status: body.status,
    };

    if (body.mechanicId) updateData.mechanicId = body.mechanicId;
    if (body.notes) updateData.notes = body.notes;
    if (body.status === BookingStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true } },
        mechanic: { select: { id: true, name: true } },
      },
    });

    // Update mechanic status if assigned or completed
    if (body.mechanicId && body.status === BookingStatus.ASSIGNED) {
      const mechanic = await prisma.mechanic.update({
        where: { id: body.mechanicId },
        data: { status: 'BUSY' },
      });
      emitMechanicUpdate(mechanic);
    }

    if (body.status === BookingStatus.COMPLETED && existing.mechanicId) {
      const mechanic = await prisma.mechanic.update({
        where: { id: existing.mechanicId },
        data: { status: 'AVAILABLE', jobsCompleted: { increment: 1 } },
      });
      emitMechanicUpdate(mechanic);
    }

    // Emit real-time updates
    emitBookingUpdate(updated);
    emitDashboardRefresh();

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// Import needed function
function emitMechanicUpdate(mechanic: unknown): void {
  try {
    const { emitMechanicUpdate: emit } = require('../lib/socket');
    emit(mechanic);
  } catch {
    // Socket might not be ready during tests
  }
}

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const createSchema = z.object({
      customerId: z.string(),
      vehicleMake: z.string().min(1),
      vehicleModel: z.string().min(1),
      vehicleYear: z.number().int().min(1990).max(new Date().getFullYear() + 1),
      vehiclePlate: z.string().min(1),
      service: z.nativeEnum(ServiceCategory),
      serviceDetails: z.string().optional(),
      amount: z.number().positive(),
      scheduledAt: z.string(),
      mechanicId: z.string().optional(),
      notes: z.string().optional(),
    });

    const body = createSchema.parse(req.body);

    const bookingNumber = `IM-${Date.now().toString(36).toUpperCase()}`;

    const booking = await prisma.booking.create({
      data: {
        ...body,
        bookingNumber,
        scheduledAt: new Date(body.scheduledAt),
        status: body.mechanicId ? BookingStatus.ASSIGNED : BookingStatus.PENDING,
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        mechanic: { select: { id: true, name: true } },
      },
    });

    emitNewBooking(booking);
    emitDashboardRefresh();

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/bookings/export/csv:
 *   get:
 *     summary: Export bookings as CSV
 *     tags: [Bookings]
 */
router.get('/export/csv', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where: Prisma.BookingWhereInput = {};
    if (req.query.status) where.status = req.query.status as BookingStatus;
    if (req.query.startDate) where.scheduledAt = { gte: new Date(req.query.startDate as string) };

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        customer: { select: { name: true, email: true } },
        mechanic: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['Booking ID', 'Customer', 'Email', 'Vehicle', 'Service', 'Mechanic', 'Status', 'Amount', 'Scheduled At', 'Created At'];
    const rows = bookings.map((b) => [
      b.bookingNumber,
      b.customer.name,
      b.customer.email,
      `${b.vehicleYear} ${b.vehicleMake} ${b.vehicleModel}`,
      b.service,
      b.mechanic?.name || 'Unassigned',
      b.status,
      b.amount.toFixed(2),
      new Date(b.scheduledAt).toISOString(),
      new Date(b.createdAt).toISOString(),
    ]);

    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="bookings.csv"');
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

export default router;
