import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CompetitionSiteVersion } from '../../domain/value-objects/competition-version.vo';

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // @OneToMany(() => TeamEntity, team => team.competition)
  // teams: TeamEntity[];

  // @OneToMany(() => MatchEntity, match => match.competition)
  // matches: MatchEntity[];
}
