import { Router, Request, Response } from 'express';
import { body, validationResult, param, query } from 'express-validator';
import { prisma } from '../server.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// Get all optical sales
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

      const [sales, total] = await Promise.all([
        prisma.opticalSale.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            patient: true,
            prescription: true,
            items: { include: { product: true } },
          },
        }),
        prisma.opticalSale.count({ where }),
      ]);

      res.json({
        sales,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      console.error('Error fetching sales:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get sale by ID
router.get(
  '/:id',
  authMiddleware,
  param('id').notEmpty(),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const sale = await prisma.opticalSale.findUnique({
        where: { id },
        include: {
          patient: true,
          prescription: true,
          items: { include: { product: true } },
          payments: true,
        },
      });

      if (!sale) {
        return res.status(404).json({ error: 'Sale not found' });
      }

      res.json(sale);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Create new optical sale
router.post(
  '/',
  authMiddleware,
  [
    body('patientId').notEmpty(),
    body('items').isArray({ min: 1 }),
    body('items.*.productId').notEmpty(),
    body('items.*.quantity').isInt({ min: 1 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { patientId, prescriptionId, items, discount = 0, paymentStatus = 'UNPAID' } = req.body;

      // Validate patient exists
      const patient = await prisma.patient.findUnique({ where: { id: patientId } });
      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      // Get product details and calculate totals
      let subtotal = 0;
      const saleItems = [];

      for (const item of items) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (!product) {
          return res.status(404).json({ error: `Product ${item.productId} not found` });
        }

        if (product.quantity < item.quantity) {
          return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
        }

        const itemTotal = product.sellingPrice * item.quantity;
        subtotal += itemTotal;

        saleItems.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice: product.sellingPrice,
          total: itemTotal,
        });
      }

      const discountAmount = Math.min(parseFloat(discount) || 0, subtotal);
      const total = subtotal - discountAmount;
      const amountPaid = paymentStatus === 'PAID' ? total : 0;
      const outstandingBalance = total - amountPaid;

      // Create sale with items
      const sale = await prisma.opticalSale.create({
        data: {
          patientId,
          prescriptionId: prescriptionId || null,
          subtotal,
          discount: discountAmount,
          total,
          paymentStatus,
          amountPaid,
          outstandingBalance,
          items: {
            create: saleItems,
          },
        },
        include: {
          patient: true,
          prescription: true,
          items: { include: { product: true } },
        },
      });

      // Update inventory and create stock movements
      for (const item of saleItems) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (product) {
          const newQuantity = product.quantity - item.quantity;

          await prisma.product.update({
            where: { id: item.productId },
            data: { quantity: newQuantity },
          });

          // Create stock movement record
          await prisma.stockMovement.create({
            data: {
              productId: item.productId,
              previousQuantity: product.quantity,
              quantityChanged: -item.quantity,
              newQuantity,
              reason: 'SALE',
              userId: req.user!.id,
            },
          });

          // Check if low stock and create notification
          if (newQuantity <= product.minimumStock) {
            await prisma.notification.create({
              data: {
                title: 'Low Stock Alert',
                message: `${product.name} inventory at ${newQuantity} units (minimum: ${product.minimumStock})`,
                type: 'LOW_STOCK',
              },
            });
          }
        }
      }

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'created',
          entity: 'OpticalSale',
          entityId: sale.id,
          changes: JSON.stringify({ total, items: saleItems.length }),
        },
      });

      res.status(201).json({
        message: 'Optical sale created successfully',
        sale,
      });
    } catch (error: any) {
      console.error('Error creating sale:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Update sale payment status
router.put(
  '/:id/payment-status',
  authMiddleware,
  param('id').notEmpty(),
  body('paymentStatus').isIn(['UNPAID', 'PARTIALLY_PAID', 'PAID']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { paymentStatus } = req.body;

      const sale = await prisma.opticalSale.update({
        where: { id },
        data: { paymentStatus },
        include: { items: { include: { product: true } } },
      });

      res.json({
        message: 'Payment status updated',
        sale,
      });
    } catch (error: any) {
      console.error('Error updating sale:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
