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

  async onModuleInit() {
    this.client = new Redis({
      host: this.config.host,
      port: this.config.port,
    });

    this.client.on('error', (err) =>
      this.logger.error('Ошибка запуска Redis:', err),
    );

    try {
      await new Promise<void>((resolve, reject) => {
        this.client.once('ready', resolve);
        this.client.once('error', reject);
      });

      this.logger.log('Redis запущен');
    } catch (err) {
      this.logger.error('Не удалось подключиться к Redis', err);
      throw err;
    }
  }

  onModuleDestroy() {
    this.client?.disconnect();
  }
}
