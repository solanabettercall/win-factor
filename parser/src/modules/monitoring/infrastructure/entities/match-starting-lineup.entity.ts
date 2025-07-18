import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { MatchEntity } from './match.entity';
import { PlayerEntity } from './player.entity';

@Entity('match_starting_lineups')
@Index(['match', 'setNumber', 'player'], { unique: true })
export class MatchStartingLineupEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MatchEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'match_id' })
  match: MatchEntity;

  @ManyToOne(() => PlayerEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'player_id' })
  player: PlayerEntity;

  @Column({ name: 'set_number', type: 'int' })
  setNumber: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  static create(
    props: Omit<MatchStartingLineupEntity, 'id' | 'createdAt' | 'updatedAt'>,
  ): MatchStartingLineupEntity {
    const entity = new MatchStartingLineupEntity();
    Object.assign(entity, props);
    return entity;
  }
}
