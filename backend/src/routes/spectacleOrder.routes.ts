import { Router, Request, Response } from 'express';
import { body, validationResult, param } from 'express-validator';
import { prisma } from '../server.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// Get all spectacle orders
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.spectacleOrder.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        patient: true,
        prescription: true,
        supplier: true,
        createdBy: { select: { fullName: true } },
      },
      take: 50,
    });
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get order by ID
router.get('/:id', authMiddleware, param('id').notEmpty(), async (req: AuthRequest, res: Response) => {
  try {
    const order = await prisma.spectacleOrder.findUnique({
      where: { id: req.params.id },
      include: {
        patient: true,
        prescription: true,
        supplier: true,
        createdBy: { select: { fullName: true } },
      },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create spectacle order
router.post('/', authMiddleware, [
  body('patientId').notEmpty(),
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {
      patientId, prescriptionId, frameProduct, lensProduct,
      pd, rightFittingHeight, leftFittingHeight, segmentHeight,
      notes, supplierId, cost, sellingPrice, expectedCompletion,
    } = req.body;

    const order = await prisma.spectacleOrder.create({
      data: {
        patientId,
        prescriptionId: prescriptionId || null,
        frameProduct,
        lensProduct,
        pd: pd ? parseFloat(pd) : null,
        rightFittingHeight: rightFittingHeight ? parseFloat(rightFittingHeight) : null,
        leftFittingHeight: leftFittingHeight ? parseFloat(leftFittingHeight) : null,
        segmentHeight: segmentHeight ? parseFloat(segmentHeight) : null,
        notes,
        supplierId: supplierId || null,
        cost: cost ? parseFloat(cost) : null,
        sellingPrice: sellingPrice ? parseFloat(sellingPrice) : null,
        expectedCompletion: expectedCompletion ? new Date(expectedCompletion) : null,
        userId: req.user!.id,
      },
      include: { patient: true, prescription: true, supplier: true },
    });

    await prisma.auditLog.create({
      data: { userId: req.user!.id, action: 'created', entity: 'SpectacleOrder', entityId: order.id },
    });

    res.status(201).json({ message: 'Spectacle order created', order });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update order status
router.put('/:id/status', authMiddleware, param('id').notEmpty(), async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const order = await prisma.spectacleOrder.update({
      where: { id: req.params.id },
      data: { status },
      include: { patient: true },
    });

    await prisma.auditLog.create({
      data: { userId: req.user!.id, action: 'updated', entity: 'SpectacleOrder', entityId: order.id },
    });

    res.json({ message: 'Status updated', order });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update order details
router.put('/:id', authMiddleware, param('id').notEmpty(), async (req: AuthRequest, res: Response) => {
  try {
    const {
      frameProduct, lensProduct, pd, rightFittingHeight, leftFittingHeight,
      segmentHeight, notes, supplierId, cost, sellingPrice, expectedCompletion, status,
    } = req.body;

    const order = await prisma.spectacleOrder.update({
      where: { id: req.params.id },
      data: {
        frameProduct, lensProduct,
        pd: pd !== undefined ? parseFloat(pd) : undefined,
        rightFittingHeight: rightFittingHeight !== undefined ? parseFloat(rightFittingHeight) : undefined,
        leftFittingHeight: leftFittingHeight !== undefined ? parseFloat(leftFittingHeight) : undefined,
        segmentHeight: segmentHeight !== undefined ? parseFloat(segmentHeight) : undefined,
        notes,
        supplierId,
        cost: cost !== undefined ? parseFloat(cost) : undefined,
        sellingPrice: sellingPrice !== undefined ? parseFloat(sellingPrice) : undefined,
        expectedCompletion: expectedCompletion ? new Date(expectedCompletion) : undefined,
        status,
      },
      include: { patient: true },
    });

    res.json({ message: 'Order updated', order });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
