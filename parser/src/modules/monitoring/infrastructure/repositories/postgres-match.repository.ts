import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Match, IStartingLineup } from '../../domain/entities/match.entity';
import { MatchId } from '../../domain/value-objects/match-id.vo';
import { IMatchRepository } from '../../domain/repositories/match.repository.interface';
import { MatchEntity } from '../entities/match.entity';
import { CompetitionId } from '../../domain/value-objects/competition-id.vo';
import { TeamId } from '../../domain/value-objects/team-id.vo';
import { PlayerId } from '../../domain/value-objects/player-id.vo';
import { CompetitionEntity } from '../entities/competition.entity';
import { TeamEntity } from '../entities/team.entity';
import { PlayerEntity } from '../entities/player.entity';
import { MatchStartingLineupEntity } from '../entities/match-starting-lineup.entity';

@Injectable()
export class PostgresMatchRepository implements IMatchRepository {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectRepository(MatchEntity)
    private readonly matchRepository: Repository<MatchEntity>,
    @InjectRepository(CompetitionEntity)
    private readonly competitionRepository: Repository<CompetitionEntity>,
    @InjectRepository(TeamEntity)
    private readonly teamRepository: Repository<TeamEntity>,
    @InjectRepository(PlayerEntity)
    private readonly playerRepository: Repository<PlayerEntity>,
    @InjectRepository(MatchStartingLineupEntity)
    private readonly matchStartingLineupRepository: Repository<MatchStartingLineupEntity>,
  ) {}

  async findById(id: MatchId): Promise<Match | null> {
    const entity = await this.matchRepository.findOne({
      where: { id: id.value },
      relations: {
        homeTeam: true,
        awayTeam: true,
        competition: true,
        declaredPlayers: true,
        startingLineups: {
          player: true,
        },
      },
    });

    if (!entity) {
      return null;
    }

    return this.entityToDomain(entity);
  }

  async save(match: Match): Promise<void> {
    this.logger.debug(`Сохранение матча ID: ${match.getId().value}`);

    // Загружаем или создаем entity
    const entity: MatchEntity = await this.domainToEntity(match);

    await this.matchRepository.save(entity);
    this.logger.debug(`Матч сохранен успешно`);
  }

  private async domainToEntity(match: Match): Promise<MatchEntity> {
    const competition = await this.competitionRepository.findOneOrFail({
      where: {
        id: match.getCompetitionId().value,
      },
    });

    const declaredPlayerIds = match.getDeclaredPlayers().map((p) => p.value);
    const declaredPlayers =
      declaredPlayerIds.length > 0
        ? await this.playerRepository.find({
            where: {
              id: In(declaredPlayerIds),
            },
          })
        : [];

    // Загружаем существующий entity или создаем новый
    let entity = await this.matchRepository.findOne({
      where: { id: match.getId().value },
      relations: {
        startingLineups: { player: true },
        declaredPlayers: true,
        homeTeam: true,
        awayTeam: true,
        competition: true,
      },
    });

    if (!entity) {
      entity = MatchEntity.create({
        id: match.getId().value,
        competition,
        matchUrl: match.getMatchUrl(),
        awayTeam: null,
        homeTeam: null,
        declaredPlayers,
        startingLineups: [],
      });
    } else {
      // Обновляем существующий entity
      entity.competition = competition;
      entity.matchUrl = match.getMatchUrl();
      entity.declaredPlayers = declaredPlayers;
    }

    // Создаем карту существующих startingLineups для обновления
    const existingLineups = new Map<string, MatchStartingLineupEntity>();
    if (entity.startingLineups) {
      entity.startingLineups.forEach((lineup) => {
        const key = `${lineup.setNumber}-${lineup.player.id}`;
        existingLineups.set(key, lineup);
      });
    }

    // Подготавливаем стартовые составы для сохранения
    const startingLineupEntities: MatchStartingLineupEntity[] = [];
    const startingLineups = match.getStartingLineups();
    const newLineupKeys = new Set<string>();

    if (startingLineups.length > 0) {
      this.logger.debug(
        `Обработка ${startingLineups.length} стартовых составов`,
      );

      for (const lineup of startingLineups) {
        this.logger.debug(
          `Обработка сета ${lineup.setNumber} с ${lineup.players.length} игроками`,
        );

        for (const playerId of lineup.players) {
          this.logger.debug(`Поиск игрока с ID: ${playerId.value}`);

          try {
            const player = await this.playerRepository.findOneOrFail({
              where: { id: playerId.value },
            });

            this.logger.debug(`Игрок найден: ${player.id}`);

            const key = `${lineup.setNumber}-${player.id}`;
            newLineupKeys.add(key);

            // Используем существующую entity если есть, иначе создаем новую
            const existingLineup = existingLineups.get(key);
            if (existingLineup) {
              startingLineupEntities.push(existingLineup);
            } else {
              const lineupEntity = MatchStartingLineupEntity.create({
                match: entity,
                player,
                setNumber: lineup.setNumber,
              });
              startingLineupEntities.push(lineupEntity);
            }
          } catch (error) {
            this.logger.error(
              `Ошибка при поиске игрока ${playerId.value}: ${error.message}`,
            );
          }
        }
      }
    }

    // Устанавливаем стартовые составы
    entity.startingLineups = startingLineupEntities;

    const homeTeamId = match.getHomeTeamId();
    const awayTeamId = match.getAwayTeamId();

    if (homeTeamId) {
      const homeTeam: TeamEntity | null = await this.teamRepository.findOne({
        where: {
          code: homeTeamId.code,
          numeric: homeTeamId.numeric,
        },
      });
      entity.homeTeam = homeTeam;
    }

    if (awayTeamId) {
      const awayTeam: TeamEntity | null = await this.teamRepository.findOne({
        where: {
          code: awayTeamId.code,
          numeric: awayTeamId.numeric,
        },
      });
      entity.awayTeam = awayTeam;
    }

    return entity;
  }

  private entityToDomain(match: MatchEntity): Match {
    const id = MatchId.create(match.id);
    const competitionId = CompetitionId.create(match.competition.id);

    const domain = Match.create({
      id,
      competitionId,
      url: match.matchUrl,
    });

    if (match?.homeTeam) {
      const homeTeamId = TeamId.create(
        match.homeTeam.numeric,
        match.homeTeam.code,
      );
      domain.updateHomeTeam(homeTeamId);
    }

    if (match?.awayTeam) {
      const awayTeamId = TeamId.create(
        match.awayTeam.numeric,
        match.awayTeam.code,
      );
      domain.updateAwayTeam(awayTeamId);
    }

    // Добавляем заявленных игроков
    if (match.declaredPlayers && match.declaredPlayers.length > 0) {
      match.declaredPlayers.forEach((player) => {
        const playerId = PlayerId.create(player.id);
        domain.addDeclaredPlayer(playerId);
      });
    }

    // Добавляем стартовые составы
    if (match.startingLineups && match.startingLineups.length > 0) {
      const startingLineupsBySet = new Map<number, PlayerId[]>();

      match.startingLineups.forEach((lineup) => {
        const setNumber = lineup.setNumber;
        const playerId = PlayerId.create(lineup.player.id);

        if (!startingLineupsBySet.has(setNumber)) {
          startingLineupsBySet.set(setNumber, []);
        }
        startingLineupsBySet.get(setNumber)!.push(playerId);
      });

      startingLineupsBySet.forEach((playerIds, setNumber) => {
        domain.addStartingLineup(setNumber, playerIds);
      });
    }

    return domain;
  }

  private async createSimpleMatchEntity(match: Match): Promise<MatchEntity> {
    const competition = await this.competitionRepository.findOneOrFail({
      where: { id: match.getCompetitionId().value },
    });

    const declaredPlayerIds = match.getDeclaredPlayers().map((p) => p.value);
    const declaredPlayers =
      declaredPlayerIds.length > 0
        ? await this.playerRepository.find({
            where: { id: In(declaredPlayerIds) },
          })
        : [];

    return MatchEntity.create({
      id: match.getId().value,
      competition,
      matchUrl: match.getMatchUrl(),
      awayTeam: null,
      homeTeam: null,
      declaredPlayers,
      startingLineups: [],
    });
  }
}
