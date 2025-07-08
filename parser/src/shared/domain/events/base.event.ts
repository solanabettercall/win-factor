import { Logger } from '@nestjs/common';
import { IEvent } from '@nestjs/cqrs';

export abstract class BaseEvent<T> implements IEvent {
  protected readonly logger = new Logger();
  protected constructor(public readonly event: T) {}
}
