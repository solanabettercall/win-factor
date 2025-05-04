import { ISpike } from '../../interfaces/team-roster/spike.interface';

/**
 * Статистика атак.
 */
export class Spike implements ISpike {
  total!: number;
  errors!: number;
  blocked!: number;
  perfect!: number;
  percentPerfect!: number;
}
