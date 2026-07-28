import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { ListAuditLogsDto } from './dto/list-audit-logs.dto'

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(input: {
    workspaceId?: string | null
    actorId?: string | null
    action: string
    targetType: string
    targetId?: string | null
    metadata?: Prisma.InputJsonValue
  }) {
    return this.prisma.auditLog.create({
      data: {
        workspaceId: input.workspaceId || null,
        actorId: input.actorId || null,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId || null,
        metadata: input.metadata
      }
    })
  }

  list(query: ListAuditLogsDto) {
    return this.prisma.auditLog.findMany({
      where: {
        workspaceId: query.workspaceId,
        actorId: query.actorId,
        targetType: query.targetType
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true
          }
        },
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })
  }
}
