import { randomBytes, createHash } from 'node:crypto'
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../../prisma/prisma.service'
import { RedisService } from '../../redis/redis.service'
import { AuditService } from '../audit/audit.service'
import { UsersService } from '../users/users.service'
import { WorkspacesService } from '../workspaces/workspaces.service'
import * as bcrypt from 'bcryptjs'

interface TokenPair {
  accessToken: string
  refreshToken: string
  refreshTokenExpiresAt: Date
}

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly auditService: AuditService,
    private readonly usersService: UsersService,
    private readonly workspacesService: WorkspacesService
  ) {}

  async register(input: { email: string; password: string; displayName?: string }) {
    const passwordHash = await bcrypt.hash(input.password, 12)
    const user = await this.usersService.createUser({
      email: input.email,
      passwordHash,
      displayName: input.displayName
    })
    const workspace = await this.workspacesService.createDefaultForUser({
      userId: user.id,
      email: user.email,
      displayName: user.displayName || undefined
    })
    const tokens = await this.issueTokenPair(user.id, user.email)
    await this.auditService.log({
      workspaceId: workspace.id,
      actorId: user.id,
      action: 'auth.register',
      targetType: 'User',
      targetId: user.id,
      metadata: { email: user.email }
    })

    return {
      user,
      workspace,
      tokens
    }
  }

  async login(input: { email: string; password: string }) {
    const userWithPassword = await this.usersService.findByEmailWithPassword(input.email)
    if (!userWithPassword?.passwordHash) {
      throw new UnauthorizedException('Invalid email or password')
    }

    const passwordValid = await bcrypt.compare(input.password, userWithPassword.passwordHash)
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password')
    }

    const user = await this.usersService.getById(userWithPassword.id)
    const workspaces = await this.workspacesService.listForUser(user.id)
    const tokens = await this.issueTokenPair(user.id, user.email)
    await this.auditService.log({
      workspaceId: workspaces[0]?.id,
      actorId: user.id,
      action: 'auth.login',
      targetType: 'User',
      targetId: user.id,
      metadata: { email: user.email }
    })

    return {
      user,
      workspaces,
      tokens
    }
  }

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) throw new UnauthorizedException('Refresh token is required')

    const tokenHash = this.hashToken(refreshToken)
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true }
    })

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt <= new Date()) {
      throw new UnauthorizedException('Invalid refresh token')
    }

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() }
    })
    await this.redis.del(`refresh:${storedToken.id}`)

    const user = await this.usersService.getById(storedToken.userId)
    const tokens = await this.issueTokenPair(user.id, user.email)

    return {
      user,
      tokens
    }
  }

  async logout(refreshToken: string | undefined) {
    if (!refreshToken) return { loggedOut: true }

    const tokenHash = this.hashToken(refreshToken)
    const storedToken = await this.prisma.refreshToken.findUnique({ where: { tokenHash } })
    if (storedToken && !storedToken.revokedAt) {
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() }
      })
      await this.redis.del(`refresh:${storedToken.id}`)
    }

    return { loggedOut: true }
  }

  async getMe(userId: string) {
    const user = await this.usersService.getById(userId)
    const workspaces = await this.workspacesService.listForUser(userId)
    return { user, workspaces }
  }

  private async issueTokenPair(userId: string, email: string): Promise<TokenPair> {
    if (!email) throw new BadRequestException('Email is required')

    const accessToken = await this.jwtService.signAsync(
      { sub: userId, email },
      {
        secret: this.configService.get<string>('CREDENTIAL_SECRET') || 'development-secret',
        expiresIn: (this.configService.get<string>('ACCESS_TOKEN_TTL') || '15m') as never
      }
    )
    const refreshToken = randomBytes(48).toString('base64url')
    const refreshTokenExpiresAt = this.getRefreshTokenExpiresAt()
    const storedToken = await this.prisma.refreshToken.create({
      data: {
        tokenHash: this.hashToken(refreshToken),
        userId,
        expiresAt: refreshTokenExpiresAt
      }
    })

    await this.redis.set(`refresh:${storedToken.id}`, { userId }, this.getRefreshTokenTtlSeconds())

    return {
      accessToken,
      refreshToken,
      refreshTokenExpiresAt
    }
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex')
  }

  private getRefreshTokenExpiresAt() {
    return new Date(Date.now() + this.getRefreshTokenTtlSeconds() * 1000)
  }

  private getRefreshTokenTtlSeconds() {
    const days = Number(this.configService.get<string>('REFRESH_TOKEN_TTL_DAYS') || 30)
    return days * 24 * 60 * 60
  }
}
