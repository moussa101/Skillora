import { IsEnum, IsNotEmpty } from 'class-validator';

export enum UserTypeDto {
    STUDENT = 'STUDENT',
    PROFESSIONAL = 'PROFESSIONAL',
    RECRUITER = 'RECRUITER',
}

export enum PlanDto {
    FREE = 'FREE',
    PREMIUM = 'PREMIUM',
    ORGANIZATION = 'ORGANIZATION',
}

export class CompleteOnboardingDto {
    @IsNotEmpty()
    @IsEnum(UserTypeDto)
    userType: UserTypeDto;

    @IsNotEmpty()
    @IsEnum(PlanDto)
    plan: PlanDto;
}
