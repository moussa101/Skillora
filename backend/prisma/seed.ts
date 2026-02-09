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
        // Seed admin account
        const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

        if (existing) {
            if (existing.role !== 'ADMIN') {
                await prisma.user.update({
                    where: { email: adminEmail },
                    data: { role: 'ADMIN' },
                });
                console.log(`✅ Existing user "${adminEmail}" promoted to ADMIN.`);
            } else {
                console.log(`ℹ️  Admin account "${adminEmail}" already exists.`);
            }
        } else {
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
        }

        // Seed recruiter account
        const recruiterEmail = 'recruiter@skillora.com';
        const recruiterPassword = 'Recruiter@123';

        const existingRecruiter = await prisma.user.findUnique({ where: { email: recruiterEmail } });
        if (!existingRecruiter) {
            const hashedRecruiterPassword = await bcrypt.hash(recruiterPassword, 10);
            await prisma.user.create({
                data: {
                    email: recruiterEmail,
                    password: hashedRecruiterPassword,
                    name: 'Recruiter',
                    provider: 'EMAIL',
                    role: 'RECRUITER',
                    tier: 'RECRUITER',
                    emailVerified: true,
                    onboardingComplete: true,
                },
            });
            console.log(`✅ Recruiter account created:`);
            console.log(`   Email:    ${recruiterEmail}`);
            console.log(`   Password: ${recruiterPassword}`);
        } else {
            console.log(`ℹ️  Recruiter account "${recruiterEmail}" already exists.`);
        }
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
