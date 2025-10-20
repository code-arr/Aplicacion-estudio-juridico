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
import { Request, Response } from 'express';
import { GoogleAuthGuard } from 'src/guards/google.guard';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { UserService } from 'src/services/user.service';
import { buffer } from 'stream/consumers';
import { Public } from './public.decorator';
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly userService: UserService,
  ) {}

  @Public()
  @Post('register')
  async register(@Body() user: registerUserDto): Promise<Partial<User> | void> {
    return this.authRepository.register(user); // sin try/catch
  }

  @Public()
  @Post('login')
  async login(
    @Req() req: Request,
    @Body()
    {
      email,
      password,
      deviceId,
    }: { email: string; password: string; deviceId?: string },
  ): Promise<{ message: string; token?: string; user?: any }> {
    return this.authRepository.login(email, password, { req, deviceId }); // sin try/catch
  }

  @Get('me')
  async me(@Req() req) {
    const user = await this.userService.getOneById(req.user.id);
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
  async connectGoogleAccount(@Req() req, @Res() res: Response) {
    const dbEmail = req.query.email;
    const statePayload = { email: dbEmail };
    const state = Buffer.from(JSON.stringify(statePayload)).toString('base64');
    console.log('estamos en google conect');
    const callback = process.env.GOOGLE_CALLBACK_URL;
    if (!callback) {
      throw new Error('Google callback URL no está definida');
    }
    console.log('callback' + callback);

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&response_type=code&scope=${encodeURIComponent('profile email https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/gmail.send')}&redirect_uri=${encodeURIComponent(callback)}&access_type=offline&prompt=consent&state=${encodeURIComponent(state)}`;

    res.json({ redirectUrl: googleAuthUrl });
  }

  @Public()
  @Get('google/callback')
  @UseGuards(PassportAuthGuard('google'))
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    console.log('User: ', user);

    if (!user || !user.user || !user.googleTokens) {
      console.log('ERROR GOOGLE TOKEN');

      return res.redirect('http://tu-frontend.com/error?reason=no_google_data');
    }

    try {
      const userId = user.user.id;
      const googleTokens = user.googleTokens;
      const googleProfile = user.profile;

      await this.authRepository.linkGoogleAccount(userId, {
        googleRefreshToken: googleTokens.refreshToken,
      });

      res.redirect(`${process.env.FRONTEND_URL}/#/dashboard/settings`);
    } catch (error) {
      console.log('error 1' + error);

      return res.redirect(
        `${process.env.FRONTEND_URL}/error?reason=${encodeURIComponent(error.message)}`,
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
