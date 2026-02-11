import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { EmailService } from '../email/email.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TIER_LIMITS } from './guards/tier.guard';
import * as bcrypt from 'bcrypt';

interface OAuthUserData {
  provider: 'GITHUB' | 'GOOGLE' | 'APPLE';
  providerId: string;
  email: string;
  name?: string;
  image?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        name: registerDto.name,
        provider: 'EMAIL',
        emailVerified: false,
      },
    });

    // Send verification email
    await this.sendVerificationCode(user.email, user.name || undefined);

    const { password, ...result } = user;
    return {
      ...result,
      message:
        'Registration successful. Please check your email for verification code.',
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if email is verified
    if (!user.emailVerified && user.provider === 'EMAIL') {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    return this.generateAuthResponse(user);
  }

  // ============================================
  // EMAIL VERIFICATION
  // ============================================

  async sendVerificationCode(email: string, name?: string): Promise<void> {
    const code = this.emailService.generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete any existing codes for this email
    await this.prisma.verificationCode.deleteMany({
      where: {
        email,
        type: 'EMAIL_VERIFICATION',
      },
    });

    // Create new code
    await this.prisma.verificationCode.create({
      data: {
        email,
        code,
        type: 'EMAIL_VERIFICATION',
        expiresAt,
      },
    });

    // Send email
    await this.emailService.sendVerificationEmail(email, code, name);
  }

  async verifyEmail(
    email: string,
    code: string,
  ): Promise<{ success: boolean; message: string }> {
    const verification = await this.prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        type: 'EMAIL_VERIFICATION',
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!verification) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    // Mark code as used
    await this.prisma.verificationCode.update({
      where: { id: verification.id },
      data: { used: true },
    });

    // Mark user as verified
    await this.prisma.user.update({
      where: { email },
      data: { emailVerified: true },
    });

    return { success: true, message: 'Email verified successfully' };
  }

  async resendVerificationCode(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    await this.sendVerificationCode(email, user.name || undefined);
    return { success: true, message: 'Verification code sent' };
  }

  // ============================================
  // ONBOARDING
  // ============================================

  async completeOnboarding(
    userId: number,
    data: { userType: string; plan: string },
  ): Promise<{ success: boolean; message: string; user: any }> {
    // Map plan to tier
    const tierMap: Record<string, 'GUEST' | 'PRO' | 'RECRUITER'> = {
      FREE: 'GUEST',
      PREMIUM: 'PRO',
      ORGANIZATION: 'RECRUITER',
    };

    const tier = tierMap[data.plan] || 'GUEST';
    const userType = data.userType as 'STUDENT' | 'PROFESSIONAL' | 'RECRUITER';

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        userType,
        tier,
        onboardingComplete: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        tier: true,
        userType: true,
        onboardingComplete: true,
        analysesThisMonth: true,
      },
    });

    return {
      success: true,
      message: 'Onboarding completed successfully',
      user,
    };
  }

  // ============================================
  // PASSWORD RESET
  // ============================================

  async forgotPassword(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists
    if (!user || user.provider !== 'EMAIL') {
      return {
        success: true,
        message: 'If an account exists, a reset code has been sent',
      };
    }

    const code = this.emailService.generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete any existing codes
    await this.prisma.verificationCode.deleteMany({
      where: {
        email,
        type: 'PASSWORD_RESET',
      },
    });

    // Create new code
    await this.prisma.verificationCode.create({
      data: {
        email,
        code,
        type: 'PASSWORD_RESET',
        expiresAt,
      },
    });

    await this.emailService.sendPasswordResetEmail(email, code);
    return {
      success: true,
      message: 'If an account exists, a reset code has been sent',
    };
  }

  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    const verification = await this.prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        type: 'PASSWORD_RESET',
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!verification) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    // Mark code as used
    await this.prisma.verificationCode.update({
      where: { id: verification.id },
      data: { used: true },
    });

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    return { success: true, message: 'Password reset successfully' };
  }

  // ============================================
  // OAUTH
  // ============================================

  async validateOAuthUser(data: OAuthUserData) {
    // Determine the provider-specific ID field
    const providerIdField =
      data.provider === 'GITHUB' ? 'githubId' : 'googleId';

    // First, look up by provider-specific ID (returning user via this OAuth)
    let user = await this.prisma.user.findFirst({
      where: { [providerIdField]: data.providerId },
    });

    // Existing OAuth user — ensure onboardingComplete so they land on dashboard
    if (user && !user.onboardingComplete) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { onboardingComplete: true },
      });
    }

    if (!user) {
      // Also check legacy provider/providerId for backward compatibility
      user = await this.prisma.user.findFirst({
        where: {
          provider: data.provider,
          providerId: data.providerId,
        },
      });

      // Migrate legacy user to new field
      if (user) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            [providerIdField]: data.providerId,
            onboardingComplete: true,
          },
        });
      }
    }

    if (!user) {
      // Check if email exists (link accounts)
      user = await this.prisma.user.findUnique({
        where: { email: data.email },
      });

      if (user) {
        // Link OAuth to existing account without overwriting provider
        // This preserves email/password login while adding OAuth
        const updateData: Record<string, any> = {
          [providerIdField]: data.providerId,
          image: data.image || user.image,
          name: data.name || user.name,
          emailVerified: true, // OAuth emails are verified
          onboardingComplete: true,
        };

        // Only set provider/providerId if user has no primary auth yet
        if (user.provider === 'EMAIL' && !user.password) {
          updateData.provider = data.provider;
          updateData.providerId = data.providerId;
        }

        user = await this.prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      } else {
        // Create new user (OAuth users are auto-verified)
        user = await this.prisma.user.create({
          data: {
            email: data.email,
            name: data.name,
            image: data.image,
            provider: data.provider,
            providerId: data.providerId,
            [providerIdField]: data.providerId,
            tier: 'GUEST',
            emailVerified: true,
            onboardingComplete: true,
          },
        });
      }
    }

    return user;
  }

  // ============================================
  // HELPERS
  // ============================================

  async generateAuthResponse(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tier: user.tier,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        tier: user.tier,
        userType: user.userType,
        emailVerified: user.emailVerified,
        onboardingComplete: user.onboardingComplete,
        analysesThisMonth: user.analysesThisMonth,
        analysesLimit:
          TIER_LIMITS[user.tier as keyof typeof TIER_LIMITS]
            ?.analysesPerMonth || 1,
      },
    };
  }

  async checkAndIncrementUsage(
    userId: number,
  ): Promise<{ allowed: boolean; remaining: number }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { allowed: false, remaining: 0 };
    }

    const limits = TIER_LIMITS[user.tier as keyof typeof TIER_LIMITS];
    const now = new Date();
    const resetDate = new Date(user.analysesResetDate);

    // Check if we need to reset (new month)
    const isNewMonth =
      now.getMonth() !== resetDate.getMonth() ||
      now.getFullYear() !== resetDate.getFullYear();

    if (isNewMonth) {
      // Reset usage for new month
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          analysesThisMonth: 1,
          analysesResetDate: now,
        },
      });
      return {
        allowed: true,
        remaining: limits.analysesPerMonth === -1 ? -1 : limits.analysesPerMonth - 1,
      };
    }

    // -1 means unlimited
    if (
      limits.analysesPerMonth !== -1 &&
      user.analysesThisMonth >= limits.analysesPerMonth
    ) {
      return { allowed: false, remaining: 0 };
    }

    // Increment usage
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        analysesThisMonth: { increment: 1 },
      },
    });

    return {
      allowed: true,
      remaining:
        limits.analysesPerMonth === -1
          ? -1
          : limits.analysesPerMonth - user.analysesThisMonth - 1,
    };
  }

  async getUserFeatures(userId: number): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return [];
    }

    return TIER_LIMITS[user.tier as keyof typeof TIER_LIMITS]?.features || [];
  }

  async findUserById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        tier: true,
        userType: true,
        emailVerified: true,
        onboardingComplete: true,
        analysesThisMonth: true,
        analysesResetDate: true,
        createdAt: true,
      },
    });
  }
}
