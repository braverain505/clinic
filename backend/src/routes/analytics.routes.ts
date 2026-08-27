import { Router, Request, Response } from 'express';
import { query } from 'express-validator';
import { prisma } from '../server.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// Helper function to get date range
const getDateRange = (filter: string): { start: Date; end: Date } => {
  const now = new Date();
  let start = new Date(now);

  switch (filter) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case '7days':
      start.setDate(start.getDate() - 7);
      break;
    case '30days':
      start.setDate(start.getDate() - 30);
      break;
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }

  return { start, end: now };
};

// Revenue analytics
router.get(
  '/revenue',
  authMiddleware,
  query('filter').optional().isIn(['today', '7days', '30days', 'month', 'year']),
  async (req: AuthRequest, res: Response) => {
    try {
      const filter = (req.query.filter as string) || '30days';
      const { start, end } = getDateRange(filter);

      const payments = await prisma.payment.findMany({
        where: {
          paymentDate: { gte: start, lte: end },
        },
        orderBy: { paymentDate: 'asc' },
      });

      // Group by date
      const byDate: Record<string, number> = {};
      payments.forEach((p) => {
        const dateKey = p.paymentDate.toISOString().split('T')[0];
        byDate[dateKey] = (byDate[dateKey] || 0) + p.amount;
      });

      const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
      const avgDaily = payments.length > 0 ? totalRevenue / Math.max(1, Object.keys(byDate).length) : 0;

      res.json({
        period: filter,
        totalRevenue,
        avgDaily,
        transactions: payments.length,
        byDate: Object.entries(byDate).map(([date, amount]) => ({ date, amount })),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Patient analytics
router.get(
  '/patients',
  authMiddleware,
  query('filter').optional().isIn(['today', '7days', '30days', 'month', 'year']),
  async (req: AuthRequest, res: Response) => {
    try {
      const filter = (req.query.filter as string) || '30days';
      const { start, end } = getDateRange(filter);

      const [totalPatients, newPatients, returningPatients] = await Promise.all([
        prisma.patient.count(),
        prisma.patient.count({
          where: { createdAt: { gte: start, lte: end } },
        }),
        prisma.patient.count({
          where: {
            opticalSales: {
              some: { createdAt: { gte: start, lte: end } },
            },
          },
        }),
      ]);

      res.json({
        period: filter,
        totalPatients,
        newPatients,
        returningPatients,
        growth: totalPatients > 0 ? ((newPatients / totalPatients) * 100).toFixed(2) : 0,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Sales analytics
router.get(
  '/sales',
  authMiddleware,
  query('filter').optional().isIn(['today', '7days', '30days', 'month', 'year']),
  async (req: AuthRequest, res: Response) => {
    try {
      const filter = (req.query.filter as string) || '30days';
      const { start, end } = getDateRange(filter);

      const sales = await prisma.opticalSale.findMany({
        where: { createdAt: { gte: start, lte: end } },
        include: { items: true },
      });

      // Group by product category
      const byCategory: Record<string, { count: number; revenue: number }> = {};
      const allItems = await prisma.opticalSaleItem.findMany({
        where: {
          sale: { createdAt: { gte: start, lte: end } },
        },
        include: { product: true },
      });

      allItems.forEach((item) => {
        const cat = item.product.category;
        if (!byCategory[cat]) {
          byCategory[cat] = { count: 0, revenue: 0 };
        }
        byCategory[cat].count += item.quantity;
        byCategory[cat].revenue += item.total;
      });

      const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
      const avgSale = sales.length > 0 ? totalRevenue / sales.length : 0;

      res.json({
        period: filter,
        totalSales: sales.length,
        totalRevenue,
        avgSale,
        byCategory,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Financial analytics
router.get(
  '/financial',
  authMiddleware,
  query('filter').optional().isIn(['today', '7days', '30days', 'month', 'year']),
  async (req: AuthRequest, res: Response) => {
    try {
      const filter = (req.query.filter as string) || '30days';
      const { start, end } = getDateRange(filter);

      const [totalRevenue, totalPaid, totalOutstanding] = await Promise.all([
        prisma.opticalSale.aggregate({
          where: { createdAt: { gte: start, lte: end } },
          _sum: { total: true },
        }),
        prisma.payment.aggregate({
          where: { paymentDate: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
        prisma.opticalSale.aggregate({
          where: {
            createdAt: { gte: start, lte: end },
            paymentStatus: { in: ['UNPAID', 'PARTIALLY_PAID'] },
          },
          _sum: { outstandingBalance: true },
        }),
      ]);

      const sales = await prisma.opticalSale.findMany({
        where: { createdAt: { gte: start, lte: end } },
      });
      const totalDiscount = sales.reduce((sum, s) => sum + s.discount, 0);

      res.json({
        period: filter,
        totalRevenue: totalRevenue._sum.total || 0,
        totalPaid: totalPaid._sum.amount || 0,
        totalOutstanding: totalOutstanding._sum.outstandingBalance || 0,
        totalDiscount,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Clinical analytics
router.get(
  '/clinical',
  authMiddleware,
  query('filter').optional().isIn(['today', '7days', '30days', 'month', 'year']),
  async (req: AuthRequest, res: Response) => {
    try {
      const filter = (req.query.filter as string) || '30days';
      const { start, end } = getDateRange(filter);

      const [examinations, prescriptions, followups] = await Promise.all([
        prisma.eyeExamination.count({
          where: { examinationDate: { gte: start, lte: end } },
        }),
        prisma.prescription.count({
          where: { createdAt: { gte: start, lte: end } },
        }),
        prisma.followUp.count({
          where: { createdAt: { gte: start, lte: end } },
        }),
      ]);

      res.json({
        period: filter,
        examinations,
        prescriptions,
        followups,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
