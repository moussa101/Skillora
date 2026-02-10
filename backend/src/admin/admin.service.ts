import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UserTier, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new user (admin-initiated).
   */
  async createUser(data: {
    email: string;
    password: string;
    name?: string;
    role?: UserRole;
    tier?: UserTier;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name || null,
        provider: 'EMAIL',
        role: data.role || 'CANDIDATE',
        tier: data.tier || 'GUEST',
        emailVerified: true,
        onboardingComplete: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tier: true,
        createdAt: true,
      },
    });

    return user;
  }

  /**
   * List all users with pagination, search, and filtering.
   */
  async listUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    tier?: string;
    role?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { name: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (
      params.tier &&
      Object.values(UserTier).includes(params.tier as UserTier)
    ) {
      where.tier = params.tier;
    }

    if (
      params.role &&
      Object.values(UserRole).includes(params.role as UserRole)
    ) {
      where.role = params.role;
    }

    // Build orderBy
    const validSortFields = [
      'id',
      'email',
      'name',
      'tier',
      'role',
      'createdAt',
      'analysesThisMonth',
    ];
    const sortBy = validSortFields.includes(params.sortBy || '')
      ? params.sortBy!
      : 'createdAt';
    const sortOrder = params.sortOrder === 'asc' ? 'asc' : 'desc';

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          role: true,
          tier: true,
          provider: true,
          emailVerified: true,
          userType: true,
          onboardingComplete: true,
          analysesThisMonth: true,
          analysesResetDate: true,
          subscriptionStatus: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { resumes: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single user's full details.
   */
  async getUserById(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        tier: true,
        provider: true,
        providerId: true,
        githubId: true,
        googleId: true,
        emailVerified: true,
        userType: true,
        onboardingComplete: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
        analysesThisMonth: true,
        analysesResetDate: true,
        createdAt: true,
        updatedAt: true,
        resumes: {
          select: {
            id: true,
            fileName: true,
            fileSize: true,
            createdAt: true,
            _count: { select: { analyses: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { resumes: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User #${userId} not found`);
    }

    return user;
  }

  /**
   * Update a user's tier (plan).
   */
  async updateUserTier(userId: number, tier: UserTier) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User #${userId} not found`);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { tier },
      select: {
        id: true,
        email: true,
        name: true,
        tier: true,
        role: true,
      },
    });
  }

  /**
   * Update a user's role.
   */
  async updateUserRole(userId: number, role: UserRole) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User #${userId} not found`);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        tier: true,
        role: true,
      },
    });
  }

  /**
   * Reset a user's monthly analysis count.
   */
  async resetUserUsage(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User #${userId} not found`);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        analysesThisMonth: 0,
        analysesResetDate: new Date(),
      },
      select: {
        id: true,
        email: true,
        analysesThisMonth: true,
        analysesResetDate: true,
      },
    });
  }

  /**
   * Delete a user and all their data.
   */
  async deleteUser(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User #${userId} not found`);
    }

    if (user.role === 'ADMIN') {
      throw new BadRequestException('Cannot delete an admin user');
    }

    await this.prisma.user.delete({ where: { id: userId } });

    return { message: `User #${userId} (${user.email}) deleted successfully` };
  }

  /**
   * Get dashboard statistics.
   */
  async getDashboardStats() {
    const [
      totalUsers,
      guestUsers,
      proUsers,
      recruiterUsers,
      totalResumes,
      totalAnalyses,
      recentUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { tier: 'GUEST' } }),
      this.prisma.user.count({ where: { tier: 'PRO' } }),
      this.prisma.user.count({ where: { tier: 'RECRUITER' } }),
      this.prisma.resume.count(),
      this.prisma.analysis.count(),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // last 30 days
          },
        },
      }),
    ]);

    return {
      totalUsers,
      tierBreakdown: {
        guest: guestUsers,
        pro: proUsers,
        recruiter: recruiterUsers,
      },
      totalResumes,
      totalAnalyses,
      recentUsers,
    };
  }
}
