import { AggregateRoot } from '@nestjs/cqrs';
import { Timestamp } from '../value-objects/timestamp.vo';
import { IEvent } from '@nestjs/cqrs';

type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

export abstract class BaseEntity<T, P> extends AggregateRoot<IEvent> {
  protected readonly _id: T;
  protected readonly _createdAt: Timestamp;

  protected readonly props: P;

  protected _updatedAt: Timestamp;

  protected constructor(id: T, props: P) {
    super();
    this._id = id;
    this.props = props;
    this._createdAt = Timestamp.now();
    this._updatedAt = Timestamp.now();
  }

  get id(): T {
    return this._id;
  }

  get createdAt(): Timestamp {
    return this._createdAt;
  }

  get updatedAt(): Timestamp {
    return this._updatedAt;
  }

  protected markAsUpdated(): void {
    this._updatedAt = Timestamp.now();
  }

  equals(entity: BaseEntity<T, P>): boolean {
    if (!entity) {
      return false;
    }

    if (this === entity) {
      return true;
    }

    return this._id === entity._id;
  }

  public toString(): string {
    return JSON.stringify(this.props, null, 2);
  }

  public valueOf(): P {
    return this.props;
  }

  public [Symbol.toPrimitive](): string {
    return this.toString();
  }

  public toJSON(): JsonValue {
    return this.props as JsonValue;
  }

  public [Symbol.for('nodejs.util.inspect.custom')](): unknown {
    return this.toJSON();
  }
}
