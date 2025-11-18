"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedAdminUser = void 0;
const client_1 = require("@prisma/client");
const hash_1 = require("./hash");
const prisma = new client_1.PrismaClient();
const seedAdminUser = async () => {
    try {
        const users = [
            { name: 'admin', email: 'admin@seed.local', role: 'ADMIN' },
            { name: 'manager', email: 'manager@seed.local', role: 'MANAGER' },
            { name: 'headquarter', email: 'headquarter@seed.local', role: 'HEADQUARTER' },
            { name: 'chef', email: 'chef@seed.local', role: 'CHEF' },
            { name: 'cashier', email: 'cashier@seed.local', role: 'CASHIER' },
            { name: 'customer', email: 'customer@example.com', role: 'CUSTOMER' },
        ];
        const password = await (0, hash_1.hashPassword)('password123');
        for (const user of users) {
            await prisma.user.upsert({
                where: { email: user.email },
                update: {},
                create: {
                    name: user.name,
                    email: user.email,
                    password,
                    role: user.role,
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
exports.seedAdminUser = seedAdminUser;
//# sourceMappingURL=seedAdmin.js.map