import { ITeamInfo } from '../interfaces/team-info.interface.ts.js';

export class TeamInfo implements ITeamInfo {
  name: string;
  clubCode: string;
  nationId: string;
  logoUrl: string;

  constructor(data: ITeamInfo) {
    Object.assign(this, data);
  }
}
