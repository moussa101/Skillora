import { PrismaClient } from '@prisma/client';

/**
 * Promote a user to ADMIN role by email.
 * Usage: npx ts-node scripts/promote-admin.ts <email>
 */
async function main() {
    const email = process.argv[2];

    if (!email) {
        console.error('Usage: npx ts-node scripts/promote-admin.ts <email>');
        process.exit(1);
    }

    const prisma = new PrismaClient();

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            console.error(`❌ User with email "${email}" not found.`);
            process.exit(1);
        }

        if (user.role === 'ADMIN') {
            console.log(`ℹ️  User "${email}" is already an ADMIN.`);
            process.exit(0);
        }

        await prisma.user.update({
            where: { email },
            data: { role: 'ADMIN' },
        });

        console.log(`✅ User "${email}" has been promoted to ADMIN.`);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
