import { Router, Request, Response } from 'express';
import { body, validationResult, param } from 'express-validator';
import { prisma } from '../server.js';
import { authMiddleware, AuthRequest, requirePermission, PERMISSIONS } from '../middleware/auth.middleware.js';

const router = Router();

// Get all suppliers
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(suppliers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get supplier by ID
router.get('/:id', authMiddleware, param('id').notEmpty(), async (req: AuthRequest, res: Response) => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: req.params.id },
      include: { purchaseOrders: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    res.json(supplier);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create supplier
router.post('/', authMiddleware, requirePermission([PERMISSIONS.CREATE_SUPPLIERS]), [
  body('company').notEmpty().trim(),
  body('phone').notEmpty().trim(),
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { company, contactName, phone, email, address, paymentTerms, notes } = req.body;
    const supplier = await prisma.supplier.create({
      data: { company, contactName, phone, email, address, paymentTerms, notes },
    });

    await prisma.auditLog.create({
      data: { userId: req.user!.id, action: 'created', entity: 'Supplier', entityId: supplier.id },
    });

    res.status(201).json({ message: 'Supplier created', supplier });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update supplier
router.put('/:id', authMiddleware, param('id').notEmpty(), async (req: AuthRequest, res: Response) => {
  try {
    const { company, contactName, phone, email, address, paymentTerms, notes, status } = req.body;
    const supplier = await prisma.supplier.update({
      where: { id: req.params.id },
      data: { company, contactName, phone, email, address, paymentTerms, notes, status },
    });

    await prisma.auditLog.create({
      data: { userId: req.user!.id, action: 'updated', entity: 'Supplier', entityId: supplier.id },
    });

    res.json({ message: 'Supplier updated', supplier });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create purchase order
router.post('/purchase-orders', authMiddleware, [
  body('supplierId').notEmpty(),
  body('items').isArray({ min: 1 }),
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { supplierId, items, notes } = req.body;
    const total = items.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0);

    const po = await prisma.purchaseOrder.create({
      data: {
        supplierId,
        userId: req.user!.id,
        total,
        notes,
        items: {
          create: items.map((item: any) => ({
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
      },
      include: { items: true, supplier: true },
    });

    await prisma.auditLog.create({
      data: { userId: req.user!.id, action: 'created', entity: 'PurchaseOrder', entityId: po.id },
    });

    res.status(201).json({ message: 'Purchase order created', po });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all purchase orders
router.get('/purchase-orders/all', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const pos = await prisma.purchaseOrder.findMany({
      orderBy: { createdAt: 'desc' },
      include: { supplier: true, items: true },
      take: 50,
    });
    res.json(pos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update purchase order status
router.put('/purchase-orders/:id/status', authMiddleware, param('id').notEmpty(), async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const po = await prisma.purchaseOrder.update({
      where: { id: req.params.id },
      data: { status },
      include: { items: true, supplier: true },
    });

    // If received, update inventory
    if (status === 'RECEIVED') {
      for (const item of po.items) {
        if (item.productId) {
          const product = await prisma.product.findUnique({ where: { id: item.productId } });
          if (product) {
            const newQty = product.quantity + item.quantity;
            await prisma.product.update({ where: { id: item.productId }, data: { quantity: newQty } });
            await prisma.stockMovement.create({
              data: {
                productId: item.productId,
                previousQuantity: product.quantity,
                quantityChanged: item.quantity,
                newQuantity: newQty,
                reason: 'PURCHASE',
                userId: req.user!.id,
              },
            });
          }
        }
      }
    }

    res.json({ message: 'Status updated', po });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
