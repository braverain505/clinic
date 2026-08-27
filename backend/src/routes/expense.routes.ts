import { Router, Request, Response } from 'express';
import { body, validationResult, param } from 'express-validator';
import { prisma } from '../server.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// Get all expenses
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { id: true, fullName: true } } },
      take: 100,
    });
    res.json(expenses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get expense summary
router.get('/summary', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [monthlyTotal, byCategory, recentExpenses] = await Promise.all([
      prisma.expense.aggregate({
        where: { date: { gte: monthStart } },
        _sum: { amount: true },
      }),
      prisma.expense.groupBy({
        by: ['category'],
        where: { date: { gte: monthStart } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.expense.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { createdBy: { select: { fullName: true } } },
      }),
    ]);

    res.json({
      monthlyTotal: monthlyTotal._sum.amount || 0,
      byCategory: byCategory.map((c) => ({
        category: c.category,
        total: c._sum.amount || 0,
        count: c._count,
      })),
      recentExpenses,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get expense by ID
router.get('/:id', authMiddleware, param('id').notEmpty(), async (req: AuthRequest, res: Response) => {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: req.params.id },
      include: { createdBy: { select: { id: true, fullName: true } } },
    });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json(expense);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create expense
router.post('/', authMiddleware, [
  body('category').notEmpty(),
  body('description').notEmpty().trim(),
  body('amount').isFloat({ min: 0.01 }),
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { category, description, amount, date, paymentMethod, reference } = req.body;
    const expense = await prisma.expense.create({
      data: {
        category,
        description,
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        paymentMethod,
        reference,
        userId: req.user!.id,
      },
      include: { createdBy: { select: { fullName: true } } },
    });

    await prisma.auditLog.create({
      data: { userId: req.user!.id, action: 'created', entity: 'Expense', entityId: expense.id },
    });

    res.status(201).json({ message: 'Expense recorded', expense });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update expense
router.put('/:id', authMiddleware, param('id').notEmpty(), async (req: AuthRequest, res: Response) => {
  try {
    const { category, description, amount, date, paymentMethod, reference, status } = req.body;
    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: {
        category, description,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        date: date ? new Date(date) : undefined,
        paymentMethod, reference, status,
      },
    });

    await prisma.auditLog.create({
      data: { userId: req.user!.id, action: 'updated', entity: 'Expense', entityId: expense.id },
    });

    res.json({ message: 'Expense updated', expense });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
