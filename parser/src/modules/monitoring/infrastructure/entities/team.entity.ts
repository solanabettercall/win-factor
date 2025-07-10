import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CompetitionEntity } from './competition.entity';

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
  })
  @JoinColumn({ name: 'competition_id' })
  competition: CompetitionEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
