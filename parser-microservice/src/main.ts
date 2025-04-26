import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger(AppModule.name);
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice({
    transport: Transport.NATS,
    options: {
      servers: ['nats://nats'],
    },
  });

  await app.startAllMicroservices();
  await app.listen(3000);

  logger.log('Parser Microservice is Running!');

  const unusedVariable = 42;

  console.log('Hello, world!');
}
bootstrap();
