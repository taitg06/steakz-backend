import { PrismaClient } from '@prisma/client'
import { hashPassword } from './hash';

const prisma = new PrismaClient()

export const seedAdminUser = async () => {
  try{
    const users = [
      { name: 'admin', email: 'admin@seed.local', role: 'ADMIN' },
      { name: 'manager', email: 'manager@seed.local', role: 'BRANCH_MANAGER' },
      { name: 'headquarter', email: 'headquarter@seed.local', role: 'HEADQUARTER_MANAGER' },
      { name: 'chef', email: 'chef@seed.local', role: 'CHEF' },
      { name: 'cashier', email: 'cashier@seed.local', role: 'CASHIER' },
      { name: 'customer', email: 'customer@example.com', role: 'CUSTOMER' },
    ];
    const password = await hashPassword('password123');

    for (const user of users) {
      await prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: {
          name: user.name,
          email: user.email,
          password,
          role: user.role as any,
        },
      });
    }
    console.log('✅ Seeded users for all roles.');
  }
  catch (error) {
    console.error('Error seeding users:', error);
    return;
  }
};
