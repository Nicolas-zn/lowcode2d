import { Injectable } from '@nestjs/common'
import { NotificationType, Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { ListNotificationsDto } from './dto/list-notifications.dto'

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(input: {
    userId: string
    workspaceId?: string | null
    type?: NotificationType
    title: string
    content?: string
    metadata?: Prisma.InputJsonValue
  }) {
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        workspaceId: input.workspaceId || null,
        type: input.type || NotificationType.SYSTEM,
        title: input.title,
        content: input.content,
        metadata: input.metadata
      }
    })
  }

  list(userId: string, query: ListNotificationsDto) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        type: query.type,
        readAt: query.unreadOnly === 'true' ? null : undefined
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })
  }

  markRead(userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() }
    })
  }

  markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() }
    })
  }
}
