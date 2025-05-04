import { ITeam } from '../../interfaces/team-list/team.interface';

export class Team implements ITeam {
  id: string;
  name: string;
  logoUrl: string | null;
}
