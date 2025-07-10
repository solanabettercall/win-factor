import { BadRequestException } from '@nestjs/common';
import { ValueObject } from 'src/shared/domain/value-objects/base/value-object';

interface ITeamId {
  numeric: number;
  code: string;
}

export class TeamId extends ValueObject<ITeamId> {
  public [Symbol.toPrimitive]():
    | string
    | number
    | boolean
    | bigint
    | symbol
    | null
    | undefined {
    return this.toCompostiteId();
  }
  private constructor(props: ITeamId) {
    super(props);
  }

  private toCompostiteId(): string {
    const compostiteId = [this.props.numeric, this.props.code].join('-');
    return compostiteId;
  }

  public static create(compositeId: string): TeamId;
  public static create(numeric: number, code: string): TeamId;
  public static create(arg1: string | number, arg2?: string) {
    if (typeof arg1 === 'string') {
      const [numericString, code] = arg1.split('-');

      if (!code) {
        throw new BadRequestException(`Не удалось извлечь code`);
      }

      const numeric = parseInt(numericString);

      if (isNaN(numeric)) {
        throw new BadRequestException(`Не удалось извлечь numeric`);
      }

      return new TeamId({ code, numeric });
    } else {
      if (!arg2) {
        throw new BadRequestException(
          `Code is required when creating TeamId with numeric`,
        );
      }
      return new TeamId({ numeric: arg1, code: arg2 });
    }
  }

  public get value(): string {
    return this.toCompostiteId();
  }

  public toString(): string {
    return this.toCompostiteId();
  }

  public toJSON(): string {
    return this.toCompostiteId();
  }

  public [Symbol.for('nodejs.util.inspect.custom')](): string {
    return this.toCompostiteId();
  }

  public get numeric(): number {
    return this.props.numeric;
  }

  public get code(): string {
    return this.props.code;
  }
}
