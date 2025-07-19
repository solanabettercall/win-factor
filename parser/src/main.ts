import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import 'reflect-metadata';
import { appConfig } from './config/parser.config';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { ErrorLoggingInterceptor } from './interceptors/error-logging.interceptor';

async function bootstrap() {
  const { port } = appConfig();
  const logger = new Logger(AppModule.name);
  const app = await NestFactory.create(AppModule);

  // Глобальные фильтры и перехватчики
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ErrorLoggingInterceptor());

  process.on('uncaughtException', (err) => {
    if (err.message === 'RangeError: Maximum call stack size exceeded') {
      return;
    }
    logger.error('Uncaught Exception:', err.message);
    logger.error(err.stack);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise);
    logger.error('Reason:', reason);
    if (reason instanceof Error) {
      logger.error(reason.stack);
    }
  });

  await app.listen(port, () => {
    logger.log(`Parser Microservice запущен на ${port} порту!`);
  });
}
bootstrap();
