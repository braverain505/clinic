/**
 * Production Setup Script
 * 
 * Run this to ensure the admin owner account exists and can create other users.
 * Usage: npx tsx src/scripts/ensure-admin.ts
 * 
 * This script:
 * 1. Ensures admin@lisseyecare.com exists with OWNER role (so it can create other users)
 * 2. Ensures owner@lisseyecare.com exists
 * 3. Does NOT delete existing data - only adds missing accounts
 */

import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function ensureAccount(
  email: string,
  fullName: string,
  role: string,
  password: string
) {
  const existing = await prisma.user.findUnique({ where: { email } });
  
  if (existing) {
    console.log(`✅ ${email} already exists (role: ${existing.role})`);
    
    // If admin exists but has wrong role, update it to OWNER
    if (email === 'admin@lisseyecare.com' && existing.role !== 'OWNER') {
      await prisma.user.update({
        where: { email },
        data: { role: 'OWNER' },
      });
      console.log(`   ⬆️  Updated ${email} role from ${existing.role} to OWNER`);
    }
    
    return existing;
  }
  
  const hashedPassword = await bcryptjs.hash(password, 10);
  
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      fullName,
      role: role as any,
    },
  });
  
  console.log(`🆕 Created ${email} with role ${role}`);
  
  // Create staff profile
  await prisma.staff.create({
    data: {
      userId: user.id,
      phone: '+2348000000000',
      department: 'Management',
      position: role === 'OWNER' ? 'Owner / Director' : 'General Manager',
      employmentDate: new Date(),
    },
  });
  
  console.log(`   👤 Created staff profile for ${email}`);
  
  return user;
}

async function main() {
  console.log('🔧 Production Admin Setup Script');
  console.log('================================\n');
  
  const defaultPassword = process.env.ADMIN_PASSWORD || 'password123';
  
  // Ensure admin account has OWNER role (so it can create other users)
  await ensureAccount(
    'admin@lisseyecare.com',
    'Adewale Ogunleye',
    'OWNER',  // Changed from ADMIN to OWNER so it can create other accounts
    defaultPassword
  );
  
  // Ensure owner account exists
  await ensureAccount(
    'owner@lisseyecare.com',
    'Chief Mrs. Folake Ogunleye',
    'OWNER',
    defaultPassword
  );
  
  // List all users
  console.log('\n📋 All users in database:');
  const users = await prisma.user.findMany({
    select: {
      email: true,
      fullName: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  
  for (const user of users) {
    console.log(`   ${user.role.padEnd(20)} ${user.email.padEnd(30)} ${user.fullName}`);
  }
  
  console.log('\n✅ Setup complete!');
  console.log('\n📌 Default credentials (change after first login):');
  console.log('   Email: admin@lisseyecare.com');
  console.log('   Password: password123');
  console.log('\n🔐 The admin account has OWNER role, allowing it to:');
  console.log('   - Create new users (OWNER, ADMIN, OPTOMETRIST, etc.)');
  console.log('   - Edit user roles and details');
  console.log('   - Reset passwords');
  console.log('   - Deactivate users');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
