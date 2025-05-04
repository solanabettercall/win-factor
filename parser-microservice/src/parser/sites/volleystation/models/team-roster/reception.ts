import { IReception } from '../../interfaces/team-roster/reception.interface';

/**
 * Статистика приёма подачи.
 */
export class Reception implements IReception {
  total!: number;
  errors!: number;
  negative!: number;
  perfect!: number;
  percentPerfect!: number;
}
