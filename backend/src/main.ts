import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ConfigService } from '@nestjs/config';
import { parseCorsOrigins } from './config/auth.config.js';
import { configureHttpSecurity } from './http-security.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');
  configureHttpSecurity(app);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: parseCorsOrigins(
      configService.getOrThrow<string>('CORS_ORIGINS'),
    ),
    credentials: true,
  });
  
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
