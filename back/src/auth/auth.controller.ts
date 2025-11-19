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
import { AbogadoDto } from 'src/dtos/lawyer.dto';
import { RegisterDto } from 'src/dtos/registerDto';
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly userService: UserService,
  ) {}

  @Public()
  @Post('register')
  async register(@Body() body: RegisterDto): Promise<Partial<User> | void> {
    console.log('BODY LLEGA ASÍ:', body);
    return this.authRepository.register(body.user, body.lawyer);
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
    // tipar correctamente lo que viene en query
    const dbEmail = (req.query.email as string) || undefined;

    // leer y validar env vars ANTES de usarlas
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const callback = process.env.GOOGLE_CALLBACK_URL;
    if (!clientId) {
      return res
        .status(500)
        .json({ error: 'GOOGLE_CLIENT_ID no está definida' });
    }
    if (!callback) {
      return res
        .status(500)
        .json({ error: 'GOOGLE_CALLBACK_URL no está definida' });
    }

    // preparar state (URL-safe). Si tu Node soporta base64url, ok; si no, usamos fallback.
    let state: string;
    try {
      state = Buffer.from(
        JSON.stringify({ email: dbEmail, returnTo: '/#/dashboard/settings' }),
      ).toString('base64url');
    } catch (err) {
      // fallback: hacer base64 estándar y convertir a base64url seguro
      const b64 = Buffer.from(
        JSON.stringify({ email: dbEmail, returnTo: '/#/dashboard/settings' }),
      ).toString('base64');
      state = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    const scope = encodeURIComponent(
      'profile email https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/gmail.send',
    );

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      clientId,
    )}&response_type=code&scope=${scope}&redirect_uri=${encodeURIComponent(
      callback,
    )}&access_type=offline&prompt=consent&state=${encodeURIComponent(state)}`;

    console.log('estamos en google conect - redirect:', googleAuthUrl);
    return res.json({ redirectUrl: googleAuthUrl });
  }

  @Public()
  @Get('google/callback')
  @UseGuards(PassportAuthGuard('google'))
  async googleAuthCallback(@Req() req: ExpressRequest, @Res() res: Response) {
    console.log('googleAuthCallback - query:', req.query);
    console.log('googleAuthCallback - req.user (passport):', req.user);
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

      // después de linkear en DB:
      const scheme = process.env.APP_SCHEME || 'ibarrayasoc';
      const returnToEncoded = encodeURIComponent(
        returnTo || '/#/dashboard/settings',
      );

      // construyo deep link que la app recibirá
      const deepLink = `${scheme}://oauth-callback?status=success&returnTo=${returnToEncoded}`;

      // HTML mínimo que intenta abrir el deep link y muestra fallback
      const html = `<!doctype html>
      <html>
      <head><meta charset="utf-8"><title>Volviendo a la app…</title>
      <meta name="viewport" content="width=device-width,initial-scale=1"/>
      <style>body{font-family:system-ui,Arial;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;padding:20px} .card{max-width:640px;text-align:center}</style>
      </head>
      <body>
        <div class="card">
          <h2>Volviendo a la aplicación…</h2>
          <p>La aplicación instalada debería abrirse automáticamente. Si no, hacé click en el botón o copiá el enlace.</p>
          <p><a id="open" href="${deepLink}" style="display:inline-block;padding:10px 14px;border-radius:6px;border:1px solid #ccc;text-decoration:none">Abrir la app</a></p>
          <pre id="link" style="background:#f6f6f6;padding:8px;border-radius:6px;word-break:break-all">${deepLink}</pre>
        </div>
      <script>
      (function(){
        var deep = ${JSON.stringify(deepLink)};
        // intento abrirlo (varias tácticas para mayor compatibilidad)
        try { window.location = deep; } catch(e) {}
        // iframe fallback
        setTimeout(function(){
          var ifr = document.createElement('iframe');
          ifr.style.display='none'; ifr.src = deep; document.body.appendChild(ifr);
          setTimeout(function(){ try{ document.body.removeChild(ifr);}catch(e){} }, 1200);
        }, 200);
      })();
      </script>
      </body></html>`;

      // envía la página al navegador (no redirect)
      return res.status(200).send(html);
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
