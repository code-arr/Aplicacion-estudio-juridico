/* eslint-disable prettier/prettier */
// src/mailer/system-mailer.service.ts
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
    // URL de tu Backend (API)
    const apiUrl = this.config.get('API_URL') || 'http://localhost:3000';

    // Apuntamos a un endpoint nuevo que vamos a crear en el AuthController
    const landingLink = `${apiUrl}/auth/reset-landing?token=${encodeURIComponent(token)}`;

    await this.mailer.sendMail({
      to,
      subject: 'Restablecer contraseña - Ibarra & Asoc.',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>Recuperación de Contraseña</h2>
          <p>Para abrir la aplicación y cambiar tu contraseña, hacé click abajo:</p>
          
          <a href="${landingLink}" style="
            background-color: #2563EB; color: white; padding: 10px 20px; 
            text-decoration: none; border-radius: 5px; display: inline-block;">
            Abrir App y Restaurar
          </a>
        </div>
      `,
    });
  }
}

