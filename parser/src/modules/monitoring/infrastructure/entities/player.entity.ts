import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CompetitionEntity } from './competition.entity';
import { TeamEntity } from './team.entity';

@Entity('players')
export class PlayerEntity {
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  url: string;

  @Column({ name: 'photo_url', nullable: true, type: 'varchar' })
  photoUrl: string | null;

  @Column({ type: 'int' })
  number: number;

  @Column({ type: 'varchar' })
  position: string;

  @ManyToOne(() => CompetitionEntity, (competition) => competition.players, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'competition_id' })
  competition: CompetitionEntity;

  @ManyToOne(() => TeamEntity, (team) => team.players, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn([
    { name: 'team_numeric', referencedColumnName: 'numeric' },
    { name: 'team_code', referencedColumnName: 'code' },
  ])
  team: TeamEntity | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  static create(
    props: Omit<PlayerEntity, 'createdAt' | 'updatedAt'>,
  ): PlayerEntity {
    const entity = new PlayerEntity();
    Object.assign(entity, props);
    return entity;
  }
}
