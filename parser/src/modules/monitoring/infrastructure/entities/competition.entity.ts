import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { CompetitionSiteVersion } from '../../domain/value-objects/competition-version.vo';
import { TeamEntity } from './team.entity';

@Entity('competitions')
export class CompetitionEntity {
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column()
  name: string;

  @Column()
  url: string;

  @Column({ type: 'varchar' })
  version: CompetitionSiteVersion;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => TeamEntity, (team) => team.competition, { cascade: true })
  teams: TeamEntity[];

  // @OneToMany(() => MatchEntity, match => match.competition)
  // matches: MatchEntity[];
}
