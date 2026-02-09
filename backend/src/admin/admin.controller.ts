import {
    Controller, Get, Post, Patch, Delete, Param, Query, Body,
    UseGuards, ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminService } from './admin.service';
import { IsEnum, IsOptional, IsEmail, IsString, MinLength } from 'class-validator';
import { UserTier, UserRole } from '@prisma/client';

class UpdateTierDto {
    @IsEnum(UserTier)
    tier: UserTier;
}

class UpdateRoleDto {
    @IsEnum(UserRole)
    role: UserRole;
}

class CreateUserDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @IsOptional()
    @IsEnum(UserTier)
    tier?: UserTier;
}

@ApiTags('admin')
@Controller('admin')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminController {
    constructor(private adminService: AdminService) { }

    // ============================================
    // DASHBOARD
    // ============================================

    @Get('stats')
    @ApiOperation({ summary: 'Get admin dashboard statistics' })
    async getDashboardStats() {
        return this.adminService.getDashboardStats();
    }

    // ============================================
    // USER MANAGEMENT
    // ============================================

    @Get('users')
    @ApiOperation({ summary: 'List all users with pagination and search' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'tier', required: false, enum: UserTier })
    @ApiQuery({ name: 'role', required: false, enum: UserRole })
    @ApiQuery({ name: 'sortBy', required: false, type: String })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
    async listUsers(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('tier') tier?: string,
        @Query('role') role?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    ) {
        return this.adminService.listUsers({
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            search,
            tier,
            role,
            sortBy,
            sortOrder,
        });
    }

    @Post('users')
    @ApiOperation({ summary: 'Create a new user' })
    async createUser(@Body() dto: CreateUserDto) {
        return this.adminService.createUser(dto);
    }

    @Get('users/:id')
    @ApiOperation({ summary: 'Get a single user\'s full details' })
    async getUser(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.getUserById(id);
    }

    @Patch('users/:id/tier')
    @ApiOperation({ summary: 'Update a user\'s tier/plan' })
    async updateUserTier(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateTierDto,
    ) {
        return this.adminService.updateUserTier(id, dto.tier);
    }

    @Patch('users/:id/role')
    @ApiOperation({ summary: 'Update a user\'s role' })
    async updateUserRole(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateRoleDto,
    ) {
        return this.adminService.updateUserRole(id, dto.role);
    }

    @Patch('users/:id/reset-usage')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Reset a user\'s monthly analysis count' })
    async resetUserUsage(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.resetUserUsage(id);
    }

    @Delete('users/:id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete a user and all their data' })
    @ApiResponse({ status: 200, description: 'User deleted' })
    async deleteUser(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.deleteUser(id);
    }
}
