import { Type } from 'class-transformer';
import { ISkillStatistics } from '../../interfaces/skills/skill-statistics.interface';
import { Block } from './block';
import { Reception } from './reception';
import { Serve } from './serve';
import { Spike } from './spike';

export class SkillStatistics implements ISkillStatistics {
  @Type(() => Serve)
  serve: Serve;
  @Type(() => Reception)
  reception: Reception;
  @Type(() => Spike)
  spike: Spike;
  @Type(() => Block)
  block: Block;
}
