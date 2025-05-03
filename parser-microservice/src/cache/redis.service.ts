import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';
import { appConfig } from 'src/config/parser.config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly logger = new Logger(RedisService.name);

  private readonly config = appConfig().redis;

  onModuleInit() {
    this.client = new Redis({
      host: this.config.host,
      port: this.config.port,
    });

    this.client.on('connect', () => this.logger.log('Redis запущен'));
    this.client.on('error', (err) =>
      this.logger.error('Ошибка запуска Redis:', err),
    );
  }

  onModuleDestroy() {
    this.client?.disconnect();
  }
}
