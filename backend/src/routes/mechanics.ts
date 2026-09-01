import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { createError } from '../middleware/errorHandler';
import { MechanicStatus } from '@prisma/client';

const router = Router();

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.nativeEnum(MechanicStatus).optional(),
  sortBy: z.enum(['name', 'jobsCompleted', 'rating', 'joinedAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * @swagger
 * /api/mechanics:
 *   get:
 *     summary: Get all mechanics with their current status and stats
 *     tags: [Mechanics]
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = querySchema.parse(req.query);
    const skip = (query.page - 1) * query.limit;

    const where: Prisma.MechanicWhereInput = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { email: { contains: query.search } },
      ];
    }
    if (query.status) where.status = query.status;

    const [mechanics, total] = await Promise.all([
      prisma.mechanic.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { [query.sortBy]: query.sortOrder },
        include: {
          bookings: {
            where: { status: { in: ['ASSIGNED', 'ON_THE_WAY', 'IN_PROGRESS'] } },
            take: 1,
            orderBy: { updatedAt: 'desc' },
            include: {
              customer: { select: { name: true } },
            },
          },
        },
      }),
      prisma.mechanic.count({ where }),
    ]);

    const mechanicsWithStats = mechanics.map((m) => ({
      ...m,
      currentBooking: m.bookings[0] || null,
      bookings: undefined,
    }));

    res.json({
      success: true,
      data: mechanicsWithStats,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/mechanics/{id}:
 *   get:
 *     summary: Get mechanic details with booking history
 *     tags: [Mechanics]
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mechanic = await prisma.mechanic.findUnique({
      where: { id: req.params.id },
      include: {
        bookings: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: { select: { name: true } },
          },
        },
      },
    });

    if (!mechanic) {
      return next(createError('Mechanic not found', 404, 'MECHANIC_NOT_FOUND'));
    }

    res.json({ success: true, data: mechanic });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/mechanics/{id}/status:
 *   patch:
 *     summary: Update mechanic availability status
 *     tags: [Mechanics]
 */
router.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z.object({
      status: z.nativeEnum(MechanicStatus),
    }).parse(req.body);

    const mechanic = await prisma.mechanic.update({
      where: { id: req.params.id },
      data: { status: body.status },
    });

    res.json({ success: true, data: mechanic });
  } catch (error) {
    next(error);
  }
});

export default router;
