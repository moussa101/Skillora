import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import {
  SubscriptionController,
  AdminSubscriptionController,
} from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [SubscriptionController, AdminSubscriptionController],
  providers: [SubscriptionService, PrismaService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
