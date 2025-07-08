import { BadRequestException } from '@nestjs/common';
import { ValueObject } from 'src/shared/domain/value-objects/base/value-object';

interface IPlayerId {
  id: number;
}

export class PlayerId extends ValueObject<IPlayerId> {
  public [Symbol.toPrimitive]():
    | string
    | number
    | boolean
    | bigint
    | symbol
    | null
    | undefined {
    return this.props.id;
  }
  private constructor(props: IPlayerId) {
    super(props);
  }

  /**
   * Фабричный метод для создания IPlayerId
   * @param id - положительное целое число
   */
  public static create(id: number): PlayerId {
    if (!Number.isInteger(id) || id < 0) {
      throw new BadRequestException(
        `ID игрока должен быть неотрицательным целым числом. Получено: ${id}`,
      );
    }

    return new PlayerId({ id });
  }

  public get value(): number {
    return this.props.id;
  }

  public toString(): string {
    return this.props.id.toString();
  }

  public toJSON(): number {
    return this.props.id;
  }

  public [Symbol.for('nodejs.util.inspect.custom')](): number {
    return this.props.id;
  }
}
