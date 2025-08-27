// src/lib/google/gmail.client.ts

import { google } from 'googleapis';
import { Buffer } from 'node:buffer';

/**
 * Devuelve un cliente de Gmail autenticado con refresh_token.
 * Requiere GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y GOOGLE_CALLBACK_URL en .env
 */
export function getGmailClient(refreshToken: string) {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_CALLBACK_URL!, // debe coincidir con tu config de consola de Google
  );
  oauth2.setCredentials({ refresh_token: refreshToken });

  return google.gmail({ version: 'v1', auth: oauth2 });
}

/**
 * base64url: convierte a base64 y reemplaza + por -, / por _, y quita '=' finales
 * Overloads para que TS no rompa con unions (string | Uint8Array).
 */
export function toBase64Url(input: string): string;
export function toBase64Url(input: Uint8Array): string;
export function toBase64Url(input: string | Uint8Array): string {
  let b64: string;

  if (typeof input === 'string') {
    b64 = Buffer.from(input, 'utf8').toString('base64');
  } else {
    // Buffer es un Uint8Array, así que esto funciona para Buffer y para Uint8Array
    b64 = Buffer.from(input).toString('base64');
  }

  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

/**
 * Construye un mensaje MIME (multipart/mixed) con cuerpo HTML y un adjunto PDF,
 * y lo devuelve en base64url listo para gmail.users.messages.send({ raw }).
 */
export function buildMimeMessage({
  from,
  to,
  subject,
  html,
  filename,
  pdfBuffer,
}: {
  from: string;
  to: string;
  subject: string;
  html: string;
  filename: string;
  pdfBuffer: Buffer;
}) {
  // Usamos un nombre de variable único para evitar colisiones
  const boundaryId = '===EstudioBoundary_' + Date.now();

  // Encabezados del correo
  const headers =
    [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`, // para asuntos con UTF-8 complejo se puede usar RFC 2047 si hace falta
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundaryId}"`,
    ].join('\r\n') + '\r\n\r\n';

  // Parte HTML (7bit)
  const htmlPart =
    `--${boundaryId}\r\n` +
    'Content-Type: text/html; charset="UTF-8"\r\n' +
    'Content-Transfer-Encoding: 7bit\r\n\r\n' +
    html +
    '\r\n\r\n';

  // Adjunto PDF (base64 con plegado opcional a 76 columnas para legibilidad)
  const attachmentPart =
    `--${boundaryId}\r\n` +
    `Content-Type: application/pdf; name="${filename}"\r\n` +
    'Content-Transfer-Encoding: base64\r\n' +
    `Content-Disposition: attachment; filename="${filename}"\r\n\r\n` +
    pdfBuffer.toString('base64').replace(/(.{76})/g, '$1\r\n') +
    '\r\n\r\n';

  // Cierre del multipart
  const closing = `--${boundaryId}--`;

  const rawMessage = headers + htmlPart + attachmentPart + closing;
  return toBase64Url(rawMessage);
}
