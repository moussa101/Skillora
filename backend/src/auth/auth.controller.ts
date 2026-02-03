import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Response, Request } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    @ApiOperation({ summary: 'Register a new user with email/password' })
    @ApiResponse({ status: 201, description: 'User successfully registered' })
    @ApiResponse({ status: 409, description: 'Email already exists' })
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login user with email/password' })
    @ApiResponse({ status: 200, description: 'Login successful' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
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
    // APPLE OAuth
    // ============================================

    @Get('apple')
    @UseGuards(AuthGuard('apple'))
    @ApiOperation({ summary: 'Initiate Apple OAuth login' })
    async appleAuth() {
        // Guard redirects to Apple
    }

    @Post('apple/callback')
    @UseGuards(AuthGuard('apple'))
    @ApiOperation({ summary: 'Apple OAuth callback (POST for Apple)' })
    async appleAuthCallback(@Req() req: Request, @Res() res: Response) {
        const authResponse = await this.authService.generateAuthResponse(req.user);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        res.redirect(`${frontendUrl}/auth/callback?token=${authResponse.access_token}`);
    }

    // ============================================
    // USER INFO
    // ============================================

    @Get('me')
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: 'Get current user info' })
    async getMe(@Req() req: Request) {
        const user = await this.authService.findUserById((req.user as any).sub);
        const features = await this.authService.getUserFeatures((req.user as any).sub);
        return { ...user, features };
    }

    @Get('usage')
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: 'Get current usage stats' })
    async getUsage(@Req() req: Request) {
        const user = await this.authService.findUserById((req.user as any).sub);
        const features = await this.authService.getUserFeatures((req.user as any).sub);
        return {
            tier: user?.tier,
            analysesThisMonth: user?.analysesThisMonth,
            features,
        };
    }
}
