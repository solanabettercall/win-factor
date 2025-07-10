import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CompetitionId } from '../../domain/value-objects/competition-id.vo';
import { GetCompetitionQuery } from '../queries/get-competition.query';
import { SaveCompetitionCommand } from '../commands/save-competition.command';
import {
  Competition,
  ICompetitionProps,
} from '../../domain/entities/competition.entity';
import { GetVolleystationCompetitionQuery } from 'src/modules/volleystation/application/queries/get-volleystation-competition.query';
import { IRawComptition } from 'src/modules/volleystation/infrastructure/volleystation-competition.service';
import { GetVolleystationTeamsQuery } from 'src/modules/volleystation/application/queries/get-volleystation-teams.query';
import { IRawTeam } from 'src/modules/volleystation/infrastructure/volleystation-team.service';

import { ITeam, Team } from '../../domain/entities/team.entity';
import { TeamId } from '../../domain/value-objects/team-id.vo';
import { GetTeamQuery } from '../queries/get-team.query';
import { SaveTeamCommand } from '../commands/save-team.command';
import { IRawPlayer } from 'src/modules/volleystation/infrastructure/volleystation-player.service';
import { GetVolleystationPlayersQuery } from 'src/modules/volleystation/application/queries/get-volleystation-players.query';
import { IPlayer } from '../../domain/entities/player.entity';
import { GetMatchQuery } from '../queries/get-match.query';
import { GetVolleystationMatchesQuery } from 'src/modules/volleystation/application/queries/get-volleystation-matches.query';
import { IRawMatch } from 'src/modules/volleystation/infrastructure/volleystation-match.service';
import { SaveMatchCommand } from '../commands/save-match.command';
import { mapRawDetailedToMatch, mapRawToMatch } from '../mappers/match.mapper';
import { IMatchProps, Match } from '../../domain/entities/match.entity';
import { GetVolleystationMatchQuery } from 'src/modules/volleystation/application/queries/get-volleystation-match.query';
import { MatchId } from '../../domain/value-objects/match-id.vo';
import { CompetitionMapper } from '../mappers/competition.mapper';
import { TeamMapper } from '../mappers/team.mapper';
import { PlayerMapper } from '../mappers/player.mapper';

@Injectable()
export class ScraperService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async onApplicationBootstrap() {
    const competitionId = CompetitionId.create(25);
    const matchId = MatchId.create(2238712);
    await this.fetchAndSaveCompetition(competitionId);
    const competition = await this.getCompetitionFromDb(competitionId);
    if (!competition) {
      this.logger.warn(`Турнир ${competitionId} не найден`);
      return;
    }

    await Promise.all([
      this.fetchAndSaveMatchesForCompetition(competitionId),
      this.fetchAndSaveTeamsForCompetition(competitionId),
      this.fetchAndSavePlayersForCompetition(competitionId),
      this.fetchAndSaveMatch(competitionId, matchId),
    ]);
    // console.log(`Игроков: ${competition?.getPlayerCount()}`);
    // console.log(`Команд: ${competition?.getTeamCount()}`);
    // console.log(`Матчей: ${competition?.getMatchCount()}`);

    // const match1 = await this.queryBus.execute(new GetMatchQuery(matchId));
    // const match2 = await this.queryBus.execute(
    //   new GetMatchQuery(MatchId.create(2238762)),
    // );

