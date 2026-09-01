import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { createError } from '../middleware/errorHandler';

const router = Router();

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'city']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Get all customers with booking stats
 *     tags: [Customers]
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = querySchema.parse(req.query);
    const skip = (query.page - 1) * query.limit;

    const where: Prisma.CustomerWhereInput = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { city: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { [query.sortBy]: query.sortOrder },
        include: {
          _count: { select: { bookings: true } },
          bookings: {
            select: { amount: true, status: true },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    const customersWithStats = customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      address: c.address,
      city: c.city,
      createdAt: c.createdAt,
      totalBookings: c._count.bookings,
      totalSpend: c.bookings
        .filter((b) => b.status === 'COMPLETED')
        .reduce((sum, b) => sum + b.amount, 0),
    }));

    res.json({
      success: true,
      data: customersWithStats,
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
 * /api/customers/{id}:
 *   get:
 *     summary: Get customer details with full booking history
 *     tags: [Customers]
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        bookings: {
          orderBy: { createdAt: 'desc' },
          include: {
            mechanic: { select: { name: true } },
          },
        },
      },
    });

    if (!customer) {
      return next(createError('Customer not found', 404, 'CUSTOMER_NOT_FOUND'));
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
});

export default router;
