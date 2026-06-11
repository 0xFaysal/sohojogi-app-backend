import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getConfigNumber } from './common/utils/config-number.util';
import { configureApp } from './configure-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  configureApp(app);

  await app.listen(getConfigNumber(configService, 'PORT', 3000), '0.0.0.0');
}

bootstrap();
