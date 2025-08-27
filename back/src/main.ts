import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS: simple para dev. En prod, pasá orígenes permitidos por env si querés.
  app.enableCors({
  origin: true,
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
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
