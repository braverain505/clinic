import { Router, Request, Response } from 'express';
import { param, validationResult } from 'express-validator';
import { prisma } from '../server.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// Get all receipts
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const receipts = await prisma.receipt.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        sale: { include: { items: { include: { product: true } } } },
      },
      take: 50,
    });

    res.json(receipts);
  } catch (error: any) {
    console.error('Error fetching receipts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get receipt by ID
router.get('/:id', authMiddleware, param('id').notEmpty(), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: {
        sale: { include: { items: { include: { product: true } } } },
      },
    });

    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    res.json(receipt);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create receipt for a sale
router.post('/', authMiddleware, param('saleId'), async (req: AuthRequest, res: Response) => {
  try {
    const { saleId } = req.body;

    // Get sale details
    const sale = await prisma.opticalSale.findUnique({
      where: { id: saleId },
      include: {
        patient: true,
        items: { include: { product: true } },
        payments: { orderBy: { paymentDate: 'desc' }, take: 1 },
      },
    });

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    // Check if receipt already exists
    const existing = await prisma.receipt.findFirst({
      where: { saleId },
    });

    if (existing) {
      return res.status(400).json({ error: 'Receipt already exists for this sale' });
    }

    // Create receipt
    const receipt = await prisma.receipt.create({
      data: {
        saleId,
        patientName: `${sale.patient.firstName} ${sale.patient.lastName}`,
        patientId: sale.patientId,
        invoiceNumber: sale.invoiceId,
        items: JSON.stringify(
          sale.items.map((item) => ({
            name: item.product.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          }))
        ),
        subtotal: sale.subtotal,
        discount: sale.discount,
        grandTotal: sale.total,
        amountPaid: sale.amountPaid,
        balance: sale.outstandingBalance,
        paymentMethod: sale.payments.length > 0 ? sale.payments[0].paymentMethod : 'N/A',
        receivedBy: req.user!.id,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'created',
        entity: 'Receipt',
        entityId: receipt.id,
        changes: JSON.stringify({ saleId }),
      },
    });

    res.status(201).json({
      message: 'Receipt created successfully',
      receipt,
    });
  } catch (error: any) {
    console.error('Error creating receipt:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate receipt PDF
router.get('/:id/pdf', authMiddleware, param('id').notEmpty(), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: {
        sale: { include: { items: { include: { product: true } } } },
      },
    });

    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    // For now, return JSON. In production, would use pdfkit or similar
    res.json({
      message: 'PDF generation would be implemented here',
      receipt,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
