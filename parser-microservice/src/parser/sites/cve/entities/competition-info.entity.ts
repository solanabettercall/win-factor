import { ICompetitionInfo } from '../interfaces/competition-info.interface';

export class CompetitionInfo implements ICompetitionInfo {
  id: number;
  name: string;
  logoUrl: string;

  constructor(data: ICompetitionInfo) {
    Object.assign(this, data);
  }
}
