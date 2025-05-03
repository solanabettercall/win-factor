import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';
import { appConfig } from 'src/config/parser.config';
import {
  ClassConstructor,
  instanceToPlain,
  plainToInstance,
} from 'class-transformer';
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

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<'OK'> {
    if (ttl) {
      return this.client.set(key, value, 'EX', ttl);
    }
    return this.client.set(key, value);
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async getJson<T extends object>(
    key: string,
    cls: ClassConstructor<T>,
  ): Promise<T | null> {
    const result = await this.client.call('JSON.GET', key);
    if (!result) return null;

    const plain = JSON.parse(result as string);
    return plainToInstance(cls, plain);
  }

  async setJson<T extends object>(
    key: string,
    value: T,
    ttl?: number,
  ): Promise<'OK' | Error> {
    const plainObject = instanceToPlain(value);
    const jsonString = JSON.stringify(plainObject);

    const result = await this.client.call('JSON.SET', key, '.', jsonString);

    if (ttl) {
      await this.client.expire(key, ttl);
    }

    if (result === 'OK') {
      return 'OK';
    } else {
      throw new InternalServerErrorException(
        value,
        'Ошибка при установке JSON',
      );
    }
  }
}
