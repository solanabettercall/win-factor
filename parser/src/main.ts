import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, LogLevel } from '@nestjs/common';
import 'reflect-metadata';
import { appConfig, Environment } from './config/parser.config';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { ErrorLoggingInterceptor } from './interceptors/error-logging.interceptor';

async function bootstrap() {
  const { port, env } = appConfig();

  let logLevels: LogLevel[];
  if (env === Environment.production) {
    logLevels = ['error', 'warn', 'log'];
  } else if (env === Environment.development) {
    logLevels = ['error', 'warn'];
  } else {
    logLevels = ['error', 'warn', 'log', 'debug', 'verbose'];
  }

  const logger = new Logger(AppModule.name);
  const app = await NestFactory.create(AppModule, { logger: logLevels });

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
