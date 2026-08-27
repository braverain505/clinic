import { Router, Request, Response } from 'express';
import { param, validationResult } from 'express-validator';
import PDFDocument from 'pdfkit';
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
        sale: { include: { items: { include: { product: true } }, patient: true } },
      },
    });

    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${receipt.receiptNumber}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(18).font('Helvetica-Bold').text('LISS EYE CARE SERVICES', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Premium Eye Care Management', { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#0ea5e9');
    doc.moveDown(0.5);

    // Receipt info
    doc.fontSize(14).font('Helvetica-Bold').text('RECEIPT', { align: 'center' });
    doc.moveDown(0.5);

    doc.fontSize(10).font('Helvetica');
    doc.text(`Receipt Number: ${receipt.receiptNumber}`, 50, doc.y, { continued: true });
    doc.text(`  |  Invoice: ${receipt.invoiceNumber}`, { align: 'right' });
    doc.moveDown(0.3);
    doc.text(`Date: ${new Date(receipt.createdAt).toLocaleDateString('en-NG')}`, 50, doc.y, { continued: true });
    doc.text(`  |  Patient: ${receipt.patientName}`, { align: 'right' });
    doc.moveDown(0.8);

    // Table header
    const tableTop = doc.y;
    doc.font('Helvetica-Bold').fontSize(9);
    doc.text('Item', 50, tableTop, { width: 250 });
    doc.text('Qty', 310, tableTop, { width: 50, align: 'center' });
    doc.text('Unit Price', 370, tableTop, { width: 80, align: 'right' });
    doc.text('Total', 470, tableTop, { width: 80, align: 'right' });
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e2e8f0');
    doc.moveDown(0.3);

    // Table rows
    doc.font('Helvetica').fontSize(9);
    const items = receipt.items ? JSON.parse(receipt.items) : [];
    items.forEach((item: any) => {
      doc.text(item.name, 50, doc.y, { width: 250 });
      doc.text(String(item.quantity), 310, doc.y - 14, { width: 50, align: 'center' });
      doc.text(`₦${item.unitPrice.toLocaleString('en-NG')}`, 370, doc.y - 14, { width: 80, align: 'right' });
      doc.text(`₦${item.total.toLocaleString('en-NG')}`, 470, doc.y - 14, { width: 80, align: 'right' });
      doc.moveDown(0.3);
    });

    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e2e8f0');
    doc.moveDown(0.5);

    // Totals
    const totalsX = 370;
    doc.font('Helvetica').fontSize(10);
    doc.text('Subtotal:', totalsX, doc.y, { width: 80, align: 'right' });
    doc.text(`₦${receipt.subtotal.toLocaleString('en-NG')}`, 470, doc.y - 14, { width: 80, align: 'right' });
    doc.moveDown(0.3);

    if (receipt.discount > 0) {
      doc.text('Discount:', totalsX, doc.y, { width: 80, align: 'right' });
      doc.text(`-₦${receipt.discount.toLocaleString('en-NG')}`, 470, doc.y - 14, { width: 80, align: 'right' });
      doc.moveDown(0.3);
    }

    doc.font('Helvetica-Bold').fontSize(11);
    doc.text('Grand Total:', totalsX, doc.y, { width: 80, align: 'right' });
    doc.text(`₦${receipt.grandTotal.toLocaleString('en-NG')}`, 470, doc.y - 15, { width: 80, align: 'right' });
    doc.moveDown(0.5);

    doc.font('Helvetica').fontSize(10);
    doc.text('Amount Paid:', totalsX, doc.y, { width: 80, align: 'right' });
    doc.text(`₦${receipt.amountPaid.toLocaleString('en-NG')}`, 470, doc.y - 14, { width: 80, align: 'right' });
    doc.moveDown(0.3);

    if (receipt.balance > 0) {
      doc.font('Helvetica-Bold').text('Balance Due:', totalsX, doc.y, { width: 80, align: 'right' });
      doc.font('Helvetica-Bold').text(`₦${receipt.balance.toLocaleString('en-NG')}`, 470, doc.y - 14, { width: 80, align: 'right' });
      doc.moveDown(0.5);
    }

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e2e8f0');
    doc.moveDown(0.5);

    doc.fontSize(9).font('Helvetica');
    doc.text(`Payment Method: ${receipt.paymentMethod.replace('_', ' ')}`, 50);
    doc.text(`Received By: ${receipt.receivedBy}`, 50);
    doc.moveDown(1);

    doc.fontSize(8).fillColor('#94a3b8');
    doc.text('Thank you for choosing LISS Eye Care Services.', { align: 'center' });
    doc.text('For enquiries, please contact us.', { align: 'center' });

    doc.end();
  } catch (error: any) {
    console.error('Error generating receipt PDF:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
