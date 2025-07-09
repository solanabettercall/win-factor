import { BadRequestException } from '@nestjs/common';
import { ValueObject } from 'src/shared/domain/value-objects/base/value-object';

interface IMatchId {
  id: number;
}

export class MatchId extends ValueObject<IMatchId> {
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
  private constructor(props: IMatchId) {
    super(props);
  }

  /**
   * Фабричный метод для создания CompetitionId
   * @param id - положительное целое число
   */
  public static create(id: number): MatchId {
    if (!Number.isInteger(id) || id < 0) {
      throw new BadRequestException(
        `ID матча должно быть неотрицательным целым числом. Получено: ${id}`,
      );
    }

    return new MatchId({ id });
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
