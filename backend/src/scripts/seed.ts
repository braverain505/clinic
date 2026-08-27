import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.attendance.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.supplier.deleteMany();
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

  // ─── USERS (one per role for testing) ─────────────────────
  console.log('👤 Creating users for every role...');
  const hashedPassword = await bcryptjs.hash('password123', 10);

  const owner = await prisma.user.create({
    data: { email: 'owner@lisseyecare.com', password: hashedPassword, fullName: 'Chief Mrs. Folake Ogunleye', role: 'OWNER' },
  });

  const admin = await prisma.user.create({
    data: { email: 'admin@lisseyecare.com', password: hashedPassword, fullName: 'Adewale Ogunleye', role: 'ADMIN' },
  });

  const optometrist = await prisma.user.create({
    data: { email: 'optometrist@lisseyecare.com', password: hashedPassword, fullName: 'Dr. Chioma Okafor', role: 'OPTOMETRIST' },
  });

  const optometrist2 = await prisma.user.create({
    data: { email: 'dr.Emeka@lisseyecare.com', password: hashedPassword, fullName: 'Dr. Emeka Nwankwo', role: 'OPTOMETRIST' },
  });

  const receptionist = await prisma.user.create({
    data: { email: 'receptionist@lisseyecare.com', password: hashedPassword, fullName: 'Ngozi Eze', role: 'RECEPTIONIST' },
  });

  const cashier = await prisma.user.create({
    data: { email: 'cashier@lisseyecare.com', password: hashedPassword, fullName: 'Tunde Adeyemi', role: 'CASHIER' },
  });

  const inventoryManager = await prisma.user.create({
    data: { email: 'inventory@lisseyecare.com', password: hashedPassword, fullName: 'Funke Oladipo', role: 'INVENTORY_MANAGER' },
  });

  // ─── STAFF ───────────────────────────────────────────────
  console.log('👥 Creating staff profiles...');
  const staffRecords = [
    { userId: owner.id, phone: '+2348001234567', department: 'Management', position: 'Owner / Director', employmentDate: new Date('2019-01-01') },
    { userId: admin.id, phone: '+2348012345678', department: 'Management', position: 'General Manager', employmentDate: new Date('2020-01-15') },
    { userId: optometrist.id, phone: '+2348023456789', department: 'Clinical', position: 'Lead Optometrist', employmentDate: new Date('2021-03-01') },
    { userId: optometrist2.id, phone: '+2348034567890', department: 'Clinical', position: 'Optometrist', employmentDate: new Date('2022-06-15') },
    { userId: receptionist.id, phone: '+2348056789012', department: 'Front Desk', position: 'Senior Receptionist', employmentDate: new Date('2022-01-10') },
    { userId: cashier.id, phone: '+2348045678901', department: 'Finance', position: 'Cashier', employmentDate: new Date('2022-09-01') },
    { userId: inventoryManager.id, phone: '+2348067890123', department: 'Operations', position: 'Inventory Manager', employmentDate: new Date('2023-02-01') },
  ];

  const staffList = await Promise.all(
    staffRecords.map((s) => prisma.staff.create({ data: s }))
  );

  // Create attendance records for staff
  console.log('📋 Creating attendance records...');
  for (const s of staffList) {
    for (let i = 0; i < 5; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const clockIn = new Date(date);
      clockIn.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60));
      const clockOut = new Date(date);
      clockOut.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60));
      await prisma.attendance.create({
        data: {
          staffId: s.id,
          date,
          clockIn,
          clockOut,
          status: i === 0 ? 'PRESENT' : Math.random() > 0.1 ? 'PRESENT' : 'LATE',
        },
      });
    }
  }

  // ─── SUPPLIERS ───────────────────────────────────────────
  console.log('🚚 Creating suppliers...');
  const suppliers = await Promise.all([
    prisma.supplier.create({ data: { company: 'VisionOpt Nigeria Ltd', contactName: 'Chief Okonkwo', phone: '+2348101234567', email: 'sales@visionopt.ng', address: '45 Market Road, Aba', paymentTerms: 'Net 30', status: 'ACTIVE' } }),
    prisma.supplier.create({ data: { company: 'Essilor West Africa', contactName: 'Mrs. Bello', phone: '+2348112345678', email: 'orders@essilor-wa.com', address: '12 Industrial Estate, Lagos', paymentTerms: 'Net 60', status: 'ACTIVE' } }),
    prisma.supplier.create({ data: { company: 'Specs & Lenses Co', contactName: 'Mr. Chukwuma', phone: '+2348123456789', email: 'info@specsng.com', address: '78 Ogui Road, Enugu', paymentTerms: 'Net 30', status: 'ACTIVE' } }),
    prisma.supplier.create({ data: { company: 'Acuvue Distributors', contactName: 'Dr. Adah', phone: '+2348134567890', email: 'supply@acuvue-ng.com', address: '33 Allen Avenue, Ikeja', paymentTerms: 'Net 45', status: 'ACTIVE' } }),
  ]);

  // ─── PRODUCTS ────────────────────────────────────────────
  console.log('📦 Creating products...');
  const products = [
    // Frames
    { sku: 'FRM-001', name: 'Classic Black Frame', category: 'FRAMES', brand: 'RayBan', purchasePrice: 15000, sellingPrice: 35000, quantity: 25, minimumStock: 10 },
    { sku: 'FRM-002', name: 'Premium Gold Frame', category: 'FRAMES', brand: 'Gucci', purchasePrice: 25000, sellingPrice: 65000, quantity: 15, minimumStock: 5 },
    { sku: 'FRM-003', name: 'Executive Titanium Frame', category: 'FRAMES', brand: 'Prada', purchasePrice: 30000, sellingPrice: 85000, quantity: 8, minimumStock: 5 },
    { sku: 'FRM-004', name: 'Sporty Blue Frame', category: 'FRAMES', brand: 'Nike', purchasePrice: 12000, sellingPrice: 28000, quantity: 20, minimumStock: 8 },
    { sku: 'FRM-005', name: 'Vintage Brown Frame', category: 'FRAMES', brand: 'Coach', purchasePrice: 18000, sellingPrice: 42000, quantity: 12, minimumStock: 6 },
    { sku: 'FRM-006', name: 'Cat-Eye Rose Gold', category: 'FRAMES', brand: 'Michael Kors', purchasePrice: 20000, sellingPrice: 48000, quantity: 10, minimumStock: 5 },
    { sku: 'FRM-007', name: 'Round Wire Frame', category: 'FRAMES', brand: 'Tom Ford', purchasePrice: 22000, sellingPrice: 55000, quantity: 7, minimumStock: 5 },
    { sku: 'FRM-008', name: 'Bold Matte Black', category: 'FRAMES', brand: 'Oakley', purchasePrice: 16000, sellingPrice: 38000, quantity: 18, minimumStock: 8 },

    // Lenses
    { sku: 'LEN-001', name: 'Single Vision Lens', category: 'LENSES', brand: 'Essilor', purchasePrice: 8000, sellingPrice: 18000, quantity: 100, minimumStock: 20 },
    { sku: 'LEN-002', name: 'Bifocal Lens', category: 'LENSES', brand: 'Essilor', purchasePrice: 12000, sellingPrice: 28000, quantity: 45, minimumStock: 15 },
    { sku: 'LEN-003', name: 'Progressive Lens', category: 'LENSES', brand: 'Hoya', purchasePrice: 18000, sellingPrice: 45000, quantity: 35, minimumStock: 10 },
    { sku: 'LEN-004', name: 'Photochromic Lens', category: 'LENSES', brand: 'Transitions', purchasePrice: 15000, sellingPrice: 38000, quantity: 28, minimumStock: 10 },
    { sku: 'LEN-005', name: 'Anti-Reflective Coating', category: 'LENSES', brand: 'Crizal', purchasePrice: 5000, sellingPrice: 12000, quantity: 60, minimumStock: 20 },
    { sku: 'LEN-006', name: 'Blue Light Blocking Lens', category: 'LENSES', brand: 'Essilor', purchasePrice: 10000, sellingPrice: 25000, quantity: 40, minimumStock: 15 },

    // Contact Lenses
    { sku: 'CON-001', name: 'Daily Soft Contact Lens', category: 'CONTACT_LENSES', brand: 'Acuvue', purchasePrice: 3000, sellingPrice: 8000, quantity: 50, minimumStock: 20 },
    { sku: 'CON-002', name: 'Monthly Soft Contact Lens', category: 'CONTACT_LENSES', brand: 'Air Optix', purchasePrice: 4000, sellingPrice: 10000, quantity: 40, minimumStock: 15 },
    { sku: 'CON-003', name: 'Toric Contact Lens', category: 'CONTACT_LENSES', brand: 'Acuvue', purchasePrice: 5000, sellingPrice: 12000, quantity: 3, minimumStock: 10 }, // Low stock

    // Accessories
    { sku: 'ACC-001', name: 'Lens Cleaning Kit', category: 'ACCESSORIES', brand: 'Generic', purchasePrice: 1000, sellingPrice: 2500, quantity: 80, minimumStock: 20 },
    { sku: 'ACC-002', name: 'Lens Solution (500ml)', category: 'ACCESSORIES', brand: 'Bausch+Lomb', purchasePrice: 1500, sellingPrice: 3500, quantity: 70, minimumStock: 25 },
    { sku: 'ACC-003', name: 'Eyeglass Case (Leather)', category: 'ACCESSORIES', brand: 'Generic', purchasePrice: 2000, sellingPrice: 5000, quantity: 50, minimumStock: 15 },
    { sku: 'ACC-004', name: 'Microfiber Cloth', category: 'ACCESSORIES', brand: 'Generic', purchasePrice: 500, sellingPrice: 1200, quantity: 120, minimumStock: 30 },
    { sku: 'ACC-005', name: 'Nose Pads (Pair)', category: 'ACCESSORIES', brand: 'Generic', purchasePrice: 200, sellingPrice: 800, quantity: 2, minimumStock: 20 }, // Low stock
  ];

  const createdProducts = await Promise.all(
    products.map((p) =>
      prisma.product.create({
        data: {
          ...p,
          barcode: `BAR-${p.sku}`,
          description: `High-quality ${p.name.toLowerCase()}`,
          supplier: suppliers[Math.floor(Math.random() * suppliers.length)].company,
          status: 'ACTIVE',
        },
      })
    )
  );

  // ─── PATIENTS ────────────────────────────────────────────
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
    { firstName: 'Emeka', lastName: 'Odinaka' },
    { firstName: 'Funke', lastName: 'Oladipo' },
    { firstName: 'Obinna', lastName: 'Igwe' },
    { firstName: 'Sade', lastName: 'Lawal' },
    { firstName: 'Ikenna', lastName: 'Chukwu' },
    { firstName: 'Halima', lastName: 'Abubakar' },
    { firstName: 'Tolu', lastName: 'Akande' },
    { firstName: 'Adaeze', lastName: 'Ugwu' },
    { firstName: 'Femi', lastName: 'Oyewole' },
    { firstName: 'Nneka', lastName: 'Obi' },
    { firstName: 'Babatunde', lastName: 'Ogundipe' },
    { firstName: 'Yetunde', lastName: 'Bankole' },
    { firstName: 'Chidi', lastName: 'Nnamdi' },
    { firstName: 'Folake', lastName: 'Coker' },
    { firstName: 'Uche', lastName: 'Mbakwe' },
  ];

  const patients = await Promise.all(
    nigerianNames.map((name, i) =>
      prisma.patient.create({
        data: {
          firstName: name.firstName,
          lastName: name.lastName,
          phone: `+234${80 + (i % 9)}${String(1000000 + Math.floor(Math.random() * 9000000)).slice(0, 8)}`,
          email: `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}@email.com`,
          gender: i % 3 === 0 ? 'MALE' : i % 3 === 1 ? 'FEMALE' : 'MALE',
          dateOfBirth: new Date(1975 + Math.floor(Math.random() * 35), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          address: `${Math.floor(Math.random() * 500) + 1} ${['Main Street', 'Market Road', 'Allen Avenue', 'Ogui Road', 'Victoria Island'].slice(0, 5)[i % 5]}, Lagos`,
          city: 'Lagos',
          state: 'Lagos',
          country: 'Nigeria',
          medicalHistory: i % 4 === 0 ? 'Hypertension' : 'No known medical history',
          ocularHistory: 'Regular eye checkups',
          allergies: i % 5 === 0 ? 'Penicillin' : 'None known',
        },
      })
    )
  );

  // ─── EYE EXAMINATIONS ────────────────────────────────────
  console.log('👁️  Creating eye examinations...');
  const examinations = [];
  for (let i = 0; i < 25; i++) {
    const examDate = new Date();
    examDate.setDate(examDate.getDate() - Math.floor(Math.random() * 60));
    const exam = await prisma.eyeExamination.create({
      data: {
        patientId: patients[i % patients.length].id,
        userId: i % 2 === 0 ? optometrist.id : optometrist2.id,
        examinationDate: examDate,
        vaRightDistance: ['20/20', '20/25', '20/30', '20/40'][Math.floor(Math.random() * 4)],
        vaLeftDistance: ['20/20', '20/25', '20/30', '20/40'][Math.floor(Math.random() * 4)],
        vaBothDistance: '20/20',
        vaRightNear: 'N5',
        vaLeftNear: 'N5',
        vaBothNear: 'N5',
        rhSphere: parseFloat((-3 + Math.random() * 5).toFixed(2)),
        rhCylinder: parseFloat((-2 + Math.random() * 3).toFixed(2)),
        rhAxis: Math.floor(Math.random() * 180),
        rhAdd: parseFloat((1 + Math.random() * 2).toFixed(2)),
        rhPrism: 0,
        lhSphere: parseFloat((-3 + Math.random() * 5).toFixed(2)),
        lhCylinder: parseFloat((-2 + Math.random() * 3).toFixed(2)),
        lhAxis: Math.floor(Math.random() * 180),
        lhAdd: parseFloat((1 + Math.random() * 2).toFixed(2)),
        lhPrism: 0,
        pupillaryDistance: parseFloat((62 + Math.random() * 6).toFixed(1)),
        nearPD: parseFloat((59 + Math.random() * 5).toFixed(1)),
        tonometry: `IOP: ${12 + Math.floor(Math.random() * 8)} mmHg both eyes`,
        colourVision: Math.random() > 0.1 ? 'Normal' : 'Mild deficiency detected',
        keratometry: `K1: ${(42 + Math.random() * 3).toFixed(2)}, K2: ${(43 + Math.random() * 3).toFixed(2)}`,
        visualFields: 'Normal',
        clinicalNotes: [
          'Patient has mild myopia with slight astigmatism',
          'Presbyopia noted, recommended progressive lenses',
          'Early signs of dry eye, recommended artificial tears',
          'Normal examination, no significant findings',
          'Moderate myopia, recommended corrective lenses',
        ][Math.floor(Math.random() * 5)],
        diagnosis: [
          'Refractive Error - Myopic Astigmatism',
          'Presbyopia',
          'Dry Eye Syndrome',
          'Normal',
          'Myopia',
        ][Math.floor(Math.random() * 5)],
        treatment: [
          'Corrective lenses recommended',
          'Progressive lenses prescribed',
          'Artificial tears TID, review in 3 months',
          'No treatment needed',
          'Single vision lenses recommended',
        ][Math.floor(Math.random() * 5)],
      },
    });
    examinations.push(exam);
  }

  // ─── PRESCRIPTIONS ───────────────────────────────────────
  console.log('📋 Creating prescriptions...');
  const prescriptions = [];
  for (let i = 0; i < 20; i++) {
    const exam = examinations[i];
    const rx = await prisma.prescription.create({
      data: {
        patientId: exam.patientId,
        examinationId: exam.id,
        userId: i % 2 === 0 ? optometrist.id : optometrist2.id,
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
        recommendations: 'Wear glasses as prescribed. Review in 12 months.',
        reviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
    prescriptions.push(rx);
  }

  // ─── OPTICAL SALES ───────────────────────────────────────
  console.log('🛍️  Creating optical sales...');
  const sales = [];
  for (let i = 0; i < 20; i++) {
    const frameProduct = createdProducts.filter((p) => p.category === 'FRAMES')[i % 8];
    const lensProduct = createdProducts.filter((p) => p.category === 'LENSES')[i % 6];
    const accProduct = createdProducts.filter((p) => p.category === 'ACCESSORIES')[i % 4];

    const subtotal = frameProduct.sellingPrice + lensProduct.sellingPrice + (i % 3 === 0 ? accProduct.sellingPrice : 0);
    const discount = i % 4 === 0 ? Math.floor(subtotal * 0.05) : 0;
    const total = subtotal - discount;
    const paid = i % 3 === 0 ? total : i % 3 === 1 ? Math.floor(total * 0.5) : 0;

    const saleDate = new Date();
    saleDate.setDate(saleDate.getDate() - Math.floor(Math.random() * 30));

    const sale = await prisma.opticalSale.create({
      data: {
        patientId: patients[i % patients.length].id,
        prescriptionId: prescriptions[i % prescriptions.length]?.id,
        subtotal,
        discount,
        total,
        paymentStatus: paid === total ? 'PAID' : paid > 0 ? 'PARTIALLY_PAID' : 'UNPAID',
        amountPaid: paid,
        outstandingBalance: total - paid,
        createdAt: saleDate,
        items: {
          create: [
            { productId: frameProduct.id, quantity: 1, unitPrice: frameProduct.sellingPrice, total: frameProduct.sellingPrice },
            { productId: lensProduct.id, quantity: 2, unitPrice: lensProduct.sellingPrice, total: lensProduct.sellingPrice * 2 },
            ...(i % 3 === 0 ? [{ productId: accProduct.id, quantity: 1, unitPrice: accProduct.sellingPrice, total: accProduct.sellingPrice }] : []),
          ],
        },
      },
    });
    sales.push(sale);
  }

  // ─── PAYMENTS ────────────────────────────────────────────
  console.log('💰 Creating payments...');
  for (const sale of sales) {
    if (sale.amountPaid > 0) {
      const payDate = new Date(sale.createdAt);
      payDate.setDate(payDate.getDate() + Math.floor(Math.random() * 5));
      await prisma.payment.create({
        data: {
          saleId: sale.id,
          patientId: sale.patientId,
          amount: sale.amountPaid,
          paymentMethod: ['CASH', 'BANK_TRANSFER', 'POS', 'CARD'][Math.floor(Math.random() * 4)],
          reference: `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          userId: cashier.id,
          paymentDate: payDate,
        },
      });
    }
  }

  // ─── RECEIPTS ────────────────────────────────────────────
  console.log('🧾 Creating receipts...');
  for (const sale of sales) {
    try {
      const patient = patients.find((p) => p.id === sale.patientId);
      await prisma.receipt.create({
        data: {
          saleId: sale.id,
          patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
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
    } catch (e) {
      // Receipt might already exist, skip
    }
  }

  // ─── FOLLOW-UPS ──────────────────────────────────────────
  console.log('📞 Creating follow-ups...');
  for (let i = 0; i < 15; i++) {
    const exam = examinations[i % examinations.length];
    const fupDate = new Date();
    fupDate.setDate(fupDate.getDate() + (i < 3 ? 0 : i < 6 ? 3 : i < 10 ? 7 : -5));
    await prisma.followUp.create({
      data: {
        patientId: exam.patientId,
        examinationId: exam.id,
        reason: ['Routine eye review', 'Check lens comfort', 'Monitor prescription change', 'Assess vision improvement', 'Post-surgery follow-up'][Math.floor(Math.random() * 5)],
        followUpDate: fupDate,
        assignedStaff: i % 2 === 0 ? optometrist.fullName : optometrist2.fullName,
        notes: 'Patient should return for follow-up examination',
        status: i < 3 ? 'PENDING' : i < 6 ? 'SCHEDULED' : i < 10 ? 'COMPLETED' : 'MISSED',
      },
    });
  }

  // ─── SUPPLIER PURCHASE ORDERS ────────────────────────────
  console.log('📄 Creating purchase orders...');
  for (let i = 0; i < 5; i++) {
    const po = await prisma.purchaseOrder.create({
      data: {
        supplierId: suppliers[i % suppliers.length].id,
        userId: admin.id,
        total: 50000 + Math.floor(Math.random() * 200000),
        status: ['DRAFT', 'CONFIRMED', 'RECEIVED', 'CONFIRMED', 'RECEIVED'][i],
        notes: `Order for ${['frames', 'lenses', 'contact lenses', 'accessories'][i % 4]}`,
        items: {
          create: [
            {
              productName: `Product batch ${i + 1}`,
              quantity: 10 + Math.floor(Math.random() * 40),
              unitPrice: 1000 + Math.floor(Math.random() * 10000),
              total: 50000,
            },
          ],
        },
      },
    });
  }

  // ─── EXPENSES ────────────────────────────────────────────
  console.log('💸 Creating expenses...');
  const expenseCategories = ['RENT', 'UTILITIES', 'SALARIES', 'TRANSPORTATION', 'PROCUREMENT', 'MAINTENANCE', 'MARKETING', 'SUPPLIES'];
  const expenseDescriptions = [
    'Office rent - Victoria Island branch',
    'Electricity bill - July',
    'Staff salaries - July',
    'Staff transportation allowance',
    'Monthly lens procurement',
    'AC maintenance and servicing',
    'Social media advertising',
    'Office cleaning supplies',
    'Internet subscription',
    'Generator fuel',
  ];

  for (let i = 0; i < 12; i++) {
    const expDate = new Date();
    expDate.setDate(expDate.getDate() - Math.floor(Math.random() * 30));
    await prisma.expense.create({
      data: {
        category: expenseCategories[i % expenseCategories.length],
        description: expenseDescriptions[i % expenseDescriptions.length],
        amount: [350000, 45000, 850000, 25000, 150000, 15000, 30000, 5000, 12000, 8000][i % 10],
        date: expDate,
        paymentMethod: ['CASH', 'BANK_TRANSFER', 'CASH', 'BANK_TRANSFER'][i % 4],
        status: 'APPROVED',
        userId: admin.id,
      },
    });
  }

  // ─── NOTIFICATIONS ───────────────────────────────────────
  console.log('📬 Creating notifications...');
  const notificationData = [
    { title: 'New Patient Registered', message: 'Victoria Adunni registered as a new patient', type: 'PATIENT_REGISTERED' },
    { title: 'Payment Received', message: 'Payment of ₦103,000 received from Chioma Okafor', type: 'PAYMENT_RECEIVED' },
    { title: 'Low Stock Alert', message: 'Toric Contact Lens inventory at 3 units (min: 10)', type: 'LOW_STOCK' },
    { title: 'Low Stock Alert', message: 'Nose Pads inventory at 2 units (min: 20)', type: 'LOW_STOCK' },
    { title: 'Follow-up Due', message: '5 patients due for follow-up this week', type: 'FOLLOWUP_DUE' },
    { title: 'Outstanding Payment', message: '₦456,000 outstanding from 6 customers', type: 'OUTSTANDING_PAYMENT' },
    { title: 'New Patient Registered', message: 'Uche Mbakwe registered as a new patient', type: 'PATIENT_REGISTERED' },
    { title: 'Payment Received', message: 'Payment of ₦65,000 received from Tunde Adeyemi', type: 'PAYMENT_RECEIVED' },
  ];

  await Promise.all(
    notificationData.map((n, i) =>
      prisma.notification.create({
        data: { ...n, read: i > 4 },
      })
    )
  );

  // ─── AUDIT LOGS ──────────────────────────────────────────
  console.log('📝 Creating audit logs...');
  for (let i = 0; i < 10; i++) {
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: ['created', 'updated', 'created'][i % 3],
        entity: ['Patient', 'Product', 'OpticalSale', 'Payment', 'Expense'][i % 5],
        entityId: `entity-${i}`,
      },
    });
  }

  console.log('\n✅ Comprehensive seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - 7 Users (Owner, Admin, 2 Optometrists, Receptionist, Cashier, Inventory Manager)`);
  console.log(`   - 7 Staff members with attendance records`);
  console.log(`   - 4 Suppliers`);
  console.log(`   - ${createdProducts.length} Products (including 2 low stock)`);
  console.log(`   - ${patients.length} Patients`);
  console.log(`   - ${examinations.length} Eye Examinations`);
  console.log(`   - ${prescriptions.length} Prescriptions`);
  console.log(`   - ${sales.length} Optical Sales`);
  console.log(`   - Multiple Payments, Receipts, Follow-ups`);
  console.log(`   - 5 Purchase Orders`);
  console.log(`   - 12 Expenses`);
  console.log(`   - 8 Notifications`);
  console.log(`   - 10 Audit Logs`);
  console.log(`\n🔐 Demo Credentials (all passwords: password123):`);
  console.log(`   Owner:          owner@lisseyecare.com`);
  console.log(`   Admin:          admin@lisseyecare.com`);
  console.log(`   Optometrist:    optometrist@lisseyecare.com`);
  console.log(`   Optometrist 2:  dr.Emeka@lisseyecare.com`);
  console.log(`   Receptionist:   receptionist@lisseyecare.com`);
  console.log(`   Cashier:        cashier@lisseyecare.com`);
  console.log(`   Inventory Mgr:  inventory@lisseyecare.com`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
