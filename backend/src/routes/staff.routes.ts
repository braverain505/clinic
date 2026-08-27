import { Router, Request, Response } from 'express';
import { body, validationResult, param } from 'express-validator';
import bcryptjs from 'bcryptjs';
import { prisma } from '../server.js';
import { authMiddleware, AuthRequest, requireRole, ROLES, Role, ROLE_PERMISSIONS } from '../middleware/auth.middleware.js';

const router = Router();

// ─── Get all staff (with user info) ─────────────────────────
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

// ─── Get all users (admin) ──────────────────────────────────
router.get('/users', authMiddleware, requireRole([ROLES.OWNER, ROLES.ADMIN]), async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        staff: {
          select: { id: true, employeeId: true, department: true, position: true, phone: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Create staff member (creates User + Staff) ─────────────
router.post('/', authMiddleware, requireRole([ROLES.OWNER, ROLES.ADMIN]), [
  body('fullName').notEmpty().trim(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(Object.values(ROLES)),
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { fullName, email, password, role, phone, department, position, employmentDate } = req.body;

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role,
      },
    });

    // Create staff profile
    const staff = await prisma.staff.create({
      data: {
        userId: user.id,
        phone,
        department,
        position,
        employmentDate: employmentDate ? new Date(employmentDate) : new Date(),
      },
      include: { user: { select: { id: true, fullName: true, email: true, role: true } } },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'created',
        entity: 'Staff',
        entityId: staff.id,
        changes: JSON.stringify({ fullName, email, role, department }),
      },
    });

    res.status(201).json({
      message: 'Staff member created successfully',
      staff,
      credentials: { email, password }, // Return plain password once for admin to share
    });
  } catch (error: any) {
    console.error('Error creating staff:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── Get staff by ID ────────────────────────────────────────
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

// ─── Update staff ───────────────────────────────────────────
router.put('/:id', authMiddleware, requireRole([ROLES.OWNER, ROLES.ADMIN]), param('id').notEmpty(), async (req: AuthRequest, res: Response) => {
  try {
    const { phone, department, position, status, role } = req.body;

    const staff = await prisma.staff.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });
    if (!staff) return res.status(404).json({ error: 'Staff not found' });

    // Update staff profile
    const updatedStaff = await prisma.staff.update({
      where: { id: req.params.id },
      data: { phone, department, position, status },
      include: { user: { select: { id: true, fullName: true, email: true, role: true } } },
    });

    // Update user role if changed
    if (role && role !== staff.user.role) {
      await prisma.user.update({
        where: { id: staff.userId },
        data: { role },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'updated',
        entity: 'Staff',
        entityId: staff.id,
        changes: JSON.stringify(req.body),
      },
    });

    res.json({ message: 'Staff updated', staff: updatedStaff });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Deactivate staff ───────────────────────────────────────
router.put('/:id/deactivate', authMiddleware, requireRole([ROLES.OWNER, ROLES.ADMIN]), param('id').notEmpty(), async (req: AuthRequest, res: Response) => {
  try {
    const staff = await prisma.staff.findUnique({ where: { id: req.params.id } });
    if (!staff) return res.status(404).json({ error: 'Staff not found' });

    await prisma.staff.update({
      where: { id: req.params.id },
      data: { status: 'INACTIVE' },
    });

    await prisma.auditLog.create({
      data: { userId: req.user!.id, action: 'updated', entity: 'Staff', entityId: staff.id, changes: JSON.stringify({ status: 'INACTIVE' }) },
    });

    res.json({ message: 'Staff deactivated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Reset staff password ───────────────────────────────────
router.put('/:id/reset-password', authMiddleware, requireRole([ROLES.OWNER, ROLES.ADMIN]), param('id').notEmpty(), async (req: AuthRequest, res: Response) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const staff = await prisma.staff.findUnique({ where: { id: req.params.id } });
    if (!staff) return res.status(404).json({ error: 'Staff not found' });

    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: staff.userId },
      data: { password: hashedPassword },
    });

    await prisma.auditLog.create({
      data: { userId: req.user!.id, action: 'updated', entity: 'User', entityId: staff.userId, changes: JSON.stringify({ action: 'password_reset' }) },
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Clock in ───────────────────────────────────────────────
router.post('/:id/clock-in', authMiddleware, param('id').notEmpty(), async (req: AuthRequest, res: Response) => {
  try {
    const staff = await prisma.staff.findUnique({ where: { id: req.params.id } });
    if (!staff) return res.status(404).json({ error: 'Staff not found' });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

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

// ─── Clock out ──────────────────────────────────────────────
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

// ─── Get attendance records ──────────────────────────────────
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
