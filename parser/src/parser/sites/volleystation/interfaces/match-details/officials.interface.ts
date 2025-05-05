import { Official } from '../../models/match-details/official.model';

export interface IOfficials {
  referee1: Official | null;
  referee2: Official | null;
  scorer1: Official | null;
  scorer2: Official | null;
  lineJudge1: Official | null;
  lineJudge2: Official | null;
  supervisor: Official | null;
}
