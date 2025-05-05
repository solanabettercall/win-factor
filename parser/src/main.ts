import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import 'reflect-metadata';
import { appConfig } from './config/parser.config';

async function bootstrap() {
  const { port } = appConfig();
  const logger = new Logger(AppModule.name);
  const app = await NestFactory.create(AppModule);

  await app.listen(port, () => {
    logger.log(`Parser Microservice запущен на ${port} порту!`);
  });
}
bootstrap();
