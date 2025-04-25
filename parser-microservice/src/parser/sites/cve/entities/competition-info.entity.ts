import { ICompetitionInfo } from '../interfaces/competition-info.interface';

export class CompetitionInfo implements ICompetitionInfo {
  id: string;
  name: string;
  logoUrl: string;

  constructor(data: ICompetitionInfo) {
    Object.assign(this, data);
  }
}
