import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { CompetitionEntity } from './competition.entity';
import { TeamEntity } from './team.entity';
import { PlayerEntity } from './player.entity';
import { MatchStartingLineupEntity } from './match-starting-lineup.entity';

@Entity('matches')
export class MatchEntity {
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ name: 'match_url' })
  matchUrl: string;

  @ManyToOne(() => TeamEntity, {
    nullable: true,
    onDelete: 'SET NULL',
    cascade: ['insert'],
  })
  @JoinColumn([
    { name: 'home_team_numeric', referencedColumnName: 'numeric' },
    { name: 'home_team_code', referencedColumnName: 'code' },
  ])
  homeTeam: TeamEntity | null;

  @ManyToOne(() => TeamEntity, {
    nullable: true,
    onDelete: 'SET NULL',
    cascade: ['insert'],
  })
  @JoinColumn([
    { name: 'away_team_numeric', referencedColumnName: 'numeric' },
    { name: 'away_team_code', referencedColumnName: 'code' },
  ])
  awayTeam: TeamEntity | null;

  @ManyToOne(() => CompetitionEntity, (competition) => competition.matches, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'competition_id' })
  competition: CompetitionEntity;

  @ManyToMany(() => PlayerEntity)
  @JoinTable({
    name: 'match_players',
    joinColumn: { name: 'match_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'player_id', referencedColumnName: 'id' },
  })
  declaredPlayers: PlayerEntity[];

@OneToMany(() => MatchStartingLineupEntity, (lineup) => lineup.match, {
    cascade: true,
  })
  startingLineups: MatchStartingLineupEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  static create(
    props: Omit<MatchEntity, 'createdAt' | 'updatedAt'>,
  ): MatchEntity {
    const entity = new MatchEntity();
    Object.assign(entity, props);
    return entity;
  }
}
