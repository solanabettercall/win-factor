import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import 'reflect-metadata';
import { appConfig } from './config/parser.config';

async function bootstrap() {
  const { port } = appConfig();
  const logger = new Logger(AppModule.name);
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice({
    transport: Transport.NATS,
    options: {
      servers: ['nats://nats'],
    },
  });

  await app.startAllMicroservices();
  await app.listen(port, () => {
    logger.log(`Parser Microservice запущен на ${port} порту!`);
  });
}
bootstrap();
