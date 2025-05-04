import { IBlock } from '../../interfaces/team-roster/block.interface';

/**
 * Статистика блоков.
 */
export class Block implements IBlock {
  points!: number;
  pointsPerSet!: number;
}
