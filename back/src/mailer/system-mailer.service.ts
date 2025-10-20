import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SystemMailerService {
  constructor(
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
  ) {}

  async sendPasswordReset(to: string, token: string) {
    const scheme = this.config.get('APP_SCHEME') || 'ibarrayasoc';
    const deepLink = `${scheme}://reset?token=${encodeURIComponent(token)}`;

    await this.mailer.sendMail({
      to,
      subject: 'Restablecer contraseña',
      text: `
Hola,

Para restablecer tu contraseña, hacé click en el siguiente enlace:
${deepLink}

Si no solicitaste este cambio, podés ignorar este correo.
      `,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111;">
          <p>Hola,</p>
          <p>Para restablecer tu contraseña, hacé click en el botón:</p>
          <p style="margin:24px 0;">
            <a href="${deepLink}" style="background:#0b63ce;color:#fff;text-decoration:none;
               padding:12px 18px;border-radius:6px;display:inline-block;border-radius:6px;">
              Restablecer contraseña
            </a>
          </p>
          <p>Si el botón no funciona, copiá este enlace:</p>
          <p><a href="${deepLink}">${deepLink}</a></p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
          <p style="color:#555;">Si no solicitaste este cambio, ignorá este correo.</p>
        </div>
      `,
    });
  }
}