    // console.log(match1);
    // console.log(match2);
  }

  async getCompetitionFromDb(id: CompetitionId) {
    return this.queryBus.execute(new GetCompetitionQuery(id));
  }

  async saveCompetitionToDb(competition: ICompetitionProps) {
    const creatingCompetition = Competition.create(competition);
    await this.commandBus.execute(
      new SaveCompetitionCommand(creatingCompetition),
    );
  }

  async getTeamFromDb(id: TeamId): Promise<Team | null> {
    return this.queryBus.execute(new GetTeamQuery(id));
  }

  async saveTeamToDb(team: ITeam) {
    const creatingTeam = Team.create(team);
    await this.commandBus.execute(new SaveTeamCommand(creatingTeam));
  }

  private readonly logger = new Logger(this.constructor.name);

  async fetchAndSaveCompetition(id?: CompetitionId) {
    const competitionId = id ?? CompetitionId.create(110);

    const rawCompetition: IRawComptition | null = await this.queryBus.execute(
      new GetVolleystationCompetitionQuery(competitionId),
    );

    if (!rawCompetition) {
      this.logger.debug(`Турнир ${competitionId} не найден`);
      return;
    }

    const mappedCompetition = CompetitionMapper.rawToDomain(rawCompetition);

    await this.saveCompetitionToDb(mappedCompetition);

    const createdCompetition = await this.getCompetitionFromDb(competitionId);
    // console.log(createdCompetition);
  }

  async fetchAndSaveMatch(competitionId: CompetitionId, matchId: MatchId) {
    const competition: Competition | null =
      await this.getCompetitionFromDb(competitionId);

    if (!competition) {
      this.logger.warn(`Турнир ${competitionId} не найден`);
      return;
    }

    const rawMatch = await this.queryBus.execute(
      new GetVolleystationMatchQuery({
        competition,
        matchId,
      }),
    );
    if (!rawMatch) {
      this.logger.warn(`Матч ${matchId} не найден`);

      return;
    }

    const matchWithoutTeams = mapRawDetailedToMatch(rawMatch);

    const match = Match.create(matchWithoutTeams);

    match.updateAwayTeam(rawMatch.away);
    match.updateHomeTeam(rawMatch.home);

    await this.commandBus.execute(new SaveMatchCommand(match));

    const createdMatch = await this.queryBus.execute(
      new GetMatchQuery(matchId),
    );

    if (!createdMatch) return;

    this.logger.log(`Матч ${createdMatch.getId()} сохранен`);
  }

  async fetchAndSavePlayersForCompetition(competitionId: CompetitionId) {
    const competition = await this.getCompetitionFromDb(competitionId);

    if (!competition) {
      this.logger.warn(`Турнир ${competitionId} не найден`);
      return;
    }

    const players: IRawPlayer[] = await this.queryBus.execute(
      new GetVolleystationPlayersQuery(competition),
    );

    const mappedPlayers: IPlayer[] = players.map(PlayerMapper.rawToDomain);

    competition.addPlayers(mappedPlayers);

    await this.commandBus.execute(new SaveCompetitionCommand(competition));

    this.logger.log(
      `Добавлено ${competition.getPlayerCount()} игроков в турнир ${competition.getName()}`,
    );
  }

  async fetchAndSaveTeamsForCompetition(competitionId: CompetitionId) {
    const competition: Competition | null =
      await this.getCompetitionFromDb(competitionId);

    if (!competition) {
      this.logger.warn(`Турнир ${competitionId} не найден`);
      return;
    }

    const teams: IRawTeam[] = await this.queryBus.execute(
      new GetVolleystationTeamsQuery(competition),
    );

    const mappedTeams: ITeam[] = teams.map(TeamMapper.rawToDomain);

    competition.addTeams(mappedTeams);

    await this.commandBus.execute(new SaveCompetitionCommand(competition));

    this.logger.log(
      `Добавлено ${competition.getTeamCount()} команд в турнир ${competition.getName()}`,
    );
  }

  async fetchAndSaveMatchesForCompetition(competitionId: CompetitionId) {
    const competition: Competition | null =
      await this.getCompetitionFromDb(competitionId);

    if (!competition) {
      this.logger.warn(`Турнир ${competitionId} не найден`);
      return;
    }

    const rawMatches: IRawMatch[] = await this.queryBus.execute(
      new GetVolleystationMatchesQuery(competition),
    );

    const matches: IMatchProps[] = rawMatches.map(mapRawToMatch);

    competition.addMatches(matches);

    await this.commandBus.execute(new SaveCompetitionCommand(competition));

    this.logger.log(
      `Добавлено ${competition.getMatchCount()} матчей в турнир ${competition.getName()}`,
    );
  }
}
