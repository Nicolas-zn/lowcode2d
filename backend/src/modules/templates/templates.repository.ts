import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class TemplatesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByHash(hashValue: string) {
    return this.prisma.lowCodeTemplate.findFirst({
      where: { hashValue },
      orderBy: { id: 'desc' }
    })
  }

  create(hashValue: string, template: Prisma.InputJsonValue) {
    return this.prisma.lowCodeTemplate.create({
      data: { hashValue, template }
    })
  }
}
