// src/auth/auth.controller.ts
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { registerUserDto } from 'src/dtos/user.dto';
import { User } from 'src/entities/user.entity';
import { AuthRepository } from 'src/auth/auth.repository';
import { Request as ExpressRequest, Response } from 'express';
import { GoogleAuthGuard } from 'src/guards/google.guard';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { UserService } from 'src/services/user.service';
import { buffer } from 'stream/consumers';
import { Public } from './public.decorator';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly userService: UserService,
  ) {}

  @Public()
  @Post('register')
  @Post('register')
  async register(@Body() user: registerUserDto): Promise<Partial<User> | void> {
    return this.authRepository.register(user);
  }
  @Public()
  @Post('login')
  async login(
    @Req() req: ExpressRequest,
    @Body()
    {
      email,
      password,
      deviceId,
    }: { email: string; password: string; deviceId?: string },
  ): Promise<{ message: string; token?: string; user?: any }> {
    return this.authRepository.login(email, password, {
      req: req as any,
      deviceId,
    }); // sin try/catch
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req) {
    const user = await this.userService.getOneById(req.user?.id);
    if (!user) {
      throw new UnauthorizedException('User not found for this token');
    }
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      googleEmail: user.googleEmail ?? null,
    };
  }

  @Get('google/connect')
  async connectGoogleAccount(@Req() req: ExpressRequest, @Res() res: Response) {
    const dbEmail = req.query.email;
    const statePayload = { email: dbEmail, returnTo: '/#/dashboard/settings' }; // añade returnTo opcional
    // usar base64url para compatibilidad con URL-safe
    const state = Buffer.from(JSON.stringify(statePayload)).toString(
      'base64url',
    );
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&response_type=code&scope=${encodeURIComponent('profile email https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/gmail.send')}&redirect_uri=${encodeURIComponent(callback)}&access_type=offline&prompt=consent&state=${encodeURIComponent(state)}`;
    console.log('estamos en google conect');
    const callback = process.env.GOOGLE_CALLBACK_URL;
    if (!callback) {
      throw new Error('Google callback URL no está definida');
    }
    console.log('callback' + callback);

    res.json({ redirectUrl: googleAuthUrl });
  }

  @Public()
  @Get('google/callback')
  @UseGuards(PassportAuthGuard('google'))
  async googleAuthCallback(@Req() req: ExpressRequest, @Res() res: Response) {
    // Decodificar state (fallback a settings)
    const rawState = (req.query.state as string) || '';
    let returnTo = '/#/dashboard/settings';
    try {
      if (rawState) {
        const state = JSON.parse(
          Buffer.from(rawState, 'base64url').toString('utf-8'),
        );
        if (state?.returnTo) returnTo = state.returnTo;
      }
    } catch (err) {
      console.warn('No se pudo parsear state, usaré fallback returnTo', err);
    }

    // req.user viene de Passport (GoogleStrategy.validate)
    const user = req.user as any;
    console.log('Google callback user:', user);

    if (!user || !user.user || !user.googleTokens) {
      console.log('ERROR: datos de Google incompletos');
      // única redirección en caso de error
      return res.redirect(
        `${process.env.FRONTEND_URL}/error?reason=no_google_data`,
      );
    }

    try {
      const userId = user.user.id;
      const googleTokens = user.googleTokens;

      // linkear en BD
      await this.authRepository.linkGoogleAccount(userId, {
        googleRefreshToken: googleTokens.refreshToken,
      });

      // única redirección al final (usar returnTo)
      return res.redirect(`${process.env.FRONTEND_URL}${returnTo}`);
    } catch (error) {
      console.error('Error al linkear cuenta Google:', error);
      return res.redirect(
        `${process.env.FRONTEND_URL}/error?reason=${encodeURIComponent(error?.message ?? 'unknown')}`,
      );
    }
  }

  @Public()
  @Post('forgotPassword')
  async forgotPassword(@Body('email') email: string) {
    return this.authRepository.forgotPassword(email);
  }

  @Public()
  @Post('resetPassword')
  async resetPassword(@Body() body: { token: string; password: string }) {
    return this.authRepository.resetPassword(body.token, body.password);
  }
}
