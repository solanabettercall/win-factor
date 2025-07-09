import { ValueObject } from 'src/shared/domain/value-objects/base/value-object';

type CompetitionSiteVersion = 'website' | 'website2';

interface ICompetitionVersion {
  value: CompetitionSiteVersion;
}

export class CompetitionVersion extends ValueObject<ICompetitionVersion> {
  public [Symbol.toPrimitive]():
    | string
    | number
    | boolean
    | bigint
    | symbol
    | null
    | undefined {
    return this.props.value;
  }
  private constructor(props: ICompetitionVersion) {
    super(props);
  }

  public static create(value: CompetitionSiteVersion): CompetitionVersion {
    return new CompetitionVersion({ value });
  }

  public get value(): CompetitionSiteVersion {
    return this.props.value;
  }

  public toString(): string {
    return this.props.value;
  }

  public toJSON(): string {
    return this.props.value;
  }

  public [Symbol.for('nodejs.util.inspect.custom')](): string {
    return this.props.value;
  }

  public equals(vo?: CompetitionVersion): boolean {
    if (!vo) return false;

    return this.props.value === vo.props.value;
  }

  public isV1(): boolean {
    return this.props.value === 'website';
  }

  public isV2(): boolean {
    return this.props.value === 'website2';
  }
}
