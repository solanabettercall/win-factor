import { IOfficial } from '../../interfaces/match-details/official.interface';

export class Official implements IOfficial {
  firstName: string;
  lastName: string;
  level: string | null;
}
