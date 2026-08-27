import { Router, Request, Response } from 'express';
import { prisma } from '../server.js';
import { authMiddleware, AuthRequest, requirePermission, PERMISSIONS, Permission } from '../middleware/auth.middleware.js';

const router = Router();

const hasPermission = (user: AuthRequest['user'], perm: Permission): boolean => {
  return user?.permissions?.includes(perm) ?? false;
};

// Get dashboard KPI data (role-filtered)
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const kpis: any = {};

    // Revenue (only for roles with VIEW_REVENUE)
    if (hasPermission(req.user, PERMISSIONS.VIEW_REVENUE)) {
      const todayPayments = await prisma.payment.findMany({
        where: { paymentDate: { gte: today, lt: tomorrow } },
      });
      const yesterdayPayments = await prisma.payment.findMany({
        where: { paymentDate: { gte: yesterday, lt: today } },
      });
      const todayRevenue = todayPayments.reduce((sum, p) => sum + p.amount, 0);
      const yesterdayRevenue = yesterdayPayments.reduce((sum, p) => sum + p.amount, 0);
      const revenueChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;

      kpis.todayRevenue = {
        value: todayRevenue,
        change: revenueChange,
        comparison: `${revenueChange >= 0 ? '↑' : '↓'} ${Math.abs(revenueChange).toFixed(1)}% from yesterday`,
      };

      const outstandingSales = await prisma.opticalSale.findMany({
        where: { paymentStatus: { in: ['UNPAID', 'PARTIALLY_PAID'] } },
      });
      kpis.outstandingPayments = {
        value: outstandingSales.reduce((sum, s) => sum + s.outstandingBalance, 0),
        count: outstandingSales.length,
        comparison: `${outstandingSales.length} invoices`,
      };
    }

    // Patient stats (only for roles with VIEW_PATIENT_STATS)
    if (hasPermission(req.user, PERMISSIONS.VIEW_PATIENT_STATS)) {
      const todayPatients = await prisma.patient.findMany({
        where: { createdAt: { gte: today, lt: tomorrow } },
      });
      kpis.patientsToday = {
        value: todayPatients.length,
        comparison: 'New patients today',
      };
    }

    // Clinical stats (only for roles with VIEW_CLINICAL_STATS)
    if (hasPermission(req.user, PERMISSIONS.VIEW_CLINICAL_STATS)) {
      const todayExams = await prisma.eyeExamination.findMany({
        where: { examinationDate: { gte: today, lt: tomorrow } },
      });
      kpis.eyeExaminations = {
        value: todayExams.length,
        comparison: 'Examinations today',
      };

      const pendingFollowUps = await prisma.followUp.findMany({
        where: { status: { in: ['PENDING', 'SCHEDULED'] }, followUpDate: { gte: today } },
      });
      kpis.pendingFollowUps = {
        value: pendingFollowUps.length,
        comparison: 'Due this week and beyond',
      };
    }

    // Sales stats (only for roles with VIEW_SALES_STATS)
    if (hasPermission(req.user, PERMISSIONS.VIEW_SALES_STATS)) {
      const todaySales = await prisma.opticalSale.findMany({
        where: { createdAt: { gte: today, lt: tomorrow } },
      });
      kpis.opticalSales = {
        value: todaySales.length,
        comparison: 'Sales today',
      };
    }

    res.json({ kpis });
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get attention items (role-filtered)
router.get('/attention', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const needsAttention: any = {};

    if (hasPermission(req.user, PERMISSIONS.VIEW_FOLLOWUPS)) {
      const overdueFUPs = await prisma.followUp.findMany({
        where: { status: { in: ['PENDING', 'SCHEDULED'] }, followUpDate: { lt: new Date() } },
        take: 10,
        include: { patient: true },
      });
      needsAttention.overdue_followups = overdueFUPs.length;
    }

    if (hasPermission(req.user, PERMISSIONS.VIEW_INVENTORY)) {
      const lowStockProducts = await prisma.product.findMany({
        where: { quantity: { lte: 10 } },
        take: 10,
      });
      needsAttention.low_stock_items = lowStockProducts.length;
    }

    if (hasPermission(req.user, PERMISSIONS.VIEW_REVENUE)) {
      const outstandingSales = await prisma.opticalSale.findMany({
        where: { paymentStatus: { in: ['UNPAID', 'PARTIALLY_PAID'] } },
        take: 10,
        include: { patient: true },
      });
      needsAttention.outstanding_payments = outstandingSales.length;
    }

    res.json({ needsAttention });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
