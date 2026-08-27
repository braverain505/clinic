import { Router, Request, Response } from 'express';
import { body, validationResult, param, query } from 'express-validator';
import { prisma } from '../server.js';
import { authMiddleware, AuthRequest, requirePermission, PERMISSIONS } from '../middleware/auth.middleware.js';

const router = Router();

// Get all examinations
router.get(
  '/',
  authMiddleware,
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('patientId').optional().isString(),
  async (req: AuthRequest, res: Response) => {
    try {
      const page = (req.query.page as any) || 1;
      const limit = (req.query.limit as any) || 10;
      const patientId = req.query.patientId as string | undefined;

      const skip = (page - 1) * limit;
      const where = patientId ? { patientId } : {};

      const [examinations, total] = await Promise.all([
        prisma.eyeExamination.findMany({
          where,
          skip,
          take: limit,
          orderBy: { examinationDate: 'desc' },
          include: {
            patient: true,
            optometrist: { select: { id: true, fullName: true, email: true } },
          },
        }),
        prisma.eyeExamination.count({ where }),
      ]);

      res.json({
        examinations,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      console.error('Error fetching examinations:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get examination by ID
router.get(
  '/:id',
  authMiddleware,
  param('id').notEmpty(),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const examination = await prisma.eyeExamination.findUnique({
        where: { id },
        include: {
          patient: true,
          optometrist: { select: { id: true, fullName: true, email: true } },
          prescriptions: true,
        },
      });

      if (!examination) {
        return res.status(404).json({ error: 'Examination not found' });
      }

      res.json(examination);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Create eye examination
router.post(
  '/',
  authMiddleware,
  requirePermission([PERMISSIONS.CREATE_EXAMINATIONS]),
  [
    body('patientId').notEmpty(),
    body('vaRightDistance').optional().isString(),
    body('vaLeftDistance').optional().isString(),
    body('rhSphere').optional().isFloat(),
    body('rhCylinder').optional().isFloat(),
    body('rhAxis').optional().isFloat(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { patientId, examinationDate, vaRightDistance, vaLeftDistance, vaBothDistance, vaRightNear, vaLeftNear, vaBothNear, rhSphere, rhCylinder, rhAxis, rhAdd, rhPrism, lhSphere, lhCylinder, lhAxis, lhAdd, lhPrism, pupillaryDistance, nearPD, tonometry, colourVision, keratometry, visualFields, otherTests, clinicalNotes, diagnosis, treatment } =
        req.body;

      const examination = await prisma.eyeExamination.create({
        data: {
          patientId,
          userId: req.user!.id,
          examinationDate: examinationDate ? new Date(examinationDate) : new Date(),
          vaRightDistance,
          vaLeftDistance,
          vaBothDistance,
          vaRightNear,
          vaLeftNear,
          vaBothNear,
          rhSphere: rhSphere ? parseFloat(rhSphere) : null,
          rhCylinder: rhCylinder ? parseFloat(rhCylinder) : null,
          rhAxis: rhAxis ? parseFloat(rhAxis) : null,
          rhAdd: rhAdd ? parseFloat(rhAdd) : null,
          rhPrism: rhPrism ? parseFloat(rhPrism) : null,
          lhSphere: lhSphere ? parseFloat(lhSphere) : null,
          lhCylinder: lhCylinder ? parseFloat(lhCylinder) : null,
          lhAxis: lhAxis ? parseFloat(lhAxis) : null,
          lhAdd: lhAdd ? parseFloat(lhAdd) : null,
          lhPrism: lhPrism ? parseFloat(lhPrism) : null,
          pupillaryDistance: pupillaryDistance ? parseFloat(pupillaryDistance) : null,
          nearPD: nearPD ? parseFloat(nearPD) : null,
          tonometry,
          colourVision,
          keratometry,
          visualFields,
          otherTests,
          clinicalNotes,
          diagnosis,
          treatment,
        },
        include: { patient: true, optometrist: true },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'created',
          entity: 'EyeExamination',
          entityId: examination.id,
        },
      });

      res.status(201).json({
        message: 'Eye examination created successfully',
        examination,
      });
    } catch (error: any) {
      console.error('Error creating examination:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Update examination
router.put(
  '/:id',
  authMiddleware,
  param('id').notEmpty(),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { vaRightDistance, vaLeftDistance, vaBothDistance, vaRightNear, vaLeftNear, vaBothNear, rhSphere, rhCylinder, rhAxis, rhAdd, rhPrism, lhSphere, lhCylinder, lhAxis, lhAdd, lhPrism, pupillaryDistance, nearPD, tonometry, colourVision, keratometry, visualFields, otherTests, clinicalNotes, diagnosis, treatment } =
        req.body;

      const examination = await prisma.eyeExamination.update({
        where: { id },
        data: {
          vaRightDistance,
          vaLeftDistance,
          vaBothDistance,
          vaRightNear,
          vaLeftNear,
          vaBothNear,
          rhSphere: rhSphere !== undefined ? parseFloat(rhSphere) : undefined,
          rhCylinder: rhCylinder !== undefined ? parseFloat(rhCylinder) : undefined,
          rhAxis: rhAxis !== undefined ? parseFloat(rhAxis) : undefined,
          rhAdd: rhAdd !== undefined ? parseFloat(rhAdd) : undefined,
          rhPrism: rhPrism !== undefined ? parseFloat(rhPrism) : undefined,
          lhSphere: lhSphere !== undefined ? parseFloat(lhSphere) : undefined,
          lhCylinder: lhCylinder !== undefined ? parseFloat(lhCylinder) : undefined,
          lhAxis: lhAxis !== undefined ? parseFloat(lhAxis) : undefined,
          lhAdd: lhAdd !== undefined ? parseFloat(lhAdd) : undefined,
          lhPrism: lhPrism !== undefined ? parseFloat(lhPrism) : undefined,
          pupillaryDistance: pupillaryDistance !== undefined ? parseFloat(pupillaryDistance) : undefined,
          nearPD: nearPD !== undefined ? parseFloat(nearPD) : undefined,
          tonometry,
          colourVision,
          keratometry,
          visualFields,
          otherTests,
          clinicalNotes,
          diagnosis,
          treatment,
        },
        include: { patient: true, optometrist: true },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'updated',
          entity: 'EyeExamination',
          entityId: id,
        },
      });

      res.json({
        message: 'Examination updated successfully',
        examination,
      });
    } catch (error: any) {
      console.error('Error updating examination:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
