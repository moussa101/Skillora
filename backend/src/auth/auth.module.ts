import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
// Apple OAuth requires paid developer account - uncomment when configured
// import { AppleStrategy } from './strategies/apple.strategy';
import { PrismaService } from '../prisma.service';
import { TierGuard, UsageLimitGuard } from './guards/tier.guard';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'dev-only-secret-do-not-use-in-production',
            signOptions: { expiresIn: '7d' },
        }),
        UsersModule,
        EmailModule,
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        PrismaService,
        JwtStrategy,
        GithubStrategy,
        GoogleStrategy,
        // AppleStrategy, // Uncomment when Apple OAuth is configured
        TierGuard,
        UsageLimitGuard,
    ],
    exports: [AuthService, TierGuard, UsageLimitGuard],
})
export class AuthModule { }
