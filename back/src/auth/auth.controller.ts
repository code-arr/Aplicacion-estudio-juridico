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

function sanitizeReturnTo(raw?: string | null): string {
  if (!raw) return '/#/dashboard/settings';
  // decoded safe
  let dec = raw;
  try {
    dec = decodeURIComponent(raw);
  } catch {}
  // permitir solo rutas internas (hash SPA o path absoluto)
  if (dec.startsWith('/#/') || dec.startsWith('/')) {
    // limite de longitud razonable
    if (dec.length > 500) return '/#/dashboard/settings';
    return dec;
  }
  // fallback
  return '/#/dashboard/settings';
}
function escapeHtml(s?: string) {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

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
    const maybeUser = req.user as any;
    console.log(
      'googleAuthCallback - passport user id/email:',
      maybeUser?.user?.id,
      maybeUser?.user?.email,
    );

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
      const errorHtml = `<!doctype html><html><head><meta charset="utf-8"><title>Error</title></head><body>
      <h2>Error al conectar Google</h2>
      <p>No se recibieron datos de Google. Si el problema persiste, contactá al soporte.</p>
      </body></html>`;
      return res.status(400).send(errorHtml);
    }

    try {
      const userId = user.user.id;
      const googleTokens = user.googleTokens;

      // linkear en BD
      await this.authRepository.linkGoogleAccount(userId, {
        googleRefreshToken: googleTokens.refreshToken,
      });

      console.log(`[auth] google linked for user ${userId}`);

      // sanitizar returnTo para evitar open-redirect
      const safeReturnTo = sanitizeReturnTo(returnTo);
      const scheme = process.env.APP_SCHEME || 'ibarrayasoc';
      const returnToEncoded = encodeURIComponent(safeReturnTo);

      const deepLink = `${scheme}://oauth-callback?status=success&returnTo=${returnToEncoded}`;

      // HTML mínimo que intenta abrir el deep link y muestra fallback
      const html = `
        <!doctype html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Conexión exitosa</title>
          <meta name="viewport" content="width=device-width,initial-scale=1"/>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background-color: #f8fafc;
              color: #334155;
            }
            .card {
              background: white;
              padding: 2rem;
              border-radius: 1rem;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
              max-width: 400px;
              text-align: center;
            }
            h2 { margin-top: 0; color: #0f172a; }
            p { margin-bottom: 1.5rem; line-height: 1.5; }
            .btn {
              display: inline-block;
              background-color: #4f46e5; /* Tu color Indigo */
              color: white;
              padding: 0.75rem 1.5rem;
              border-radius: 0.5rem;
              text-decoration: none;
              font-weight: 500;
              transition: background-color 0.2s;
            }
            .btn:hover { background-color: #4338ca; }
            .subtext { margin-top: 1rem; font-size: 0.875rem; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>¡Conectado!</h2>
            <p>Tu cuenta de Google se vinculó correctamente con el sistema. <br>La aplicación debería abrirse ahora.</p>
            
            <a id="open" href="${deepLink}" class="btn">Abrir la aplicación</a>
            
            <p class="subtext">Si no se abre automáticamente, hacé click en el botón.</p>
          </div>
          <script>
            (function(){
              var deep = ${JSON.stringify(deepLink)};
              // 1. Intento abrir
              try { window.location.href = deep; } catch(e) {}
              
              // 2. Iframe fallback (para navegadores viejos o mañosos)
              setTimeout(function(){
                var ifr = document.createElement('iframe');
                ifr.style.display='none'; 
                ifr.src = deep; 
                document.body.appendChild(ifr);
                setTimeout(function(){ try{ document.body.removeChild(ifr);}catch(e){} }, 1000);
              }, 500);
            })();
          </script>
        </body>
        </html>`;

      // envía la página al navegador (no redirect)
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    } catch (error) {
      console.error('Error al linkear cuenta Google:', error?.message ?? error);
      const errorHtml = `<!doctype html><html><head><meta charset="utf-8"><title>Error</title></head><body>
        <h2>Error al conectar Google</h2>
        <p>${escapeHtml(error?.message ?? 'Error desconocido')}</p>
        </body></html>`;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(500).send(errorHtml);
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

  @Public()
  @Get('reset-landing') // 👈 El endpoint al que apunta el mail
  resetLanding(@Req() req: ExpressRequest, @Res() res: Response) {
    const token = req.query.token as string;

    if (!token) {
      return res.status(400).send('<h1>Error: Token no válido</h1>');
    }

    // 1. Definimos el Deep Link (Protocolo personalizado)
    // Esto le dice a Windows/Mac: "Abrí la app Ibarra y andá a reset-password"
    const scheme = process.env.APP_SCHEME || 'ibarrayasoc';

    // Ojo acá: La estructura depende de cómo manejes el deep link en Electron.
    // Generalmente es: scheme://ruta?param=valor
    const deepLink = `${scheme}://reset-password?token=${encodeURIComponent(token)}`;

    // 2. El mismo HTML "trampolín" que usaste en Google
    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Abriendo aplicación...</title>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f8fafc; text-align: center; }
          .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); max-width: 400px; }
          .btn { background-color: #4f46e5; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; display: inline-block; margin-top: 1rem; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Abriendo Ibarra & Asoc.</h2>
          <p>Estamos intentando abrir la aplicación para que cambies tu contraseña.</p>
          <a href="${deepLink}" class="btn">Abrir manualmente</a>
        </div>
        <script>
          // Intento automático
          setTimeout(function(){
            window.location.href = "${deepLink}";
          }, 500);
        </script>
      </body>
      </html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  }
}

