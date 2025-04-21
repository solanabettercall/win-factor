import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { PaymentsModule } from './payments/payments.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [UsersModule, PaymentsModule, HealthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
