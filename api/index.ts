import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';

let cachedServer: express.Express | null = null;

async function bootstrapServer() {
  const expressApp = express();
  const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

  configureApp(nestApp);
  await nestApp.init();

  return expressApp;
}

export default async function handler(request: express.Request, response: express.Response) {
  cachedServer ??= await bootstrapServer();
  return cachedServer(request, response);
}
