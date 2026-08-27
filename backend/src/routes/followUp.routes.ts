import { Router, Request, Response } from 'express';
import { body, validationResult, param, query } from 'express-validator';
import { prisma } from '../server.js';
import { authMiddleware, AuthRequest, requirePermission, PERMISSIONS } from '../middleware/auth.middleware.js';

const router = Router();

// Get all follow-ups
router.get(
  '/',
  authMiddleware,
  query('status').optional().isIn(['PENDING', 'CONTACTED', 'SCHEDULED', 'COMPLETED', 'MISSED']),
  async (req: AuthRequest, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const where = status ? { status } : {};

      const followUps = await prisma.followUp.findMany({
        where,
        orderBy: { followUpDate: 'asc' },
        include: {
          patient: true,
          examination: true,
        },
      });

      // Categorize follow-ups
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      const categorized = {
        dueToday: followUps.filter(
          (f) =>
            f.followUpDate.getFullYear() === today.getFullYear() &&
            f.followUpDate.getMonth() === today.getMonth() &&
            f.followUpDate.getDate() === today.getDate()
        ),
        dueThisWeek: followUps.filter((f) => f.followUpDate > today && f.followUpDate <= weekFromNow),
        overdue: followUps.filter((f) => f.followUpDate < today && f.status !== 'COMPLETED'),
      };

      res.json({
        followUps,
        categorized,
      });
    } catch (error: any) {
      console.error('Error fetching follow-ups:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get follow-up by ID
router.get('/:id', authMiddleware, param('id').notEmpty(), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const followUp = await prisma.followUp.findUnique({
      where: { id },
      include: {
        patient: true,
        examination: true,
      },
    });

    if (!followUp) {
      return res.status(404).json({ error: 'Follow-up not found' });
    }

    res.json(followUp);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create follow-up
router.post(
  '/',
  authMiddleware,
  requirePermission([PERMISSIONS.CREATE_FOLLOWUPS]),
  [
    body('patientId').notEmpty(),
    body('reason').notEmpty().trim(),
    body('followUpDate').isISO8601(),
    body('status').isIn(['PENDING', 'CONTACTED', 'SCHEDULED', 'COMPLETED', 'MISSED']),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { patientId, examinationId, reason, followUpDate, assignedStaff, notes, status } = req.body;

      const followUp = await prisma.followUp.create({
        data: {
          patientId,
          examinationId: examinationId || null,
          reason,
          followUpDate: new Date(followUpDate),
          assignedStaff: assignedStaff || 'Unassigned',
          notes,
          status: status || 'PENDING',
        },
        include: {
          patient: true,
          examination: true,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'created',
          entity: 'FollowUp',
          entityId: followUp.id,
        },
      });

      // Create notification
      if (status === 'PENDING') {
        await prisma.notification.create({
          data: {
            title: 'Follow-up Scheduled',
            message: `Follow-up scheduled for ${followUp.patient.firstName} ${followUp.patient.lastName}`,
            type: 'FOLLOWUP_DUE',
          },
        });
      }

      res.status(201).json({
        message: 'Follow-up created successfully',
        followUp,
      });
    } catch (error: any) {
      console.error('Error creating follow-up:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Update follow-up
router.put(
  '/:id',
  authMiddleware,
  param('id').notEmpty(),
  body('status').optional().isIn(['PENDING', 'CONTACTED', 'SCHEDULED', 'COMPLETED', 'MISSED']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { reason, followUpDate, assignedStaff, notes, status } = req.body;

      const followUp = await prisma.followUp.update({
        where: { id },
        data: {
          reason,
          followUpDate: followUpDate ? new Date(followUpDate) : undefined,
          assignedStaff,
          notes,
          status,
        },
        include: {
          patient: true,
          examination: true,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'updated',
          entity: 'FollowUp',
          entityId: id,
        },
      });

      res.json({
        message: 'Follow-up updated successfully',
        followUp,
      });
    } catch (error: any) {
      console.error('Error updating follow-up:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
