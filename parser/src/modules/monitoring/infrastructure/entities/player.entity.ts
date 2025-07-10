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

  @ManyToOne(() => CompetitionEntity, (competition) => competition.players)
  @JoinColumn({ name: 'competition_id' })
  competition: CompetitionEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
