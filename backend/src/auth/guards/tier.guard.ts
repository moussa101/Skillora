import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserTier } from '@prisma/client';

export const TIERS_KEY = 'tiers';

// Decorator to set required tiers
export const RequiredTiers = (...tiers: UserTier[]) => {
    return (target: any, key?: string, descriptor?: any) => {
        Reflect.defineMetadata(TIERS_KEY, tiers, descriptor?.value || target);
        return descriptor || target;
    };
};

// Feature limits by tier
export const TIER_LIMITS = {
    GUEST: {
        analysesPerMonth: 1,
        features: ['basic_parsing'],
    },
    PRO: {
        analysesPerMonth: 50,
        features: ['basic_parsing', 'ai_critique', 'ats_scoring', 'pdf_export'],
    },
    RECRUITER: {
        analysesPerMonth: 1000,
        features: ['basic_parsing', 'ai_critique', 'ats_scoring', 'pdf_export', 'bulk_upload', 'api_access', 'candidate_ranking', 'team_dashboard'],
    },
};

@Injectable()
export class TierGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredTiers = this.reflector.get<UserTier[]>(TIERS_KEY, context.getHandler());

        if (!requiredTiers || requiredTiers.length === 0) {
            return true; // No tier requirement
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('Authentication required');
        }

        const hasRequiredTier = requiredTiers.some(tier => {
            // RECRUITER has access to PRO features, PRO has access to GUEST features
            if (user.tier === 'RECRUITER') return true;
            if (user.tier === 'PRO' && tier !== 'RECRUITER') return true;
            return user.tier === tier;
        });

        if (!hasRequiredTier) {
            throw new ForbiddenException(`This feature requires one of the following tiers: ${requiredTiers.join(', ')}`);
        }

        return true;
    }
}

@Injectable()
export class UsageLimitGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('Authentication required');
        }

        const limits = TIER_LIMITS[user.tier as keyof typeof TIER_LIMITS];

        // Check if usage reset is needed (new month)
        const now = new Date();
        const resetDate = new Date(user.analysesResetDate);
        const isNewMonth = now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear();

        if (isNewMonth) {
            // Usage will be reset by the service
            return true;
        }

        if (user.analysesThisMonth >= limits.analysesPerMonth) {
            throw new ForbiddenException(
                `You have reached your monthly limit of ${limits.analysesPerMonth} analyses. ` +
                `Upgrade to ${user.tier === 'GUEST' ? 'Pro' : 'Recruiter'} for more analyses.`
            );
        }

        return true;
    }
}
