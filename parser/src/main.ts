import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import 'reflect-metadata';
import { appConfig } from './config/parser.config';

async function bootstrap() {
  const { port } = appConfig();
  const logger = new Logger(AppModule.name);
  const app = await NestFactory.create(AppModule);

  process.on('uncaughtException', (err) => {
    if (err.message === 'RangeError: Maximum call stack size exceeded') {
      return;
    }
    logger.error(err);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  await app.listen(port, () => {
    logger.log(`Parser Microservice запущен на ${port} порту!`);
  });
}
bootstrap();
