import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { ParserModule } from './parser/parser.module';

@Module({
  imports: [HealthModule, ParserModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
