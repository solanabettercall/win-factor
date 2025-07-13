import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { CompetitionEntity } from './competition.entity';
import { PlayerEntity } from './player.entity';

@Entity('teams')
export class TeamEntity {
  @PrimaryColumn({ type: 'int' })
  numeric: number;

  @PrimaryColumn({ type: 'varchar' })
  code: string;

  @Column()
  name: string;

  @Column()
  url: string;

  @ManyToOne(() => CompetitionEntity, (competition) => competition.teams, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'competition_id' })
  competition: CompetitionEntity;

  @OneToMany(() => PlayerEntity, (player) => player.team, {
    cascade: true,
  })
  players: PlayerEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  static create(
    props: Omit<TeamEntity, 'createdAt' | 'updatedAt' | 'players'>,
  ): TeamEntity {
    const entity = new TeamEntity();
    Object.assign(entity, props);
    return entity;
  }
}
