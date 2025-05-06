import { ICompetition } from '../interfaces/vollestation-competition.interface';

export class Competition implements ICompetition {
  id: number;
  url: string;
  name: string;
}
