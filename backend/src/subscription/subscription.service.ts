import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UserTier, PaymentStatus } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SubscriptionService {
    private readonly logger = new Logger(SubscriptionService.name);

    constructor(private prisma: PrismaService) { }

    // ============================================
    // USER-FACING
    // ============================================

    /**
     * Create a subscription request (user submits payment screenshot).
     */
    async createRequest(userId: number, data: {
        plan: UserTier;
        paymentMethod?: string;
        screenshotPath: string;
    }) {
        // Validate plan
        if (data.plan !== 'PRO' && data.plan !== 'RECRUITER') {
            throw new BadRequestException('Invalid plan. Must be PRO or RECRUITER.');
        }

        // Check for existing pending subscription
        const pending = await this.prisma.subscription.findFirst({
            where: { userId, status: 'PENDING' },
        });
        if (pending) {
            throw new BadRequestException('You already have a pending subscription request. Please wait for admin review.');
        }

        const amount = data.plan === 'PRO' ? 350 : 500;

        return this.prisma.subscription.create({
            data: {
                userId,
                plan: data.plan,
                amount,
                paymentMethod: data.paymentMethod || 'instapay',
                screenshotPath: data.screenshotPath,
                status: 'PENDING',
            },
            include: { user: { select: { email: true, name: true } } },
        });
    }

    /**
     * Get the current user's subscription status and history.
     */
    async getUserSubscriptions(userId: number) {
        const subscriptions = await this.prisma.subscription.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        const active = subscriptions.find(s => s.status === 'APPROVED' && s.endDate && new Date(s.endDate) > new Date());
        const pending = subscriptions.find(s => s.status === 'PENDING');

        return {
            active: active || null,
            pending: pending || null,
            history: subscriptions,
        };
    }

    // ============================================
    // ADMIN
    // ============================================

    /**
     * List all subscriptions (admin).
     */
    async listSubscriptions(params: {
        status?: string;
        page?: number;
        limit?: number;
    }) {
        const page = params.page || 1;
        const limit = params.limit || 20;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (params.status) {
            where.status = params.status;
        }

        const [subscriptions, total] = await Promise.all([
            this.prisma.subscription.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, email: true, name: true, tier: true, role: true, image: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.subscription.count({ where }),
        ]);

        return {
            subscriptions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get subscription stats for admin dashboard.
     */
    async getStats() {
        const [pending, approved, rejected, expired, totalRevenue] = await Promise.all([
            this.prisma.subscription.count({ where: { status: 'PENDING' } }),
            this.prisma.subscription.count({ where: { status: 'APPROVED' } }),
            this.prisma.subscription.count({ where: { status: 'REJECTED' } }),
            this.prisma.subscription.count({ where: { status: 'EXPIRED' } }),
            this.prisma.subscription.aggregate({
                where: { status: 'APPROVED' },
                _sum: { amount: true },
            }),
        ]);

        return {
            pending,
            approved,
            rejected,
            expired,
            totalRevenue: totalRevenue._sum.amount || 0,
        };
    }

    /**
     * Approve a subscription (admin sets start/end dates, upgrades user tier).
     */
    async approveSubscription(subscriptionId: number, adminId: number, data: {
        startDate: string;
        endDate: string;
        adminNote?: string;
    }) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { id: subscriptionId },
        });
        if (!subscription) throw new NotFoundException('Subscription not found');
        if (subscription.status !== 'PENDING') {
            throw new BadRequestException('Only pending subscriptions can be approved');
        }

        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);

        if (endDate <= startDate) {
            throw new BadRequestException('End date must be after start date');
        }

        // Update subscription + upgrade user tier in a transaction
        const [updatedSub] = await this.prisma.$transaction([
            this.prisma.subscription.update({
                where: { id: subscriptionId },
                data: {
                    status: 'APPROVED',
                    startDate,
                    endDate,
                    adminNote: data.adminNote,
                    reviewedBy: adminId,
                    reviewedAt: new Date(),
                },
                include: { user: { select: { id: true, email: true, name: true } } },
            }),
            this.prisma.user.update({
                where: { id: subscription.userId },
                data: {
                    tier: subscription.plan,
                    subscriptionStatus: 'ACTIVE',
                    subscriptionEndDate: endDate,
                },
            }),
        ]);

        this.logger.log(`Subscription #${subscriptionId} approved for user #${subscription.userId} (${subscription.plan}) until ${endDate.toISOString()}`);
        return updatedSub;
    }

    /**
     * Reject a subscription (admin).
     */
    async rejectSubscription(subscriptionId: number, adminId: number, adminNote?: string) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { id: subscriptionId },
        });
        if (!subscription) throw new NotFoundException('Subscription not found');
        if (subscription.status !== 'PENDING') {
            throw new BadRequestException('Only pending subscriptions can be rejected');
        }

        return this.prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
                status: 'REJECTED',
                adminNote,
                reviewedBy: adminId,
                reviewedAt: new Date(),
            },
            include: { user: { select: { id: true, email: true, name: true } } },
        });
    }

    /**
     * Admin manually sets/extends subscription dates for a user.
     */
    async setSubscriptionDates(subscriptionId: number, adminId: number, data: {
        startDate: string;
        endDate: string;
        adminNote?: string;
    }) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { id: subscriptionId },
        });
        if (!subscription) throw new NotFoundException('Subscription not found');

        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);

        if (endDate <= startDate) {
            throw new BadRequestException('End date must be after start date');
        }

        const [updatedSub] = await this.prisma.$transaction([
            this.prisma.subscription.update({
                where: { id: subscriptionId },
                data: {
                    startDate,
                    endDate,
                    adminNote: data.adminNote,
                    reviewedBy: adminId,
                    reviewedAt: new Date(),
                    status: 'APPROVED',
                },
                include: { user: { select: { id: true, email: true, name: true } } },
            }),
            this.prisma.user.update({
                where: { id: subscription.userId },
                data: {
                    tier: subscription.plan,
                    subscriptionStatus: 'ACTIVE',
                    subscriptionEndDate: endDate,
                },
            }),
        ]);

        return updatedSub;
    }

    // ============================================
    // AUTO-EXPIRY (runs every hour)
    // ============================================

    @Cron(CronExpression.EVERY_HOUR)
    async handleExpiredSubscriptions() {
        const now = new Date();

        // Find all approved subscriptions that have expired
        const expiredSubs = await this.prisma.subscription.findMany({
            where: {
                status: 'APPROVED',
                endDate: { lt: now },
            },
            include: { user: { select: { id: true, email: true, tier: true } } },
        });

        if (expiredSubs.length === 0) return;

        this.logger.log(`Found ${expiredSubs.length} expired subscription(s), downgrading...`);

        for (const sub of expiredSubs) {
            await this.prisma.$transaction([
                // Mark subscription as expired
                this.prisma.subscription.update({
                    where: { id: sub.id },
                    data: { status: 'EXPIRED' },
                }),
                // Downgrade user to GUEST
                this.prisma.user.update({
                    where: { id: sub.userId },
                    data: {
                        tier: 'GUEST',
                        subscriptionStatus: 'CANCELLED',
                        subscriptionEndDate: null,
                    },
                }),
            ]);

            this.logger.log(`User #${sub.userId} (${sub.user.email}) downgraded to GUEST — subscription expired`);
        }
    }
}
