import { Module } from '@nestjs/common';
import { UsersMicroserviceController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersMicroserviceController],
  providers: [UsersService],
})
export class UsersModule {}
