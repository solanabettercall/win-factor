import { Module } from '@nestjs/common';
import { PaymentsModule } from './payments/payments.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [PaymentsModule, HealthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
