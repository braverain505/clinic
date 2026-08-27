import { Router, Request, Response } from 'express';
import { body, validationResult, param, query } from 'express-validator';
import { prisma } from '../server.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// Get all prescriptions
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

      const [prescriptions, total] = await Promise.all([
        prisma.prescription.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            patient: true,
            examination: true,
            optometrist: { select: { id: true, fullName: true } },
          },
        }),
        prisma.prescription.count({ where }),
      ]);

      res.json({
        prescriptions,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      console.error('Error fetching prescriptions:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get prescription by ID
router.get(
  '/:id',
  authMiddleware,
  param('id').notEmpty(),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const prescription = await prisma.prescription.findUnique({
        where: { id },
        include: {
          patient: true,
          examination: true,
          optometrist: { select: { id: true, fullName: true } },
        },
      });

      if (!prescription) {
        return res.status(404).json({ error: 'Prescription not found' });
      }

      res.json(prescription);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Create prescription from examination
router.post(
  '/',
  authMiddleware,
  [body('patientId').notEmpty(), body('examinationId').notEmpty()],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { patientId, examinationId, rhSphere, rhCylinder, rhAxis, rhAdd, rhPrism, lhSphere, lhCylinder, lhAxis, lhAdd, lhPrism, pupillaryDistance, recommendations, reviewDate } = req.body;

      // Get examination data
      const examination = await prisma.eyeExamination.findUnique({
        where: { id: examinationId },
      });

      if (!examination) {
        return res.status(404).json({ error: 'Examination not found' });
      }

      const prescription = await prisma.prescription.create({
        data: {
          patientId,
          examinationId,
          userId: req.user!.id,
          rhSphere: rhSphere !== undefined ? parseFloat(rhSphere) : examination.rhSphere,
          rhCylinder: rhCylinder !== undefined ? parseFloat(rhCylinder) : examination.rhCylinder,
          rhAxis: rhAxis !== undefined ? parseFloat(rhAxis) : examination.rhAxis,
          rhAdd: rhAdd !== undefined ? parseFloat(rhAdd) : examination.rhAdd,
          rhPrism: rhPrism !== undefined ? parseFloat(rhPrism) : examination.rhPrism,
          lhSphere: lhSphere !== undefined ? parseFloat(lhSphere) : examination.lhSphere,
          lhCylinder: lhCylinder !== undefined ? parseFloat(lhCylinder) : examination.lhCylinder,
          lhAxis: lhAxis !== undefined ? parseFloat(lhAxis) : examination.lhAxis,
          lhAdd: lhAdd !== undefined ? parseFloat(lhAdd) : examination.lhAdd,
          lhPrism: lhPrism !== undefined ? parseFloat(lhPrism) : examination.lhPrism,
          pupillaryDistance: pupillaryDistance !== undefined ? parseFloat(pupillaryDistance) : examination.pupillaryDistance,
          recommendations,
          reviewDate: reviewDate ? new Date(reviewDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
        include: { patient: true, examination: true, optometrist: true },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'created',
          entity: 'Prescription',
          entityId: prescription.id,
        },
      });

      res.status(201).json({
        message: 'Prescription created successfully',
        prescription,
      });
    } catch (error: any) {
      console.error('Error creating prescription:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Update prescription
router.put(
  '/:id',
  authMiddleware,
  param('id').notEmpty(),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { rhSphere, rhCylinder, rhAxis, rhAdd, rhPrism, lhSphere, lhCylinder, lhAxis, lhAdd, lhPrism, pupillaryDistance, recommendations, reviewDate } = req.body;

      const prescription = await prisma.prescription.update({
        where: { id },
        data: {
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
          recommendations,
          reviewDate: reviewDate ? new Date(reviewDate) : undefined,
        },
        include: { patient: true, examination: true, optometrist: true },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'updated',
          entity: 'Prescription',
          entityId: id,
        },
      });

      res.json({
        message: 'Prescription updated successfully',
        prescription,
      });
    } catch (error: any) {
      console.error('Error updating prescription:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
