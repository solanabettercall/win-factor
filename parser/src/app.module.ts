import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { ParserModule } from './parser/parser.module';
import { RedisModule } from './cache/redis.module';
import { MongooseModule } from '@nestjs/mongoose';
import { appConfig } from './config/parser.config';
import { MonitoringModule } from './monitoring/monitoring.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule, BullRootModuleOptions } from '@nestjs/bullmq';

@Module({
  imports: [
    HealthModule,
    ParserModule,
    RedisModule,
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      useFactory: () => {
        const config = appConfig();
        const options: BullRootModuleOptions = {
          defaultJobOptions: {
            attempts: 30,
            backoff: {
              type: 'fixed',
              delay: 5000,
            },
          },
          connection: {
            host: config.redis.host,
            port: config.redis.port,
          },
        };
        return options;
      },
    }),
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
