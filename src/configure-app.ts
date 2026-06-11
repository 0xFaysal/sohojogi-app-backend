import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export function configureApp(app: INestApplication) {
  const configService = app.get(ConfigService);

  app.enableCors();
  app.setGlobalPrefix(`api/${configService.get<string>('API_VERSION', 'v1')}`);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
