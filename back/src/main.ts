import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const httpAdapter: any = app.getHttpAdapter();
  const expressApp = httpAdapter.getInstance?.() ?? httpAdapter;
  if (expressApp?.set) {
    // Importante para que los logs muestren la IP real del usuario y no la del Balanceador de AWS
    expressApp.set('trust proxy', 1);
  }

  // DEFINICIÓN DE ORÍGENES PERMITIDOS
  const allowedOrigins = [
    'http://localhost:5173', // Tu entorno local Vite
    'http://127.0.0.1:5173', // Variante local
    'http://127.0.0.1:5500', // Live Server local
    'https://ibarrayasoc.com', // (Futuro) Tu web oficial
    'https://www.ibarrayasoc.com', // (Futuro) Tu web oficial con www
    'app://.', // Electron (Protocolo común en apps de escritorio)
    'file://', // Electron (A veces usa file system directo)
  ];

  app.enableCors({
    origin: (origin, cb) => {
      // 1. Permitir solicitudes sin origen (ej: Apps de escritorio, Postman, cURL)
      if (!origin) return cb(null, true);

      // 2. Limpiar la barra final si existe
      const o = origin.replace(/\/$/, '');

      // 3. Chequear si está en la lista blanca
      if (allowedOrigins.includes(o)) {
        return cb(null, true);
      }

      // 4. (OPCIONAL PERO ÚTIL PARA DEPURAR EN PROD)
      // Si te da muchos problemas de CORS con la App .exe, podés descomentar la siguiente línea temporalmente:
      // console.log('Bloqueado por CORS:', o);

      return cb(new Error(`Origen no permitido por CORS: ${o}`), false);
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true, // Importante si usas cookies o headers de auth
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  app.enableShutdownHooks();

  // Healthcheck simple
  expressApp.get('/health', (_req: any, res: any) =>
    res.status(200).json({ status: 'ok', env: process.env.NODE_ENV }),
  );

  // Puerto
  const port = Number(process.env.PORT) ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(
    `🟢 Nest listening on port ${port} in mode ${process.env.NODE_ENV}`,
  );
}
bootstrap();

