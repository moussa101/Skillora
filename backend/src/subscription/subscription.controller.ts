import {
    Controller, Post, Get, Patch, Body, Param, Query, Request,
    UseGuards, UseInterceptors, UploadedFile, ParseIntPipe,
    HttpCode, HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ApiTags, ApiOperation, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { UserTier } from '@prisma/client';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads', 'payments');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const paymentStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `payment-${uniqueSuffix}${ext}`);
    },
});

class SubscribeDto {
    @IsEnum({ PRO: 'PRO', RECRUITER: 'RECRUITER' })
    plan: 'PRO' | 'RECRUITER';

    @IsOptional()
    @IsString()
    paymentMethod?: string;
}

class ApproveDto {
    @IsDateString()
    startDate: string;

    @IsDateString()
    endDate: string;

    @IsOptional()
    @IsString()
    adminNote?: string;
}

class RejectDto {
    @IsOptional()
    @IsString()
    adminNote?: string;
}

class SetDatesDto {
    @IsDateString()
    startDate: string;

    @IsDateString()
    endDate: string;

    @IsOptional()
    @IsString()
    adminNote?: string;
}

// ============================================
// USER ENDPOINTS
// ============================================

@ApiTags('subscriptions')
@Controller('subscriptions')
@UseGuards(AuthGuard('jwt'))
export class SubscriptionController {
    constructor(private subscriptionService: SubscriptionService) { }

    @Post('request')
    @ApiOperation({ summary: 'Submit payment screenshot and request subscription' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('screenshot', {
        storage: paymentStorage,
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
        fileFilter: (_req, file, cb) => {
            const allowed = /\.(jpg|jpeg|png|webp|gif|pdf)$/i;
            if (allowed.test(file.originalname)) {
                cb(null, true);
            } else {
                cb(new Error('Only image files (JPG, PNG, WebP, GIF) and PDF are allowed'), false);
            }
        },
    }))
    async requestSubscription(
        @UploadedFile() screenshot: Express.Multer.File,
        @Body() body: SubscribeDto,
        @Request() req,
    ) {
        if (!screenshot) {
            return { error: 'Payment screenshot is required' };
        }

        return this.subscriptionService.createRequest(req.user.id, {
            plan: body.plan as UserTier,
            paymentMethod: body.paymentMethod,
            screenshotPath: screenshot.path,
        });
    }

    @Get('my')
    @ApiOperation({ summary: 'Get current user subscription status' })
    async getMySubscriptions(@Request() req) {
        return this.subscriptionService.getUserSubscriptions(req.user.id);
    }
}

// ============================================
// ADMIN ENDPOINTS
// ============================================

@ApiTags('admin/subscriptions')
@Controller('admin/subscriptions')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminSubscriptionController {
    constructor(private subscriptionService: SubscriptionService) { }

    @Get()
    @ApiOperation({ summary: 'List all subscriptions (admin)' })
    @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'] })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async listSubscriptions(
        @Query('status') status?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.subscriptionService.listSubscriptions({
            status,
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
        });
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get subscription statistics' })
    async getStats() {
        return this.subscriptionService.getStats();
    }

    @Patch(':id/approve')
    @ApiOperation({ summary: 'Approve a subscription request with dates' })
    async approveSubscription(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: ApproveDto,
        @Request() req,
    ) {
        return this.subscriptionService.approveSubscription(id, req.user.id, dto);
    }

    @Patch(':id/reject')
    @ApiOperation({ summary: 'Reject a subscription request' })
    async rejectSubscription(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: RejectDto,
        @Request() req,
    ) {
        return this.subscriptionService.rejectSubscription(id, req.user.id, dto.adminNote);
    }

    @Patch(':id/dates')
    @ApiOperation({ summary: 'Set or update subscription dates' })
    async setDates(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: SetDatesDto,
        @Request() req,
    ) {
        return this.subscriptionService.setSubscriptionDates(id, req.user.id, dto);
    }

    @Get('screenshot/:filename')
    @ApiOperation({ summary: 'Serve payment screenshot' })
    async getScreenshot(@Param('filename') filename: string, @Request() req) {
        const filePath = path.join(uploadDir, filename);
        if (!fs.existsSync(filePath)) {
            return { error: 'Screenshot not found' };
        }

        const res = req.res;
        res.sendFile(filePath);
    }
}
