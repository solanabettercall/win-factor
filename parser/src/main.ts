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
    if (
      err?.stack?.includes('engine.io-client') &&
      err.message.includes('RangeError: Maximum call stack size exceeded')
    ) {
      logger.warn('Socket.io: Maximum call stack size exceeded');
    } else {
      logger.error(`Uncaught Exception: ${err.message}`, err.stack);
    }
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  await app.listen(port, () => {
    logger.log(`Parser Microservice запущен на ${port} порту!123`);
  });
}
bootstrap();
