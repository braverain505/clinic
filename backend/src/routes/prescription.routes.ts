import { Router, Request, Response } from 'express';
import { body, validationResult, param, query } from 'express-validator';
import PDFDocument from 'pdfkit';
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

// Generate prescription PDF
router.get('/:id/pdf', authMiddleware, param('id').notEmpty(), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        patient: true,
        examination: true,
        optometrist: { select: { fullName: true } },
      },
    });

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=prescription-${prescription.rxId}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(18).font('Helvetica-Bold').text('LISS EYE CARE SERVICES', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Premium Eye Care Management', { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#0ea5e9');
    doc.moveDown(0.5);

    // Title
    doc.fontSize(14).font('Helvetica-Bold').text('OPTICAL PRESCRIPTION', { align: 'center' });
    doc.moveDown(0.8);

    // Patient info
    doc.fontSize(10).font('Helvetica');
    const infoY = doc.y;
    doc.text('Patient:', 50, infoY, { continued: true });
    doc.text(` ${prescription.patient.firstName} ${prescription.patient.lastName}`);
    doc.text('Patient ID:', 50, doc.y, { continued: true });
    doc.text(` ${prescription.patient.patientId}`);
    doc.text('Date:', 50, doc.y, { continued: true });
    doc.text(` ${new Date(prescription.createdAt).toLocaleDateString('en-NG')}`);
    doc.text('Optometrist:', 50, doc.y, { continued: true });
    doc.text(` ${prescription.optometrist?.fullName || 'N/A'}`);
    doc.moveDown(0.8);

    // Refraction table
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e2e8f0');
    doc.moveDown(0.3);

    const tableTop = doc.y;
    doc.font('Helvetica-Bold').fontSize(9);
    doc.text('Eye', 50, tableTop, { width: 80 });
    doc.text('SPH', 140, tableTop, { width: 60, align: 'center' });
    doc.text('CYL', 210, tableTop, { width: 60, align: 'center' });
    doc.text('AXIS', 280, tableTop, { width: 60, align: 'center' });
    doc.text('ADD', 350, tableTop, { width: 60, align: 'center' });
    doc.text('PRISM', 420, tableTop, { width: 60, align: 'center' });
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e2e8f0');
    doc.moveDown(0.3);

    // OD row
    doc.font('Helvetica').fontSize(10);
    const rowY = doc.y;
    doc.text('OD (Right)', 50, rowY, { width: 80 });
    doc.text(prescription.rhSphere?.toFixed(2) || '—', 140, rowY, { width: 60, align: 'center' });
    doc.text(prescription.rhCylinder?.toFixed(2) || '—', 210, rowY, { width: 60, align: 'center' });
    doc.text(String(prescription.rhAxis ?? '—'), 280, rowY, { width: 60, align: 'center' });
    doc.text(prescription.rhAdd?.toFixed(2) || '—', 350, rowY, { width: 60, align: 'center' });
    doc.text(prescription.rhPrism?.toFixed(2) || '—', 420, rowY, { width: 60, align: 'center' });
    doc.moveDown(0.5);

    // OS row
    const rowY2 = doc.y;
    doc.text('OS (Left)', 50, rowY2, { width: 80 });
    doc.text(prescription.lhSphere?.toFixed(2) || '—', 140, rowY2, { width: 60, align: 'center' });
    doc.text(prescription.lhCylinder?.toFixed(2) || '—', 210, rowY2, { width: 60, align: 'center' });
    doc.text(String(prescription.lhAxis ?? '—'), 280, rowY2, { width: 60, align: 'center' });
    doc.text(prescription.lhAdd?.toFixed(2) || '—', 350, rowY2, { width: 60, align: 'center' });
    doc.text(prescription.lhPrism?.toFixed(2) || '—', 420, rowY2, { width: 60, align: 'center' });
    doc.moveDown(0.5);

    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e2e8f0');
    doc.moveDown(0.5);

    // PD
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('Pupillary Distance:', 50, doc.y, { continued: true });
    doc.font('Helvetica').text(` ${prescription.pupillaryDistance?.toFixed(1) || '—'} mm`);
    doc.moveDown(0.5);

    // Recommendations
    if (prescription.recommendations) {
      doc.font('Helvetica-Bold').fontSize(10).text('Recommendations:');
      doc.font('Helvetica').text(prescription.recommendations, { width: 500 });
      doc.moveDown(0.5);
    }

    // Review date
    if (prescription.reviewDate) {
      doc.font('Helvetica-Bold').fontSize(10).text('Review Date:', { continued: true });
      doc.font('Helvetica').text(` ${new Date(prescription.reviewDate).toLocaleDateString('en-NG')}`);
    }

    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e2e8f0');
    doc.moveDown(0.5);

    doc.fontSize(8).fillColor('#94a3b8');
    doc.text('This is a digital prescription generated by LISS Eye Care Services.', { align: 'center' });
    doc.text('Please retain for your records.', { align: 'center' });

    doc.end();
  } catch (error: any) {
    console.error('Error generating prescription PDF:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
