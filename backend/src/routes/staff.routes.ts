import { Router, Request, Response } from 'express';
import { body, validationResult, param } from 'express-validator';
import { prisma } from '../server.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// Get all staff
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const staff = await prisma.staff.findMany({
      include: {
        user: { select: { id: true, fullName: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(staff);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get staff by ID
router.get('/:id', authMiddleware, param('id').notEmpty(), async (req: AuthRequest, res: Response) => {
  try {
    const staff = await prisma.staff.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, fullName: true, email: true, role: true } },
        attendance: { orderBy: { date: 'desc' }, take: 30 },
      },
    });
    if (!staff) return res.status(404).json({ error: 'Staff not found' });
    res.json(staff);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create staff
router.post('/', authMiddleware, [
  body('userId').notEmpty(),
  body('department').optional().isString(),
  body('position').optional().isString(),
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { userId, phone, department, position, employmentDate } = req.body;
    const staff = await prisma.staff.create({
      data: {
        userId,
        phone,
        department,
        position,
        employmentDate: employmentDate ? new Date(employmentDate) : new Date(),
      },
      include: { user: { select: { fullName: true, email: true, role: true } } },
    });

    res.status(201).json({ message: 'Staff created', staff });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Clock in
router.post('/:id/clock-in', authMiddleware, param('id').notEmpty(), async (req: AuthRequest, res: Response) => {
  try {
    const staff = await prisma.staff.findUnique({ where: { id: req.params.id } });
    if (!staff) return res.status(404).json({ error: 'Staff not found' });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check if already clocked in today
    const existing = await prisma.attendance.findFirst({
      where: { staffId: staff.id, date: { gte: today } },
    });

    if (existing) {
      return res.status(400).json({ error: 'Already clocked in today' });
    }

    const hour = now.getHours();
    const minute = now.getMinutes();
    const isLate = hour > 9 || (hour === 9 && minute > 0);

    const attendance = await prisma.attendance.create({
      data: {
        staffId: staff.id,
        clockIn: now,
        status: isLate ? 'LATE' : 'PRESENT',
      },
    });

    res.json({ message: 'Clocked in', attendance });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Clock out
router.post('/:id/clock-out', authMiddleware, param('id').notEmpty(), async (req: AuthRequest, res: Response) => {
  try {
    const staff = await prisma.staff.findUnique({ where: { id: req.params.id } });
    if (!staff) return res.status(404).json({ error: 'Staff not found' });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const attendance = await prisma.attendance.findFirst({
      where: { staffId: staff.id, date: { gte: today }, clockOut: null },
    });

    if (!attendance) {
      return res.status(400).json({ error: 'No active clock-in found for today' });
    }

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: { clockOut: now },
    });

    res.json({ message: 'Clocked out', attendance: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance records
router.get('/:id/attendance', authMiddleware, param('id').notEmpty(), async (req: AuthRequest, res: Response) => {
  try {
    const records = await prisma.attendance.findMany({
      where: { staffId: req.params.id },
      orderBy: { date: 'desc' },
      take: 30,
    });
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
