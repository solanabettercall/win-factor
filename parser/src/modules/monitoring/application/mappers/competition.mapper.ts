import {
  ICompetition,
  Competition,
} from '../../domain/entities/competition.entity';
import { IRawComptition } from 'src/modules/volleystation/infrastructure/volleystation-competition.service';
import { CompetitionId } from '../../domain/value-objects/competition-id.vo';
import { CompetitionVersion } from '../../domain/value-objects/competition-version.vo';
import { CompetitionEntity } from '../../infrastructure/entities/competition.entity';
import { TeamMapper } from './team.mapper';
import { PlayerMapper } from './player.mapper';

export class CompetitionMapper {
  static rawToDomain(raw: IRawComptition): ICompetition {
    return {
      id: raw.id,
      name: raw.name,
      url: raw.url,
      version: raw.version,
    };
  }

  static domainToEntity(competition: Competition): CompetitionEntity {
    const entity = new CompetitionEntity();
    entity.id = competition.getId().value;
    entity.name = competition.getName();
    entity.url = competition.getUrl();
    entity.version = competition.getVersion().value;

    const teams = competition.getTeams();
    if (teams.length > 0) {
      entity.teams = teams.map(TeamMapper.domainToEntity);
    }

    const players = competition.getPlayers();
    if (players.length > 0) {
      entity.players = players.map(PlayerMapper.domainToEntity);
    }

    return entity;
  }

  static entityToDomain(entity: CompetitionEntity): Competition {
    const competition = Competition.create({
      id: CompetitionId.create(entity.id),
      name: entity.name,
      url: entity.url,
      version: CompetitionVersion.create(entity.version),
    });

    if (entity.teams && entity.teams.length > 0) {
      const teams = entity.teams.map(TeamMapper.entityToDomain);
      competition.addTeams(teams);
    }

    if (entity.players && entity.players.length > 0) {
      const players = entity.players.map(PlayerMapper.entityToDomain);
      competition.addPlayers(players);
    }

    return competition;
  }
}
