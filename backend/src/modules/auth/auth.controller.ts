import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { Request, Response } from 'express'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'

const REFRESH_COOKIE_NAME = 'bs_refresh_token'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.register(dto)
    this.setRefreshCookie(response, result.tokens.refreshToken, result.tokens.refreshTokenExpiresAt)
    return this.toPublicAuthResponse(result)
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(dto)
    this.setRefreshCookie(response, result.tokens.refreshToken, result.tokens.refreshTokenExpiresAt)
    return this.toPublicAuthResponse(result)
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.refresh(request.cookies?.[REFRESH_COOKIE_NAME])
    this.setRefreshCookie(response, result.tokens.refreshToken, result.tokens.refreshTokenExpiresAt)
    return this.toPublicAuthResponse(result)
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.logout(request.cookies?.[REFRESH_COOKIE_NAME])
    response.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' })
    return result
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: { sub: string }) {
    return this.authService.getMe(user.sub)
  }

  private toPublicAuthResponse(result: {
    user: unknown
    workspace?: unknown
    workspaces?: unknown
    tokens: { accessToken: string; refreshTokenExpiresAt: Date }
  }) {
    return {
      user: result.user,
      workspace: result.workspace,
      workspaces: result.workspaces,
      accessToken: result.tokens.accessToken,
      refreshTokenExpiresAt: result.tokens.refreshTokenExpiresAt
    }
  }

  private setRefreshCookie(response: Response, refreshToken: string, expiresAt: Date) {
    response.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/api/auth',
      expires: expiresAt
    })
  }
}
