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

  public static create(compositeId: string): TeamId {
    const [numericString, code] = compositeId.split('-');

    if (!code) {
      throw new BadRequestException(`Не удалось извлечь code`);
    }

    const numeric = parseInt(numericString);

    if (!numeric) {
      throw new BadRequestException(`Не удалось извлечь numeric`);
    }

    return new TeamId({ code, numeric });
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
}
