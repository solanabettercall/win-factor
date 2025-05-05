import { IBlock } from '../../interfaces/skills/block.interface';

/**
 * Статистика блоков.
 */
export class Block implements IBlock {
  points!: number;
  pointsPerSet!: number;
}
