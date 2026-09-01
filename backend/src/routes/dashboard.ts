import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { BookingStatus, MechanicStatus } from '@prisma/client';

const router = Router();

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get dashboard overview stats and analytics
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Dashboard data including KPIs and chart data
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalBookings,
      todayBookings,
      completedBookings,
      pendingBookings,
      cancelledBookings,
      activeMechanics,
      revenueResult,
      newCustomersThisMonth,
      bookingsByStatus,
      bookingsByService,
      recentBookings,
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({
        where: { scheduledAt: { gte: today, lt: tomorrow } },
      }),
      prisma.booking.count({ where: { status: BookingStatus.COMPLETED } }),
      prisma.booking.count({
        where: {
          status: {
            in: [BookingStatus.PENDING, BookingStatus.ASSIGNED, BookingStatus.ON_THE_WAY, BookingStatus.IN_PROGRESS],
          },
        },
      }),
      prisma.booking.count({ where: { status: BookingStatus.CANCELLED } }),
      prisma.mechanic.count({ where: { status: MechanicStatus.BUSY } }),
      prisma.booking.aggregate({
        where: { status: BookingStatus.COMPLETED },
        _sum: { amount: true },
      }),
      prisma.customer.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      prisma.booking.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.booking.groupBy({
        by: ['service'],
        _count: { id: true },
        _sum: { amount: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true } },
          mechanic: { select: { name: true } },
        },
      }),
    ]);

    // Bookings over last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const bookingsOverTime = await prisma.$queryRaw<
      { date: string; count: bigint; revenue: number }[]
    >`
      SELECT
        DATE("scheduledAt") as date,
        COUNT(*)::bigint as count,
        COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN amount ELSE 0 END), 0) as revenue
      FROM bookings
      WHERE "scheduledAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("scheduledAt")
      ORDER BY date ASC
    `;

    res.json({
      success: true,
      data: {
        overview: {
          totalBookings,
          todayBookings,
          completedBookings,
          pendingBookings,
          cancelledBookings,
          totalRevenue: revenueResult._sum.amount || 0,
          activeMechanics,
          newCustomers: newCustomersThisMonth,
        },
        charts: {
          bookingsByStatus: bookingsByStatus.map((b) => ({
            status: b.status,
            count: b._count.id,
          })),
          bookingsByService: bookingsByService.map((b) => ({
            service: b.service,
            count: b._count.id,
            revenue: b._sum.amount || 0,
          })),
          bookingsOverTime: bookingsOverTime.map((b) => ({
            date: b.date,
            count: Number(b.count),
            revenue: Number(b.revenue),
          })),
        },
        recentBookings,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
