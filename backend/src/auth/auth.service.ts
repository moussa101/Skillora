import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
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
    ) { }

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
            },
        });

        const { password, ...result } = user;
        return result;
    }

    async login(loginDto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: loginDto.email },
        });

        if (!user || !user.password) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return this.generateAuthResponse(user);
    }

    async validateOAuthUser(data: OAuthUserData) {
        // Check if user exists with this provider ID
        let user = await this.prisma.user.findFirst({
            where: {
                provider: data.provider,
                providerId: data.providerId,
            },
        });

        if (!user) {
            // Check if email exists (link accounts)
            user = await this.prisma.user.findUnique({
                where: { email: data.email },
            });

            if (user) {
                // Update existing user with OAuth info
                user = await this.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        provider: data.provider,
                        providerId: data.providerId,
                        image: data.image || user.image,
                        name: data.name || user.name,
                    },
                });
            } else {
                // Create new user
                user = await this.prisma.user.create({
                    data: {
                        email: data.email,
                        name: data.name,
                        image: data.image,
                        provider: data.provider,
                        providerId: data.providerId,
                        tier: 'GUEST',
                    },
                });
            }
        }

        return user;
    }

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
                analysesThisMonth: user.analysesThisMonth,
                analysesLimit: TIER_LIMITS[user.tier as keyof typeof TIER_LIMITS]?.analysesPerMonth || 1,
            },
        };
    }

    async checkAndIncrementUsage(userId: number): Promise<{ allowed: boolean; remaining: number }> {
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
        const isNewMonth = now.getMonth() !== resetDate.getMonth() ||
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
            return { allowed: true, remaining: limits.analysesPerMonth - 1 };
        }

        if (user.analysesThisMonth >= limits.analysesPerMonth) {
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
            remaining: limits.analysesPerMonth - user.analysesThisMonth - 1,
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
                analysesThisMonth: true,
                analysesResetDate: true,
                createdAt: true,
            },
        });
    }
}
