import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPlayerRepository } from '../../domain/repositories/player.repository.interface';
import { PlayerEntity } from '../entities/player.entity';
import { PlayerId } from '../../domain/value-objects/player-id.vo';
import { Player } from '../../domain/entities/player.entity';
import { PlayerMapper } from '../../application/mappers/player.mapper';

@Injectable()
export class PostgresPlayerRepository implements IPlayerRepository {
  constructor(
    @InjectRepository(PlayerEntity)
    private readonly playerRepository: Repository<PlayerEntity>,
  ) {}

  async findById(id: PlayerId): Promise<Player | null> {
    const entity = await this.playerRepository.findOne({
      where: { id: id.value },
    });

    if (!entity) {
      return null;
    }

    return this.mapEntityToDomain(entity);
  }

  async save(competition: Player): Promise<void> {
    const entity = this.mapDomainToEntity(competition);
    await this.playerRepository.save(entity);
  }

  private mapEntityToDomain(entity: PlayerEntity): Player {
    return PlayerMapper.entityToDomain(entity);
  }

  private mapDomainToEntity(competition: Player): PlayerEntity {
    return PlayerMapper.domainToEntity(competition);
  }
}
