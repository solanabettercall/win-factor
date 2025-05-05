import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { ParserModule } from './parser/parser.module';
import { RedisModule } from './cache/redis.module';

@Module({
  imports: [HealthModule, ParserModule, RedisModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
