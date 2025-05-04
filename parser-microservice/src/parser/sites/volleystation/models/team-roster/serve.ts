import { IServe } from '../../interfaces/team-roster/serve.interface';

/**
 * Статистика подач.
 */
export class Serve implements IServe {
  total!: number;
  aces!: number;
  errors!: number;
  acesPerSet!: number;
}
