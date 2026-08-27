import { Router, Request, Response } from 'express';
import { body, validationResult, param } from 'express-validator';
import { prisma } from '../server.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// Get all payments
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { paymentDate: 'desc' },
      include: {
        patient: true,
        sale: true,
        receivedBy: { select: { id: true, fullName: true } },
      },
      take: 100,
    });

    res.json(payments);
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get payment by ID
router.get('/:id', authMiddleware, param('id').notEmpty(), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        patient: true,
        sale: { include: { items: { include: { product: true } } } },
        receivedBy: { select: { id: true, fullName: true } },
      },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Record payment for a sale
router.post(
  '/',
  authMiddleware,
  [
    body('saleId').notEmpty(),
    body('amount').isFloat({ min: 0.01 }),
    body('paymentMethod').isIn(['CASH', 'BANK_TRANSFER', 'POS', 'CARD']),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { saleId, amount, paymentMethod, reference, paymentDate } = req.body;

      // Get sale
      const sale = await prisma.opticalSale.findUnique({ where: { id: saleId } });
      if (!sale) {
        return res.status(404).json({ error: 'Sale not found' });
      }

      // Validate payment amount
      const paymentAmount = parseFloat(amount);
      if (paymentAmount > sale.outstandingBalance && sale.paymentStatus !== 'UNPAID') {
        return res.status(400).json({ error: 'Payment amount exceeds outstanding balance' });
      }

      // Create payment
      const payment = await prisma.payment.create({
        data: {
          saleId,
          patientId: sale.patientId,
          amount: paymentAmount,
          paymentMethod,
          reference,
          userId: req.user!.id,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        },
        include: {
          patient: true,
          sale: true,
          receivedBy: { select: { id: true, fullName: true } },
        },
      });

      // Update sale payment status and outstanding balance
      const newAmountPaid = sale.amountPaid + paymentAmount;
      const newOutstandingBalance = sale.total - newAmountPaid;
      const newPaymentStatus =
        newOutstandingBalance === 0 ? 'PAID' : newOutstandingBalance < sale.total ? 'PARTIALLY_PAID' : 'UNPAID';

      await prisma.opticalSale.update({
        where: { id: saleId },
        data: {
          amountPaid: newAmountPaid,
          outstandingBalance: Math.max(0, newOutstandingBalance),
          paymentStatus: newPaymentStatus,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'created',
          entity: 'Payment',
          entityId: payment.id,
          changes: JSON.stringify({ amount: paymentAmount, paymentMethod }),
        },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          title: 'Payment Received',
          message: `Payment of ₦${paymentAmount.toLocaleString('en-NG')} received from ${sale.patientId}`,
          type: 'PAYMENT_RECEIVED',
        },
      });

      res.status(201).json({
        message: 'Payment recorded successfully',
        payment,
      });
    } catch (error: any) {
      console.error('Error recording payment:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get outstanding payments summary
router.get('/summary/outstanding', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const outstandingSales = await prisma.opticalSale.findMany({
      where: {
        paymentStatus: { in: ['UNPAID', 'PARTIALLY_PAID'] },
      },
      include: {
        patient: true,
        payments: true,
      },
    });

    const totalOutstanding = outstandingSales.reduce((sum, sale) => sum + sale.outstandingBalance, 0);
    const count = outstandingSales.length;

    res.json({
      totalOutstanding,
      count,
      sales: outstandingSales,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
