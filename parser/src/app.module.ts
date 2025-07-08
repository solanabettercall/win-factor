import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { RedisModule } from './shared/infrastructure/cache/redis.module';
import { MongooseModule } from '@nestjs/mongoose';
import { appConfig } from './config/parser.config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule, BullRootModuleOptions } from '@nestjs/bullmq';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { VolleystationModule } from './modules/volleystation/volleystation.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [
    CqrsModule.forRoot(),
    HealthModule,
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
    EventEmitterModule.forRoot(),
    VolleystationModule,
    MonitoringModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
