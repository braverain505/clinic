import { Router, Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import { prisma } from '../server.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// Global search across all entities
router.get(
  '/',
  authMiddleware,
  query('q').notEmpty().trim(),
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const searchTerm = req.query.q as string;
      const searchPattern = { contains: searchTerm, mode: 'insensitive' as const };

      const [patients, prescriptions, sales, products, payments] = await Promise.all([
        prisma.patient.findMany({
          where: {
            OR: [
              { firstName: searchPattern },
              { lastName: searchPattern },
              { phone: searchPattern },
              { email: searchPattern },
              { patientId: searchPattern },
            ],
          },
          take: 10,
        }),
        prisma.prescription.findMany({
          where: {
            OR: [
              { rxId: searchPattern },
              { patient: {
                OR: [
                  { firstName: searchPattern },
                  { lastName: searchPattern },
                ],
              }},
            ],
          },
          include: { patient: true },
          take: 10,
        }),
        prisma.opticalSale.findMany({
          where: {
            OR: [
              { invoiceId: searchPattern },
              { patient: {
                OR: [
                  { firstName: searchPattern },
                  { lastName: searchPattern },
                ],
              }},
            ],
          },
          include: { patient: true },
          take: 10,
        }),
        prisma.product.findMany({
          where: {
            OR: [
              { name: searchPattern },
              { sku: searchPattern },
              { brand: searchPattern },
              { barcode: searchPattern },
            ],
          },
          take: 10,
        }),
        prisma.payment.findMany({
          where: {
            OR: [
              { reference: searchPattern },
              { sale: {
                invoiceId: searchPattern,
              }},
            ],
          },
          include: { sale: true, patient: true },
          take: 10,
        }),
      ]);

      res.json({
        query: searchTerm,
        results: {
          patients: patients.map((p) => ({
            type: 'PATIENT',
            id: p.id,
            name: `${p.firstName} ${p.lastName}`,
            value: p.patientId,
            phone: p.phone,
          })),
          prescriptions: prescriptions.map((p) => ({
            type: 'PRESCRIPTION',
            id: p.id,
            name: `RX ${p.rxId} - ${p.patient.firstName} ${p.patient.lastName}`,
            value: p.rxId,
            patientId: p.patientId,
          })),
          sales: sales.map((s) => ({
            type: 'SALE',
            id: s.id,
            name: `INV ${s.invoiceId} - ${s.patient.firstName} ${s.patient.lastName}`,
            value: s.invoiceId,
            amount: s.total,
            patientId: s.patientId,
          })),
          products: products.map((p) => ({
            type: 'PRODUCT',
            id: p.id,
            name: p.name,
            value: p.sku,
            price: p.sellingPrice,
            stock: p.quantity,
          })),
          payments: payments.map((p) => ({
            type: 'PAYMENT',
            id: p.id,
            name: `Payment for ${p.sale.invoiceId}`,
            value: p.reference,
            amount: p.amount,
          })),
        },
        summary: {
          patients: patients.length,
          prescriptions: prescriptions.length,
          sales: sales.length,
          products: products.length,
          payments: payments.length,
          total: patients.length + prescriptions.length + sales.length + products.length + payments.length,
        },
      });
    } catch (error: any) {
      console.error('Search error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
