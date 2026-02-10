import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(private prisma: PrismaService) {}

  async create(createFeedbackDto: CreateFeedbackDto) {
    return this.prisma.feedback.create({
      data: {
        name: createFeedbackDto.name,
        email: createFeedbackDto.email,
        rating: createFeedbackDto.rating,
        message: createFeedbackDto.message,
      },
    });
  }

  async findAll() {
    return this.prisma.feedback.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getStats() {
    const totalFeedback = await this.prisma.feedback.count();
    const averageRating = await this.prisma.feedback.aggregate({
      _avg: {
        rating: true,
      },
    });

    return {
      total: totalFeedback,
      averageRating: averageRating._avg.rating || 0,
    };
  }
}
