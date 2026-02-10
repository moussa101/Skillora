import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @ApiOperation({ summary: 'Submit user feedback' })
  @ApiResponse({ status: 201, description: 'Feedback submitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() createFeedbackDto: CreateFeedbackDto) {
    const feedback = await this.feedbackService.create(createFeedbackDto);
    return {
      message: 'Thank you for your feedback!',
      id: feedback.id,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all feedback (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all feedback' })
  async findAll() {
    return this.feedbackService.findAll();
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get feedback statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Feedback statistics' })
  async getStats() {
    return this.feedbackService.getStats();
  }
}
