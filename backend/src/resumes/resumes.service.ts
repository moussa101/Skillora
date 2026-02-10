import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ResumesService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ResumeCreateInput) {
    return this.prisma.resume.create({
      data,
    });
  }

  async findAll(userId: number) {
    return this.prisma.resume.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { analyses: true },
    });
  }

  async findOne(id: number, userId?: number) {
    const where: Prisma.ResumeWhereUniqueInput = { id };

    // If userId is provided, ensure ownership is verified manually in controller or here?
    // Better to return valid resume and let controller check, OR simple where check
    // But Prisma findUnique only accepts unique identifiers.
    // So we use findFirst if checking userId

    if (userId) {
      return this.prisma.resume.findFirst({
        where: { id, userId },
        include: { analyses: true },
      });
    }

    return this.prisma.resume.findUnique({
      where,
      include: { analyses: true },
    });
  }

  async createAnalysis(data: Prisma.AnalysisCreateInput) {
    return this.prisma.analysis.create({
      data,
    });
  }
}
