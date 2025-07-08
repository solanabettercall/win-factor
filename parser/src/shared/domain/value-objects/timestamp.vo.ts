import { ValueObject } from './base/value-object';

interface ITimestamp {
  value: Date;
}

export class Timestamp extends ValueObject<ITimestamp> {
  public toJSON() {
    return this.props.value.toISOString();
  }

  public [Symbol.toPrimitive]():
    | string
    | number
    | boolean
    | bigint
    | symbol
    | null
    | undefined {
    return this.props.value.toISOString();
  }

  private constructor(props: ITimestamp) {
    super(props);
  }

  static now(): Timestamp {
    return new Timestamp({
      value: new Date(),
    });
  }

  static fromDate(date: Date): Timestamp {
    return new Timestamp({
      value: new Date(date),
    });
  }

  static fromUnix(unix: number): Timestamp {
    return new Timestamp({
      value: new Date(unix * 1000),
    });
  }

  getValue(): Date {
    return new Date(this.props.value);
  }

  getUnix(): number {
    return Math.floor(this.props.value.getTime() / 1000);
  }

  isBefore(other: Timestamp): boolean {
    return this.props.value < other.props.value;
  }

  isAfter(other: Timestamp): boolean {
    return this.props.value > other.props.value;
  }

  toString(): string {
    return this.props.value.toISOString();
  }
}
