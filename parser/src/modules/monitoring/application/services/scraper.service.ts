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
import { mapRawToCompetition } from '../mappers/competition.mapper';
import { GetVolleystationTeamsQuery } from 'src/modules/volleystation/application/queries/get-volleystation-teams.query';
import { IRawTeam } from 'src/modules/volleystation/infrastructure/volleystation-team.service';
import { mapRawToTeam } from '../mappers/team.mapper';
import { ITeam, Team } from '../../domain/entities/team.entity';
import { TeamId } from '../../domain/value-objects/team-id.vo';
import { GetTeamQuery } from '../queries/get-team.query';
import { SaveTeamCommand } from '../commands/save-team.command';
import { IRawPlayer } from 'src/modules/volleystation/infrastructure/volleystation-player.service';
import { GetVolleystationPlayersQuery } from 'src/modules/volleystation/application/queries/get-volleystation-players.query';
import { IPlayer } from '../../domain/entities/player.entity';
import { mapRawToPlayer } from '../mappers/player.mapper';

@Injectable()
export class ScraperService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

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

    const mappedCompetition: ICompetition = mapRawToCompetition(rawCompetition);

    await this.saveCompetitionToDb(mappedCompetition);

    const createdCompetition = await this.getCompetitionFromDb(competitionId);
    console.log(createdCompetition);
  }

  async onApplicationBootstrap() {
    const competitionId = CompetitionId.create(25);
    await this.fetchAndSaveCompetition(competitionId);
    // await this.fetchAndSaveCompetition(competitionId);
    await this.fetchAndSaveTeamsForCompetition(competitionId);
    await this.fetchAndSavePlayersForCompetition(competitionId);

    const competition = await this.getCompetitionFromDb(competitionId);

    console.log(`Игроков: ${competition?.getPlayerCount()}`);
    console.log(`Команд: ${competition?.getTeamCount()}`);
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

    const mappedPlayers: IPlayer[] = players.map(mapRawToPlayer);

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

    const mappedTeams: ITeam[] = teams.map(mapRawToTeam);

    competition.addTeams(mappedTeams);

    await this.commandBus.execute(new SaveCompetitionCommand(competition));

    this.logger.log(
      `Добавлено ${competition.getTeamCount()} команд в турнир ${competition.getName()}`,
    );
  }
}
