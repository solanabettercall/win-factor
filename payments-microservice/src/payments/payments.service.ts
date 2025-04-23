import { Injectable, Inject } from '@nestjs/common';
import { CreatePaymentDto } from './dtos/CreatePayment.dto';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { User } from 'src/typeorm/entities/User';

@Injectable()
export class PaymentsService {
  constructor(@Inject('NATS_SERVICE') private natsClient: ClientProxy) {}

  async createPayment({ userId, ...createPaymentDto }: CreatePaymentDto) {
    const user = await lastValueFrom<User>(
      this.natsClient.send({ cmd: 'getUserById' }, { userId }),
    );

    return user;
  }
}
