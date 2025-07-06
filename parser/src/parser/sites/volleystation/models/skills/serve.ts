import { IServe } from '../../interfaces/skills/serve.interface';

/**
 * Статистика подач.
 */
export class Serve implements IServe {
  total!: number;
  aces!: number;
  errors!: number;
  acesPerSet!: number;
}
