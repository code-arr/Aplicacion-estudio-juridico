import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS: simple para dev. En prod, pasá orígenes permitidos por env si querés.
  app.enableCors({
    origin: (origin, cb) => {
      const allowList = [
        'http://localhost:5173', // 👈 sin barra final
        'http://127.0.0.1:5173', // 👈 sin barra final
      ];
      if (!origin) return cb(null, true); // Electron/file://, curl, etc.
      if (allowList.includes(origin)) return cb(null, true);
      return cb(new Error('Origen no permitido por CORS'), false);
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 204,
  });
  // Cierre limpio en reemplazos/actualizaciones de EB
  app.enableShutdownHooks();

  // (Opcional) si corrés con Express detrás de Nginx, confiá en X-Forwarded-
  try {
    if (app.getHttpAdapter().getType() === 'express') {
      // @ts-ignore
      app.set('trust proxy', 1);
    }
  } catch {}

  // Healthcheck sin I/O (no toca DB ni S3)
  const httpAdapter: any = app.getHttpAdapter();
  const expressLike = httpAdapter.getInstance?.() ?? httpAdapter;
  expressLike.get('/health', (_req: any, res: any) =>
    res.status(200).json({ status: 'ok' }),
  );

  // Puerto y host correctos para EB
  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
