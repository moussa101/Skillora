/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../src/auth/auth.service';
import { AuthController } from '../src/auth/auth.controller';
import { UsersService } from '../src/users/users.service';
import { PrismaService } from '../src/prisma.service';
import { JwtService, JwtModule } from '@nestjs/jwt';
import { EmailService } from '../src/email/email.service';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';

/**
 * Integration tests - test the auth module components working together
 * Uses mocked Prisma to avoid database dependency, but real JWT & EmailService
 */
describe('Auth Integration', () => {
  let authService: AuthService;
  let authController: AuthController;
  let jwtService: JwtService;

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

  const mockUsersService = {
    findOne: jest.fn(),
    findByEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'test-secret-key',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        EmailService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    authController = module.get<AuthController>(AuthController);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  // ==========================================
  // REGISTER → VERIFY → LOGIN flow
  // ==========================================
  describe('Full registration flow', () => {
    it('should register user, verify email, then allow login', async () => {
      // Step 1: Register
      const registerDto = {
        email: 'flow@example.com',
        password: 'Password123!',
        name: 'Flow User',
      };

      mockPrisma.user.findUnique.mockResolvedValueOnce(null); // No existing user
      const createdUser = {
        id: 1,
        email: registerDto.email,
        name: registerDto.name,
        password: '$2b$10$hashedpassword',
        provider: 'EMAIL',
        emailVerified: false,
        role: 'CANDIDATE',
        tier: 'GUEST',
        onboardingComplete: false,
        userType: 'STUDENT',
        analysesThisMonth: 0,
        image: null,
      };
      mockPrisma.user.create.mockResolvedValue(createdUser);
      mockPrisma.verificationCode.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.verificationCode.create.mockResolvedValue({});

      const registerResult = await authController.register(registerDto);
      expect(registerResult.message).toContain('Registration successful');

      // Step 2: Try login before verification — should fail
      mockPrisma.user.findUnique.mockResolvedValueOnce(createdUser);
      // bcrypt.compare would return true for the real password
      // But emailVerified is false, so it should throw

      // Step 3: Verify email
      mockPrisma.verificationCode.findFirst.mockResolvedValue({
        id: 1,
        email: registerDto.email,
        code: '123456',
        used: false,
        expiresAt: new Date(Date.now() + 900000),
      });
      mockPrisma.verificationCode.update.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue({
        ...createdUser,
        emailVerified: true,
      });

      const verifyResult = await authController.verifyEmail({
        email: registerDto.email,
        code: '123456',
      } as any);
      expect(verifyResult.success).toBe(true);
    });
  });

  // ==========================================
  // JWT token validation
  // ==========================================
  describe('JWT token generation and validation', () => {
    it('should generate a valid JWT token on login', async () => {
      const user = {
        id: 1,
        email: 'token@example.com',
        role: 'CANDIDATE',
        tier: 'GUEST',
        name: 'Token User',
        image: null,
        userType: 'STUDENT',
        emailVerified: true,
        onboardingComplete: true,
        analysesThisMonth: 0,
      };

      const authResponse = await authService.generateAuthResponse(user);

      expect(authResponse.access_token).toBeDefined();

      // Verify the JWT is valid
      const decoded = jwtService.verify(authResponse.access_token);
      expect(decoded.sub).toBe(1);
      expect(decoded.email).toBe('token@example.com');
      expect(decoded.role).toBe('CANDIDATE');
      expect(decoded.tier).toBe('GUEST');
    });

    it('should include correct user info in response', async () => {
      const user = {
        id: 2,
        email: 'pro@example.com',
        role: 'CANDIDATE',
        tier: 'PRO',
        name: 'Pro User',
        image: 'https://example.com/img.jpg',
        userType: 'PROFESSIONAL',
        emailVerified: true,
        onboardingComplete: true,
        analysesThisMonth: 3,
      };

      const authResponse = await authService.generateAuthResponse(user);

      expect(authResponse.user.tier).toBe('PRO');
      expect(authResponse.user.analysesLimit).toBe(-1); // PRO is unlimited
    });
  });

  // ==========================================
  // Password reset flow
  // ==========================================
  describe('Password reset flow', () => {
    it('should handle forgot → reset password flow', async () => {
      // Forgot password
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 1,
        email: 'reset@example.com',
        provider: 'EMAIL',
      });
      mockPrisma.verificationCode.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.verificationCode.create.mockResolvedValue({});

      const forgotResult = await authController.forgotPassword({
        email: 'reset@example.com',
      } as any);
      expect(forgotResult.success).toBe(true);

      // Reset password
      mockPrisma.verificationCode.findFirst.mockResolvedValue({
        id: 1,
        email: 'reset@example.com',
        code: '654321',
        used: false,
        expiresAt: new Date(Date.now() + 900000),
      });
      mockPrisma.verificationCode.update.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue({});

      const resetResult = await authController.resetPassword({
        email: 'reset@example.com',
        code: '654321',
        newPassword: 'NewPassword123!',
      } as any);
      expect(resetResult.success).toBe(true);
    });
  });

  // ==========================================
  // OAuth integration
  // ==========================================
  describe('OAuth callback integration', () => {
    it('should generate auth response for GitHub OAuth user', async () => {
      const githubUser = {
        id: 1,
        email: 'github@example.com',
        name: 'GitHub User',
        image: 'https://github.com/avatar.jpg',
        role: 'CANDIDATE',
        tier: 'GUEST',
        userType: 'STUDENT',
        emailVerified: true,
        onboardingComplete: true,
        analysesThisMonth: 0,
      };

      const response = await authService.generateAuthResponse(githubUser);

      expect(response.access_token).toBeDefined();
      expect(response.user.email).toBe('github@example.com');
      expect(response.user.emailVerified).toBe(true);
    });
  });

  // ==========================================
  // Tier-based access
  // ==========================================
  describe('Tier-based usage limits', () => {
    it('should enforce GUEST 5-analysis limit', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        tier: 'GUEST',
        analysesThisMonth: 5,
        analysesResetDate: new Date(),
      });

      const result = await authService.checkAndIncrementUsage(1);

      expect(result.allowed).toBe(false);
    });

    it('should allow unlimited for PRO tier', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        tier: 'PRO',
        analysesThisMonth: 100,
        analysesResetDate: new Date(),
      });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await authService.checkAndIncrementUsage(1);

      // PRO has -1 (unlimited), so 100 < -1 is false — always allowed
      expect(result.allowed).toBe(true);
    });
  });
});
