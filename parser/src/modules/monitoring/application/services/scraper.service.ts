import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CompetitionId } from '../../domain/value-objects/competition-id.vo';
import { GetCompetitionQuery } from '../queries/get-competition.query';
import { SaveCompetitionCommand } from '../commands/save-competition.command';
import { Competition } from '../../domain/entities/competition.entity';
import { GetVolleystationCompetitionQuery } from 'src/modules/volleystation/application/queries/get-volleystation-competition.query';
import { IRawComptition } from 'src/modules/volleystation/infrastructure/volleystation-competition.service';
import { GetVolleystationTeamsQuery } from 'src/modules/volleystation/application/queries/get-volleystation-teams.query';
import {
  IRawDetailedTeam,
  IRawTeam,
} from 'src/modules/volleystation/infrastructure/volleystation-team.service';

import { Team } from '../../domain/entities/team.entity';
import { TeamId } from '../../domain/value-objects/team-id.vo';
import { SaveTeamCommand } from '../commands/save-team.command';
import {
  IRawDetailedMatch,
  IRawMatch,
} from 'src/modules/volleystation/infrastructure/volleystation-match.service';
import { SaveMatchCommand } from '../commands/save-match.command';
import { GetVolleystationMatchQuery } from 'src/modules/volleystation/application/queries/get-volleystation-match.query';
import { MatchId } from '../../domain/value-objects/match-id.vo';

import { Match } from '../../domain/entities/match.entity';
import { GetMatchQuery } from '../queries/get-match.query';
import { GetVolleystationPlayersQuery } from 'src/modules/volleystation/application/queries/get-volleystation-players.query';
import { IRawPlayer } from 'src/modules/volleystation/infrastructure/volleystation-player.service';
import { Player } from '../../domain/entities/player.entity';
import { SavePlayerCommand } from '../commands/save-player.command';
import { GetPlayerQuery } from '../queries/get-player.query';
import { GetVolleystationTeamQuery } from 'src/modules/volleystation/application/queries/get-volleystation-team.query';
import { GetTeamQuery } from '../queries/get-team.query';
import { GetVolleystationMatchesQuery } from 'src/modules/volleystation/application/queries/get-volleystation-matches.query';

@Injectable()
export class ScraperService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  private readonly logger = new Logger(this.constructor.name);

  async onApplicationBootstrap() {
    const competitionId = CompetitionId.create(285);
    const teamId = TeamId.create(2215385, '7471');
    const matchId = MatchId.create(2237827);
    const rawCompetition: IRawComptition | null = await this.queryBus.execute(
      new GetVolleystationCompetitionQuery(competitionId),
    );
    if (!rawCompetition) {
      this.logger.warn(`Турнир ${competitionId} не найден`);
      return;
    }

    const competition = Competition.create(rawCompetition);

    await this.commandBus.execute(new SaveCompetitionCommand(competition));
    // const competitionFromDb = await this.queryBus.execute(
    //   new GetCompetitionQuery(competitionId),
    // );

    //#region Команды
    const rawTeams: IRawTeam[] = await this.queryBus.execute(
      new GetVolleystationTeamsQuery(competition),
    );
    const teams: Team[] = rawTeams.map(Team.create);

    await Promise.all(
      teams.map((team) => this.commandBus.execute(new SaveTeamCommand(team))),
    );
    // await this.commandBus.execute(new SaveTeamCommand(teams[0]));

    // const team = await this.queryBus.execute(
    //   new GetTeamQuery(teams[0].getId()),
    // );
    //#endregion

    //#region
    const rawPlayers: IRawPlayer[] = await this.queryBus.execute(
      new GetVolleystationPlayersQuery(competition),
    );
    const players: Player[] = rawPlayers.map(Player.create);

    await Promise.all(
      players.map((player) =>
        this.commandBus.execute(new SavePlayerCommand(player)),
      ),
    );
    //#endregion

    // //#region Список матчей
    // const rawMatches: IRawMatch[] = await this.queryBus.execute(
    //   new GetVolleystationMatchesQuery(competition),
    // );
    // const matches: Match[] = rawMatches.map(Match.create);
    // // const firstMatch = matches[0];

    // await Promise.all(
    //   matches.map((match) =>
    //     this.commandBus.execute(new SaveMatchCommand(match)),
    //   ),
    // );

    // // await this.commandBus.execute(new SaveMatchCommand(firstMatch));
    // // const match1 = await this.queryBus.execute(
    // //   new GetMatchQuery(firstMatch.getId()),
    // // );
    // // console.log(match1);
    // //#endregion

    // // #region Матч
    // const rawDetailedMatch: IRawDetailedMatch | null =
    //   await this.queryBus.execute(
    //     new GetVolleystationMatchQuery({
    //       competition,
    //       matchId,
    //     }),
    //   );
    // if (!rawDetailedMatch) {
    //   this.logger.warn(`Матч ${matchId} не найден`);
    //   return;
    // }

    // const match: Match = Match.create(rawDetailedMatch);

    // await this.commandBus.execute(new SaveMatchCommand(match));
    // const matchFromDb = await this.queryBus.execute(new GetMatchQuery(matchId));
    // // #endregion;

    //#region Команда
    const rawDetailedTeam: IRawDetailedTeam | null =
      await this.queryBus.execute(
        new GetVolleystationTeamQuery({
          competition,
          teamId,
        }),
      );

    if (!rawDetailedTeam) {
      this.logger.warn(`Команда ${teamId} не найдена`);
      return;
    }

    const team: Team = Team.create(rawDetailedTeam);
    console.log(team);
    await this.commandBus.execute(new SaveTeamCommand(team));
    const teamFromDb = await this.queryBus.execute(new GetTeamQuery(teamId));
    console.log(teamFromDb);
    //#endregion
  }
}
