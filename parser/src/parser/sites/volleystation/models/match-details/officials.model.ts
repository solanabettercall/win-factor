import { Type } from 'class-transformer';
import { IOfficials } from '../../interfaces/match-details/officials.interface';
import { Official } from './official.model';

export class Officials implements IOfficials {
  referee3: Official;
  @Type(() => Official)
  commissioner: Official;
  @Type(() => Official)
  delegate: Official;
  @Type(() => Official)
  refereeChallenge: Official;
  @Type(() => Official)
  refereeSubstitute: Official;
  @Type(() => Official)
  referee1: Official | null;
  @Type(() => Official)
  @Type(() => Official)
  referee2: Official | null;
  @Type(() => Official)
  scorer1: Official | null;
  @Type(() => Official)
  scorer2: Official | null;
  @Type(() => Official)
  lineJudge1: Official | null;
  @Type(() => Official)
  lineJudge2: Official | null;
  @Type(() => Official)
  supervisor: Official | null;
}
