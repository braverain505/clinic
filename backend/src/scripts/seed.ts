import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.opticalSaleItem.deleteMany();
  await prisma.opticalSale.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.eyeExamination.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  console.log('👤 Creating admin user...');
  const hashedPassword = await bcryptjs.hash('password123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@lisseyecare.com',
      password: hashedPassword,
      fullName: 'Admin User',
      role: 'ADMIN',
    },
  });

  const optometrist = await prisma.user.create({
    data: {
      email: 'optometrist@lisseyecare.com',
      password: hashedPassword,
      fullName: 'Dr. Chioma Okafor',
      role: 'OPTOMETRIST',
    },
  });

  const cashier = await prisma.user.create({
    data: {
      email: 'cashier@lisseyecare.com',
      password: hashedPassword,
      fullName: 'Tunde Adeyemi',
      role: 'CASHIER',
    },
  });

  // Create products
  console.log('📦 Creating products...');
  const products = [
    // Frames
    { sku: 'FRM-001', name: 'Classic Black Frame', category: 'FRAMES', brand: 'RayBan', purchasePrice: 15000, sellingPrice: 35000, quantity: 25 },
    { sku: 'FRM-002', name: 'Premium Gold Frame', category: 'FRAMES', brand: 'Gucci', purchasePrice: 25000, sellingPrice: 65000, quantity: 15 },
    { sku: 'FRM-003', name: 'Executive Titanium Frame', category: 'FRAMES', brand: 'Prada', purchasePrice: 30000, sellingPrice: 85000, quantity: 8 },
    { sku: 'FRM-004', name: 'Sporty Blue Frame', category: 'FRAMES', brand: 'Nike', purchasePrice: 12000, sellingPrice: 28000, quantity: 20 },
    { sku: 'FRM-005', name: 'Vintage Brown Frame', category: 'FRAMES', brand: 'Coach', purchasePrice: 18000, sellingPrice: 42000, quantity: 12 },
    
    // Lenses
    { sku: 'LEN-001', name: 'Single Vision Lens', category: 'LENSES', brand: 'Essilor', purchasePrice: 8000, sellingPrice: 18000, quantity: 100 },
    { sku: 'LEN-002', name: 'Bifocal Lens', category: 'LENSES', brand: 'Essilor', purchasePrice: 12000, sellingPrice: 28000, quantity: 45 },
    { sku: 'LEN-003', name: 'Progressive Lens', category: 'LENSES', brand: 'Hoya', purchasePrice: 18000, sellingPrice: 45000, quantity: 35 },
    { sku: 'LEN-004', name: 'Photochromic Lens', category: 'LENSES', brand: 'Transitions', purchasePrice: 15000, sellingPrice: 38000, quantity: 28 },
    { sku: 'LEN-005', name: 'Anti-Reflective Coating', category: 'LENSES', brand: 'Crizal', purchasePrice: 5000, sellingPrice: 12000, quantity: 60 },
    
    // Contact Lenses
    { sku: 'CON-001', name: 'Daily Soft Contact Lens', category: 'CONTACT_LENSES', brand: 'Acuvue', purchasePrice: 3000, sellingPrice: 8000, quantity: 50 },
    { sku: 'CON-002', name: 'Monthly Soft Contact Lens', category: 'CONTACT_LENSES', brand: 'Air Optix', purchasePrice: 4000, sellingPrice: 10000, quantity: 40 },
    
    // Accessories
    { sku: 'ACC-001', name: 'Lens Cleaning Kit', category: 'ACCESSORIES', brand: 'Generic', purchasePrice: 1000, sellingPrice: 2500, quantity: 80 },
    { sku: 'ACC-002', name: 'Lens Solution (500ml)', category: 'ACCESSORIES', brand: 'Bausch+Lomb', purchasePrice: 1500, sellingPrice: 3500, quantity: 70 },
    { sku: 'ACC-003', name: 'Eyeglass Case (Leather)', category: 'ACCESSORIES', brand: 'Generic', purchasePrice: 2000, sellingPrice: 5000, quantity: 50 },
    { sku: 'ACC-004', name: 'Microfiber Cloth', category: 'ACCESSORIES', brand: 'Generic', purchasePrice: 500, sellingPrice: 1200, quantity: 120 },
  ];

  const createdProducts = await Promise.all(
    products.map((p) =>
      prisma.product.create({
        data: {
          ...p,
          barcode: `BAR-${p.sku}`,
          description: `High-quality ${p.name}`,
          supplier: 'LISS Optical Suppliers',
          status: 'ACTIVE',
        },
      })
    )
  );

  // Create patients
  console.log('🧑‍🤝‍🧑 Creating patients...');
  const nigerianNames = [
    { firstName: 'Chioma', lastName: 'Okafor' },
    { firstName: 'Tunde', lastName: 'Adeyemi' },
    { firstName: 'Amara', lastName: 'Nwosu' },
    { firstName: 'Kunle', lastName: 'Johnson' },
    { firstName: 'Zainab', lastName: 'Ahmed' },
    { firstName: 'Ibrahim', lastName: 'Hassan' },
    { firstName: 'Ngozi', lastName: 'Eze' },
    { firstName: 'David', lastName: 'James' },
    { firstName: 'Glory', lastName: 'Olawale' },
    { firstName: 'Yusuf', lastName: 'Babatunde' },
    { firstName: 'Blessing', lastName: 'Okoro' },
    { firstName: 'Oluwaseun', lastName: 'Adebayo' },
    { firstName: 'Ife', lastName: 'Adekunle' },
    { firstName: 'Kemi', lastName: 'Adeleke' },
    { firstName: 'Rasheed', lastName: 'Oladele' },
    { firstName: 'Chinedu', lastName: 'Uche' },
    { firstName: 'Temitope', lastName: 'Bello' },
    { firstName: 'Aisha', lastName: 'Mohammed' },
    { firstName: 'Segun', lastName: 'Fasanya' },
    { firstName: 'Victoria', lastName: 'Adunni' },
  ];

  const patients = await Promise.all(
    nigerianNames.map((name, i) =>
      prisma.patient.create({
        data: {
          firstName: name.firstName,
          lastName: name.lastName,
          phone: `+234${80 + Math.floor(Math.random() * 9)}${String(Math.floor(Math.random() * 1000000)).padStart(8, '0')}`,
          email: `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}@email.com`,
          gender: ['MALE', 'FEMALE', 'OTHER'][Math.floor(Math.random() * 3)],
          dateOfBirth: new Date(1980 + Math.floor(Math.random() * 30), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          address: `${Math.floor(Math.random() * 1000) + 1} Main Street, Lagos`,
          city: 'Lagos',
          state: 'Lagos',
          country: 'Nigeria',
          medicalHistory: 'No known medical history',
          ocularHistory: 'Regular eye checkups',
          allergies: 'None known',
        },
      })
    )
  );

  // Create eye examinations
  console.log('👁️  Creating eye examinations...');
  const examinations = [];
  for (let i = 0; i < 15; i++) {
    const exam = await prisma.eyeExamination.create({
      data: {
        patientId: patients[i % patients.length].id,
        userId: optometrist.id,
        examinationDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        vaRightDistance: '20/20',
        vaLeftDistance: '20/20',
        vaBothDistance: '20/20',
        vaRightNear: '20/20',
        vaLeftNear: '20/20',
        vaBothNear: '20/20',
        rhSphere: -1.5 + Math.random() * 3,
        rhCylinder: -0.5 + Math.random() * 2,
        rhAxis: Math.floor(Math.random() * 180),
        rhAdd: 1.0 + Math.random() * 2,
        rhPrism: 0,
        lhSphere: -1.5 + Math.random() * 3,
        lhCylinder: -0.5 + Math.random() * 2,
        lhAxis: Math.floor(Math.random() * 180),
        lhAdd: 1.0 + Math.random() * 2,
        lhPrism: 0,
        pupillaryDistance: 63 + Math.random() * 4,
        nearPD: 60 + Math.random() * 4,
        tonometry: 'IOP: 15 mmHg both eyes',
        colourVision: 'Normal',
        keratometry: 'K1: 43.50, K2: 44.00',
        visualFields: 'Normal',
        clinicalNotes: 'Patient has mild myopia with slight astigmatism',
        diagnosis: 'Refractive Error - Myopic Astigmatism',
        treatment: 'Corrective lenses recommended',
      },
    });
    examinations.push(exam);
  }

  // Create prescriptions
  console.log('📋 Creating prescriptions...');
  const prescriptions = [];
  for (let i = 0; i < 10; i++) {
    const exam = examinations[i];
    const prescription = await prisma.prescription.create({
      data: {
        patientId: exam.patientId,
        examinationId: exam.id,
        userId: optometrist.id,
        rhSphere: exam.rhSphere!,
        rhCylinder: exam.rhCylinder!,
        rhAxis: exam.rhAxis!,
        rhAdd: exam.rhAdd!,
        rhPrism: exam.rhPrism!,
        lhSphere: exam.lhSphere!,
        lhCylinder: exam.lhCylinder!,
        lhAxis: exam.lhAxis!,
        lhAdd: exam.lhAdd!,
        lhPrism: exam.lhPrism!,
        pupillaryDistance: exam.pupillaryDistance!,
        recommendations: 'Wear glasses as prescribed. Review in 12 months',
        reviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
    prescriptions.push(prescription);
  }

  // Create optical sales
  console.log('🛍️  Creating optical sales...');
  const sales = [];
  for (let i = 0; i < 15; i++) {
    const frameProduct = createdProducts.find((p) => p.category === 'FRAMES');
    const lensProduct = createdProducts.find((p) => p.category === 'LENSES');

    if (frameProduct && lensProduct) {
      const subtotal = frameProduct.sellingPrice + lensProduct.sellingPrice;
      const discount = Math.random() > 0.7 ? Math.floor(subtotal * 0.05) : 0;
      const total = subtotal - discount;

      const sale = await prisma.opticalSale.create({
        data: {
          patientId: patients[i % patients.length].id,
          prescriptionId: prescriptions[i % prescriptions.length]?.id,
          subtotal,
          discount,
          total,
          paymentStatus: ['UNPAID', 'PARTIALLY_PAID', 'PAID'][Math.floor(Math.random() * 3)],
          amountPaid: Math.random() > 0.5 ? total : Math.floor(total * 0.5),
          outstandingBalance: Math.random() > 0.5 ? 0 : Math.floor(total * 0.5),
          items: {
            create: [
              {
                productId: frameProduct.id,
                quantity: 1,
                unitPrice: frameProduct.sellingPrice,
                total: frameProduct.sellingPrice,
              },
              {
                productId: lensProduct.id,
                quantity: 2,
                unitPrice: lensProduct.sellingPrice,
                total: lensProduct.sellingPrice * 2,
              },
            ],
          },
        },
      });
      sales.push(sale);
    }
  }

  // Create payments
  console.log('💰 Creating payments...');
  for (const sale of sales) {
    if (sale.amountPaid > 0) {
      await prisma.payment.create({
        data: {
          saleId: sale.id,
          patientId: sale.patientId,
          amount: sale.amountPaid,
          paymentMethod: ['CASH', 'BANK_TRANSFER', 'POS', 'CARD'][Math.floor(Math.random() * 4)],
          reference: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          userId: cashier.id,
          paymentDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  // Create receipts
  console.log('🧾 Creating receipts...');
  for (const sale of sales.slice(0, 10)) {
    await prisma.receipt.create({
      data: {
        saleId: sale.id,
        patientName: `${patients.find((p) => p.id === sale.patientId)?.firstName} ${patients.find((p) => p.id === sale.patientId)?.lastName}`,
        patientId: sale.patientId,
        invoiceNumber: sale.invoiceId,
        subtotal: sale.subtotal,
        discount: sale.discount,
        grandTotal: sale.total,
        amountPaid: sale.amountPaid,
        balance: sale.outstandingBalance,
        paymentMethod: 'CASH',
        receivedBy: cashier.fullName,
      },
    });
  }

  // Create follow-ups
  console.log('📞 Creating follow-ups...');
  for (let i = 0; i < 10; i++) {
    const exam = examinations[i];
    await prisma.followUp.create({
      data: {
        patientId: exam.patientId,
        examinationId: exam.id,
        reason: ['Routine eye review', 'Check lens comfort', 'Monitor prescription change', 'Assess vision improvement'][
          Math.floor(Math.random() * 4)
        ],
        followUpDate: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000),
        assignedStaff: optometrist.fullName,
        notes: 'Patient should return for follow-up examination',
        status: 'PENDING',
      },
    });
  }

  // Create notifications
  console.log('📬 Creating notifications...');
  const notifications = [
    { title: 'New Patient Registered', message: 'David James registered as a new patient', type: 'PATIENT_REGISTERED' },
    { title: 'Payment Received', message: 'Payment of ₦485,000 received from Chioma Okafor', type: 'PAYMENT_RECEIVED' },
    { title: 'Low Stock Alert', message: 'Executive Titanium Frame inventory at 8 units', type: 'LOW_STOCK' },
    { title: 'Follow-up Due', message: '5 patients due for follow-up this week', type: 'FOLLOWUP_DUE' },
    { title: 'Outstanding Payment', message: '₦245,000 outstanding from 4 customers', type: 'OUTSTANDING_PAYMENT' },
  ];

  await Promise.all(
    notifications.map((n) =>
      prisma.notification.create({
        data: {
          title: n.title,
          message: n.message,
          type: n.type,
          read: false,
        },
      })
    )
  );

  console.log('\n✅ Database seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - 3 Users created (Admin, Optometrist, Cashier)`);
  console.log(`   - ${createdProducts.length} Products created`);
  console.log(`   - ${patients.length} Patients created`);
  console.log(`   - ${examinations.length} Eye Examinations created`);
  console.log(`   - ${prescriptions.length} Prescriptions created`);
  console.log(`   - ${sales.length} Optical Sales created`);
  console.log(`   - Multiple Payments, Receipts, Follow-ups created`);
  console.log(`\n🔐 Demo Credentials:`);
  console.log(`   Email: admin@lisseyecare.com`);
  console.log(`   Password: password123`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
