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

  private getNegativeKey(key: string): string {
    return `${key}:negative`;
  }

  async isNegativeCached(originalKey: string): Promise<boolean> {
    const negativeKey = this.getNegativeKey(originalKey);
    const exists = await this.exists(negativeKey);
    return exists;
  }

  async setNegativeCache(originalKey: string, ttl: number): Promise<void> {
    const negativeKey = this.getNegativeKey(originalKey);
    await this.set(negativeKey, '1', ttl);
  }

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
  ): Promise<T | T[] | null> {
    const result = await this.client.call('JSON.GET', key);
    if (!result) return null;

    const plain = JSON.parse(result as string);
    if (Array.isArray(plain)) {
      return plain.map((item) => plainToInstance(cls, item)) as T[];
    }

    return plainToInstance(cls, plain) as T;
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

  async getJsonByPattern<T extends object>(
    pattern: string,
    cls: ClassConstructor<T>,
  ): Promise<T[]> {
    const foundKeys: string[] = [];
    let cursor = '0';

    do {
      const [newCursor, keys] = await this.client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );
      cursor = newCursor as string;
      foundKeys.push(...(keys as string[]));
    } while (cursor !== '0');

    if (foundKeys.length === 0) return [];

    // Теперь сразу пачкой отдаем все объекты
    // JSON.MGET key1 key2 ... path
    const args: (string | number)[] = [...foundKeys, '.'];
    const raw = (await this.client.call('JSON.MGET', ...args)) as (
      | string
      | null
    )[];
    const result: T[] = [];

    for (const item of raw) {
      if (!item) continue;
      const plain = JSON.parse(item);
      if (Array.isArray(plain)) {
        plain.forEach((p) => result.push(plainToInstance(cls, p)));
      } else {
        result.push(plainToInstance(cls, plain));
      }
    }

    return result;
  }
}
