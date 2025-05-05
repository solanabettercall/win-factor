import { ISkillStatistics } from '../../interfaces/skills/skill-statistics.interface';
import { Block } from './block';
import { Reception } from './reception';
import { Serve } from './serve';
import { Spike } from './spike';

export class SkillStatistics implements ISkillStatistics {
  serve: Serve;
  reception: Reception;
  spike: Spike;
  block: Block;
}
