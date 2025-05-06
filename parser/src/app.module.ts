import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { ParserModule } from './parser/parser.module';
import { RedisModule } from './cache/redis.module';
import { MongooseModule } from '@nestjs/mongoose';
import { appConfig } from './config/parser.config';
import { MonitoringModule } from './monitoring/monitoring.module';

@Module({
  imports: [
    HealthModule,
    ParserModule,
    RedisModule,
    MongooseModule.forRootAsync({
      useFactory: () => {
        const { host, password, port, username, database } =
          appConfig().mongodb;
        const uri =
          `mongodb://${username}:${password}` +
          `@${host}:${port}/${database}?authSource=admin`;
        return {
          uri,
          dbName: database,
        };
      },
    }),
    MonitoringModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
