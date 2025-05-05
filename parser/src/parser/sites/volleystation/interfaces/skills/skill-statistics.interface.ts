import { IBlock } from './block.interface';
import { IReception } from './reception.interface';
import { IServe } from './serve.interface';
import { ISpike } from './spike.interface';

export interface ISkillStatistics {
  serve: IServe;
  reception: IReception;
  spike: ISpike;
  block: IBlock;
}
