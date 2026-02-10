import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { EmailService } from '../email/email.service';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('hashed-password'),
    compare: jest.fn(),
}));

describe('AuthService', () => {
    let service: AuthService;
    let prisma: PrismaService;
    let jwtService: JwtService;
    let emailService: EmailService;

    const mockPrisma = {
        user: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        verificationCode: {
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            deleteMany: jest.fn(),
        },
    };

    const mockJwtService = {
        sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    const mockEmailService = {
        sendVerificationEmail: jest.fn().mockResolvedValue(true),
        sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
        generateCode: jest.fn().mockReturnValue('123456'),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: JwtService, useValue: mockJwtService },
                { provide: EmailService, useValue: mockEmailService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        prisma = module.get<PrismaService>(PrismaService);
        jwtService = module.get<JwtService>(JwtService);
        emailService = module.get<EmailService>(EmailService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // ==========================================
    // REGISTER
    // ==========================================
    describe('register', () => {
        const registerDto = { email: 'test@example.com', password: 'Password123!', name: 'Test User' };

        it('should register a new user successfully', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            mockPrisma.user.create.mockResolvedValue({
                id: 1,
                email: registerDto.email,
                name: registerDto.name,
                password: 'hashed-password',
                provider: 'EMAIL',
                emailVerified: false,
            });
            mockPrisma.verificationCode.deleteMany.mockResolvedValue({ count: 0 });
            mockPrisma.verificationCode.create.mockResolvedValue({});

            const result = await service.register(registerDto);

            expect(result.email).toBe(registerDto.email);
            expect(result.message).toContain('Registration successful');
            expect(result).not.toHaveProperty('password');
            expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
        });

        it('should throw ConflictException if email already exists', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: registerDto.email });

            await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
        });

        it('should hash the password before storing', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            mockPrisma.user.create.mockResolvedValue({
                id: 1, email: registerDto.email, password: 'hashed-password',
                name: registerDto.name, provider: 'EMAIL', emailVerified: false,
            });
            mockPrisma.verificationCode.deleteMany.mockResolvedValue({ count: 0 });
            mockPrisma.verificationCode.create.mockResolvedValue({});

            await service.register(registerDto);

            expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
        });
    });

    // ==========================================
    // LOGIN
    // ==========================================
    describe('login', () => {
        const loginDto = { email: 'test@example.com', password: 'Password123!' };

        it('should login successfully with valid credentials', async () => {
            const mockUser = {
                id: 1, email: loginDto.email, password: 'hashed-password',
                provider: 'EMAIL', emailVerified: true, role: 'CANDIDATE',
                tier: 'GUEST', name: 'Test', image: null, userType: 'STUDENT',
                onboardingComplete: true, analysesThisMonth: 0,
            };
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await service.login(loginDto);

            expect(result.access_token).toBe('mock-jwt-token');
            expect(result.user.email).toBe(loginDto.email);
        });

        it('should throw UnauthorizedException for non-existent user', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException for wrong password', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 1, email: loginDto.email, password: 'hashed-password',
                provider: 'EMAIL', emailVerified: true,
            });
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException for unverified email', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 1, email: loginDto.email, password: 'hashed-password',
                provider: 'EMAIL', emailVerified: false,
            });
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
        });
    });

    // ==========================================
    // EMAIL VERIFICATION
    // ==========================================
    describe('verifyEmail', () => {
        it('should verify email with valid code', async () => {
            mockPrisma.verificationCode.findFirst.mockResolvedValue({
                id: 1, email: 'test@example.com', code: '123456', used: false,
            });
            mockPrisma.verificationCode.update.mockResolvedValue({});
            mockPrisma.user.update.mockResolvedValue({});

            const result = await service.verifyEmail('test@example.com', '123456');

            expect(result.success).toBe(true);
            expect(result.message).toContain('verified');
        });

        it('should throw BadRequestException for invalid code', async () => {
            mockPrisma.verificationCode.findFirst.mockResolvedValue(null);

            await expect(service.verifyEmail('test@example.com', '000000'))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('resendVerificationCode', () => {
        it('should resend verification code for unverified user', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 1, email: 'test@example.com', emailVerified: false, name: 'Test',
            });
            mockPrisma.verificationCode.deleteMany.mockResolvedValue({ count: 0 });
            mockPrisma.verificationCode.create.mockResolvedValue({});

            const result = await service.resendVerificationCode('test@example.com');

            expect(result.success).toBe(true);
        });

        it('should throw for already verified email', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 1, email: 'test@example.com', emailVerified: true,
            });

            await expect(service.resendVerificationCode('test@example.com'))
                .rejects.toThrow(BadRequestException);
        });
    });

    // ==========================================
    // PASSWORD RESET
    // ==========================================
    describe('forgotPassword', () => {
        it('should send reset code for existing email user', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 1, email: 'test@example.com', provider: 'EMAIL',
            });
            mockPrisma.verificationCode.deleteMany.mockResolvedValue({ count: 0 });
            mockPrisma.verificationCode.create.mockResolvedValue({});

            const result = await service.forgotPassword('test@example.com');

            expect(result.success).toBe(true);
            expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalled();
        });

        it('should not reveal if user does not exist', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);

            const result = await service.forgotPassword('nonexistent@example.com');

            expect(result.success).toBe(true);
            expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
        });
    });

    describe('resetPassword', () => {
        it('should reset password with valid code', async () => {
            mockPrisma.verificationCode.findFirst.mockResolvedValue({
                id: 1, email: 'test@example.com', code: '123456', used: false,
            });
            mockPrisma.verificationCode.update.mockResolvedValue({});
            mockPrisma.user.update.mockResolvedValue({});

            const result = await service.resetPassword('test@example.com', '123456', 'NewPassword123!');

            expect(result.success).toBe(true);
            expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123!', 10);
        });

        it('should throw for invalid reset code', async () => {
            mockPrisma.verificationCode.findFirst.mockResolvedValue(null);

            await expect(service.resetPassword('test@example.com', '000000', 'NewPass123!'))
                .rejects.toThrow(BadRequestException);
        });
    });

    // ==========================================
    // OAUTH
    // ==========================================
    describe('validateOAuthUser', () => {
        const oauthData = {
            provider: 'GITHUB' as const,
            providerId: 'gh-123',
            email: 'oauth@example.com',
            name: 'OAuth User',
            image: 'https://example.com/avatar.jpg',
        };

        it('should return existing user found by provider ID', async () => {
            const existingUser = {
                id: 1, email: oauthData.email, githubId: 'gh-123',
                onboardingComplete: true,
            };
            mockPrisma.user.findFirst.mockResolvedValue(existingUser);

            const result = await service.validateOAuthUser(oauthData);

            expect(result).toEqual(existingUser);
        });

        it('should set onboardingComplete=true for existing OAuth user', async () => {
            const existingUser = {
                id: 1, email: oauthData.email, githubId: 'gh-123',
                onboardingComplete: false,
            };
            const updatedUser = { ...existingUser, onboardingComplete: true };
            mockPrisma.user.findFirst.mockResolvedValue(existingUser);
            mockPrisma.user.update.mockResolvedValue(updatedUser);

            const result = await service.validateOAuthUser(oauthData);

            expect(result.onboardingComplete).toBe(true);
        });

        it('should create new user for first-time OAuth login', async () => {
            mockPrisma.user.findFirst.mockResolvedValue(null);
            mockPrisma.user.findUnique.mockResolvedValue(null);
            const newUser = {
                id: 1, email: oauthData.email, name: oauthData.name,
                githubId: 'gh-123', tier: 'GUEST', emailVerified: true,
                onboardingComplete: true,
            };
            mockPrisma.user.create.mockResolvedValue(newUser);

            const result = await service.validateOAuthUser(oauthData);

            expect(result.emailVerified).toBe(true);
            expect(result.onboardingComplete).toBe(true);
            expect(result.tier).toBe('GUEST');
        });

        it('should link OAuth to existing email account', async () => {
            mockPrisma.user.findFirst.mockResolvedValue(null);
            const emailUser = {
                id: 1, email: oauthData.email, provider: 'EMAIL',
                password: 'hashed', image: null, name: 'Original Name',
            };
            mockPrisma.user.findUnique.mockResolvedValue(emailUser);
            const linkedUser = {
                ...emailUser, githubId: 'gh-123', onboardingComplete: true,
                emailVerified: true, name: 'OAuth User',
            };
            mockPrisma.user.update.mockResolvedValue(linkedUser);

            const result = await service.validateOAuthUser(oauthData);

            expect(result.githubId).toBe('gh-123');
            expect(result.emailVerified).toBe(true);
        });
    });

    // ==========================================
    // USAGE TRACKING
    // ==========================================
    describe('checkAndIncrementUsage', () => {
        it('should allow usage under limit', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 1, tier: 'GUEST', analysesThisMonth: 2,
                analysesResetDate: new Date(),
            });
            mockPrisma.user.update.mockResolvedValue({});

            const result = await service.checkAndIncrementUsage(1);

            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(2); // 5 - 2 - 1 = 2
        });

        it('should deny usage at limit', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 1, tier: 'GUEST', analysesThisMonth: 5,
                analysesResetDate: new Date(),
            });

            const result = await service.checkAndIncrementUsage(1);

            expect(result.allowed).toBe(false);
            expect(result.remaining).toBe(0);
        });

        it('should reset usage in new month', async () => {
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 1, tier: 'GUEST', analysesThisMonth: 5,
                analysesResetDate: lastMonth,
            });
            mockPrisma.user.update.mockResolvedValue({});

            const result = await service.checkAndIncrementUsage(1);

            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(4); // 5 - 1 = 4
        });

        it('should return not allowed for non-existent user', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);

            const result = await service.checkAndIncrementUsage(999);

            expect(result.allowed).toBe(false);
        });
    });

    // ==========================================
    // ONBOARDING
    // ==========================================
    describe('completeOnboarding', () => {
        it('should complete onboarding with FREE plan', async () => {
            mockPrisma.user.update.mockResolvedValue({
                id: 1, tier: 'GUEST', userType: 'STUDENT', onboardingComplete: true,
            });

            const result = await service.completeOnboarding(1, { userType: 'STUDENT', plan: 'FREE' });

            expect(result.success).toBe(true);
            expect(result.user.onboardingComplete).toBe(true);
        });

        it('should map PREMIUM plan to PRO tier', async () => {
            mockPrisma.user.update.mockResolvedValue({
                id: 1, tier: 'PRO', userType: 'PROFESSIONAL', onboardingComplete: true,
            });

            await service.completeOnboarding(1, { userType: 'PROFESSIONAL', plan: 'PREMIUM' });

            expect(mockPrisma.user.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ tier: 'PRO' }),
                }),
            );
        });
    });

    // ==========================================
    // GENERATE AUTH RESPONSE
    // ==========================================
    describe('generateAuthResponse', () => {
        it('should return access_token and user info', async () => {
            const user = {
                id: 1, email: 'test@example.com', name: 'Test',
                image: null, role: 'CANDIDATE', tier: 'GUEST',
                userType: 'STUDENT', emailVerified: true,
                onboardingComplete: true, analysesThisMonth: 0,
            };

            const result = await service.generateAuthResponse(user);

            expect(result.access_token).toBe('mock-jwt-token');
            expect(result.user.id).toBe(1);
            expect(result.user.email).toBe('test@example.com');
            expect(result.user.analysesLimit).toBe(5); // GUEST limit
        });
    });
});
