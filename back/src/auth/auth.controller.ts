import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { registerUserDto } from 'src/dtos/user.dto';
import { User } from 'src/entities/user.entity';
import { AuthRepository } from 'src/auth/auth.repository';
import { Request, Response } from 'express';
import { AuthGuard } from 'src/guards/auth.guard';
import { GoogleAuthGuard } from 'src/guards/google.guard';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { UserService } from 'src/services/user.service';
@Controller('auth')
export class AuthController {
  constructor(private readonly authRepository: AuthRepository) {}

  @Post('register')
  async register(@Body() user: registerUserDto): Promise<Partial<User> | void> {
    try {
      return this.authRepository.register(user);
    } catch (error) {
      throw new Error(
        'Error al registrar el usuario en el controlador: ' + error.message,
      );
    }
  }

  @Post('login')
  async login(
    @Body() { email, password }: { email: string; password: string },
  ): Promise<{ message: string; token?: string }> {
    try {
      return this.authRepository.login(email, password);
    } catch (error) {
      throw new Error(
        'Error al iniciar sesión en el controlador: ' + error.message,
      );
    }
  }

  @Get('google/connect')
  @UseGuards(AuthGuard)
  async connectGoogleAccount(@Req() req, @Res() res: Response) {
    console.log('estamos en google conect');
    const callback = process.env.GOOGLE_CALLBACK_URL;
    if (!callback) {
      throw new Error('Google callback URL no está definida');
    }
    console.log("callback" + callback);
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&response_type=code&scope=${encodeURIComponent('profile email https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/gmail.send')}&redirect_uri=${encodeURIComponent(callback)}&access_type=offline&prompt=consent`;

    res.json({ redirectUrl: googleAuthUrl });
  }

  @Get('google/callback')
  @UseGuards(PassportAuthGuard('google'))
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    console.log('User: ', user);

    if (!user || !user.user || !user.googleTokens) {
      console.log("ERROR GOOGLE TOKEN");
      
      return res.redirect('http://tu-frontend.com/error?reason=no_google_data');
    }

    try {
      const userId = user.user.id;
      const googleTokens = user.googleTokens;
      const googleProfile = user.profile;

      await this.authRepository.linkGoogleAccount(userId, {
        googleRefreshToken: googleTokens.refreshToken,
      });

      res.redirect('http://127.0.0.1:5500/index.html');
    } catch (error) {
      console.log("error 1" + error);

      return res.redirect(`http://tu-frontend.com/error?reason=${encodeURIComponent(error.message)}`);
    }
  }
}
