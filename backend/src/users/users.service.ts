
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service'; // Assuming PrismaService will be created in src/prisma.service.ts
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findOne(
        userWhereUniqueInput: Prisma.UserWhereUniqueInput,
    ): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: userWhereUniqueInput,
        });
    }

    async createUser(data: Prisma.UserCreateInput): Promise<User> {
        return this.prisma.user.create({
            data,
        });
    }

    async updateUser(
        where: Prisma.UserWhereUniqueInput,
        data: Prisma.UserUpdateInput,
    ): Promise<User> {
        return this.prisma.user.update({
            where,
            data,
        });
    }

    async updateProfileImage(userId: number, imageDataUrl: string): Promise<User> {
        return this.prisma.user.update({
            where: { id: userId },
            data: { image: imageDataUrl },
        });
    }
}
