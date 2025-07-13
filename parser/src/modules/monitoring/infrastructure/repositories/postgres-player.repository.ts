import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPlayerRepository } from '../../domain/repositories/player.repository.interface';
import { PlayerEntity } from '../entities/player.entity';
import { PlayerId } from '../../domain/value-objects/player-id.vo';
import { Player } from '../../domain/entities/player.entity';
import { CompetitionEntity } from '../entities/competition.entity';
import { CompetitionId } from '../../domain/value-objects/competition-id.vo';
import { TeamId } from '../../domain/value-objects/team-id.vo';
import { TeamEntity } from '../entities/team.entity';

@Injectable()
export class PostgresPlayerRepository implements IPlayerRepository {
  constructor(
    @InjectRepository(PlayerEntity)
    private readonly playerRepository: Repository<PlayerEntity>,
    @InjectRepository(CompetitionEntity)
    private readonly competitionRepository: Repository<CompetitionEntity>,
    @InjectRepository(TeamEntity)
    private readonly teamRepository: Repository<TeamEntity>,
  ) {}

  async findById(id: PlayerId): Promise<Player | null> {
    const entity = await this.playerRepository.findOne({
      where: { id: id.value },
      relations: {
        competition: true,
      },
    });

    if (!entity) {
      return null;
    }

    return this.entityToDomain(entity);
  }

  async save(player: Player): Promise<void> {
    const entity: PlayerEntity = await this.domainToEntity(player);
    await this.playerRepository.save(entity);
  }

  private async domainToEntity(player: Player): Promise<PlayerEntity> {
    const competition = await this.competitionRepository.findOneOrFail({
      where: {
        id: player.getCompetitionId().value,
      },
    });

    const entity = PlayerEntity.create({
      id: player.getId().value,
      name: player.getName(),
      url: player.getUrl(),
      competition,
      number: player.getNumber(),
      photoUrl: player.getPhotoUrl(),
      position: player.getPosition(),
      team: null,
    });

    const teamId = player.getTeamId();
    if (teamId) {
      const team: TeamEntity | null = await this.teamRepository.findOne({
        where: {
          code: player.getTeamId()?.code,
          numeric: player.getTeamId()?.numeric,
        },
      });

      entity.team = team;
    }

    return entity;
  }

  private entityToDomain(player: PlayerEntity): Player {
    const id = PlayerId.create(player.id);
    const competitionId = CompetitionId.create(player.competition.id);

    const domain = Player.create({
      id,
      name: player.name,
      url: player.url,
      competitionId,
      number: player.number,
      photoUrl: player.photoUrl,
      position: player.position,
    });

    if (player?.team?.code && player?.team?.numeric) {
      const teamId = TeamId.create(player.team.numeric, player.team.code);
      domain.setTeam(teamId);
    }

    return domain;
  }
}
