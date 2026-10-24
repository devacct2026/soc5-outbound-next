import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configuration = app.get(ConfigService);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: configuration.getOrThrow<string>('FRONTEND_ORIGIN'),
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableShutdownHooks();

  const port = configuration.getOrThrow<number>('PORT');
  await app.listen(port, '0.0.0.0');

  Logger.log(`API listening on port ${port}`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
