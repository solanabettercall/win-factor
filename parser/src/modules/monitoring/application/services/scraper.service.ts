import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CompetitionId } from '../../domain/value-objects/competition-id.vo';
import { GetCompetitionQuery } from '../queries/get-competition.query';
import { SaveCompetitionCommand } from '../commands/save-competition.command';
import {
  Competition,
  ICompetition,
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
import { GetVolleystationMatchesQuery } from 'src/modules/volleystation/application/queries/get-volleystation-matches.query';
import {
  IRawDetailedMatch,
  IRawMatch,
} from 'src/modules/volleystation/infrastructure/volleystation-match.service';
import { SaveMatchCommand } from '../commands/save-match.command';
import { GetVolleystationMatchQuery } from 'src/modules/volleystation/application/queries/get-volleystation-match.query';
import { MatchId } from '../../domain/value-objects/match-id.vo';

import {
  catchError,
  finalize,
  from,
  lastValueFrom,
  map,
  mergeMap,
  of,
  scan,
  tap,
  toArray,
} from 'rxjs';
import { SavePlayerCommand } from '../commands/save-player.command';
import { PlayerId } from '../../domain/value-objects/player-id.vo';

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

  async saveCompetitionToDb(competition: ICompetition) {
    const creatingCompetition = Competition.create(competition);
    await this.commandBus.execute(
      new SaveCompetitionCommand(creatingCompetition),
    );
  }

  async getTeamFromDb(id: TeamId): Promise<Team | null> {
    return this.queryBus.execute(new GetTeamQuery(id));
  }

  async saveTeamToDb(team: ITeam) {
    await this.commandBus.execute(new SaveTeamCommand(team));
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

    await this.saveCompetitionToDb(rawCompetition);
  }

  async fetchAndSaveMatch(competitionId: CompetitionId, matchId: MatchId) {
    const competition: Competition | null =
      await this.getCompetitionFromDb(competitionId);

    if (!competition) {
      this.logger.warn(`Турнир ${competitionId} не найден`);
      return;
    }

    const rawMatch: IRawDetailedMatch | null = await this.queryBus.execute(
      new GetVolleystationMatchQuery({
        competition,
        matchId,
      }),
    );

    if (!rawMatch) {
      this.logger.warn(`Матч ${matchId} не найден`);

      return;
    }

    await this.commandBus.execute(new SaveMatchCommand(rawMatch));
  }

  async fetchAndSavePlayersForCompetition(competitionId: CompetitionId) {
    const competition = await this.getCompetitionFromDb(competitionId);

    if (!competition) {
      this.logger.warn(`Турнир ${competitionId} не найден`);
      return;
    }

    const rawPlayers: IRawPlayer[] = await this.queryBus.execute(
      new GetVolleystationPlayersQuery(competition),
    );

    type error = {
      playerId: PlayerId;
      error: unknown;
    };

    const results: { success: number; failed: number; errors: error[] } = {
      success: 0,
      failed: 0,
      errors: [],
    };

    return lastValueFrom(
      from(rawPlayers).pipe(
        mergeMap(
          (player) =>
            from(this.commandBus.execute(new SavePlayerCommand(player))).pipe(
              tap(() => results.success++),
              catchError((error) => {
                results.failed++;
                results.errors.push({ playerId: player.id, error });
                this.logger.error(
                  `Ошибка сохранения игрока ${player.id}:`,
                  error,
                );
                return of(null);
              }),
            ),
          5,
        ),
        scan((processed) => {
          const count = processed + 1;
          if (count % 10 === 0) {
            this.logger.verbose(
              `Обработано ${count}/${rawPlayers.length} игроков`,
            );
          }
          return count;
        }, 0),
        toArray(),
        map(() => results),
        finalize(() => {
          this.logger.verbose(
            `Завершено. Успешно: ${results.success}, Ошибок: ${results.failed}`,
          );
        }),
      ),
    );
  }

  // TODO: Only develop: REFACTOR this for production
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

    type error = {
      teamId: TeamId;
      error: unknown;
    };

    const results: { success: number; failed: number; errors: error[] } = {
      success: 0,
      failed: 0,
      errors: [],
    };

    return lastValueFrom(
      from(teams).pipe(
        mergeMap(
          (team) =>
            from(this.commandBus.execute(new SaveTeamCommand(team))).pipe(
              tap(() => results.success++),
              catchError((error) => {
                results.failed++;
                results.errors.push({ teamId: team.id, error });
                this.logger.error(
                  `Ошибка сохранения команды ${team.id}:`,
                  error,
                );
                return of(null);
              }),
            ),
          5,
        ),
        scan((processed) => {
          const count = processed + 1;
          if (count % 10 === 0) {
            this.logger.verbose(`Обработано ${count}/${teams.length} команд`);
          }
          return count;
        }, 0),
        toArray(),
        map(() => results),
        finalize(() => {
          this.logger.verbose(
            `Завершено. Успешно: ${results.success}, Ошибок: ${results.failed}`,
          );
        }),
      ),
    );
  }

  // TODO: Only develop: REFACTOR this for production
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

    type error = {
      matchId: MatchId;
      error: unknown;
    };
    const results: { success: number; failed: number; errors: error[] } = {
      success: 0,
      failed: 0,
      errors: [],
    };

    return lastValueFrom(
      from(rawMatches).pipe(
        mergeMap(
          (match) =>
            from(this.commandBus.execute(new SaveMatchCommand(match))).pipe(
              tap(() => results.success++),
              catchError((error) => {
                results.failed++;
                results.errors.push({ matchId: match.id, error });
                this.logger.error(
                  `Ошибка сохранения матча ${match.id}:`,
                  error,
                );
                return of(null);
              }),
            ),
          5,
        ),
        scan((processed) => {
          const count = processed + 1;
          if (count % 10 === 0) {
            this.logger.verbose(
              `Обработано ${count}/${rawMatches.length} матчей`,
            );
          }
          return count;
        }, 0),
        toArray(),
        map(() => results),
        finalize(() => {
          this.logger.verbose(
            `Завершено. Успешно: ${results.success}, Ошибок: ${results.failed}`,
          );
        }),
      ),
    );
  }
}
