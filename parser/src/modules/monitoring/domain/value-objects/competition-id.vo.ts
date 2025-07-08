import { BadRequestException } from '@nestjs/common';
import { ValueObject } from 'src/shared/domain/value-objects/base/value-object';

interface ICompetitionId {
  id: number;
}

export class CompetitionId extends ValueObject<ICompetitionId> {
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
  private constructor(props: ICompetitionId) {
    super(props);
  }

  /**
   * Фабричный метод для создания CompetitionId
   * @param id - положительное целое число
   */
  public static create(id: number): CompetitionId {
    if (!Number.isInteger(id) || id < 0) {
      throw new BadRequestException(
        `ID соревнования должен быть неотрицательным целым числом. Получено: ${id}`,
      );
    }

    return new CompetitionId({ id });
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
