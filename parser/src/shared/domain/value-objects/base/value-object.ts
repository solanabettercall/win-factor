import * as equal from 'fast-deep-equal';

interface ValueObjectProps {
  [index: string]: any;
}

type JSONValue =
  | null
  | string
  | number
  | boolean
  | JSONValue[]
  | { [key: string]: JSONValue };

export abstract class ValueObject<T extends ValueObjectProps> {
  public readonly props: T;

  constructor(props: Readonly<T>) {
    this.props = Object.freeze(props);
  }

  public equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }
    if (vo.props === undefined) {
      return false;
    }
    return equal(this.props, vo.props);
  }

  public toString(): string {
    return JSON.stringify(this.props);
  }

  public valueOf(): any {
    return this.props;
  }

  public abstract toJSON(): JSONValue;

  public abstract [Symbol.toPrimitive](
    hint: 'default' | 'string' | 'number',
  ): string | number | boolean | bigint | symbol | null | undefined;

  public [Symbol.for('nodejs.util.inspect.custom')](): string {
    return `${this.constructor.name}(${this.toString()})`;
  }
}
