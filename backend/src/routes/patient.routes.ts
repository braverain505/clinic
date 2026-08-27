import { Router, Request, Response } from 'express';
import { body, validationResult, param, query } from 'express-validator';
import { prisma } from '../server.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// Get all patients with pagination and search
router.get(
  '/',
  authMiddleware,
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().isString(),
  async (req: AuthRequest, res: Response) => {
    try {
      const page = (req.query.page as any) || 1;
      const limit = (req.query.limit as any) || 10;
      const search = (req.query.search as string) || '';

      const skip = (page - 1) * limit;

      const where = search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' as const } },
              { lastName: { contains: search, mode: 'insensitive' as const } },
              { phone: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
              { patientId: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {};

      const [patients, total] = await Promise.all([
        prisma.patient.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            examinations: { take: 1, orderBy: { examinationDate: 'desc' } },
            opticalSales: { take: 1, orderBy: { createdAt: 'desc' } },
          },
        }),
        prisma.patient.count({ where }),
      ]);

      res.json({
        patients,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get patient by ID
router.get(
  '/:id',
  authMiddleware,
  param('id').notEmpty(),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const patient = await prisma.patient.findUnique({
        where: { id },
        include: {
          examinations: { orderBy: { examinationDate: 'desc' } },
          prescriptions: { orderBy: { createdAt: 'desc' } },
          opticalSales: { orderBy: { createdAt: 'desc' } },
          payments: { orderBy: { createdAt: 'desc' } },
          followUps: { orderBy: { followUpDate: 'desc' } },
        },
      });

      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      res.json(patient);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Create new patient
router.post(
  '/',
  authMiddleware,
  [
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim(),
    body('phone').notEmpty().trim(),
    body('gender').isIn(['MALE', 'FEMALE', 'OTHER']),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { firstName, lastName, phone, email, gender, dateOfBirth, address, city, state, country, medicalHistory, ocularHistory, allergies } =
        req.body;

      const patient = await prisma.patient.create({
        data: {
          firstName,
          lastName,
          phone,
          email,
          gender,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          address,
          city,
          state,
          country,
          medicalHistory,
          ocularHistory,
          allergies,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'created',
          entity: 'Patient',
          entityId: patient.id,
          changes: JSON.stringify(patient),
        },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          title: 'New Patient Registered',
          message: `${firstName} ${lastName} registered as a new patient`,
          type: 'PATIENT_REGISTERED',
        },
      });

      res.status(201).json({
        message: 'Patient created successfully',
        patient,
      });
    } catch (error: any) {
      console.error('Error creating patient:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Update patient
router.put(
  '/:id',
  authMiddleware,
  param('id').notEmpty(),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { firstName, lastName, phone, email, gender, dateOfBirth, address, city, state, country, medicalHistory, ocularHistory, allergies } =
        req.body;

      const patient = await prisma.patient.update({
        where: { id },
        data: {
          firstName,
          lastName,
          phone,
          email,
          gender,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          address,
          city,
          state,
          country,
          medicalHistory,
          ocularHistory,
          allergies,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'updated',
          entity: 'Patient',
          entityId: patient.id,
          changes: JSON.stringify(req.body),
        },
      });

      res.json({
        message: 'Patient updated successfully',
        patient,
      });
    } catch (error: any) {
      console.error('Error updating patient:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete patient
router.delete(
  '/:id',
  authMiddleware,
  param('id').notEmpty(),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      await prisma.patient.delete({ where: { id } });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'deleted',
          entity: 'Patient',
          entityId: id,
        },
      });

      res.json({ message: 'Patient deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting patient:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
