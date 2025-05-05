import { ISpike } from '../../interfaces/skills/spike.interface';

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
