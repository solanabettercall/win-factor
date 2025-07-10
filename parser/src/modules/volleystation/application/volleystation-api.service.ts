import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class VolleystationApiService {
  private readonly logger = new Logger(this.constructor.name);

  constructor() {}
}
