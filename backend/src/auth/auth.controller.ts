import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards, Req, Res, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { validateImageFile, processProfileImage } from '../utils/image-upload.util';
import type { Response, Request } from 'express';

// DTOs for new endpoints
class VerifyEmailDto {
    @IsEmail()
    email: string;

    @IsString()
    code: string;
}

class ForgotPasswordDto {
    @IsEmail()
    email: string;
}

class ResetPasswordDto {
    @IsEmail()
    email: string;

    @IsString()
    code: string;

    @IsString()
    @MinLength(8)
    newPassword: string;
}

class ResendVerificationDto {
    @IsEmail()
    email: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private usersService: UsersService,
    ) { }

    @Post('register')
    @ApiOperation({ summary: 'Register a new user with email/password' })
    @ApiResponse({ status: 201, description: 'User registered, verification email sent' })
    @ApiResponse({ status: 409, description: 'Email already exists' })
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login user with email/password' })
    @ApiResponse({ status: 200, description: 'Login successful' })
    @ApiResponse({ status: 401, description: 'Invalid credentials or email not verified' })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    // ============================================
    // EMAIL VERIFICATION
    // ============================================

    @Post('verify-email')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verify email with 6-digit code' })
    @ApiResponse({ status: 200, description: 'Email verified successfully' })
    @ApiResponse({ status: 400, description: 'Invalid or expired code' })
    async verifyEmail(@Body() dto: VerifyEmailDto) {
        return this.authService.verifyEmail(dto.email, dto.code);
    }

    @Post('resend-verification')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Resend verification email' })
    @ApiResponse({ status: 200, description: 'Verification code sent' })
    async resendVerification(@Body() dto: ResendVerificationDto) {
        return this.authService.resendVerificationCode(dto.email);
    }

    // ============================================
    // PASSWORD RESET
    // ============================================

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Request password reset code' })
    @ApiResponse({ status: 200, description: 'Reset code sent if account exists' })
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto.email);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Reset password with code' })
    @ApiResponse({ status: 200, description: 'Password reset successfully' })
    @ApiResponse({ status: 400, description: 'Invalid or expired code' })
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto.email, dto.code, dto.newPassword);
    }

    // ============================================
    // GITHUB OAuth
    // ============================================

    @Get('github')
    @UseGuards(AuthGuard('github'))
    @ApiOperation({ summary: 'Initiate GitHub OAuth login' })
    async githubAuth() {
        // Guard redirects to GitHub
    }

    @Get('github/callback')
    @UseGuards(AuthGuard('github'))
    @ApiOperation({ summary: 'GitHub OAuth callback' })
    async githubAuthCallback(@Req() req: Request, @Res() res: Response) {
        const authResponse = await this.authService.generateAuthResponse(req.user);
        // Redirect to frontend with token
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        res.redirect(`${frontendUrl}/auth/callback?token=${authResponse.access_token}`);
    }

    // ============================================
    // GOOGLE OAuth
    // ============================================

    @Get('google')
    @UseGuards(AuthGuard('google'))
    @ApiOperation({ summary: 'Initiate Google OAuth login' })
    async googleAuth() {
        // Guard redirects to Google
    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    @ApiOperation({ summary: 'Google OAuth callback' })
    async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
        const authResponse = await this.authService.generateAuthResponse(req.user);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        res.redirect(`${frontendUrl}/auth/callback?token=${authResponse.access_token}`);
    }

    // ============================================
    // APPLE OAuth (disabled - requires paid developer account)
    // ============================================

    // @Get('apple')
    // @UseGuards(AuthGuard('apple'))
    // async appleAuth() {}

    // @Post('apple/callback')
    // @UseGuards(AuthGuard('apple'))
    // async appleAuthCallback(@Req() req: Request, @Res() res: Response) {}

    // ============================================
    // USER INFO
    // ============================================

    @Get('me')
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: 'Get current user info' })
    async getMe(@Req() req: Request) {
        const userId = (req.user as any).id;
        const user = await this.authService.findUserById(userId);
        const features = await this.authService.getUserFeatures(userId);
        return { ...user, features };
    }

    @Get('usage')
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: 'Get current usage stats' })
    async getUsage(@Req() req: Request) {
        const userId = (req.user as any).id;
        const user = await this.authService.findUserById(userId);
        const features = await this.authService.getUserFeatures(userId);
        return {
            tier: user?.tier,
            analysesThisMonth: user?.analysesThisMonth,
            features,
        };
    }

    // ============================================
    // PROFILE IMAGE UPLOAD
    // ============================================

    @Post('profile-image')
    @UseGuards(AuthGuard('jwt'))
    @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 5 * 1024 * 1024 } }))
    @ApiOperation({ summary: 'Upload profile image' })
    @ApiConsumes('multipart/form-data')
    @ApiResponse({ status: 200, description: 'Image uploaded successfully' })
    @ApiResponse({ status: 400, description: 'Invalid image file' })
    async uploadProfileImage(
        @Req() req: Request,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException('No image file provided');
        }

        const userId = (req.user as any).id;

        // Validate the image
        const validation = validateImageFile(file.buffer, file.mimetype, file.size);
        if (!validation.valid) {
            throw new BadRequestException(validation.error);
        }

        // Process image (resize to 200x200, convert to WebP, strip metadata)
        const processed = await processProfileImage(file.buffer);

        // Save to database
        const updatedUser = await this.usersService.updateProfileImage(userId, processed.dataUrl);

        return {
            message: 'Profile image updated successfully',
            image: updatedUser.image,
        };
    }
}
