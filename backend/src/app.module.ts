import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ResumesModule } from './resumes/resumes.module';
import { AdminModule } from './admin/admin.module';
import { SubscriptionModule } from './subscription/subscription.module';

@Module({
  imports: [
    // Rate limiting: 10 requests per hour per user (NFR-SEC-03)
    ThrottlerModule.forRoot([{
      ttl: 3600000, // 1 hour in ms
      limit: 10,
    }]),
    AuthModule,
    UsersModule,
    ResumesModule,
    AdminModule,
    SubscriptionModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }

