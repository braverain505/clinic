import { Router, Request, Response } from 'express';
import { prisma } from '../server.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// Get today's KPI data
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Today's metrics
    const todaySales = await prisma.opticalSale.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const todayExaminations = await prisma.eyeExamination.findMany({
      where: {
        examinationDate: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const todayPatients = await prisma.patient.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const todayPayments = await prisma.payment.findMany({
      where: {
        paymentDate: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Yesterday's metrics for comparison
    const yesterdaySales = await prisma.opticalSale.findMany({
      where: {
        createdAt: {
          gte: yesterday,
          lt: today,
        },
      },
    });

    const yesterdayPayments = await prisma.payment.findMany({
      where: {
        paymentDate: {
          gte: yesterday,
          lt: today,
        },
      },
    });

    // Calculate totals
    const todayRevenue = todayPayments.reduce((sum, p) => sum + p.amount, 0);
    const yesterdayRevenue = yesterdayPayments.reduce((sum, p) => sum + p.amount, 0);
    const revenueChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;

    // Outstanding payments
    const outstandingSales = await prisma.opticalSale.findMany({
      where: {
        paymentStatus: { in: ['UNPAID', 'PARTIALLY_PAID'] },
      },
    });
    const outstandingAmount = outstandingSales.reduce((sum, s) => sum + s.outstandingBalance, 0);

    // Pending follow-ups
    const pendingFollowUps = await prisma.followUp.findMany({
      where: {
        status: { in: ['PENDING', 'SCHEDULED'] },
        followUpDate: {
          gte: today,
        },
      },
    });

    res.json({
      kpis: {
        todayRevenue: {
          value: todayRevenue,
          change: revenueChange,
          comparison: `${revenueChange > 0 ? '↑' : '↓'} ${Math.abs(revenueChange).toFixed(1)}% from yesterday`,
        },
        patientsToday: {
          value: todayPatients.length,
          change: 0,
          comparison: 'New patients today',
        },
        eyeExaminations: {
          value: todayExaminations.length,
          change: 0,
          comparison: 'Examinations today',
        },
        opticalSales: {
          value: todaySales.length,
          change: 0,
          comparison: 'Sales today',
        },
        outstandingPayments: {
          value: outstandingAmount,
          count: outstandingSales.length,
          comparison: `${outstandingSales.length} invoices`,
        },
        pendingFollowUps: {
          value: pendingFollowUps.length,
          comparison: 'Due this week and beyond',
        },
      },
      todaysSummary: {
        sales: todaySales.length,
        revenue: todayRevenue,
        examinations: todayExaminations.length,
        patients: todayPatients.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard attention items
router.get('/attention', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const [overdueFUPs, lowStockProducts, outstandingPayments] = await Promise.all([
      prisma.followUp.findMany({
        where: {
          status: { in: ['PENDING', 'SCHEDULED'] },
          followUpDate: { lt: new Date() },
        },
        take: 10,
        include: { patient: true },
      }),
      prisma.product.findMany({
        where: {
          quantity: { lte: prisma.product.fields.minimumStock },
        },
        take: 10,
      }),
      prisma.opticalSale.findMany({
        where: {
          paymentStatus: { in: ['UNPAID', 'PARTIALLY_PAID'] },
        },
        take: 10,
        include: { patient: true },
      }),
    ]);

    res.json({
      needsAttention: {
        overdue_followups: overdueFUPs.length,
        low_stock_items: lowStockProducts.length,
        outstanding_payments: outstandingPayments.length,
        items: {
          overdue_followups: overdueFUPs,
          low_stock_products: lowStockProducts,
          outstanding_sales: outstandingPayments,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
