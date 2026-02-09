import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

/**
 * Seed a default admin account.
 * Credentials:
 *   Email:    admin@skillora.com
 *   Password: Admin@123
 */
async function main() {
    const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/resume_analyzer';
    const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : undefined,
    });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    const adminEmail = 'admin@skillora.com';
    const adminPassword = 'Admin@123';

    try {
        const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

        if (existing) {
            // Ensure the existing user has ADMIN role
            if (existing.role !== 'ADMIN') {
                await prisma.user.update({
                    where: { email: adminEmail },
                    data: { role: 'ADMIN' },
                });
                console.log(`✅ Existing user "${adminEmail}" promoted to ADMIN.`);
            } else {
                console.log(`ℹ️  Admin account "${adminEmail}" already exists.`);
            }
            return;
        }

        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        await prisma.user.create({
            data: {
                email: adminEmail,
                password: hashedPassword,
                name: 'Admin',
                provider: 'EMAIL',
                role: 'ADMIN',
                tier: 'PRO',
                emailVerified: true,
                onboardingComplete: true,
            },
        });

        console.log(`✅ Admin account created:`);
        console.log(`   Email:    ${adminEmail}`);
        console.log(`   Password: ${adminPassword}`);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
