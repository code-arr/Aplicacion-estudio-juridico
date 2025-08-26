import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { registerUserDto } from 'src/dtos/user.dto';
import { User } from 'src/entities/user.entity';
import { AuthRepository } from 'src/auth/auth.repository';
import { Request, Response } from 'express';
import { AuthGuard } from 'src/guards/auth.guard';
import { GoogleAuthGuard } from 'src/guards/google.guard';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport'; 
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
  @UseGuards(AuthGuard) // Solo usamos tu guard de JWT para verificar el token.
  async connectGoogleAccount(@Req() req, @Res() res: Response) {
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&response_type=code&scope=${encodeURIComponent('profile email https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/gmail.send')}&redirect_uri=${encodeURIComponent("http://estudio-backend-dev-env.us-east-1.elasticbeanstalk.com/auth/google/callback")}&access_type=offline&prompt=consent`;

    // Devolvemos la URL al frontend.
    res.json({ redirectUrl: googleAuthUrl });
  }

  // Este es el callback que recibe la respuesta de Google.
  @Get('google/callback')
  @UseGuards(PassportAuthGuard('google'))
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    // Aquí es donde guardas el token de Google.
    res.redirect('http://tu-frontend.com/dashboard');
  }
}
