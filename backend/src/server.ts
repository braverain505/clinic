import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

// Load environment variables
dotenv.config();

// Initialize Prisma
const prisma = new PrismaClient();

// ─── Auto-setup: ensure admin accounts exist on startup ───
async function autoSetup() {
  try {
    const defaultPassword = process.env.ADMIN_PASSWORD || 'password123';
    const hashed = await bcryptjs.hash(defaultPassword, 10);

    const accounts = [
      { email: 'admin@lisseyecare.com', fullName: 'Adewale Ogunleye', role: 'OWNER', pos: 'General Manager' },
      { email: 'owner@lisseyecare.com', fullName: 'Chief Mrs. Folake Ogunleye', role: 'OWNER', pos: 'Owner / Director' },
    ];

    for (const acct of accounts) {
      const existing = await prisma.user.findUnique({ where: { email: acct.email } });
      if (!existing) {
        const user = await prisma.user.create({
          data: { email: acct.email, password: hashed, fullName: acct.fullName, role: acct.role as any },
        });
        await prisma.staff.create({
          data: { userId: user.id, phone: '+2348000000000', department: 'Management', position: acct.pos, employmentDate: new Date() },
        });
        console.log(`✅ Created ${acct.email} with role ${acct.role}`);
      } else if (existing.role !== acct.role) {
        await prisma.user.update({ where: { email: acct.email }, data: { role: acct.role as any } });
        console.log(`⬆️  Promoted ${acct.email} from ${existing.role} to ${acct.role}`);
      }
    }
  } catch (err: any) {
    console.error('⚠️  Auto-setup skipped:', err.message);
  }
}
autoSetup();

// Initialize Express
const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((origin) => origin.trim())
  : true;
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global error handler middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  
  if (err.message && err.message.includes('P2025')) {
    return res.status(404).json({ error: 'Resource not found' });
  }
  
  res.status(500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'LISS Eye Care Backend is running' });
});

// Import routes (will be created next)
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import patientRoutes from './routes/patient.routes.js';
import examinationRoutes from './routes/examination.routes.js';
import prescriptionRoutes from './routes/prescription.routes.js';
import productRoutes from './routes/product.routes.js';
import opticalSaleRoutes from './routes/opticalSale.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import receiptRoutes from './routes/receipt.routes.js';
import followUpRoutes from './routes/followUp.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import searchRoutes from './routes/search.routes.js';
import supplierRoutes from './routes/supplier.routes.js';
import expenseRoutes from './routes/expense.routes.js';
import staffRoutes from './routes/staff.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import spectacleOrderRoutes from './routes/spectacleOrder.routes.js';

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/examinations', examinationRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/products', productRoutes);
app.use('/api/optical-sales', opticalSaleRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/follow-ups', followUpRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/spectacle-orders', spectacleOrderRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`✅ LISS Eye Care Backend running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

export { app, prisma };
