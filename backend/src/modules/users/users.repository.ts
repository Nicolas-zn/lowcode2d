import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: this.safeUserSelect()
    })
  }

  findByEmailWithPassword(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })
  }

  create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({
      data,
      select: this.safeUserSelect()
    })
  }

  safeUserSelect() {
    return {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true
    } satisfies Prisma.UserSelect
  }
}
